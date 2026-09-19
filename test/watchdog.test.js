// Deterministic proof for the watchdog — the part that turns "your flight moved" into a specific dollar
// lever, and (just as important) refuses to when the change isn't to YOUR booking. Run:  node --test
//
// Thresholds under test are the federal "significant change" line (14 CFR 260.2: 3h domestic /
// 6h international, airport change, added connection) and the per-airline contract lines
// (United 30 min, Alaska 60, Delta 120) that unlock free rebooking below the federal line.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { diffSchedule, normFlight, iataFor, priceAlert, register, sweep, summary, get } from '../src/watchdog.js';

const snap = (price, outDep, outArr, extra = {}) => ({
  price,
  outbound: [{ from: 'HLN', to: 'SLC', dep: `2026-09-10T${outDep}:00`, arr: null, flight: 'DL4001' }, { from: 'SLC', to: 'JFK', dep: null, arr: `2026-09-10T${outArr}:00`, flight: 'DL1234' }],
  inbound: [{ from: 'JFK', to: 'SLC', dep: '2026-09-17T08:00:00', arr: null, flight: 'DL1235' }, { from: 'SLC', to: 'HLN', dep: null, arr: '2026-09-17T13:00:00', flight: 'DL4002' }],
  stops: 1,
  ...extra,
});

const kinds = (a) => a.map((x) => x.kind);

// ---------------------------------------------------------------- schedule levers (same itinerary)
test('no change -> no alerts', () => {
  const b = snap(487, '05:40', '16:47');
  assert.deepEqual(diffSchedule(b, snap(487, '05:40', '16:47')), []);
});

test('arrival 3h+ later on a domestic trip = SIGNIFICANT change -> refund lever (14 CFR 260.2)', () => {
  const a = diffSchedule(snap(487, '05:40', '16:47'), snap(487, '05:40', '19:47'), { zone: 'domestic', iata: 'DL' });
  assert.equal(a[0].kind, 'significant_change');
  assert.match(a[0].lever, /full refund/i);
  assert.match(a[0].rule, /260\.2/);
  assert.equal(a[0].leg, 'outbound');
  assert.match(a[0].was, /arr 16:47/);
  assert.match(a[0].now, /arr 19:47/);
});

test('arrival 2h59m later domestic = NOT significant federally, but IS a Delta contract change', () => {
  const a = diffSchedule(snap(487, '05:40', '16:47'), snap(487, '05:40', '19:46'), { zone: 'domestic', iata: 'DL' });
  assert.equal(a[0].kind, 'schedule_change', 'below the 180-min federal line');
  assert.match(a[0].detail, /120\+ minutes/, 'cites Delta’s 120-min contract line');
});

test('international needs 6h, not 3h, for the federal trigger', () => {
  const dom = diffSchedule(snap(900, '05:40', '16:47'), snap(900, '05:40', '20:00'), { zone: 'domestic' });
  const intl = diffSchedule(snap(900, '05:40', '16:47'), snap(900, '05:40', '20:00'), { zone: 'intl_eligible' });
  assert.equal(dom[0].kind, 'significant_change', 'domestic: 3h13m clears 3h');
  assert.equal(intl[0].kind, 'schedule_change', 'international: 3h13m does NOT clear 6h');
});

test('departure moved EARLIER 3h+ is a trigger; moved LATER is not (Delta Rule 19(A) asymmetry)', () => {
  const earlier = diffSchedule(snap(487, '08:40', '16:47'), snap(487, '05:40', '16:47'), { zone: 'domestic' });
  assert.equal(earlier[0].kind, 'significant_change');
  const later = diffSchedule(snap(487, '05:40', '16:47'), snap(487, '08:40', '16:47'), { zone: 'domestic' });
  assert.notEqual(later[0].kind, 'significant_change', 'a later departure alone is not the federal trigger');
});

test('an ADDED CONNECTION is a trigger with NO time threshold', () => {
  const b = { price: 487, outbound: [{ from: 'HLN', to: 'JFK', dep: '2026-09-10T05:40:00', arr: '2026-09-10T12:00:00', flight: 'DL1' }], inbound: [], stops: 0 };
  const f = { price: 487, outbound: [{ from: 'HLN', to: 'SLC', dep: '2026-09-10T05:40:00', arr: null, flight: 'DL2' }, { from: 'SLC', to: 'JFK', dep: null, arr: '2026-09-10T12:20:00', flight: 'DL3' }], inbound: [], stops: 1 };
  const a = diffSchedule(b, f);
  assert.equal(a[0].kind, 'significant_change');
  assert.match(a[0].detail, /added a connection/);
});

test('an AIRPORT change is a trigger regardless of time', () => {
  const b = snap(487, '05:40', '16:47');
  const f = snap(487, '05:40', '16:47');
  f.outbound[1].to = 'LGA';
  const a = diffSchedule(b, f);
  assert.equal(a[0].kind, 'significant_change');
  assert.match(a[0].detail, /different airport/);
});

test('contract thresholds differ by airline: 45 min moves United, not Delta', () => {
  const ua = diffSchedule(snap(300, '05:40', '16:47'), snap(300, '05:40', '17:32'), { iata: 'UA' });
  const dl = diffSchedule(snap(300, '05:40', '16:47'), snap(300, '05:40', '17:32'), { iata: 'DL' });
  assert.equal(ua[0].kind, 'schedule_change', 'United: 45 ≥ 30-min contract line');
  assert.equal(dl[0].kind, 'minor_change', 'Delta: 45 < 120-min line');
});

test('the schedule diff never emits a fare alert', () => {
  assert.deepEqual(kinds(diffSchedule(snap(487, '05:40', '16:47'), snap(400, '05:40', '20:00'), { zone: 'domestic' })), ['significant_change']);
});

test('CLOCK-TEXT times (the keyless source) diff correctly — "12:57PM" -> "4:10PM" = 193 min', () => {
  // Google Flights gives clock text with no date. Without this, schedule shifts would silently
  // never fire on the free data source.
  const gf = (dep, arr, price = 500) => ({ price, outbound: [{ from: 'HLN', to: 'SLC', dep, arr: null, flight: 'DL' }, { from: 'SLC', to: 'JFK', dep: null, arr, flight: 'DL' }], inbound: [], stops: 1 });
  const a = diffSchedule(gf('12:57PM', '11:40PM'), gf('12:57PM', '11:40PM'));
  assert.deepEqual(a, [], 'identical clock text -> no alert');
  const shifted = diffSchedule(gf('5:40 AM', '11:00 AM'), gf('5:40 AM', '2:13 PM'), { zone: 'domestic', iata: 'DL' });
  assert.equal(shifted[0].kind, 'significant_change', '3h13m later arrival crosses the federal line');
  assert.equal(shifted[0].delta, 193);
});

test('CLOCK-TEXT wraps across midnight to the nearest distance', () => {
  const gf = (arr) => ({ price: 500, outbound: [{ from: 'A', to: 'B', dep: '9:00 PM', arr, flight: 'X' }], inbound: [], stops: 0 });
  const a = diffSchedule(gf('11:50 PM'), gf('12:20 AM'), { iata: 'DL' });
  // 30 minutes later, not -1410. Below Delta's 120-min line -> minor.
  assert.equal(a[0].kind, 'minor_change');
  assert.equal(a[0].delta, 30);
});

test('mixed formats across providers are NOT guessed at', () => {
  const iso = { price: 500, outbound: [{ from: 'A', to: 'B', dep: '2026-09-10T05:40:00', arr: '2026-09-10T11:00:00', flight: 'X' }], inbound: [], stops: 0 };
  const txt = { price: 500, outbound: [{ from: 'A', to: 'B', dep: '5:40 AM', arr: '11:00 AM', flight: 'X' }], inbound: [], stops: 0 };
  assert.deepEqual(diffSchedule(iso, txt), [], 'no time alert when the two snapshots came from different providers');
});

test('missing legs are skipped rather than crashing', () => {
  assert.deepEqual(diffSchedule({ price: 300, outbound: [], inbound: [] }, { price: 250, outbound: [], inbound: [] }), []);
  assert.deepEqual(diffSchedule(null, snap(1, '05:40', '16:47')), []);
  assert.deepEqual(diffSchedule(snap(1, '05:40', '16:47'), null), []);
});

// ---------------------------------------------------------------- fare levers
test('a drop is measured against what was PAID, with the exact dollar delta', () => {
  const a = priceAlert(snap(412, '05:40', '16:47'), { paid: 487 });
  assert.equal(a.kind, 'price_drop');
  assert.equal(a.delta, 75);
  assert.match(a.title, /\$75/);
  assert.equal(a.severity, 'high', '$50+ is high');
  assert.equal(a.basis, 'paid');
  assert.match(a.detail, /\$487 you paid/);
  assert.match(a.detail, /same cabin/, 'cabin unknown -> says to confirm it');
});

test('without a paid fare the basis is the price when watching began — and it says so', () => {
  const a = priceAlert(snap(450, '05:40', '16:47'), { baseline: snap(480, '05:40', '16:47') });
  assert.equal(a.basis, 'watch');
  assert.match(a.detail, /when the watchdog started/);
  assert.match(a.lever, /If you paid more than \$450/);
});

test('a $1 wobble, an increase, a Basic Economy listing, or no basis -> no fare alert', () => {
  assert.equal(priceAlert(snap(486.5, '05:40', '16:47'), { paid: 487 }), null);
  assert.equal(priceAlert(snap(600, '05:40', '16:47'), { paid: 487 }), null);
  assert.equal(priceAlert({ ...snap(300, '05:40', '16:47'), basic: true }, { paid: 487 }), null);
  assert.equal(priceAlert(snap(300, '05:40', '16:47'), {}), null);
});

// ---------------------------------------------------------------- identity
test('flight numbers normalize; a bare carrier code is not a flight number; the airline comes from the flight number first', () => {
  assert.equal(normFlight('dl 0123'), 'DL123');
  assert.equal(normFlight('DL'), null);
  assert.equal(normFlight('B6 915'), 'B6915');
  assert.equal(iataFor({ flightNo: 'UA55', airline: 'Delta Air Lines' }), 'UA');
  assert.equal(iataFor({ airline: 'Alaska Airlines' }), 'AS');
  assert.equal(iataFor({}), null);
});

// ---------------------------------------------------------------- whole sweeps, against a throwaway registry
const freshStore = () => {
  process.env.FAIRFARE_WATCH_FILE = path.join(mkdtempSync(path.join(os.tmpdir(), 'ff-watch-')), 'watch.json');
};
const D = '2026-10-01';
const iso = (hm) => `${D}T${hm}:00`;
const seg = (from, to, dep, arr, flightNumber, cabin = null) => ({ from, to, dep, arr, flightNumber, cabin });
const offer = (price, out, extra = {}) => ({ price: { total: price }, outbound: { segments: out }, inbound: null, companion: { status: 'eligible' }, ...extra });
const results = (offers, source = 'amadeus:production') => async () => ({ offers, source });
const quick = (search) => sweep(search, { pace: 0, jitter: 0 });
const DL100 = (dep = '06:00', arr = '14:00') => seg('HLN', 'JFK', iso(dep), iso(arr), 'DL100');
const trip = (over = {}) => ({ origin: 'HLN', destination: 'JFK', departDate: D, zone: 'domestic', airline: 'Delta Air Lines', ...over });

test('SWEEP: the booked flight is unchanged while a cheaper connection ranks first -> no alerts, nothing counted', async () => {
  freshStore();
  register(trip({ id: 'a', flightNo: 'DL100', fare: '450' }), [offer(450, [DL100()])]);
  const cheaperConnection = offer(390, [seg('HLN', 'SLC', iso('11:00'), iso('12:30'), 'DL200'), seg('SLC', 'JFK', iso('13:30'), iso('22:30'), 'DL300')]);
  await quick(results([cheaperConnection, offer(450, [DL100()])]));
  const w = get('a');
  assert.equal(w.match, 'matched');
  assert.deepEqual(w.alerts, []);
  assert.equal(summary([w]).moneyFound, 0);
});

test('SWEEP: a drop on the booked flight is against what was paid; ONE live alert follows the price and resolves when it is gone', async () => {
  freshStore();
  register(trip({ id: 'b', flightNo: 'DL100', fare: '500' }), [offer(500, [DL100()])]);
  const at = async (price) => { await quick(results([offer(price, [DL100()])])); return get('b'); };
  let w = await at(480);
  assert.equal(w.alerts.length, 1);
  assert.equal(w.alerts[0].delta, 20);
  assert.equal(w.alerts[0].basis, 'paid');
  w = await at(460);
  assert.equal(w.alerts.length, 1, 'updated, not stacked');
  assert.equal(w.alerts[0].delta, 40);
  assert.equal(w.alerts[0].seen, false);
  assert.equal(summary([w]).moneyFound, 40, 'what is available now, not a running sum');
  w = await at(480);
  assert.equal(w.alerts[0].delta, 20);
  assert.equal(summary([w]).moneyFound, 20);
  w = await at(520);
  assert.equal(w.alerts[0].resolved, true);
  assert.equal(summary([w]).moneyFound, 0);
});

test('SWEEP: the booked first flight now departs 3h+ earlier -> refund lever carrying that flight’s own old and new times', async () => {
  freshStore();
  const conn = (dep, arr, next) => [seg('HLN', 'SLC', iso(dep), iso(arr), 'DL100'), seg('SLC', 'JFK', iso(next[0]), iso(next[1]), next[2])];
  register(trip({ id: 'c', flightNo: 'DL100' }), [offer(500, conn('09:00', '10:30', ['11:30', '18:00', 'DL5']))]);
  await quick(results([offer(500, conn('05:50', '07:20', ['08:30', '15:00', 'DL7']))]));
  const a = get('c').alerts.find((x) => x.kind === 'significant_change');
  assert.ok(a, JSON.stringify(get('c').alerts));
  assert.match(a.detail, /DL100 now departs 190 min earlier/);
  assert.equal(a.leg, 'outbound');
  assert.match(a.was, /DL100 HLN→SLC dep 09:00/);
  assert.match(a.now, /dep 05:50/);
  assert.match(a.rule, /260\.2/);
});

test('SWEEP: a first flight that lands 2.5h later is a contract lever with a connection warning — never a refund claim', async () => {
  freshStore();
  const conn = (dep, arr) => [seg('HLN', 'SLC', iso(dep), iso(arr), 'DL100'), seg('SLC', 'JFK', iso('15:00'), iso('21:00'), 'DL9')];
  register(trip({ id: 'd', flightNo: 'DL100' }), [offer(500, conn('09:00', '10:30'))]);
  await quick(results([offer(500, conn('11:30', '13:00'))]));
  const w = get('d');
  assert.deepEqual(kinds(w.alerts), ['schedule_change']);
  assert.match(w.alerts[0].detail, /connecting flight/);
  assert.match(w.alerts[0].detail, /120\+ minutes/);
});

test('SWEEP: the booked final flight arrives 3h+ later -> refund lever', async () => {
  freshStore();
  const first = seg('HLN', 'SLC', iso('09:00'), iso('10:30'), 'DL100');
  register(trip({ id: 'e', flightNo: 'DL9' }), [offer(500, [first, seg('SLC', 'JFK', iso('12:00'), iso('18:00'), 'DL9')])]);
  await quick(results([offer(500, [first, seg('SLC', 'JFK', iso('15:10'), iso('21:10'), 'DL9')])]));
  const a = get('e').alerts[0];
  assert.equal(a.kind, 'significant_change');
  assert.match(a.detail, /DL9 now arrives 190 min later/);
});

test('SWEEP: another airline’s booking is not watched — the price sources list Delta only', async () => {
  freshStore();
  const w = register(trip({ id: 'f', airline: 'United Airlines', flightNo: 'UA55' }), null);
  assert.equal(w.status, 'unsupported');
  let called = 0;
  const r = await quick(async () => { called++; return { offers: [], source: 'amadeus:production' }; });
  assert.equal(called, 0);
  assert.equal(r.checked, 0);
});

test('SWEEP: a typed flight number on a source without flight numbers -> "unmatchable", no alerts', async () => {
  freshStore();
  register(trip({ id: 'g', flightNo: 'DL100', fare: '900' }), null);
  await quick(results([offer(300, [seg('HLN', 'JFK', '6:00AM', '2:00PM', 'DL')], { fareDataAvailable: false })], 'googleflights'));
  const w = get('g');
  assert.equal(w.match, 'unmatchable');
  assert.deepEqual(w.alerts, []);
});

test('SWEEP: a saved result is followed by its exact airports and times; missing twice -> one check-your-reservation note, cleared when it returns', async () => {
  freshStore();
  const mine = (price) => offer(price, [seg('HLN', 'SLC', '5:40AM', null, 'DL'), seg('SLC', 'JFK', null, '4:47PM', 'DL')], { fareDataAvailable: false });
  const other = (price) => offer(price, [seg('HLN', 'SLC', '1:10PM', null, 'DL'), seg('SLC', 'JFK', null, '11:55PM', 'DL')], { fareDataAvailable: false });
  const itinerary = { outbound: [{ from: 'HLN', to: 'SLC', dep: '5:40AM', arr: null, flight: 'DL' }, { from: 'SLC', to: 'JFK', dep: null, arr: '4:47PM', flight: 'DL' }], inbound: [] };
  register(trip({ id: 'h', fare: '900', itinerary }), [mine(842), other(700)]);
  const gf = (offers) => quick(results(offers, 'googleflights'));
  await gf([other(650), mine(800)]);
  let w = get('h');
  assert.equal(w.match, 'matched');
  assert.deepEqual(kinds(w.alerts), ['price_drop']);
  assert.equal(w.alerts[0].delta, 100, 'against the $900 paid, on the SAME itinerary — not the $650 other flight');
  assert.match(w.alerts[0].detail, /same cabin/);
  await gf([other(650)]);
  assert.equal(get('h').alerts.filter((a) => a.kind === 'flight_not_found').length, 0, 'one miss is not enough');
  await gf([other(650)]);
  w = get('h');
  const note = w.alerts.find((a) => a.kind === 'flight_not_found' && !a.resolved);
  assert.ok(note);
  assert.match(note.detail, /Your 5:40AM departure/);
  assert.equal(w.alerts.some((a) => a.kind === 'significant_change'), false, 'a missing flight is never a refund claim');
  await gf([mine(800)]);
  w = get('h');
  assert.equal(w.alerts.find((a) => a.kind === 'flight_not_found').resolved, true);
  assert.equal(w.alerts.filter((a) => a.kind === 'price_drop').length, 1);
});

test('SWEEP: with no flight number and no saved itinerary, the route’s cheapest fare is never "your flight"', async () => {
  freshStore();
  register(trip({ id: 'i', fare: '500' }), null);
  await quick(results([offer(500, [DL100('06:00', '14:00')])]));
  await quick(results([offer(300, [seg('HLN', 'JFK', iso('13:00'), iso('23:00'), 'DL900')])]));
  const w = get('i');
  assert.equal(w.match, 'route_only');
  assert.deepEqual(w.alerts, []);
});

test('SWEEP: a watch registered before booking identity existed has its old route-level alerts retired', async () => {
  freshStore();
  writeFileSync(process.env.FAIRFARE_WATCH_FILE, JSON.stringify({
    old: { id: 'old', origin: 'HLN', destination: 'JFK', departDate: D, zone: 'domestic', iata: 'DL', baseline: { price: 887 }, alerts: [{ kind: 'significant_change', delta: 203, title: 'Outbound changed enough to unlock a CASH refund', seen: false }], checks: 3 },
  }));
  await quick(results([offer(500, [DL100()])]));
  const w = get('old');
  assert.equal(w.alerts[0].resolved, true);
  assert.equal(w.match, 'route_only');
  assert.equal(summary([w]).unseen, 0);
});

test('SWEEP: a Basic Economy listing on the booked flight never counts as a fare drop', async () => {
  freshStore();
  register(trip({ id: 'j', flightNo: 'DL100', fare: '450' }), [offer(450, [DL100()])]);
  await quick(results([offer(300, [DL100()], { basicEconomy: true })]));
  assert.deepEqual(get('j').alerts, [], 'only Basic matched -> no comparison');
  await quick(results([offer(300, [DL100()], { basicEconomy: true }), offer(440, [DL100()])]));
  assert.equal(get('j').alerts.find((x) => x.kind === 'price_drop').delta, 10, 'the non-Basic fare on the same flight');
});

test('SWEEP: when the typed flight sits in two different itineraries, no single price is called "yours"', async () => {
  freshStore();
  const first = seg('HLN', 'SLC', iso('09:00'), iso('10:30'), 'DL100');
  register(trip({ id: 'k', flightNo: 'DL100', fare: '600' }), null);
  await quick(results([offer(400, [first, seg('SLC', 'JFK', iso('12:00'), iso('18:00'), 'DL5')]), offer(450, [first, seg('SLC', 'JFK', iso('13:00'), iso('19:00'), 'DL7')])]));
  const w = get('k');
  assert.equal(w.match, 'matched');
  assert.equal(w.alerts.some((a) => a.kind === 'price_drop'), false);
});
