// Deterministic proof for the mobile alerts engine's pure core: computeEventsCore().
// Run:  node --test   (Node 22.18+ strips TS types, so this imports the ACTUAL mobile module.)
//
// alerts.ts imports Expo/RN modules for its side-effecting half. Rather than stub those with a
// loader hook, the pure part is exported as computeEventsCore(trips, watches, deadlinesFn) and
// exercised here through the SAME source text (loaded via a small in-process transform that strips
// only the native import lines). Everything asserted below is real shipped mobile logic.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const src = readFileSync(path.join(root, 'mobile/src/lib/alerts.ts'), 'utf8');
// Strip the four native/aliased imports; the pure core needs none of them (deadlines is injected).
const stripped = src
  .split(/\r?\n/)
  .filter((l) => !/^import .* from '(@react-native-async-storage\/async-storage|expo-notifications|react-native|@\/config|@\/lib\/trips)';\s*$/.test(l))
  .join('\n')
  // The type-only reference to `deadlines` in the core signature must resolve; alias it to `any`.
  .replace('deadlinesFn: (t: Trip) => ReturnType<typeof deadlines>', 'deadlinesFn: (t: Trip) => any[]');
// Node's TS strip only handles erasable syntax; the module still references Notifications/AsyncStorage/Platform
// at runtime inside functions we never call. Declare them so the module evaluates.
const shim = 'const Notifications = {}; const AsyncStorage = {}; const Platform = { OS: "test" }; const API_BASE = ""; const HAS_API = false; type Trip = any; const deadlines = () => [];\n';
const tmpDir = path.join(root, 'test', '.tmp');
mkdirSync(tmpDir, { recursive: true });
const tmp = path.join(tmpDir, 'alerts.core.ts');
writeFileSync(tmp, shim + stripped);
const { computeEventsCore } = await import(pathToFileURL(tmp).href);
const { deadlines } = await import('../mobile/src/lib/trips.ts');

const computeEvents = (trips, watches) => computeEventsCore(trips, watches, deadlines);

// Local calendar dates, matching the engine: toISOString() is UTC, which is already tomorrow in U.S. evenings.
const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const trip = (over = {}) => ({ id: 't1', airline: 'Delta Air Lines', origin: 'HLN', dest: 'JFK', departDate: iso(20), region: 'us', payment: 'credit', issue: 'none', ...over });

test('no watches, no issues, no near deadlines -> no events', () => {
  assert.deepEqual(computeEvents([trip()], {}), []);
});

test('a watchdog price drop becomes a "$N back" notification with a stable key', () => {
  const w = { t1: { id: 't1', alerts: [{ kind: 'price_drop', severity: 'high', title: 'Fare dropped $80', detail: 'x', lever: 'Rebook', delta: 80 }] } };
  const ev = computeEvents([trip()], w);
  assert.equal(ev.length, 1);
  assert.equal(ev[0].key, 'wd:t1:price_drop:80');
  assert.match(ev[0].title, /HLN→JFK: Fare dropped \$80/);
  assert.match(ev[0].body, /\$80 back/);
  assert.equal(ev[0].data.tripId, 't1');
});

test('a significant schedule change says "cash refund unlocked"', () => {
  const w = { t1: { id: 't1', alerts: [{ kind: 'significant_change', severity: 'high', title: 'Outbound changed', detail: 'x', lever: 'Decline and refund', delta: 210 }] } };
  const ev = computeEvents([trip()], w);
  assert.match(ev[0].body, /cash refund unlocked/);
});

test('minor changes never notify (no alert fatigue)', () => {
  const w = { t1: { id: 't1', alerts: [{ kind: 'minor_change', severity: 'low', title: 'retimed 5 min', detail: 'x', delta: 5 }] } };
  assert.equal(computeEvents([trip()], w).length, 0);
});

test('a claim deadline within 3 days becomes an event; 4+ days out does not', () => {
  const soon = trip({ issue: 'bumped', issueDate: iso(-58), fare: '300', arrDelay: '3-4' });
  const ev = computeEvents([soon], {});
  assert.ok(ev.some((e) => /closes in 2 days/.test(e.title)), JSON.stringify(ev.map((e) => e.title)));
  // 30 days after bumping the denied-boarding window closes TODAY -> exactly one event, and it says so
  const edge = trip({ issue: 'bumped', issueDate: iso(-30), fare: '300', arrDelay: '3-4' });
  const edgeEv = computeEvents([edge], {});
  assert.equal(edgeEv.length, 1);
  assert.match(edgeEv[0].title, /Denied-boarding cash claim closes today/);
  // 10 days after: nothing is within 3 days (db 20d, chargeback 50d, dot 170d)
  const far = trip({ issue: 'bumped', issueDate: iso(-10), fare: '300', arrDelay: '3-4' });
  assert.equal(computeEvents([far], {}).length, 0);
});

test('keys are stable across runs (idempotency contract)', () => {
  const w = { t1: { id: 't1', alerts: [{ kind: 'price_drop', delta: 80, title: 'x', detail: 'x' }] } };
  const a = computeEvents([trip()], w).map((e) => e.key);
  const b = computeEvents([trip()], w).map((e) => e.key);
  assert.deepEqual(a, b);
});

test('watches for trips not in the vault are ignored', () => {
  const w = { ghost: { id: 'ghost', alerts: [{ kind: 'price_drop', delta: 99, title: 'x', detail: 'x' }] } };
  assert.equal(computeEvents([trip()], w).length, 0);
});

test('every event carries deep-link data pointing at the trips screen', () => {
  const w = { t1: { id: 't1', alerts: [{ kind: 'price_drop', delta: 12, title: 'x', detail: 'x' }, { kind: 'schedule_change', delta: 40, title: 'y', detail: 'y' }] } };
  for (const e of computeEvents([trip()], w)) {
    assert.equal(e.data.screen, 'trips');
    assert.equal(e.data.tripId, 't1');
  }
});
