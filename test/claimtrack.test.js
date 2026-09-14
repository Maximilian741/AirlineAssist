// Deterministic proof for the claim tracker — the airline's legal response clocks and the
// escalation ladder they unlock. Run:  node --test
//
// Loads the REAL shipped public/claimtrack.js in a vm sandbox with a fake localStorage.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function fresh() {
  const store = new Map();
  const sandbox = {
    window: {},
    localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) },
  };
  vm.createContext(sandbox);
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', 'claimtrack.js'), 'utf8'), sandbox);
  return sandbox.window.ClaimTrack;
}

const RESULT = { headline: 'x', entitlements: [{ strength: 'strong', amountText: '$1,200 (400% of fare)' }] };
const bumped = { type: 'bumped', region: 'us', payment: 'credit', voluntary: 'no', arrDelay: '3-4', fareOneWay: 300 };
const cancelled = { type: 'cancelled', traveled: 'no', region: 'us', payment: 'credit' };

// Backdate a filing so clocks can be observed running out.
function backdate(CT, id, stage, daysAgo) {
  const c = CT.get(id);
  const d = new Date(); d.setDate(d.getDate() - daysAgo);
  c.filings = c.filings.map((f) => (f.stage === stage ? { ...f, date: d.toISOString().slice(0, 10) } : f));
  CT.update(id, { filings: c.filings });
}

test('start() captures the headline amount and begins with no filings', () => {
  const CT = fresh();
  const c = CT.start(bumped, { airline: 'Delta Air Lines' }, RESULT);
  assert.equal(c.amount, '$1,200');
  assert.equal(c.filings.length, 0);
  assert.equal(c.status, 'open');
  assert.equal(CT.nextAction(c).kind, 'file', 'first action is to send the letter');
  assert.equal(CT.nextAction(c).channel, 'file-email');
});

test('filing with the airline starts the 30/60-day response clocks (14 CFR 259.7)', () => {
  const CT = fresh();
  const c = CT.start(cancelled, {}, RESULT);
  CT.recordFiling(c.id, 'airline');
  const tl = CT.timeline(CT.get(c.id));
  const keys = tl.map((t) => t.key);
  assert.ok(keys.includes('ack') && keys.includes('answer'), 'both response clocks present');
  const ack = tl.find((t) => t.key === 'ack'), ans = tl.find((t) => t.key === 'answer');
  assert.equal(ack.daysLeft, 30);
  assert.equal(ans.daysLeft, 60);
  assert.equal(ack.status, 'waiting');
});

test('a cancellation refund adds the 7-BUSINESS-day clock; debit adds 20 calendar days', () => {
  const CT = fresh();
  const card = CT.start(cancelled, {}, RESULT);
  CT.recordFiling(card.id, 'airline');
  const r1 = CT.timeline(CT.get(card.id)).find((t) => t.key === 'refund');
  assert.ok(r1, 'refund clock present');
  assert.ok(r1.daysLeft >= 7 && r1.daysLeft <= 11, `7 business days spans 9-11 calendar days depending on weekday, got ${r1.daysLeft}`);

  const debit = CT.start({ ...cancelled, payment: 'other' }, {}, RESULT);
  CT.recordFiling(debit.id, 'airline');
  const r2 = CT.timeline(CT.get(debit.id)).find((t) => t.key === 'refund');
  assert.equal(r2.daysLeft, 20);
  assert.match(r2.label, /20 calendar days/);
});

test('bumping filing notes the same-day/24h cash obligation (14 CFR 250.8)', () => {
  const CT = fresh();
  const c = CT.start(bumped, {}, RESULT);
  CT.recordFiling(c.id, 'airline');
  const b = CT.timeline(CT.get(c.id)).find((t) => t.key === 'bump');
  assert.ok(b);
  assert.equal(b.rule, '14 CFR 250.8');
});

test('while clocks run, the next action is WAIT — never a premature escalation', () => {
  const CT = fresh();
  const c = CT.start(cancelled, {}, RESULT);
  CT.recordFiling(c.id, 'airline');
  const na = CT.nextAction(CT.get(c.id));
  assert.equal(na.kind, 'wait');
  assert.match(na.text, /Waiting on the airline/);
});

test('when the airline blows its 60-day answer clock, the DOT complaint unlocks', () => {
  const CT = fresh();
  const c = CT.start(cancelled, {}, RESULT);
  CT.recordFiling(c.id, 'airline');
  backdate(CT, c.id, 'airline', 61);
  const na = CT.nextAction(CT.get(c.id));
  assert.equal(na.kind, 'escalate');
  assert.equal(na.channel, 'file-dot');
  assert.match(na.text, /blew its deadline/);
});

test('an overdue REFUND (past 7 business days) unlocks escalation before the 60-day mark', () => {
  const CT = fresh();
  const c = CT.start(cancelled, {}, RESULT);
  CT.recordFiling(c.id, 'airline');
  backdate(CT, c.id, 'airline', 15); // refund clock (≤11 cal days) blown; 60-day answer clock not
  const na = CT.nextAction(CT.get(c.id));
  assert.equal(na.kind, 'escalate', 'refund overdue is itself grounds to escalate');
  assert.equal(na.channel, 'file-dot');
});

test('after DOT is filed and ignored, the small-claims final notice unlocks', () => {
  const CT = fresh();
  const c = CT.start(cancelled, {}, RESULT);
  CT.recordFiling(c.id, 'airline');
  backdate(CT, c.id, 'airline', 70);
  CT.recordFiling(c.id, 'dot');
  backdate(CT, c.id, 'dot', 61);
  const na = CT.nextAction(CT.get(c.id));
  assert.equal(na.kind, 'escalate');
  assert.equal(na.channel, 'esc-notice');
  assert.match(na.text, /final notice/i);
});

test('the ladder does not skip: DOT is offered before small claims', () => {
  const CT = fresh();
  const c = CT.start(cancelled, {}, RESULT);
  CT.recordFiling(c.id, 'airline');
  backdate(CT, c.id, 'airline', 200); // everything blown, but DOT never filed
  const na = CT.nextAction(CT.get(c.id));
  assert.equal(na.channel, 'file-dot', 'must route through DOT first');
});

test('recording the same stage twice on one day is idempotent', () => {
  const CT = fresh();
  const c = CT.start(cancelled, {}, RESULT);
  CT.recordFiling(c.id, 'airline');
  CT.recordFiling(c.id, 'airline');
  assert.equal(CT.get(c.id).filings.length, 1);
});

test('marking paid closes the claim; summary counts reflect it', () => {
  const CT = fresh();
  const a = CT.start(cancelled, {}, RESULT); CT.recordFiling(a.id, 'airline');
  const b = CT.start(bumped, {}, RESULT); CT.recordFiling(b.id, 'airline'); backdate(CT, b.id, 'airline', 61);
  CT.markOutcome(a.id, 'paid');
  const s = CT.summary();
  assert.equal(s.total, 2);
  assert.equal(s.paid, 1);
  assert.equal(s.open, 1);
  assert.equal(s.overdue, 1);
  assert.equal(s.actionable, 1);
  assert.equal(CT.nextAction(CT.get(a.id)).kind, 'closed');
});

test('international regimes add their own escalation windows', () => {
  const CT = fresh();
  const ca = CT.start({ type: 'delayed', region: 'canada', arrDelay: '6-9', payment: 'credit' }, {}, RESULT);
  CT.recordFiling(ca.id, 'airline');
  assert.ok(CT.timeline(CT.get(ca.id)).some((t) => t.key === 'appr' && t.daysLeft === 30), 'APPR 30-day pay-or-explain');
  const uk = CT.start({ type: 'delayed', region: 'from_uk', arrDelay: '6-9', payment: 'credit' }, {}, RESULT);
  CT.recordFiling(uk.id, 'airline');
  assert.ok(CT.timeline(CT.get(uk.id)).some((t) => t.key === 'uk8w' && t.daysLeft === 56), 'UK 8-week ADR window');
});
