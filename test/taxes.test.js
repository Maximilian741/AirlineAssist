// Deterministic proof for the companion tax computation.
// Run:  node --test
//
// Every expected number below is derived independently from the primary sources (IRS Pub. 510,
// 49 CFR 1510.5, 49 U.S.C. 40117, IRC 4261) and cross-checked against figures Delta itself
// publishes. If a rate changes, these tests fail loudly instead of silently shipping bad math.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeCompanionTaxes, segmentsOf, RATES, DELTA_CAPS } from '../src/taxes.js';

const sum = (b) => Math.round(b.reduce((n, x) => n + x.amount, 0) * 100) / 100;

test('2026 statutory rates match the primary sources', () => {
  assert.equal(RATES.securityFeePerOneWayTrip, 5.60, 'AY per one-way — 49 CFR 1510.5');
  assert.equal(RATES.securityFeeRoundTripCap, 11.20, 'AY round-trip cap — Pub. L. 113-294');
  assert.equal(RATES.pfcMaxPerBoarding, 4.50, 'PFC max — 49 U.S.C. 40117(b)(1)');
  assert.equal(RATES.pfcMaxBoardingsPerDirection, 2, 'PFC boardings — 49 U.S.C. 40117(e)(2)');
  assert.equal(RATES.domesticSegmentTax, 5.30, 'ZP 2026 — IRS Pub. 510');
  assert.equal(RATES.akHiSegmentTax, 11.70, 'ZP Alaska/Hawaii 2026 — IRS Pub. 510');
  assert.equal(RATES.intlDepartureTax, 23.40, 'International head tax 2026 — IRS Pub. 510');
  assert.equal(RATES.domesticExcisePct, 0.075, '7.5% excise — IRC 4261(a)');
  assert.equal(DELTA_CAPS.domestic, 80, 'Delta domestic cap');
  assert.equal(DELTA_CAPS.intl_eligible, 250, 'Delta international cap');
});

test('WORKED EXAMPLE: HLN–SLC–JFK / JFK–SLC–HLN (4 segments) = $50.40', () => {
  // AY 11.20 + XF (2+2 boardings × 4.50 = 18.00) + ZP (4 × 5.30 = 21.20) + US 0.00
  const r = computeCompanionTaxes({ outboundSegments: 2, inboundSegments: 2, zone: 'domestic' });
  assert.equal(r.total, 50.40);
  assert.equal(r.exact, true, 'domestic must be exact, never estimated');
  assert.equal(r.capped, false, '$50.40 is under Delta’s $80 cap');
  const by = Object.fromEntries(r.breakdown.map((b) => [b.code, b.amount]));
  assert.equal(by.AY, 11.20);
  assert.equal(by.XF, 18.00);
  assert.equal(by.ZP, 21.20);
  assert.equal(by.US, 0, '7.5% of a $0 companion fare is $0 — the reason the cert is cheap');
  assert.equal(sum(r.breakdown), 50.40, 'breakdown must sum to the total');
});

test('Nonstop each way (2 segments) = $30.80', () => {
  // AY 11.20 + XF (1+1 × 4.50 = 9.00) + ZP (2 × 5.30 = 10.60)
  const r = computeCompanionTaxes({ outboundSegments: 1, inboundSegments: 1 });
  assert.equal(r.total, 30.80);
  assert.equal(sum(r.breakdown), 30.80);
});

test('CORROBORATION: the no-PFC floor is $21.80 — Delta advertises "from $22"', () => {
  // Independent check that the formula is right: Delta publicly states companion taxes run
  // "between $22 and $250". Our computed floor (nonstop RT at airports levying no PFC)
  // lands at $21.80 — i.e. Delta's own advertised floor, reproduced from statute.
  const r = computeCompanionTaxes({ outboundSegments: 1, inboundSegments: 1, pfcPerBoarding: 0 });
  assert.equal(r.total, 21.80);
  assert.ok(Math.abs(r.total - 22) < 1, 'must reproduce Delta’s advertised ~$22 floor');
});

test('One-way domestic charges a single security fee', () => {
  const nonstop = computeCompanionTaxes({ outboundSegments: 1 });
  assert.equal(nonstop.total, 15.40); // 5.60 + 4.50 + 5.30
  const oneConnection = computeCompanionTaxes({ outboundSegments: 2 });
  assert.equal(oneConnection.total, 25.20); // 5.60 + 9.00 + 10.60
});

test('Security fee never exceeds the $11.20 round-trip cap, however many segments', () => {
  for (const segs of [1, 2, 3, 4, 6, 10]) {
    const r = computeCompanionTaxes({ outboundSegments: segs, inboundSegments: segs });
    const ay = r.breakdown.find((b) => b.code === 'AY').amount;
    assert.equal(ay, 11.20, `AY stayed capped at ${segs} segments/direction`);
  }
});

test('PFC never exceeds $18.00 on a round trip (max 2 boardings per direction)', () => {
  for (const segs of [2, 3, 4, 8]) {
    const r = computeCompanionTaxes({ outboundSegments: segs, inboundSegments: segs });
    const xf = r.breakdown.find((b) => b.code === 'XF').amount;
    assert.equal(xf, 18.00, `XF stayed capped at ${segs} segments/direction`);
  }
});

test('Delta’s $80 domestic cap binds only on absurd itineraries, and is enforced', () => {
  const sane = computeCompanionTaxes({ outboundSegments: 3, inboundSegments: 3 });
  assert.equal(sane.total, 61.00); // 11.20 + 18.00 + 31.80
  assert.equal(sane.capped, false);

  const absurd = computeCompanionTaxes({ outboundSegments: 6, inboundSegments: 6 });
  assert.equal(absurd.total, 80, 'capped at Delta’s contractual maximum');
  assert.equal(absurd.capped, true);
});

test('Alaska/Hawaii segments use the higher $11.70 rate', () => {
  const r = computeCompanionTaxes({ outboundSegments: 1, inboundSegments: 1, akHi: true });
  assert.equal(r.total, 43.60); // 11.20 + 9.00 + (2 × 11.70 = 23.40)
});

test('INTERNATIONAL: U.S. portion of a nonstop round trip = $75.13', () => {
  // AY 5.60 (only the U.S.-originating one-way) + XF 4.50 (U.S. boarding only)
  // + head taxes 46.80 + Customs/Immigration/APHIS 18.23.  ZP and the 7.5% do NOT apply.
  const r = computeCompanionTaxes({ outboundSegments: 1, inboundSegments: 1, zone: 'intl_eligible', foreignTax: 0 });
  assert.equal(r.total, 75.13);
  assert.equal(r.breakdown.find((b) => b.code === 'ZP'), undefined, 'no segment tax on international');
});

test('INTERNATIONAL: with a domestic connection each way, U.S. portion = $84.13', () => {
  // Extra U.S. boarding outbound + one on the return: XF 13.50 instead of 4.50.
  const r = computeCompanionTaxes({ outboundSegments: 2, inboundSegments: 2, zone: 'intl_eligible', foreignTax: 0 });
  assert.equal(r.total, 84.13);
});

test('INTERNATIONAL is honestly flagged as approximate unless foreign tax is known', () => {
  const unknown = computeCompanionTaxes({ outboundSegments: 1, inboundSegments: 1, zone: 'intl_eligible' });
  assert.equal(unknown.exact, false, 'must NOT claim exactness when foreign tax is a default');
  assert.ok(unknown.note, 'must explain why');

  const known = computeCompanionTaxes({ outboundSegments: 1, inboundSegments: 1, zone: 'intl_eligible', foreignTax: 80 });
  assert.equal(known.exact, true, 'exact once the foreign tax is supplied');
  assert.equal(known.total, 155.13); // 75.13 + 80
});

test('International total is capped at Delta’s $250', () => {
  const r = computeCompanionTaxes({ outboundSegments: 2, inboundSegments: 2, zone: 'intl_eligible', foreignTax: 400 });
  assert.equal(r.total, 250);
  assert.equal(r.capped, true);
});

test('Companion taxes are ALWAYS far below the old $80 fallback for real domestic trips', () => {
  // This is the bug being fixed: the app used to assume $80 whenever taxes weren't visible,
  // understating savings by ~$30–$58 on every domestic result.
  for (const [out, inb] of [[1, 1], [2, 2], [1, 2], [2, 1]]) {
    const r = computeCompanionTaxes({ outboundSegments: out, inboundSegments: inb });
    assert.ok(r.total < 80, `${out}+${inb} segments computed ${r.total}, below the old $80 assumption`);
    assert.ok(r.total >= 21.80, 'and never below the statutory floor');
  }
});

test('Missing itinerary detail returns null rather than a fake number', () => {
  const r = computeCompanionTaxes({ outboundSegments: 0 });
  assert.equal(r.total, null);
  assert.equal(r.exact, false);
});

test('segmentsOf() reads real segments, else derives from the stop count', () => {
  assert.equal(segmentsOf({ segments: [{}, {}] }), 2, 'uses actual segments');
  assert.equal(segmentsOf(null, 1), 2, '1 stop = 2 segments');
  assert.equal(segmentsOf(null, 0), 1, 'nonstop = 1 segment');
  assert.equal(segmentsOf(null, null), 0, 'unknown stays unknown');
});
