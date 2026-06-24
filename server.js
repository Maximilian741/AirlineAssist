// server.js
// Zero-dependency local web server for the Delta Companion value dashboard.
// Run:  node server.js   (then open http://localhost:5173)
//
// Responsibilities:
//   * Serve the static dashboard from /public
//   * Hold the Amadeus API key server-side (never exposed to the browser)
//   * Provide a small JSON API: /api/health, /api/meta, /api/search, /api/scan
//   * Pick the data provider: live Amadeus when keys are set, sample data otherwise

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import * as amadeus from './src/providers/amadeus.js';
import * as googleflights from './src/providers/googleflights.js';
import * as mock from './src/providers/mock.js';
import { evaluateOffer, listTiers, compareOffers, compareByValue } from './src/companion.js';
import { ORIGIN, DESTINATIONS, zoneOf } from './src/data/routes.js';
import * as history from './src/history.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ---- tiny .env loader (so you don't need dotenv) -------------------------------------------
loadEnvFile(path.join(__dirname, '.env'));
function loadEnvFile(file) {
  if (!existsSync(file)) return;
  for (const raw of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}

const PORT = process.env.PORT || 5173;
const PUBLIC_DIR = path.join(__dirname, 'public');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// ---- provider selection --------------------------------------------------------------------
// Priority: Amadeus if a key is set (precise fare classes) -> Google Flights (keyless live)
// -> sample data (offline fallback).
function chooseProvider({ forceSample } = {}) {
  if (forceSample) return mock;
  if (amadeus.isConfigured()) return amadeus;
  return googleflights;
}

// Run one round-trip search and attach companion eligibility + value to each offer.
async function runSearch(params, tier, opts = {}) {
  const provider = chooseProvider(opts);
  const zone = zoneOf(params.destination);
  const roundTrip = Boolean(params.returnDate);

  let res, degraded = false;
  try {
    res = await provider.searchOffers(params);
  } catch (err) {
    if (provider === mock) throw err;
    // A rate-limit/blocked signal must NOT silently become fake sample data — report it.
    if (err.blocked) {
      return { offers: [], source: 'googleflights', notes: String(err.message || err), blocked: true, zone };
    }
    // Other live failures degrade gracefully to sample data rather than 500.
    res = await mock.searchOffers(params);
    res = { ...res, source: 'sample(fallback)', notes: `Live source failed (${String(err?.message || err).slice(0, 120)}); showing sample data.` };
    degraded = true;
  }

  const evaluated = (res.offers || []).map((o) => evaluateOffer(o, tier, { zone, roundTrip }));
  evaluated.sort(compareOffers);
  return { offers: evaluated, source: res.source, notes: res.notes, degraded, blocked: Boolean(res.blocked), cached: Boolean(res.cached), zone };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- HTTP server ---------------------------------------------------------------------------
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (url.pathname === '/api/health') return json(res, healthPayload());
    if (url.pathname === '/api/meta') return json(res, metaPayload());
    if (url.pathname === '/api/search' && req.method === 'POST') return handleSearch(req, res);
    if (url.pathname === '/api/scan' && req.method === 'POST') return handleScan(req, res);
    if (url.pathname === '/api/explore' && req.method === 'POST') return handleExplore(req, res);
    if (url.pathname === '/api/calendar' && req.method === 'POST') return handleCalendar(req, res);
    if (url.pathname === '/api/history') return handleHistory(res, url);

    if (url.pathname.startsWith('/api/')) return json(res, { error: 'Unknown endpoint' }, 404);

    return serveStatic(url.pathname, res);
  } catch (err) {
    return json(res, { error: String(err?.message || err) }, 500);
  }
});

server.listen(PORT, () => {
  const amadeusOn = amadeus.isConfigured();
  console.log('\n  Delta Companion Dashboard');
  console.log(`  → http://localhost:${PORT}`);
  if (amadeusOn) {
    console.log(`  Data source: LIVE · Amadeus ${amadeus.status().env} (precise fare classes)`);
  } else {
    console.log('  Data source: LIVE · Google Flights (keyless, no signup — real prices)');
    console.log('  Tip: add AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET to .env for exact fare-class eligibility.');
  }
  console.log('');
});

// ---- handlers ------------------------------------------------------------------------------
function healthPayload() {
  const amadeusOn = amadeus.isConfigured();
  // Both Amadeus and Google Flights are "live"; only the offline sample path is not.
  const dataSource = amadeusOn ? 'amadeus' : 'googleflights';
  return {
    ok: true,
    origin: ORIGIN,
    dataSource,
    amadeus: amadeus.status(),
    live: true,
    keyless: !amadeusOn, // true when running on the no-signup Google Flights source
  };
}

function metaPayload() {
  return {
    origin: ORIGIN,
    destinations: DESTINATIONS,
    tiers: listTiers(),
  };
}

async function handleSearch(req, res) {
  const body = await readBody(req);
  const {
    origin = 'HLN', destination, departDate, returnDate,
    tier = 'platinum', adults = 1, forceSample = false,
  } = body || {};

  if (!destination || !departDate) {
    return json(res, { error: 'destination and departDate are required.' }, 400);
  }

  try {
    const dest = destination.toUpperCase();
    const result = await runSearch(
      { origin, destination: dest, departDate, returnDate, adults },
      tier,
      { forceSample }
    );
    // Record the best price we saw for this route+date (powers the trend over time).
    const best = result.offers.find((o) => o.companion.status !== 'ineligible') || result.offers[0];
    if (best) {
      history.record({
        origin, destination: dest, departDate, returnDate,
        price: best.price.total, status: best.companion.status, source: result.source,
      });
    }
    return json(res, { ...result, params: { origin, destination: dest, departDate, returnDate, tier } });
  } catch (err) {
    return json(res, { error: String(err?.message || err), hint: amadeusHint(err) }, 502);
  }
}

// Shared: run many round-trip searches through a small concurrency pool and return one best
// offer per trip. Used by both /api/scan (selected destinations) and /api/explore (everywhere).
async function runTrips(trips, tier, { forceSample = false, concurrency = 3, cap = 70 } = {}) {
  const limited = trips.slice(0, cap);
  const rows = new Array(limited.length);
  let source = null;
  let lastError = null;
  let next = 0;
  let blockedCount = 0;

  async function worker() {
    while (true) {
      const i = next++;
      if (i >= limited.length) break;
      const t = limited[i];
      const origin = t.origin || 'HLN';
      const destination = (t.destination || '').toUpperCase();
      // Gentle, jittered pacing so Google doesn't rate-limit the burst. Cached hits return instantly.
      await sleep(120 + Math.floor(Math.random() * 380));
      try {
        const r = await runSearch(
          { origin, destination, departDate: t.departDate, returnDate: t.returnDate, adults: t.adults || 1 },
          tier,
          { forceSample }
        );
        source = r.source;
        if (r.blocked) blockedCount++;
        const best = r.offers.find((o) => o.companion.status !== 'ineligible') || r.offers[0] || null;
        if (best) {
          history.record({
            origin, destination, departDate: t.departDate, returnDate: t.returnDate,
            price: best.price.total, status: best.companion.status, source: r.source,
          });
        }
        rows[i] = { destination: t.destination, departDate: t.departDate, returnDate: t.returnDate, best, offerCount: r.offers.length, blocked: Boolean(r.blocked) };
      } catch (err) {
        const blocked = Boolean(err && err.blocked);
        if (blocked) blockedCount++;
        lastError = String(err?.message || err);
        rows[i] = { destination: t.destination, departDate: t.departDate, returnDate: t.returnDate, best: null, error: lastError, blocked };
      }
    }
  }

  const pool = Array.from({ length: Math.min(concurrency, limited.length) }, worker);
  await Promise.all(pool);

  // Rank by where the cert is worth the most (eligible first, then biggest savings).
  rows.sort((a, b) => {
    if (!a.best || !b.best) return (b.best ? 1 : 0) - (a.best ? 1 : 0);
    return compareByValue(a.best, b.best);
  });
  return { rows, source, scanned: limited.length, truncated: trips.length > limited.length, lastError, blockedCount };
}

async function handleScan(req, res) {
  const body = await readBody(req);
  const { tier = 'platinum', trips = [], forceSample = false } = body || {};
  if (!Array.isArray(trips) || trips.length === 0) {
    return json(res, { error: 'trips[] is required.' }, 400);
  }
  const result = await runTrips(trips, tier, { forceSample, cap: 30 });
  return json(res, result);
}

// "Everywhere": no destination needed — scan Delta's reachable network from HLN and rank every
// destination by companion value. This is the "show me any deal" view.
//   * exact mode:    one round trip (departDate -> returnDate) per destination.
//   * flexible mode: scan several departure weeks between departStart..departEnd (trip = `nights`
//                    long) and keep the CHEAPEST week per destination.
async function handleExplore(req, res) {
  const body = await readBody(req);
  const {
    origin = 'HLN', departDate, returnDate, tier = 'platinum',
    scope = 'all', flexible = false, departStart, departEnd, nights = 7, forceSample = false,
  } = body || {};

  const pool = DESTINATIONS.filter((d) => d.code !== origin && (scope === 'all' ? true : d.popular));

  // ---- flexible: find the cheapest week in a window ----
  if (flexible && departStart && departEnd) {
    const MAX = 70;          // total searches budget (gentle on Google's rate limits)
    const MIN_SAMPLES = 3;   // always check at least a few weeks, or "flexible" is meaningless
    const allWeeks = weeklyDatesBetween(departStart, departEnd);
    let samples = Math.min(allWeeks.length, 5, Math.max(MIN_SAMPLES, Math.floor(MAX / Math.max(1, pool.length))));

    // If checking every destination across `samples` weeks blows the budget, trim destinations
    // (keeping the popular ones) so each destination still gets a real multi-week comparison.
    let activePool = pool;
    if (activePool.length * samples > MAX) {
      const ordered = [...pool.filter((d) => d.popular), ...pool.filter((d) => !d.popular)];
      activePool = ordered.slice(0, Math.max(1, Math.floor(MAX / samples)));
    }
    const weeks = allWeeks.slice(0, samples);

    const trips = [];
    for (const d of activePool) for (const dep of weeks) {
      trips.push({ origin, destination: d.code, departDate: dep, returnDate: addDaysStr(dep, nights) });
    }
    const flat = await runTrips(trips, tier, { forceSample, cap: MAX });

    // Keep the cheapest week per destination.
    const byDest = {};
    for (const r of flat.rows) {
      const cur = byDest[r.destination];
      if (!cur) { byDest[r.destination] = r; continue; }
      if (r.best && (!cur.best || r.best.price.total < cur.best.price.total)) byDest[r.destination] = r;
    }
    const rows = Object.values(byDest);
    rows.sort((a, b) => {
      if (!a.best || !b.best) return (b.best ? 1 : 0) - (a.best ? 1 : 0);
      return compareByValue(a.best, b.best);
    });
    return json(res, {
      rows, source: flat.source, blockedCount: flat.blockedCount, scanned: activePool.length,
      flexible: true, trimmedFrom: pool.length,
      window: { departStart, departEnd, nights, weeksSampled: weeks.length }, scope, origin,
    });
  }

  // ---- exact dates ----
  if (!departDate) return json(res, { error: 'departDate (or flexible window) is required.' }, 400);
  const trips = pool.map((d) => ({ origin, destination: d.code, departDate, returnDate }));
  const result = await runTrips(trips, tier, { forceSample, cap: 60 });
  return json(res, { ...result, scope, origin, departDate, returnDate });
}

// Weekly YYYY-MM-DD dates from start..end inclusive (UTC, step 7 days).
function weeklyDatesBetween(start, end) {
  const out = [];
  const s = new Date(start + 'T00:00:00Z');
  const e = new Date(end + 'T00:00:00Z');
  if (Number.isNaN(s) || Number.isNaN(e) || e < s) return [start];
  for (let d = new Date(s); d <= e; d.setUTCDate(d.getUTCDate() + 7)) {
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function addDaysStr(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + Number(n || 0));
  return d.toISOString().slice(0, 10);
}

// Price calendar: sample several departure dates for one route to reveal the price-vs-date trend.
async function handleCalendar(req, res) {
  const body = await readBody(req);
  const {
    origin = 'HLN', destination, tier = 'platinum',
    tripLengthDays = 7, weeks = 8, startOffsetDays = 21, forceSample = false,
  } = body || {};
  if (!destination) return json(res, { error: 'destination is required.' }, 400);

  const n = Math.min(Math.max(parseInt(weeks, 10) || 8, 1), 12); // cap at 12 samples
  const len = Math.min(Math.max(parseInt(tripLengthDays, 10) || 7, 1), 30);
  const base = new Date();
  base.setUTCDate(base.getUTCDate() + (parseInt(startOffsetDays, 10) || 21));

  const points = [];
  let source = null;
  for (let i = 0; i < n; i++) {
    const dep = new Date(base);
    dep.setUTCDate(base.getUTCDate() + i * 7);
    const ret = new Date(dep);
    ret.setUTCDate(dep.getUTCDate() + len);
    const departDate = dep.toISOString().slice(0, 10);
    const returnDate = ret.toISOString().slice(0, 10);
    try {
      const { offers, source: src } = await runSearch(
        { origin, destination: destination.toUpperCase(), departDate, returnDate, adults: 1 },
        tier,
        { forceSample }
      );
      source = src;
      const best = offers.find((o) => o.companion.status !== 'ineligible') || offers[0] || null;
      if (best) {
        history.record({ origin, destination: destination.toUpperCase(), departDate, returnDate, price: best.price.total, status: best.companion.status, source: src });
      }
      points.push({
        departDate, returnDate,
        price: best?.price?.total ?? null,
        status: best?.companion?.status ?? null,
        netSavings: best?.value?.netSavings ?? null,
      });
    } catch (err) {
      points.push({ departDate, returnDate, price: null, error: String(err?.message || err) });
    }
  }
  return json(res, { destination, tripLengthDays: len, points, source });
}

function handleHistory(res, url) {
  const origin = url.searchParams.get('origin') || 'HLN';
  const destination = url.searchParams.get('destination');
  const departDate = url.searchParams.get('departDate');
  const returnDate = url.searchParams.get('returnDate') || null;
  if (!destination) return json(res, { summary: history.summary() });
  return json(res, { series: history.series({ origin, destination, departDate, returnDate }) });
}

function amadeusHint(err) {
  const msg = String(err?.message || err);
  if (msg.includes('auth failed')) return 'Check AMADEUS_CLIENT_ID / AMADEUS_CLIENT_SECRET in .env.';
  if (msg.includes('429')) return 'Rate limited — slow down or you hit the free quota.';
  if (msg.toLowerCase().includes('no flight') || msg.includes('400')) {
    return 'Test env has sparse data for small airports like HLN. Try production keys, or run on sample data.';
  }
  return null;
}

// ---- static + helpers ----------------------------------------------------------------------
async function serveStatic(pathname, res) {
  let rel = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(PUBLIC_DIR, path.normalize(rel).replace(/^([/\\])+/, ''));
  if (!filePath.startsWith(PUBLIC_DIR)) return json(res, { error: 'Forbidden' }, 403);
  try {
    const data = await readFile(filePath);
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

function json(res, obj, code = 200) {
  const data = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(data);
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 1_000_000) reject(new Error('Body too large'));
    });
    req.on('end', () => {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); } catch (e) { reject(new Error('Invalid JSON body')); }
    });
    req.on('error', reject);
  });
}
