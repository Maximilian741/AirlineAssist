// watchdog.js — the automated part. Re-checks every watched trip on a schedule and turns what it
// finds into MONEY LEVERS: a fare drop you can rebook to, or a schedule shift that hands you free
// rebooking / a cash refund on a nonrefundable ticket.
//
// WHY THIS IS THE JUICY ONE: airlines quietly move a large share of bookings months out. Each move
// past a threshold is a lever worth $150–$800 (free date change) up to the whole fare (cash refund
// on a "nonrefundable" ticket, 14 CFR 260 — a firm federal right). Almost nobody catches them,
// because catching them takes vigilance. That is exactly what a machine is for.
//
// Design: registrations live in data/watch.json (id -> trip + baseline snapshot). Each sweep
// re-searches the trip, diffs against the baseline, and appends alerts. Sweeps are PACED (the
// keyless source rate-limits by IP) and cheap: with Amadeus configured, one search per trip per
// sweep. The client polls /api/watch/:id for alerts; nothing pushes yet (that's the mobile app's job).

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'watch.json');

// Federal "significant change" thresholds (14 CFR 260.2) — the CASH-REFUND trigger. Airline
// contracts often go lower (United 30 min, Alaska 60, Delta 120) — those unlock free rebooking.
const SIGNIFICANT_MIN = { domestic: 180, intl: 360 };
const CONTRACT_MIN = { DL: 120, UA: 30, AS: 60, AA: 240, WN: 60, B6: 120, F9: 120, G4: 120, HA: 120 };

function load() {
  try { return existsSync(FILE) ? JSON.parse(readFileSync(FILE, 'utf8')) : {}; } catch { return {}; }
}
function save(db) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(FILE, JSON.stringify(db, null, 2));
}

/** Snapshot the parts of an offer we diff on. */
function snapshot(offer) {
  if (!offer) return null;
  const segs = (leg) => (leg && leg.segments ? leg.segments.map((s) => ({ from: s.from, to: s.to, dep: s.dep || null, arr: s.arr || null, flight: s.flightNumber || null })) : []);
  return {
    price: offer.price && offer.price.total != null ? Number(offer.price.total) : null,
    outbound: segs(offer.outbound),
    inbound: segs(offer.inbound),
    stops: offer.stops ?? null,
    at: new Date().toISOString(),
  };
}

// Providers disagree on time formats: Amadeus gives ISO ("2026-09-10T05:40:00"), the keyless
// Google Flights source gives clock text with no date ("12:57PM", "5:40 AM"). Handle both, else
// schedule shifts would silently never fire on the free source. Clock-only times are compared as
// minutes-of-day, wrapping across midnight to the smaller absolute distance.
function toMinutes(s) {
  if (!s) return null;
  const iso = Date.parse(s);
  if (!isNaN(iso)) return { abs: Math.round(iso / 60000) };
  const m = String(s).trim().match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])?$/);
  if (!m) return null;
  let h = Number(m[1]); const min = Number(m[2]);
  const ap = m[3] ? m[3].toUpperCase() : null;
  if (ap === 'PM' && h < 12) h += 12;
  if (ap === 'AM' && h === 12) h = 0;
  return { day: h * 60 + min };
}
function minutesBetween(a, b) {
  const x = toMinutes(a), y = toMinutes(b);
  if (!x || !y) return null;
  if (x.abs != null && y.abs != null) return y.abs - x.abs;
  if (x.day != null && y.day != null) {
    let d = y.day - x.day;
    if (d > 720) d -= 1440; else if (d < -720) d += 1440; // nearest wrap
    return d;
  }
  return null; // mixed formats across providers — don't guess
}

/**
 * Diff a fresh snapshot against the baseline and emit LEVERS, not just facts.
 * Each alert: { kind, severity, title, detail, lever, rule, delta }
 */
export function diff(baseline, fresh, ctx = {}) {
  const alerts = [];
  if (!baseline || !fresh) return alerts;
  const intl = ctx.zone && ctx.zone !== 'domestic';
  const iata = (ctx.iata || 'DL').toUpperCase();

  // ---- price drop -> rebook and keep the difference ----
  if (baseline.price != null && fresh.price != null && fresh.price < baseline.price - 1) {
    const drop = Math.round(baseline.price - fresh.price);
    alerts.push({
      kind: 'price_drop', severity: drop >= 50 ? 'high' : 'medium',
      title: `Fare dropped $${drop}`,
      detail: `Now $${Math.round(fresh.price)} vs your $${Math.round(baseline.price)}. Most carriers dropped change fees on non-basic fares — rebook to the lower fare and the difference comes back (usually as credit).`,
      lever: 'Rebook to today’s fare; ask for the difference as credit (cash if the fare was refundable).',
      rule: 'Airline no-change-fee policy',
      delta: drop,
    });
  }

  // ---- schedule shift -> free rebooking / cash refund on a nonrefundable ticket ----
  const legs = [['outbound', baseline.outbound, fresh.outbound], ['inbound', baseline.inbound, fresh.inbound]];
  for (const [name, was, now] of legs) {
    if (!was.length || !now.length) continue;
    const dep = was[0].dep && now[0].dep ? minutesBetween(was[0].dep, now[0].dep) : null;
    const arr = was[was.length - 1].arr && now[now.length - 1].arr ? minutesBetween(was[was.length - 1].arr, now[now.length - 1].arr) : null;
    const addedStop = now.length > was.length;
    const airportChange = was[0].from !== now[0].from || was[was.length - 1].to !== now[now.length - 1].to;
    const shift = Math.max(Math.abs(dep || 0), Math.abs(arr || 0));
    const sig = intl ? SIGNIFICANT_MIN.intl : SIGNIFICANT_MIN.domestic;
    const contract = CONTRACT_MIN[iata] || 120;

    if (addedStop || airportChange || (arr != null && arr >= sig) || (dep != null && dep <= -sig)) {
      alerts.push({
        kind: 'significant_change', severity: 'high',
        title: `${name === 'outbound' ? 'Outbound' : 'Return'} changed enough to unlock a CASH refund`,
        detail: addedStop ? 'They added a connection you didn’t book.' : airportChange ? 'They moved you to a different airport.' : `Your ${dep != null && dep <= -sig ? 'departure moved ' + Math.abs(dep) + ' min earlier' : 'arrival is now ' + arr + ' min later'} — past the federal ${sig / 60}-hour line.`,
        lever: 'This is a "significant change" under 14 CFR 260.2. You may DECLINE the new itinerary and take a full refund to your original payment — even on a nonrefundable or basic fare. Or use it as leverage for a free move to the flight you actually want.',
        rule: '14 CFR 260.2 / 260.6',
        delta: shift,
      });
    } else if (shift >= contract) {
      alerts.push({
        kind: 'schedule_change', severity: 'medium',
        title: `${name === 'outbound' ? 'Outbound' : 'Return'} moved ${shift} min`,
        detail: `Under the ${iata} contract of carriage, a change of ${contract}+ minutes lets you rebook to a different flight without a fee or fare difference — often a different day.`,
        lever: 'Ask for the flight you actually want, by flight number: "Your schedule change moved my flight. Please protect me on [flight] instead." Free.',
        rule: `${iata} contract of carriage`,
        delta: shift,
      });
    } else if (shift > 0 || (now[0].flight && was[0].flight && now[0].flight !== was[0].flight)) {
      alerts.push({
        kind: 'minor_change', severity: 'low',
        title: `${name === 'outbound' ? 'Outbound' : 'Return'} retimed ${shift} min`,
        detail: 'Below every threshold. Nothing owed — but if it now breaks a connection on your own itinerary, that IS a trigger. Worth a look.',
        lever: null, rule: null, delta: shift,
      });
    }
  }
  return alerts;
}

// ---------- registry ----------
export function list() { return Object.values(load()); }
export function get(id) { return load()[id] || null; }

export function register(trip, baselineOffer) {
  const db = load();
  const id = trip.id || 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  db[id] = {
    id,
    origin: trip.origin, destination: trip.destination, departDate: trip.departDate, returnDate: trip.returnDate || null,
    zone: trip.zone || 'domestic', iata: trip.iata || 'DL', tier: trip.tier || 'platinum',
    baseline: snapshot(baselineOffer),
    latest: null,
    alerts: [],
    checks: 0,
    createdAt: new Date().toISOString(),
    lastCheckedAt: null,
    lastError: null,
  };
  save(db);
  return db[id];
}
export function unregister(id) { const db = load(); delete db[id]; save(db); }
export function ack(id) { const db = load(); if (db[id]) { db[id].alerts = db[id].alerts.map((a) => ({ ...a, seen: true })); save(db); } return db[id] || null; }

/**
 * One sweep: re-search every watched trip (paced), diff, append new alerts.
 * `search` is injected (runSearch from server.js) so this module has no provider knowledge.
 */
export async function sweep(search, { pace = 900, concurrency = 2, log = () => {}, onPrice = null } = {}) {
  const db = load();
  const ids = Object.keys(db);
  if (!ids.length) return { checked: 0, alerts: 0 };
  let next = 0, checked = 0, newAlerts = 0;
  const worker = async () => {
    while (next < ids.length) {
      const id = ids[next++];
      const w = db[id];
      await new Promise((r) => setTimeout(r, pace + Math.floor(Math.random() * 400)));
      try {
        const res = await search({ origin: w.origin, destination: w.destination, departDate: w.departDate, returnDate: w.returnDate, adults: 1 }, w.tier);
        if (res.blocked) { w.lastError = 'rate-limited'; continue; }
        const best = res.offers.find((o) => o.companion && o.companion.status !== 'ineligible') || res.offers[0] || null;
        const fresh = snapshot(best);
        w.latest = fresh;
        w.checks++;
        // Every sweep is a price observation — feed the trend series so "lowest we've seen"
        // and the buy/wait verdict keep learning without anyone opening the app.
        if (onPrice && fresh && fresh.price != null) {
          try { onPrice({ origin: w.origin, destination: w.destination, departDate: w.departDate, returnDate: w.returnDate, price: fresh.price, status: best && best.companion && best.companion.status, source: 'watchdog' }); } catch {}
        }
        w.lastCheckedAt = new Date().toISOString();
        w.lastError = null;
        if (!w.baseline && fresh) { w.baseline = fresh; continue; } // first sight becomes the baseline
        const found = diff(w.baseline, fresh, { zone: w.zone, iata: w.iata });
        // De-dupe: only append alerts whose (kind, delta) we haven't recorded already.
        for (const a of found) {
          const dup = w.alerts.some((x) => x.kind === a.kind && x.delta === a.delta && !x.resolved);
          if (!dup && a.kind !== 'minor_change') { w.alerts.push({ ...a, at: new Date().toISOString(), seen: false }); newAlerts++; }
        }
        checked++;
      } catch (e) {
        w.lastError = String(e && e.message || e).slice(0, 160);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker));
  save(db);
  log(`watchdog: checked ${checked}/${ids.length}, ${newAlerts} new alerts`);
  return { checked, alerts: newAlerts };
}

/** Sum of dollar levers currently unseen across all watches — the "money the machine found" number. */
export function summary() {
  const all = list();
  let unseen = 0, moneyFound = 0, watches = all.length;
  for (const w of all) for (const a of w.alerts) {
    if (!a.seen) unseen++;
    if (a.kind === 'price_drop' && a.delta) moneyFound += a.delta;
  }
  return { watches, unseen, moneyFound };
}
