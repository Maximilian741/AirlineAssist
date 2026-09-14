// Deterministic proof for the fare-class decoder.
// Run:  node --test
//
// This letter decides whether the certificate can be ticketed at all, so a wrong verdict either
// sends someone to the airport expecting a free companion seat they can't have, or talks them out
// of one they could. The eligibility map is the same verified source as companion.js TIERS.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', 'fareclass.js'), 'utf8'), sandbox);
const FC = sandbox.window.FareClass;

test('Platinum tickets exactly the five Main Cabin discount classes', () => {
  for (const c of ['L', 'U', 'T', 'X', 'V']) {
    assert.equal(FC.decode(c, 'platinum').cert.ok, true, `${c} should be eligible`);
    assert.equal(FC.decode(c, 'platinum').cert.cabin, 'Main Cabin');
  }
});

test('Basic Economy (E) is never eligible — on either card', () => {
  for (const tier of ['platinum', 'reserve']) {
    const d = FC.decode('E', tier);
    assert.equal(d.cert.ok, false, tier);
    assert.match(d.cert.why, /never eligible/i);
  }
});

test('Comfort+/Premium/First are Reserve-only — and the app explains why', () => {
  for (const c of ['W', 'S', 'A', 'G', 'I', 'Z']) {
    assert.equal(FC.decode(c, 'reserve').cert.ok, true, `${c} eligible on Reserve`);
    const plat = FC.decode(c, 'platinum');
    assert.equal(plat.cert.ok, false, `${c} NOT eligible on Platinum`);
    assert.match(plat.cert.why, /Reserve card, not Platinum/);
    assert.equal(plat.cert.upgradeHint, true, 'flags the card difference');
  }
});

test('Delta One classes are excluded even on Reserve', () => {
  for (const c of ['J', 'C', 'D']) {
    const d = FC.decode(c, 'reserve');
    assert.equal(d.cert.ok, false, c);
    assert.match(d.cert.why, /Delta One/);
  }
});

test('Higher-priced Main Cabin buckets are NOT eligible, and say why', () => {
  for (const c of ['Y', 'B', 'M', 'H', 'Q', 'K']) {
    const d = FC.decode(c, 'reserve');
    assert.equal(d.cert.ok, false, `${c} should not be eligible`);
    assert.match(d.cert.why, /discount band/);
  }
});

test('Input is normalised: lowercase and stray whitespace still resolve', () => {
  assert.equal(FC.decode('t', 'platinum').cert.ok, true);
  assert.equal(FC.decode('  v  ', 'platinum').cert.ok, true);
  assert.equal(FC.decode('t', 'platinum').code, 'T');
});

test('Unknown letters are reported honestly, never guessed', () => {
  const d = FC.decode('N', 'platinum');
  assert.equal(d.known, false);
  assert.match(d.summary, /isn’t one of Delta’s common published classes/);
  assert.equal(d.cert.ok, false, 'must not claim eligibility for an unknown class');
});

test('Non-letters return null rather than a fabricated verdict', () => {
  for (const bad of ['', '  ', '4', '!', null, undefined]) {
    assert.equal(FC.decode(bad, 'platinum'), null, JSON.stringify(bad));
  }
});

test('Verified classes are marked certain; inferred hierarchy is not', () => {
  assert.equal(FC.decode('T', 'platinum').certain, true, 'certificate-mapped class is certain');
  assert.equal(FC.decode('Y', 'platinum').certain, false, 'wider hierarchy is not asserted as fact');
});

test('eligibleList reflects the card tier', () => {
  const plat = FC.eligibleList('platinum');
  assert.equal(plat.length, 1, 'Platinum: Main Cabin only');
  assert.equal(plat[0].codes.join(''), 'LUTXV');

  const res = FC.eligibleList('reserve');
  assert.equal(res.length, 4, 'Reserve: four cabins');
  assert.equal(res.map((g) => g.cabin).join('|'), 'Main Cabin|Comfort+|Premium Select|First Class');
});

test('An unrecognised tier falls back to the conservative Platinum map', () => {
  // Never over-promise because a bad tier string slipped through.
  assert.equal(FC.decode('W', 'gold').cert.ok, false);
  assert.equal(FC.eligibleList('gold').length, 1);
});
