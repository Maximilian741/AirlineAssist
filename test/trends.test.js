// Deterministic proof for the price-trend engine (src/trends.js).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { analyze, slopePerDay, sparkline, summaryLine, daysBetween, MIN_POINTS } from '../src/trends.js';

const day = (n) => `2026-08-${String(n).padStart(2, '0')}`;
const S = (...prices) => prices.map((p, i) => ({ day: day(i + 1), price: p }));

test('daysBetween is exact and signed', () => {
  assert.equal(daysBetween('2026-08-01', '2026-08-22'), 21);
  assert.equal(daysBetween('2026-08-22', '2026-08-01'), -21);
  assert.equal(daysBetween('bad', '2026-08-01'), null);
});

test('slopePerDay: exact least-squares on a straight line', () => {
  assert.equal(slopePerDay(S(100, 110, 120, 130)), 10);
  assert.equal(slopePerDay(S(200, 190, 180)), -10);
  assert.equal(slopePerDay(S(150)), 0);
});

test('empty and tiny series -> learn, never a fake verdict', () => {
  assert.equal(analyze([]).verdict, 'learn');
  const a = analyze(S(300, 290));
  assert.equal(a.verdict, 'learn');
  assert.equal(a.n, 2);
  assert.match(a.reason, new RegExp(`start at ${MIN_POINTS}`));
  // stats are still populated
  assert.equal(a.low, 290); assert.equal(a.high, 300); assert.equal(a.changeSinceLast, -10);
});

test('at the low we have seen -> buy, reason cites the exact count and span', () => {
  const a = analyze(S(320, 305, 298, 288), { today: day(10), departDate: day(30) });
  assert.equal(a.verdict, 'buy');
  assert.match(a.reason, /\$288 is the lowest we've seen across 4 checks over 3 days/);
  assert.equal(a.aboveLow, 0);
  assert.equal(a.positionPct, 0);
});

test('falling with time to spare -> wait, and says how far above the low (no $/day, no forecast)', () => {
  const a = analyze(S(400, 380, 360, 340), { today: day(10), departDate: '2026-09-30' }); // latest IS the low -> buy wins
  const b = analyze(S(300, 400, 380, 360, 350), { today: day(10), departDate: '2026-10-01' });
  assert.equal(b.verdict, 'wait');
  assert.match(b.reason, /^Price is down \$30 over the last 3 checks, with 52 days to go\./);
  assert.match(b.reason, /\$50 above the \$300 we saw on 2026-08-01/);
  assert.equal(a.verdict, 'buy');
  assert.match(a.reason, /^\$340 is the lowest we've seen across 4 checks over 3 days\./);
});

test('close to departure and not falling -> buy, names the days left and the move (no prediction)', () => {
  const a = analyze(S(200, 250, 255, 260), { today: day(10), departDate: day(20) });
  assert.equal(a.daysToDeparture, 10);
  assert.equal(a.verdict, 'buy');
  assert.equal(a.reason, "10 days to departure and the price is up $10 over the last 3 checks. It's $60 over the $200 low we saw on 2026-08-01.");
});

test('"within $N of the low" is said honestly — never "the lowest" when it is not', () => {
  const a = analyze(S(500, 300, 305), { today: day(10), departDate: '2026-10-01' });
  assert.equal(a.verdict, 'buy'); // within tolerance
  assert.match(a.reason, /^\$305 is within \$5 of the \$300 low we saw on 2026-08-02/);
  assert.doesNotMatch(a.reason, /is the lowest/);
});

test('the per-day LOW counts: a morning $200 that closed at $250 is still the low we saw', () => {
  const a = analyze([{ day: day(1), price: 250, low: 200 }, { day: day(2), price: 260 }, { day: day(3), price: 262 }], { today: day(10), departDate: '2026-10-01' });
  assert.equal(a.low, 200);
  assert.equal(a.lowDay, day(1));
  assert.equal(a.aboveLow, 62);
});

test('a trip that already departed gets a "past" verdict, never buy/wait', () => {
  const a = analyze(S(300, 280, 290), { today: '2026-09-01', departDate: '2026-08-20' });
  assert.equal(a.verdict, 'past');
  assert.match(a.reason, /departed 12 days ago/);
});

test('rising far out never prints a negative $/day: uses the window move', () => {
  // uneven gaps: days 1,2,10 @ 200,300,206 -> endpoints up (+3%) while the least-squares slope is negative
  const a = analyze([{ day: day(1), price: 200 }, { day: day(2), price: 300 }, { day: day(10), price: 206 }], { today: day(12), departDate: '2026-11-01' });
  assert.equal(a.direction, 'rising');
  assert.match(a.reason, /^Price is up \$6 over the last 3 checks\./);
  assert.doesNotMatch(a.reason, /-\$|\$-/);
});

test('rising far out -> buy inside the 24h window (cancel/rebook if it dips)', () => {
  const a = analyze(S(200, 220, 240, 260), { today: day(10), departDate: '2026-11-01' });
  assert.equal(a.verdict, 'buy');
  assert.match(a.reason, /24-hour cancel window/);
});

test('flat and above the low -> watch', () => {
  const a = analyze(S(200, 250, 251, 250, 251), { today: day(10), departDate: '2026-11-01' });
  assert.equal(a.direction, 'flat');
  assert.equal(a.verdict, 'watch');
  assert.match(a.reason, /\$51 above the \$200 low/);
});

test('direction: flat band is 2%', () => {
  assert.equal(analyze(S(500, 505, 508)).direction, 'flat');     // +1.6%
  assert.equal(analyze(S(500, 505, 515)).direction, 'rising');   // +3%
  assert.equal(analyze(S(500, 495, 485)).direction, 'falling');
});

test('summaryLine reads like a human wrote it', () => {
  const a = analyze(S(300, 280, 292));
  assert.equal(summaryLine(a), '↑ $12 since last check · low $280 (08-02) · high $300');
  assert.equal(summaryLine(analyze(S(300, 300, 300))), 'unchanged since last check · low $300 (08-01) · high $300');
});

test('sparkline: normalized path within the box, low at bottom, high at top', () => {
  const sp = sparkline(S(100, 200, 150), 120, 28, 2);
  assert.equal(sp.points.length, 3);
  assert.equal(sp.points[0][1], 26);   // min -> y = h - pad
  assert.equal(sp.points[1][1], 2);    // max -> y = pad
  assert.match(sp.path, /^M2 26 L60 2 L118 14$/);
  assert.equal(sparkline(S(100)).path, '');
});

test('unsorted input is sorted by day before analysis', () => {
  const a = analyze([{ day: day(3), price: 100 }, { day: day(1), price: 300 }, { day: day(2), price: 200 }]);
  assert.equal(a.latest, 100);
  assert.equal(a.direction, 'falling');
});
