// watchdog.js — the automated part. Re-checks every watched trip on a schedule and turns what it finds
// on THE TRAVELER'S OWN BOOKING into money levers: the itinerary got cheaper than they paid, or their
// flight moved far enough to unlock free rebooking or a refund on a nonrefundable ticket (14 CFR 260).
//
// WHICH FLIGHT. The cheapest offer on a route is not "your flight", so a watch carries the booking's
// identity and every alert is about that booking only:
//   * flights   — the itinerary's flight numbers (a trip saved from a result on a source that lists them)
//   * flight    — the one flight number the traveler typed
//   * itinerary — the exact airports and clock times of a saved result (the keyless source lists no flight
//                 numbers; the same airports at the same minutes on the same day are the same flights)
// No identity, or no match in today's results, means no schedule or fare lever — and the client says why.
//
// Design: registrations live in data/watch.json (id -> trip + booking + baseline snapshot). Each sweep
// re-searches the trip, finds the booking in the results, diffs it against its baseline, and records
// alerts. Sweeps are PACED (the keyless source rate-limits by IP). Clients read their own watches by id.
//
// WHOSE WATCH. Each client mints one random owner key and keeps it on the device; it is presented on
// every call and stored here only as a hash. A watch belongs to the first key that presents itself, and
// no other key can read, overwrite, ack or delete it. There is still no account and no identity — the
// key proves "same device", nothing more.

import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJson, writeJson } from './jsonstore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
// Overridable so tests never touch the real registry.
const storeFile = () => process.env.FAIRFARE_WATCH_FILE || path.join(DATA_DIR, 'watch.json');

// Federal "significant change" thresholds (14 CFR 260.2) — the refund trigger. Airline contracts often
// go lower (United 30 min, Alaska 60, Delta 120) — those unlock free rebooking.
const SIGNIFICANT_MIN = { domestic: 180, intl: 360 };
const CONTRACT_MIN = { DL: 120, UA: 30, AS: 60, AA: 240, WN: 60, B6: 120, F9: 120, G4: 120, HA: 120 };

// Both live price sources list Delta only (Amadeus is queried with includedAirlineCodes=DL; the keyless
// source keeps Delta rows). Another airline's booking can't be found in those results, and comparing it
// with Delta fares would be fiction — so it isn't watched.
const WATCHABLE = new Set(['DL']);
const NAME_TO_IATA = [
  [/\bdelta\b/i, 'DL'], [/\bunited\b/i, 'UA'], [/\bamerican\b/i, 'AA'], [/\bsouthwest\b/i, 'WN'], [/\balaska\b/i, 'AS'],
  [/\bjetblue\b/i, 'B6'], [/\bfrontier\b/i, 'F9'], [/\bspirit\b/i, 'NK'], [/\bhawaiian\b/i, 'HA'], [/\ballegiant\b/i, 'G4'],
];

const SIG_LEVER = 'This is a "significant change" under 14 CFR 260.2. You may DECLINE the new itinerary and take a full refund to your original payment — even on a nonrefundable or basic fare. Or use it as leverage for a free move to the flight you actually want.';
const CONTRACT_LEVER = 'Ask for the flight you actually want, by flight number: "Your schedule change moved my flight. Please protect me on [flight] instead." Free.';

// Registry limits. Every registration costs one live search, and every watch costs one more on every
// sweep — so an unbounded registry is an unbounded outbound request rate against a shared IP (or a paid
// Amadeus quota), not just a large file.
const MAX_WATCHES = 500;
const MAX_PER_OWNER = 50;
// Alerts are levers, not a log. Past this, the oldest RETIRED ones are dropped; live ones are never dropped.
const MAX_ALERTS = 20;

const nowIso = () => new Date().toISOString();
const todayUtc = () => new Date().toISOString().slice(0, 10);
const addDays = (day, n) => {
  const t = new Date(day + 'T00:00:00Z');
  t.setUTCDate(t.getUTCDate() + n);
  return t.toISOString().slice(0, 10);
};
const httpError = (message, status) => Object.assign(new Error(message), { status });

function load() {
  const db = readJson(storeFile(), {});
  return db && typeof db === 'object' && !Array.isArray(db) ? db : {};
}
function save(db) {
  writeJson(storeFile(), db);
}

// ---------- ownership ----------

/** The stored form of an owner key. Only the hash is written, so the registry file holds no usable key. */
function hashOwner(owner) {
  const s = String(owner == null ? '' : owner).trim();
  if (!s) return null;
  return createHash('sha256').update(s).digest('hex').slice(0, 32);
}

/** A watch with no owner yet (registered before owner keys existed) is open to the first key presented. */
function readable(w, hash) {
  if (!w) return false;
  if (!w.ownerHash) return true;
  return !!hash && w.ownerHash === hash;
}

/** Bind an unowned watch to the key in front of it. */
function adopt(w, hash) {
  if (!hash || w.ownerHash) return false;
  w.ownerHash = hash;
  return true;
}

/** Throws 403 if `id` already belongs to a different owner. Call before doing any work for a write. */
export function assertOwner(id, owner) {
  if (!id) return true;
  const w = load()[id];
  if (w && !readable(w, hashOwner(owner))) throw httpError('Forbidden', 403);
  return true;
}

// ---------- identity ----------

/** "dl 0123" -> "DL123". A bare carrier code (the keyless source's "DL") is not a flight number -> null. */
export function normFlight(fn) {
  const m = String(fn || '').toUpperCase().replace(/\s+/g, '').match(/^([A-Z][A-Z0-9]|[0-9][A-Z])(\d{1,4})$/);
  return m ? m[1] + String(Number(m[2])) : null;
}

/** The booking's airline as an IATA code: from the flight number first, else from the airline name. */
export function iataFor({ flightNo, airline } = {}) {
  const f = normFlight(flightNo);
  if (f) return f.slice(0, 2);
  for (const [re, code] of NAME_TO_IATA) if (re.test(String(airline || ''))) return code;
  return null;
}

/** False only for a booking on an airline the price sources don't list. An unknown airline can still be watched. */
export function canWatch(trip) {
  const iata = iataFor(trip || {});
  return !iata || WATCHABLE.has(iata);
}

function cleanLegs(legs) {
  if (!Array.isArray(legs)) return [];
  const str = (v, n) => (v == null || v === '' ? null : String(v).slice(0, n));
  return legs.slice(0, 6).map((s) => ({
    from: str(s && s.from, 4), to: str(s && s.to, 4), dep: str(s && s.dep, 25), arr: str(s && s.arr, 25),
    flight: str(s && s.flight, 8), cabin: str(s && s.cabin, 20),
  }));
}

/** What identifies the booking — only what the traveler recorded, or the search result they saved. */
export function cleanBooking({ flightNo, fare, itinerary } = {}) {
  const outbound = cleanLegs(itinerary && itinerary.outbound);
  const inbound = cleanLegs(itinerary && itinerary.inbound);
  const nums = (legs) => legs.map((s) => normFlight(s.flight));
  const flights = outbound.length && nums(outbound).every(Boolean) && nums(inbound).every(Boolean)
    ? { outbound: nums(outbound), inbound: nums(inbound) }
    : null;
  return {
    flightNo: normFlight(flightNo),
    flights,
    itinerary: outbound.length && outbound[0].from && outbound[0].dep ? { outbound, inbound } : null,
    paid: Number(fare) > 0 ? Math.round(Number(fare) * 100) / 100 : null,
  };
}

const legSegs = (offer, leg) => (offer && offer[leg] && Array.isArray(offer[leg].segments) ? offer[leg].segments : []);
const offerPrice = (o) => (o && o.price && o.price.total != null ? Number(o.price.total) : Infinity);

/** Does this search list real flight numbers (Amadeus), or only a carrier code (the keyless source)? */
export function listsFlightNumbers(offers) {
  return (offers || []).some((o) => [...legSegs(o, 'outbound'), ...legSegs(o, 'inbound')].some((s) => normFlight(s.flightNumber)));
}

/**
 * Find THE BOOKED itinerary in a search's offers -> { offer, via, cabinMatched, ambiguous } or null.
 * Never falls back to "the best offer on the route". Basic Economy is used only when nothing else matches.
 */
export function findBooked(offers, booking) {
  if (!booking || !Array.isArray(offers) || !offers.length) return null;
  const wantCabins = booking.itinerary
    ? [...booking.itinerary.outbound, ...booking.itinerary.inbound].map((s) => s.cabin).filter(Boolean)
    : [];
  const flightsOf = (o, leg) => legSegs(o, leg).map((s) => normFlight(s.flightNumber));
  const choose = (cands, via, extra = {}) => {
    if (!cands.length) return null;
    let pool = cands;
    let cabinMatched = false;
    if (wantCabins.length) {
      const same = pool.filter((o) => {
        const got = [...legSegs(o, 'outbound'), ...legSegs(o, 'inbound')].map((s) => s.cabin).filter(Boolean);
        return got.length === wantCabins.length && got.every((c, i) => c === wantCabins[i]);
      });
      if (same.length) { pool = same; cabinMatched = true; }
    }
    const full = pool.filter((o) => !o.basicEconomy);
    if (full.length) pool = full;
    const offer = pool.reduce((best, o) => (offerPrice(o) < offerPrice(best) ? o : best));
    return { offer, via, cabinMatched, ambiguous: false, ...extra };
  };

  if (booking.flights) {
    const hit = offers.filter((o) => ['outbound', 'inbound'].every((leg) => {
      const want = booking.flights[leg] || [];
      const got = flightsOf(o, leg);
      return got.length === want.length && got.every((f, i) => f === want[i]);
    }));
    const r = choose(hit, 'flights');
    if (r) return r;
  }
  if (booking.flightNo) {
    const hit = offers.filter((o) => [...flightsOf(o, 'outbound'), ...flightsOf(o, 'inbound')].includes(booking.flightNo));
    // The typed flight can sit inside several different itineraries (other connections); then no one price is "yours".
    const shapes = new Set(hit.map((o) => ['outbound', 'inbound'].map((leg) => flightsOf(o, leg).join('+')).join('|')));
    const r = choose(hit, 'flight', { ambiguous: shapes.size > 1 });
    if (r) return r;
  }
  if (booking.itinerary) {
    const hit = offers.filter((o) => ['outbound', 'inbound'].every((leg) => {
      const want = booking.itinerary[leg] || [];
      if (!want.length) return true;
      const got = legSegs(o, leg);
      return got.length === want.length && got.every((s, i) =>
        s.from === want[i].from && s.to === want[i].to && sameClock(s.dep, want[i].dep) && sameClock(s.arr, want[i].arr));
    }));
    const r = choose(hit, 'itinerary');
    if (r) return r;
  }
  return null;
}

/** Snapshot the parts of an offer we diff on. */
function snapshot(offer) {
  if (!offer) return null;
  const segs = (leg) => legSegs(offer, leg).map((s) => ({
    from: s.from, to: s.to, dep: s.dep || null, arr: s.arr || null, flight: s.flightNumber || null, cabin: s.cabin || null,
  }));
  return {
    price: offer.price && offer.price.total != null ? Number(offer.price.total) : null,
    outbound: segs('outbound'),
    inbound: segs('inbound'),
    stops: offer.stops ?? null,
    basic: !!offer.basicEconomy,
    fareData: offer.fareDataAvailable !== false,
    at: nowIso(),
  };
}

// ---------- time ----------

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
function sameClock(a, b) {
  if (!a && !b) return true;
  if (!a || !b) return false;
  return minutesBetween(a, b) === 0;
}
const clock = (v) => {
  if (!v) return '';
  const m = String(v).match(/T(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : String(v).replace(/\s+/g, '');
};
function legLine(segs) {
  if (!segs || !segs.length) return '';
  const first = segs[0], last = segs[segs.length - 1];
  return [first.dep ? 'dep ' + clock(first.dep) : '', last.arr ? 'arr ' + clock(last.arr) : '', segs.length > 1 ? `${segs.length - 1} stop${segs.length > 2 ? 's' : ''}` : '']
    .filter(Boolean).join(' / ');
}
function flightLine(fn, s) {
  return [fn, s.from && s.to ? `${s.from}→${s.to}` : '', s.dep ? 'dep ' + clock(s.dep) : '', s.arr ? 'arr ' + clock(s.arr) : ''].filter(Boolean).join(' ');
}

// ---------- levers ----------

/**
 * Schedule levers for two snapshots of the SAME itinerary (same flight numbers): times, stops, airports.
 * Each alert: { kind, severity, title, detail, lever, rule, delta, leg, was, now }
 */
export function diffSchedule(baseline, fresh, ctx = {}) {
  const alerts = [];
  if (!baseline || !fresh) return alerts;
  const intl = ctx.zone && ctx.zone !== 'domestic';
  const iata = (ctx.iata || 'DL').toUpperCase();
  for (const leg of ['outbound', 'inbound']) {
    const was = baseline[leg] || [], now = fresh[leg] || [];
    if (!was.length || !now.length) continue;
    const dep = was[0].dep && now[0].dep ? minutesBetween(was[0].dep, now[0].dep) : null;
    const arr = was[was.length - 1].arr && now[now.length - 1].arr ? minutesBetween(was[was.length - 1].arr, now[now.length - 1].arr) : null;
    const addedStop = now.length > was.length;
    const airportChange = was[0].from !== now[0].from || was[was.length - 1].to !== now[now.length - 1].to;
    const shift = Math.max(Math.abs(dep || 0), Math.abs(arr || 0));
    const sig = intl ? SIGNIFICANT_MIN.intl : SIGNIFICANT_MIN.domestic;
    const contract = CONTRACT_MIN[iata] || 120;
    const name = leg === 'outbound' ? 'Outbound' : 'Return';
    const evidence = { leg, was: legLine(was), now: legLine(now) };

    if (addedStop || airportChange || (arr != null && arr >= sig) || (dep != null && dep <= -sig)) {
      alerts.push({
        kind: 'significant_change', severity: 'high',
        title: `${name} changed enough for a full refund`,
        detail: addedStop ? 'They added a connection you didn’t book.' : airportChange ? 'They moved you to a different airport.' : `Your ${dep != null && dep <= -sig ? 'departure moved ' + Math.abs(dep) + ' min earlier' : 'arrival is now ' + arr + ' min later'} — past the federal ${sig / 60}-hour line.`,
        lever: SIG_LEVER, rule: '14 CFR 260.2 / 260.6', delta: shift, ...evidence,
      });
    } else if (shift >= contract) {
      alerts.push({
        kind: 'schedule_change', severity: 'medium',
        title: `${name} moved ${shift} min`,
        detail: `Under the ${iata} contract of carriage, a change of ${contract}+ minutes lets you rebook to a different flight without a fee or fare difference — often a different day.`,
        lever: CONTRACT_LEVER, rule: `${iata} contract of carriage`, delta: shift, ...evidence,
      });
    } else if (shift > 0 || (now[0].flight && was[0].flight && now[0].flight !== was[0].flight)) {
      alerts.push({
        kind: 'minor_change', severity: 'low',
        title: `${name} retimed ${shift} min`,
        detail: 'Below every threshold. Nothing owed — but if it now breaks a connection on your own itinerary, that IS a trigger. Worth a look.',
        lever: null, rule: null, delta: shift, ...evidence,
      });
    }
  }
  return alerts;
}

/**
 * Schedule levers for ONE known flight (the number the traveler typed). Only that flight's own times are
 * compared. A departure-earlier refund trigger needs it to start the journey; an arrival-later trigger
 * needs it to end the journey. A retime in the middle is a contract lever plus a connection warning.
 * ctx: { zone, iata, origin, destination }
 */
export function diffFlight(baseline, fresh, flightNo, ctx = {}) {
  const alerts = [];
  const fn = normFlight(flightNo);
  if (!fn) return alerts;
  const find = (snap) => {
    if (!snap) return null;
    for (const leg of ['outbound', 'inbound']) {
      const s = (snap[leg] || []).find((x) => normFlight(x.flight) === fn);
      if (s) return { leg, seg: s };
    }
    return null;
  };
  const a = find(baseline), b = find(fresh);
  if (!a || !b || a.leg !== b.leg) return alerts;
  const intl = ctx.zone && ctx.zone !== 'domestic';
  const sig = intl ? SIGNIFICANT_MIN.intl : SIGNIFICANT_MIN.domestic;
  const iata = (ctx.iata || fn.slice(0, 2)).toUpperCase();
  const contract = CONTRACT_MIN[iata] || 120;
  const start = a.leg === 'outbound' ? ctx.origin : ctx.destination;
  const end = a.leg === 'outbound' ? ctx.destination : ctx.origin;
  const was = a.seg, now = b.seg;
  const startsJourney = !!start && was.from === start;
  const endsJourney = !!end && was.to === end;
  const dep = was.dep && now.dep ? minutesBetween(was.dep, now.dep) : null;
  const arr = was.arr && now.arr ? minutesBetween(was.arr, now.arr) : null;
  const shift = Math.max(Math.abs(dep || 0), Math.abs(arr || 0));
  const airportMoved = (startsJourney && now.from !== was.from) || (endsJourney && now.to !== was.to);
  const earlier = startsJourney && dep != null && dep <= -sig;
  const later = endsJourney && arr != null && arr >= sig;
  const tag = a.leg === 'inbound' ? 'Return flight' : 'Flight';
  const evidence = { leg: a.leg, was: flightLine(fn, was), now: flightLine(fn, now) };

  if (airportMoved || earlier || later) {
    alerts.push({
      kind: 'significant_change', severity: 'high',
      title: `${tag} ${fn} changed enough for a full refund`,
      detail: airportMoved ? `They moved ${fn} to a different airport.`
        : earlier ? `${fn} now departs ${-dep} min earlier — past the federal ${sig / 60}-hour line.`
          : `${fn} now arrives ${arr} min later — past the federal ${sig / 60}-hour line.`,
      lever: SIG_LEVER, rule: '14 CFR 260.2 / 260.6',
      delta: airportMoved ? shift : earlier ? -dep : arr, ...evidence,
    });
  } else if (shift >= contract) {
    const connection = !endsJourney && arr != null && arr > 0 ? ` If ${fn} now lands after your connecting flight leaves, ask to be rebooked on one you can make.` : '';
    alerts.push({
      kind: 'schedule_change', severity: 'medium',
      title: `${tag} ${fn} moved ${shift} min`,
      detail: `Under the ${iata} contract of carriage, a change of ${contract}+ minutes lets you rebook to a different flight without a fee or fare difference — often a different day.${connection}`,
      lever: CONTRACT_LEVER, rule: `${iata} contract of carriage`, delta: shift, ...evidence,
    });
  } else if (shift > 0) {
    alerts.push({
      kind: 'minor_change', severity: 'low',
      title: `${tag} ${fn} retimed ${shift} min`,
      detail: 'Below every threshold. Nothing owed — but if it now breaks a connection on your own itinerary, that IS a trigger. Worth a look.',
      lever: null, rule: null, delta: shift, ...evidence,
    });
  }
  return alerts;
}

/**
 * A fare drop on the traveler's own itinerary. The basis is what they paid when known, otherwise the price
 * when watching began — and the text says which. A Basic Economy listing is never compared.
 */
export function priceAlert(fresh, { paid = null, baseline = null, cabinKnown = false } = {}) {
  if (!fresh || fresh.price == null || fresh.basic) return null;
  const basis = paid != null ? { price: paid, kind: 'paid' } : baseline && baseline.price != null ? { price: baseline.price, kind: 'watch' } : null;
  if (!basis || !(fresh.price < basis.price - 1)) return null;
  const drop = Math.round(basis.price - fresh.price);
  const now = Math.round(fresh.price), was = Math.round(basis.price);
  const cabin = cabinKnown ? '' : ' Confirm it’s the same cabin you booked (not Basic Economy) before you rebook.';
  return {
    kind: 'price_drop', severity: drop >= 50 ? 'high' : 'medium', basis: basis.kind,
    title: `Fare dropped $${drop}`,
    detail: basis.kind === 'paid'
      ? `Your itinerary is $${now} today vs the $${was} you paid.${cabin}`
      : `Your itinerary is $${now} today, down from $${was} when the watchdog started. Add what you paid to the trip to compare against that instead.${cabin}`,
    lever: basis.kind === 'paid'
      ? 'Rebook to today’s fare; ask for the difference as credit (cash if the fare was refundable).'
      : `If you paid more than $${now}, rebook to today’s fare and ask for the difference as credit (cash if the fare was refundable).`,
    rule: 'Airline no-change-fee policy',
    delta: drop,
  };
}

// One live fare alert per watch: it follows the price, and resolves when the drop is gone.
function upsertPrice(w, alert) {
  const live = w.alerts.find((x) => x.kind === 'price_drop' && !x.resolved);
  if (!alert) {
    if (live) { live.resolved = true; live.resolvedAt = nowIso(); }
    return 0;
  }
  if (!live) { w.alerts.push({ ...alert, at: nowIso(), seen: false }); return 1; }
  if (live.delta === alert.delta && live.detail === alert.detail) return 0;
  const grew = alert.delta > (live.delta || 0);
  Object.assign(live, alert, { at: nowIso(), seen: grew ? false : live.seen });
  return grew ? 1 : 0;
}

function missingNote(w) {
  const b = w.booking || {};
  const it = b.itinerary && b.itinerary.outbound[0];
  const which = b.flightNo || (b.flights ? b.flights.outbound.join(' + ') : it && it.dep ? `Your ${clock(it.dep)} departure` : 'Your itinerary');
  return {
    kind: 'flight_not_found', severity: 'low',
    title: 'Couldn’t find your flight in the last two checks',
    detail: `${which} on ${w.departDate} wasn’t in the last two checks of Delta’s listings. The airline may have changed or cancelled it — or the listing left it out. Check your reservation: if it now leaves 3+ hours earlier or arrives 3+ hours later (6+ on an international trip), or it was cancelled, you can decline it for a full refund.`,
    lever: null, rule: null, delta: null,
  };
}
function upsertMissing(w, missing) {
  const live = w.alerts.find((x) => x.kind === 'flight_not_found' && !x.resolved);
  if (!missing) {
    if (live) { live.resolved = true; live.resolvedAt = nowIso(); }
    return 0;
  }
  if (live) return 0;
  w.alerts.push({ ...missingNote(w), at: nowIso(), seen: false });
  return 1;
}

// ---------- registry ----------
/** Every watch, for the server's own bookkeeping (the sweep). Never served to a client. */
export function list() { return Object.values(load()); }

/**
 * The caller's own watches, by id. A watch owned by someone else is simply not returned — the same
 * answer as one that doesn't exist, so ids can't be probed. An unowned watch is adopted by this key.
 */
export function getMany(ids, owner) {
  const hash = hashOwner(owner);
  const db = load();
  const out = [];
  let changed = false;
  for (const id of ids || []) {
    const w = db[id];
    if (!w || !readable(w, hash)) continue;
    if (adopt(w, hash)) changed = true;
    out.push(w);
  }
  if (changed) save(db);
  return out;
}
export function get(id, owner) { return getMany([id], owner)[0] || null; }

/** Register (or re-register) a trip. `offers` is a live search used to find the booking for its baseline. */
export function register(trip, offers = null, owner = null) {
  const db = load();
  const hash = hashOwner(owner);
  const id = trip.id || 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const existing = db[id] || null;
  // Never replace someone else's watch: an attacker who guessed an id could otherwise point a victim's
  // alerts at a route they never booked.
  if (existing && !readable(existing, hash)) throw httpError('Forbidden', 403);
  if (!existing) {
    const all = Object.values(db);
    if (all.length >= MAX_WATCHES) throw httpError('The watchdog is full; unwatch a trip first.', 429);
    if (hash && all.filter((w) => w.ownerHash === hash).length >= MAX_PER_OWNER) {
      throw httpError(`At most ${MAX_PER_OWNER} watched trips per device.`, 429);
    }
  }
  const booking = cleanBooking(trip);
  const status = canWatch(trip) ? 'active' : 'unsupported';
  const found = status === 'active' ? findBooked(offers, booking) : null;
  db[id] = {
    id,
    ownerHash: hash || (existing && existing.ownerHash) || null,
    origin: trip.origin, destination: trip.destination, departDate: trip.departDate, returnDate: trip.returnDate || null,
    zone: trip.zone || 'domestic', iata: iataFor(trip) || 'DL', tier: trip.tier || 'platinum',
    status,
    booking,
    match: found ? 'matched' : null,
    baseline: found ? snapshot(found.offer) : null,
    latest: null,
    alerts: [],
    misses: 0,
    checks: 0,
    createdAt: nowIso(),
    lastCheckedAt: null,
    lastError: null,
  };
  save(db);
  return db[id];
}
export function unregister(id, owner) {
  const db = load();
  const w = db[id];
  if (!w) return false;
  if (!readable(w, hashOwner(owner))) throw httpError('Forbidden', 403);
  delete db[id];
  save(db);
  return true;
}
export function ack(id, owner) {
  const db = load();
  const w = db[id];
  if (!w) return null;
  const hash = hashOwner(owner);
  if (!readable(w, hash)) throw httpError('Forbidden', 403);
  adopt(w, hash);
  w.alerts = (w.alerts || []).map((a) => ({ ...a, seen: true }));
  save(db);
  return w;
}

/**
 * One sweep: re-search every watched trip (paced), find the booking, diff it, record alerts.
 * `search` is injected (runSearch from server.js) so this module has no provider knowledge.
 */
export async function sweep(search, { pace = 900, jitter = 400, concurrency = 2, log = () => {}, onPrice = null } = {}) {
  const db = load();
  const ids = Object.keys(db);
  if (!ids.length) return { checked: 0, alerts: 0 };
  let next = 0, checked = 0, newAlerts = 0;
  const worker = async () => {
    while (next < ids.length) {
      const id = ids[next++];
      const w = db[id];
      w.alerts = w.alerts || [];
      if (w.status === 'unsupported') continue;
      if (!w.booking) {
        // Registered before the watchdog knew which flight was booked: its old alerts compared whatever flight
        // happened to be cheapest, so retire them. The client re-registers the trip with its booking details.
        w.booking = cleanBooking({});
        w.baseline = null;
        for (const a of w.alerts) if (!a.resolved) { a.resolved = true; a.resolvedAt = nowIso(); }
      }
      if (pace || jitter) await new Promise((r) => setTimeout(r, pace + Math.floor(Math.random() * jitter)));
      try {
        const res = await search({ origin: w.origin, destination: w.destination, departDate: w.departDate, returnDate: w.returnDate, adults: 1 }, w.tier);
        if (res.blocked) { w.lastError = 'rate-limited'; continue; }
        // A failed live source falls back to sample fares. Those must never become a baseline, a price
        // observation, or an alert — skip the check instead.
        if (res.degraded || /sample|mock|fallback/i.test(String(res.source || ''))) { w.lastError = 'live prices unavailable — check skipped'; continue; }
        const offers = Array.isArray(res.offers) ? res.offers : [];
        // Every sweep is also a ROUTE price observation (the day's lowest listed fare) for the trend series —
        // a fact about the route, not about this booking.
        const top = offers.find((o) => o.companion && o.companion.status !== 'ineligible') || offers[0] || null;
        if (onPrice && top && top.price && top.price.total != null) {
          try { onPrice({ origin: w.origin, destination: w.destination, departDate: w.departDate, returnDate: w.returnDate, price: Number(top.price.total), status: top.companion && top.companion.status, source: 'watchdog' }); } catch {}
        }
        w.checks = (w.checks || 0) + 1;
        w.lastCheckedAt = nowIso();
        w.lastError = null;
        checked++;

        const b = w.booking;
        const identified = !!(b.flights || b.flightNo || b.itinerary);
        const found = identified ? findBooked(offers, b) : null;
        if (!found) {
          // A flight number can't be found on a source that lists none; only a saved itinerary can be.
          w.match = !identified ? 'route_only' : offers.length && !b.itinerary && !listsFlightNumbers(offers) ? 'unmatchable' : 'not_found';
          if (w.match === 'not_found' && offers.length) {
            w.misses = (w.misses || 0) + 1;
            if (w.misses >= 2) newAlerts += upsertMissing(w, true);
          }
          continue;
        }
        w.match = 'matched';
        w.misses = 0;
        upsertMissing(w, false);
        const fresh = snapshot(found.offer);
        w.latest = fresh;
        if (!w.baseline) {
          w.baseline = fresh; // first sight of the booking
        } else {
          const ctx = { zone: w.zone, iata: w.iata, origin: w.origin, destination: w.destination };
          const sched = found.via === 'flights' ? diffSchedule(w.baseline, fresh, ctx)
            : found.via === 'flight' ? diffFlight(w.baseline, fresh, b.flightNo, ctx)
              : []; // a clock-matched itinerary can't have moved: a retime would stop it matching
          for (const a of sched) {
            if (a.kind === 'minor_change') continue;
            const dup = w.alerts.some((x) => x.kind === a.kind && x.delta === a.delta && x.leg === a.leg && !x.resolved);
            if (!dup) { w.alerts.push({ ...a, at: nowIso(), seen: false }); newAlerts++; }
          }
        }
        const alert = found.ambiguous ? null : priceAlert(fresh, { paid: b.paid, baseline: w.baseline, cabinKnown: found.cabinMatched && fresh.fareData });
        newAlerts += upsertPrice(w, alert);
      } catch (e) {
        w.lastError = String((e && e.message) || e).slice(0, 160);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, ids.length) }, worker));
  save(db);
  log(`watchdog: checked ${checked}/${ids.length}, ${newAlerts} new alerts`);
  return { checked, alerts: newAlerts };
}

/** Fare drops available right now (live alerts only) and unseen alerts, across the given watches. */
export function summary(watches = list()) {
  let unseen = 0, moneyFound = 0;
  for (const w of watches) for (const a of w.alerts || []) {
    if (a.resolved) continue;
    if (!a.seen) unseen++;
    if (a.kind === 'price_drop' && a.delta) moneyFound += a.delta;
  }
  return { watches: watches.length, unseen, moneyFound };
}
