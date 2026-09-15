// The trip vault must never invent an answer that decides money. A saved trip carries only what the
// traveler told us; everything else is asked by the claim wizard, and no dollar figure appears until
// every money question is answered. Loads the REAL shipped public/claim-engine.js + public/trips.js.
// Run:  node --test

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function load(trips) {
  const store = new Map([['ff-trips', JSON.stringify(trips || [])]]);
  const localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
  const sandbox = { window: { localStorage }, localStorage };
  vm.createContext(sandbox);
  for (const f of ['claim-engine.js', 'trips.js']) {
    vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', f), 'utf8'), sandbox);
  }
  return sandbox.window;
}

const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
const j = (x) => JSON.parse(JSON.stringify(x ?? null));

const partialBump = {
  id: 'b1', airline: 'Delta Air Lines', origin: 'HLN', dest: 'JFK',
  departDate: iso(-2), returnDate: iso(5), issue: 'bumped', issueDate: iso(-2), fare: '600',
};
const completeBump = {
  id: 'b2', airline: 'Delta Air Lines', origin: 'HLN', dest: 'JFK',
  departDate: iso(-2), issue: 'bumped', issueDate: iso(-2), fare: '300',
  region: 'us', payment: 'credit', voluntary: 'no', arrDelay: '3-4',
};

test('a bump with no stated delay invents nothing: no delay, no volunteer answer, no region or payment', () => {
  const W = load([]);
  const a = j(W.Trips.claimAnswers(partialBump));
  for (const k of ['arrDelay', 'voluntary', 'region', 'payment']) assert.equal(a[k], undefined, `${k} must not be assumed`);
  assert.equal(a.type, 'bumped');
  assert.ok(W.ClaimEngine.nextQuestion(a), 'the wizard still has questions to ask');
});

test('"what you paid" is only used as the one-way fare on a one-way booking', () => {
  const W = load([]);
  assert.equal(j(W.Trips.claimAnswers(partialBump)).fareOneWay, undefined, 'round trip: total is not the one-way base');
  assert.equal(j(W.Trips.claimAnswers(completeBump)).fareOneWay, 300, 'one-way: the fare is the base');
});

test('bag hours and whether a report was filed are never assumed', () => {
  const W = load([]);
  const a = j(W.Trips.claimAnswers({ id: 'g1', issue: 'bag_late', departDate: iso(-3), issueDate: iso(-3) }));
  assert.equal(a.bagHours, undefined);
  assert.equal(a.reportFiled, undefined, 'a filed report gates the bag-fee refund — it must come from the traveler');
});

test('a schedule change never assumes the size or that the traveler declined', () => {
  const W = load([]);
  const a = j(W.Trips.claimAnswers({ id: 's1', issue: 'schedule', departDate: iso(20), region: 'us' }));
  assert.equal(a.schedDelta, undefined);
  assert.equal(a.schedAccepted, undefined);
  assert.equal(a.flightDate, iso(20), 'the flight date is a recorded fact and is kept');
});

test('no dollar figure from a partial picture: atStake is null and the vault counts it as unfinished, never as $0', () => {
  const W = load([partialBump]);
  assert.equal(W.Trips.atStake(partialBump), null);
  const m = j(W.Trips.moneyOnTable());
  assert.equal(m.incomplete, 1);
  assert.equal(m.confirmed, 0);
  assert.equal(m.tripsWithClaims, 0);
});

test('once every money question is answered, the figure appears — and it is the exact 400% amount', () => {
  const W = load([completeBump]);
  assert.equal(W.ClaimEngine.nextQuestion(W.Trips.claimAnswers(completeBump)), null);
  assert.match(String(W.Trips.atStake(completeBump)), /\$1,200/, '4 × $300 one-way, domestic 2h+ late');
  const m = j(W.Trips.moneyOnTable());
  assert.equal(m.confirmed, 1200);
  assert.equal(m.incomplete, 0);
});

test('prefilledHistory lists answered, applicable questions in wizard order so Back can reach them', () => {
  const W = load([]);
  const answers = { type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 300, arrDelay: '3-4', incidentDate: '2026-06-01', traveled: 'no' };
  assert.deepEqual(j(W.ClaimEngine.prefilledHistory(answers)), ['type', 'region', 'voluntary', 'fareOneWay', 'arrDelay', 'incidentDate'],
    'traveled does not apply to a bump, so Back must not step through it');
  assert.deepEqual(j(W.ClaimEngine.prefilledHistory({})), []);
});
