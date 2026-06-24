// providers/googleflights.js
// KEYLESS live flight data by scraping Google Flights' public deep-link.
//
// How it works (no API key, no signup):
//   * Google Flights accepts a `?tfs=` query parameter — a base64-encoded protobuf describing
//     the search (origin, destination, dates, cabin, passengers, trip type).
//   * We hand-build that protobuf (zero deps) and GET the page.
//   * Each result row carries a complete semantic `aria-label` (an accessibility string) like:
//       "From 887 US dollars round trip total. 1 stop flight with Delta. Operated by SkyWest
//        DBA Delta Connection. Leaves Helena Regional Airport at 5:40 AM on Monday, July 20 and
//        arrives at John F. Kennedy International Airport at 4:47 PM... 2 hr 55 min layover at
//        Salt Lake City..."
//     We parse those labels. aria-labels are far more stable than Google's rotating CSS classes
//     (breaking them breaks screen readers, which Google won't do casually).
//
// HONEST LIMITS:
//   * This is unofficial and best-effort. If Google changes the page it can break — we fail
//     gracefully and the app falls back to sample data.
//   * Google Flights does NOT expose the fare BOOKING CLASS (the L/U/T/X/V bucket). So companion
//     eligibility from this source is "needs confirmation on Delta," not auto-proven. We set
//     fareDataAvailable=false so the value engine treats eligibility as best-case-but-unconfirmed.

// ---------------- protobuf wire encoder (minimal, zero-dep) ----------------
function varint(n) {
  const out = [];
  let v = n >>> 0;
  while (v > 0x7f) { out.push((v & 0x7f) | 0x80); v >>>= 7; }
  out.push(v);
  return Buffer.from(out);
}
const wtag = (field, wire) => varint((field << 3) | wire);
const lenField = (field, buf) => Buffer.concat([wtag(field, 2), varint(buf.length), buf]);
const strField = (field, s) => lenField(field, Buffer.from(s, 'utf8'));
const varField = (field, n) => Buffer.concat([wtag(field, 0), varint(n)]);

const airportMsg = (code) => strField(2, code);
function flightDataMsg(date, fromCodes, toCodes) {
  const parts = [strField(2, date)];
  for (const f of fromCodes) parts.push(lenField(13, airportMsg(f)));
  for (const t of toCodes) parts.push(lenField(14, airportMsg(t)));
  return Buffer.concat(parts);
}
// Top-level "Info": data(3 repeated legs), seat(9), passengers(8 repeated), trip(19)
function buildTfs({ legs, seat = 1, adults = 1, trip = 1 }) {
  const parts = [];
  for (const leg of legs) parts.push(lenField(3, flightDataMsg(leg.date, leg.from, leg.to)));
  parts.push(varField(9, seat));
  for (let i = 0; i < adults; i++) parts.push(varField(8, 1)); // 1 = ADULT
  parts.push(varField(19, trip));                              // 1 = ROUND_TRIP, 2 = ONE_WAY
  const raw = Buffer.concat(parts);
  return raw.toString('base64').replace(/\+/g, '-').replace(/\//g, '_'); // url-safe, padding kept
}

const SEAT = { economy: 1, premium: 2, business: 3, first: 4 };

// Common airport-name -> IATA (for hub/layover labeling; origin/dest we already know).
const NAME_TO_CODE = {
  'Salt Lake City International Airport': 'SLC',
  'Hartsfield-Jackson Atlanta International Airport': 'ATL',
  'Minneapolis-St. Paul International Airport': 'MSP',
  'Detroit Metropolitan Wayne County Airport': 'DTW',
  'Seattle-Tacoma International Airport': 'SEA',
};
function codeFromName(name) {
  if (!name) return null;
  if (NAME_TO_CODE[name]) return NAME_TO_CODE[name];
  const m = name.match(/\(([A-Z]{3})\)/);
  return m ? m[1] : null;
}

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cookie': 'CONSENT=YES+cb',
};

// ---------------- fetch + parse ----------------
export function isConfigured() { return true; } // always available, no key needed

export async function searchOffers({
  origin = 'HLN', destination, departDate, returnDate, adults = 1, cabin = 'economy', max = 12,
}) {
  const seat = SEAT[cabin] || 1;
  const trip = returnDate ? 1 : 2;
  const legs = [{ date: departDate, from: [origin], to: [destination] }];
  if (returnDate) legs.push({ date: returnDate, from: [destination], to: [origin] });

  // Serve from cache when fresh (avoids re-hitting Google → fewer rate-limit problems).
  const cacheKey = `${origin}|${destination}|${departDate}|${returnDate || ''}|${seat}`;
  const cached = cacheGet(cacheKey);
  if (cached) return { ...cached, cached: true };

  const tfs = buildTfs({ legs, seat, adults, trip });
  const url = `https://www.google.com/travel/flights?tfs=${encodeURIComponent(tfs)}&hl=en&gl=us&curr=USD`;

  const res = await fetch(url, { headers: HEADERS });
  if (res.status === 429) {
    const e = new Error('Google Flights rate-limited this request (HTTP 429).');
    e.blocked = true;
    throw e;
  }
  if (!res.ok) throw new Error(`Google Flights returned HTTP ${res.status}`);
  const html = await res.text();

  const rows = parseRows(html, !!returnDate); // ALL airlines' rows
  // Keep Delta-marketed flights only (companion certificate applies to Delta tickets).
  const delta = rows.filter((r) => /\bDelta\b/i.test(r.airline) || /Delta Connection/i.test(r.operator || ''));
  const offers = dedupe(delta).slice(0, max).map((r) => normalize(r, { origin, destination, departDate, returnDate, cabin }));

  // Throttle / degraded-page detection: Google serves a 200 with NO server-rendered flight rows
  // (for ANY airline) when it's rate-limiting. For an HLN route — which always has Delta via SLC —
  // zero rows on a full page means "couldn't get data," NOT "no Delta service."
  const looksLikePage = html.length > 400000 && /AF_initDataCallback/.test(html);
  const blocked = rows.length === 0 && looksLikePage;

  const result = {
    offers,
    source: 'googleflights',
    blocked,
    notes: blocked
      ? 'Google returned no flight data (likely rate-limiting bulk requests).'
      : 'Live via Google Flights (keyless). Prices are real; booking class isn’t shown — confirm on Delta.',
  };
  if (!blocked) cacheSet(cacheKey, result); // never cache a blocked/empty response
  return result;
}

// ---------------- tiny in-memory cache (TTL) ----------------
const CACHE = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — flight prices don't move minute to minute
const CACHE_MAX = 600;
function cacheGet(key) {
  const hit = CACHE.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > CACHE_TTL_MS) { CACHE.delete(key); return null; }
  return hit.result;
}
function cacheSet(key, result) {
  CACHE.set(key, { ts: Date.now(), result });
  if (CACHE.size > CACHE_MAX) CACHE.delete(CACHE.keys().next().value); // evict oldest
}

function parseRows(html, isRoundTrip) {
  const needle = isRoundTrip ? 'round trip total' : 'total';
  const re = /aria-label="(From [^"]*?total\.[^"]*?)"/g;
  const out = [];
  for (const m of html.matchAll(re)) {
    const label = m[1];
    if (isRoundTrip && !/round trip total/.test(label)) continue;
    const parsed = parseLabel(label);
    if (parsed && parsed.price) out.push(parsed);
  }
  return out;
}

function parseLabel(label) {
  const priceM = label.match(/From\s+([\d,]+)\s+US dollars/);
  if (!priceM) return null;
  const price = parseInt(priceM[1].replace(/,/g, ''), 10);

  const stopsM = label.match(/Nonstop|(\d+)\s+stop/);
  const stops = !stopsM ? null : /Nonstop/.test(stopsM[0]) ? 0 : parseInt(stopsM[1], 10);

  const airlineM = label.match(/flight with ([^.]+?)\./);
  const operatorM = label.match(/Operated by ([^.]+?)\./);
  const depM = label.match(/Leaves (.+?) at (\d{1,2}:\d{2}\s?[AP]M) on ([A-Za-z]+, [A-Za-z]+ \d+)/);
  const arrM = label.match(/arrives at (.+?) at (\d{1,2}:\d{2}\s?[AP]M) on ([A-Za-z]+, [A-Za-z]+ \d+)/);
  const durM = label.match(/Total duration ([\dhrmin ]+?)\./);
  const layM = label.match(/layover at (.+?) in /);
  const basic = /\bBasic\b/i.test(label) || /No carry-on/i.test(label);

  return {
    price,
    stops,
    airline: airlineM ? airlineM[1].trim() : '',
    operator: operatorM ? operatorM[1].trim() : '',
    depAirport: depM ? depM[1].trim() : null,
    depTime: depM ? depM[2].replace(/\s/, '') : null,
    depDate: depM ? depM[3] : null,
    arrAirport: arrM ? arrM[1].trim() : null,
    arrTime: arrM ? arrM[2].replace(/\s/, '') : null,
    arrDate: arrM ? arrM[3] : null,
    duration: durM ? durM[1].trim() : null,
    layoverAirport: layM ? layM[1].trim() : null,
    basicEconomy: basic,
    raw: label,
  };
}

function dedupe(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const k = `${r.price}|${r.depTime}|${r.arrTime}|${r.stops}`;
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(r);
  }
  out.sort((a, b) => a.price - b.price);
  return out;
}

function normalize(r, ctx) {
  // Build a display itinerary. Google's round-trip label details the OUTBOUND slice; the return
  // is included in the round-trip price. We model what we can see.
  const hub = r.layoverAirport ? codeFromName(r.layoverAirport) : null;
  const segs = [];
  if (r.stops === 0) {
    segs.push(seg(ctx.origin, ctx.destination, r.depTime, r.arrTime, r));
  } else {
    segs.push(seg(ctx.origin, hub || 'SLC', r.depTime, null, r));
    segs.push(seg(hub || 'SLC', ctx.destination, null, r.arrTime, r));
  }

  return {
    id: `gf-${ctx.destination}-${r.price}-${(r.depTime || '').replace(/\W/g, '')}`,
    provider: 'googleflights',
    carrier: 'DL',
    fareDataAvailable: false, // Google Flights doesn't expose booking class.
    basicEconomy: r.basicEconomy,
    price: { total: r.price, base: null, taxes: null, currency: 'USD' },
    duration: r.duration,
    stops: r.stops,
    operator: r.operator,
    outbound: { segments: segs, layover: r.layoverAirport },
    inbound: ctx.returnDate ? { segments: [], roundTrip: true } : null,
  };
}

function seg(from, to, dep, arr, r) {
  return {
    from, to,
    dep, arr,
    carrier: 'DL',
    operatedBy: r.operator || 'Delta',
    flightNumber: 'DL', // GF deep-link doesn't expose flight numbers reliably in SSR
    bookingClass: null, // not exposed by Google Flights
    cabin: null,
  };
}

export const meta = { id: 'googleflights', label: 'Google Flights (keyless live)', live: true };
