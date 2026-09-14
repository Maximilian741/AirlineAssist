// Deterministic proof for the watchdog's diff engine — the part that turns "your flight moved"
// into a specific dollar lever. Run:  node --test
//
// Thresholds under test are the federal "significant change" line (14 CFR 260.2: 3h domestic /
// 6h international, airport change, added connection) and the per-airline contract lines
// (United 30 min, Alaska 60, Delta 120) that unlock free rebooking below the federal line.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { diff } from '../src/watchdog.js';

const snap = (price, outDep, outArr, extra = {}) => ({
  price,
  outbound: [{ from: 'HLN', to: 'SLC', dep: `2026-09-10T${outDep}:00`, arr: null, flight: 'DL4001' }, { from: 'SLC', to: 'JFK', dep: null, arr: `2026-09-10T${outArr}:00`, flight: 'DL1234' }],
  inbound: [{ from: 'JFK', to: 'SLC', dep: '2026-09-17T08:00:00', arr: null, flight: 'DL1235' }, { from: 'SLC', to: 'HLN', dep: null, arr: '2026-09-17T13:00:00', flight: 'DL4002' }],
  stops: 1,
  ...extra,
});

const kinds = (a) => a.map((x) => x.kind);

test('no change -> no alerts', () => {
  const b = snap(487, '05:40', '16:47');
  assert.deepEqual(diff(b, snap(487, '05:40', '16:47')), []);
});

test('price drop -> rebook lever with the exact dollar delta', () => {
  const a = diff(snap(487, '05:40', '16:47'), snap(412, '05:40', '16:47'));
  assert.equal(a.length, 1);
  assert.equal(a[0].kind, 'price_drop');
  assert.equal(a[0].delta, 75);
  assert.match(a[0].title, /\$75/);
  assert.equal(a[0].severity, 'high', '$50+ is high');
});

test('a $1 wobble is ignored — no alert spam', () => {
  assert.equal(diff(snap(487, '05:40', '16:47'), snap(486.5, '05:40', '16:47')).length, 0);
});

test('price INCREASE is not an alert (nothing actionable)', () => {
  assert.equal(diff(snap(487, '05:40', '16:47'), snap(600, '05:40', '16:47')).length, 0);
});

test('arrival 3h+ later on a domestic trip = SIGNIFICANT change -> cash refund lever (14 CFR 260.2)', () => {
  const a = diff(snap(487, '05:40', '16:47'), snap(487, '05:40', '19:47'), { zone: 'domestic', iata: 'DL' });
  assert.equal(a[0].kind, 'significant_change');
  assert.match(a[0].lever, /full refund/i);
  assert.match(a[0].rule, /260\.2/);
});

test('arrival 2h59m later domestic = NOT significant federally, but IS a Delta contract change', () => {
  const a = diff(snap(487, '05:40', '16:47'), snap(487, '05:40', '19:46'), { zone: 'domestic', iata: 'DL' });
  assert.equal(a[0].kind, 'schedule_change', 'below the 180-min federal line');
  assert.match(a[0].detail, /120\+ minutes/, 'cites Delta’s 120-min contract line');
});

test('international needs 6h, not 3h, for the federal trigger', () => {
  const dom = diff(snap(900, '05:40', '16:47'), snap(900, '05:40', '20:00'), { zone: 'domestic' });
  const intl = diff(snap(900, '05:40', '16:47'), snap(900, '05:40', '20:00'), { zone: 'intl_eligible' });
  assert.equal(dom[0].kind, 'significant_change', 'domestic: 3h13m clears 3h');
  assert.equal(intl[0].kind, 'schedule_change', 'international: 3h13m does NOT clear 6h');
});

test('departure moved EARLIER 3h+ is a trigger; moved LATER is not (Delta Rule 19(A) asymmetry)', () => {
  const earlier = diff(snap(487, '08:40', '16:47'), snap(487, '05:40', '16:47'), { zone: 'domestic' });
  assert.equal(earlier[0].kind, 'significant_change');
  const later = diff(snap(487, '05:40', '16:47'), snap(487, '08:40', '16:47'), { zone: 'domestic' });
  assert.notEqual(later[0].kind, 'significant_change', 'a later departure alone is not the federal trigger');
});

test('an ADDED CONNECTION is a trigger with NO time threshold', () => {
  const b = { price: 487, outbound: [{ from: 'HLN', to: 'JFK', dep: '2026-09-10T05:40:00', arr: '2026-09-10T12:00:00', flight: 'DL1' }], inbound: [], stops: 0 };
  const f = { price: 487, outbound: [{ from: 'HLN', to: 'SLC', dep: '2026-09-10T05:40:00', arr: null, flight: 'DL2' }, { from: 'SLC', to: 'JFK', dep: null, arr: '2026-09-10T12:20:00', flight: 'DL3' }], inbound: [], stops: 1 };
  const a = diff(b, f);
  assert.equal(a[0].kind, 'significant_change');
  assert.match(a[0].detail, /added a connection/);
});

test('an AIRPORT change is a trigger regardless of time', () => {
  const b = snap(487, '05:40', '16:47');
  const f = snap(487, '05:40', '16:47');
  f.outbound[1].to = 'LGA';
  const a = diff(b, f);
  assert.equal(a[0].kind, 'significant_change');
  assert.match(a[0].detail, /different airport/);
});

test('contract thresholds differ by airline: 45 min moves United, not Delta', () => {
  const ua = diff(snap(300, '05:40', '16:47'), snap(300, '05:40', '17:32'), { iata: 'UA' });
  const dl = diff(snap(300, '05:40', '16:47'), snap(300, '05:40', '17:32'), { iata: 'DL' });
  assert.equal(ua[0].kind, 'schedule_change', 'United: 45 ≥ 30-min contract line');
  assert.equal(dl[0].kind, 'minor_change', 'Delta: 45 < 120-min line');
});

test('price drop and schedule change are reported together', () => {
  const a = diff(snap(487, '05:40', '16:47'), snap(400, '05:40', '20:00'), { zone: 'domestic' });
  assert.deepEqual(kinds(a).sort(), ['price_drop', 'significant_change']);
});

test('CLOCK-TEXT times (the keyless source) diff correctly — "12:57PM" -> "4:10PM" = 193 min', () => {
  // Google Flights gives clock text with no date. Without this, schedule shifts would silently
  // never fire on the free data source.
  const gf = (dep, arr, price = 500) => ({ price, outbound: [{ from: 'HLN', to: 'SLC', dep, arr: null, flight: 'DL' }, { from: 'SLC', to: 'JFK', dep: null, arr, flight: 'DL' }], inbound: [], stops: 1 });
  const a = diff(gf('12:57PM', '11:40PM'), gf('12:57PM', '11:40PM'));
  assert.deepEqual(a, [], 'identical clock text -> no alert');
  const shifted = diff(gf('5:40 AM', '11:00 AM'), gf('5:40 AM', '2:13 PM'), { zone: 'domestic', iata: 'DL' });
  assert.equal(shifted[0].kind, 'significant_change', '3h13m later arrival crosses the federal line');
  assert.equal(shifted[0].delta, 193);
});

test('CLOCK-TEXT wraps across midnight to the nearest distance', () => {
  const gf = (arr) => ({ price: 500, outbound: [{ from: 'A', to: 'B', dep: '9:00 PM', arr, flight: 'X' }], inbound: [], stops: 0 });
  const a = diff(gf('11:50 PM'), gf('12:20 AM'), { iata: 'DL' });
  // 30 minutes later, not -1410. Below Delta's 120-min line -> minor.
  assert.equal(a[0].kind, 'minor_change');
  assert.equal(a[0].delta, 30);
});

test('mixed formats across providers are NOT guessed at', () => {
  const iso = { price: 500, outbound: [{ from: 'A', to: 'B', dep: '2026-09-10T05:40:00', arr: '2026-09-10T11:00:00', flight: 'X' }], inbound: [], stops: 0 };
  const txt = { price: 500, outbound: [{ from: 'A', to: 'B', dep: '5:40 AM', arr: '11:00 AM', flight: 'X' }], inbound: [], stops: 0 };
  assert.deepEqual(diff(iso, txt), [], 'no time alert when the two snapshots came from different providers');
});

test('missing legs are skipped rather than crashing', () => {
  const b = { price: 300, outbound: [], inbound: [] };
  const f = { price: 250, outbound: [], inbound: [] };
  assert.equal(diff(b, f)[0].kind, 'price_drop');
  assert.deepEqual(diff(null, f), []);
  assert.deepEqual(diff(b, null), []);
});
