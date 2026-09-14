// Deterministic proof for the coverage checker — which flights EU261/UK261/APPR actually cover.
// Run:  node --test
//
// Coverage errors are the highest-harm mistake this app could make: a false "covered" sends
// someone chasing money they aren't owed; a false "not covered" costs them €600. Expected values
// verified against Reg. (EC) 261/2004 Art. 3, the Commission's 2016 interpretive guidelines,
// UK261 (SI 2019/278), and Canada's APPR (SOR/2019-150).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(__dirname, '..', 'public', 'coverage.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const Coverage = sandbox.window.Coverage;

const regimes = (r) => Array.from(r.covered, (c) => c.regime).join(",");

test('THE ASYMMETRY: departing the EU covers ANY airline; arriving covers only EU carriers', () => {
  // CDG→JFK on Delta: covered, €600 long-haul.
  const out = Coverage.check({ from: 'eu', to: 'us', carrier: 'us', band: 'long' });
  assert.equal(regimes(out), 'EU261');
  assert.equal(out.covered[0].amount, '€600');

  // JFK→CDG on the SAME Delta metal: NOT covered.
  const back = Coverage.check({ from: 'us', to: 'eu', carrier: 'us', band: 'long' });
  assert.equal(back.covered.length, 0);
  assert.ok(back.notCovered.some((c) => c.regime === 'EU261'), 'explains why');

  // JFK→CDG on Air France: covered.
  const af = Coverage.check({ from: 'us', to: 'eu', carrier: 'eu', band: 'long' });
  assert.equal(regimes(af), 'EU261');
});

test('EU distance bands: €250 / €400 / €600', () => {
  for (const [band, amt] of [['short', '€250'], ['medium', '€400'], ['long', '€600']]) {
    const r = Coverage.check({ from: 'eu', to: 'other', carrier: 'other', band });
    assert.equal(r.covered[0].amount, amt, band);
  }
});

test('SWITZERLAND: departures covered on any airline via the EU–Swiss agreement', () => {
  // ZRH→JFK on United — covered (this silently returned "not covered" before the fix).
  const out = Coverage.check({ from: 'ch', to: 'us', carrier: 'us', band: 'long' });
  assert.equal(regimes(out), 'EU261');
  assert.match(out.covered[0].why, /Switzerland/);

  // JFK→ZRH on a U.S. carrier — not covered; on an EU carrier — covered.
  assert.equal(Coverage.check({ from: 'us', to: 'ch', carrier: 'us', band: 'long' }).covered.length, 0);
  assert.equal(regimes(Coverage.check({ from: 'us', to: 'ch', carrier: 'eu', band: 'long' })), 'EU261');
});

test('UK: departures on any airline; arrivals on UK OR EU carriers (broader than EU261)', () => {
  assert.equal(regimes(Coverage.check({ from: 'uk', to: 'us', carrier: 'us', band: 'long' })), 'UK261');
  assert.equal(regimes(Coverage.check({ from: 'us', to: 'uk', carrier: 'uk', band: 'long' })), 'UK261');
  assert.equal(regimes(Coverage.check({ from: 'us', to: 'uk', carrier: 'eu', band: 'long' })), 'UK261');
  assert.equal(Coverage.check({ from: 'us', to: 'uk', carrier: 'us', band: 'long' }).covered.length, 0);
});

test('UK long-haul pays £520 (not euros)', () => {
  const r = Coverage.check({ from: 'uk', to: 'us', carrier: 'us', band: 'long' });
  assert.equal(r.covered[0].amount, '£520');
});

test('CANADA: covered in BOTH directions on any airline — unlike EU261', () => {
  for (const t of [{ from: 'ca', to: 'us' }, { from: 'us', to: 'ca' }]) {
    const r = Coverage.check({ ...t, carrier: 'us', band: 'medium' });
    assert.equal(regimes(r), 'Canada APPR', JSON.stringify(t));
  }
});

test('Canada card carries the 1-year deadline and the safety carve-out', () => {
  const r = Coverage.check({ from: 'us', to: 'ca', carrier: 'us', band: 'medium' });
  assert.match(r.covered[0].deadline, /1 YEAR/);
  assert.match(r.covered[0].pays, /not safety-required/);
});

test('US domestic: honestly reports there is no delay-compensation law', () => {
  const r = Coverage.check({ from: 'us', to: 'us', carrier: 'us', band: 'short' });
  assert.equal(r.covered.length, 0);
  assert.ok(r.notCovered.some((c) => c.regime === 'U.S. law'));
  assert.match(r.headline, /No cash-compensation law/);
});

test('Connecting-flight and technical-fault guidance appears for EU/CH/UK departures only', () => {
  for (const from of ['eu', 'ch', 'uk']) {
    const r = Coverage.check({ from, to: 'other', carrier: 'other', band: 'long' });
    assert.ok(r.alsoKnow.some((k) => /ONE booking/.test(k.title)), from + ': connection rule shown');
    assert.ok(r.alsoKnow.some((k) => /Technical/.test(k.title)), from + ': technical-fault rule shown');
  }
  const us = Coverage.check({ from: 'us', to: 'us', carrier: 'us', band: 'short' });
  assert.equal((us.alsoKnow || []).filter((k) => /ONE booking/.test(k.title)).length, 0);
});

test('Codeshare warning appears when arriving into EU/UK/CH on a non-EU/UK carrier', () => {
  const r = Coverage.check({ from: 'us', to: 'eu', carrier: 'us', band: 'long' });
  assert.ok(r.alsoKnow.some((k) => /OPERATING airline/.test(k.title)));
});

test('The headline never claims coverage when nothing matched', () => {
  const cases = [
    { from: 'us', to: 'eu', carrier: 'us' },
    { from: 'us', to: 'other', carrier: 'other' },
    { from: 'other', to: 'other', carrier: 'eu' },
  ];
  for (const c of cases) {
    const r = Coverage.check({ ...c, band: 'long' });
    if (!r.covered.length) assert.match(r.headline, /^No /, JSON.stringify(c));
  }
});
