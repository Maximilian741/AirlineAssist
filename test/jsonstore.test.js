// Deterministic proof for src/jsonstore.js — the torn-write guard for the watchdog and price history.
// The corrupt-file case reproduces what a real power loss left behind: a file of nothing but spaces.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { readJson, writeJson } from '../src/jsonstore.js';

const fresh = () => mkdtempSync(path.join(tmpdir(), 'ff-jsonstore-'));

test('write then read round-trips, and no temp file is left behind', () => {
  const dir = fresh();
  const file = path.join(dir, 'watch.json');
  writeJson(file, { a: { id: 'a', alerts: [1, 2] } });
  assert.deepEqual(readJson(file, {}), { a: { id: 'a', alerts: [1, 2] } });
  assert.deepEqual(readdirSync(dir), ['watch.json']);
});

test('a missing file yields the fallback and creates nothing', () => {
  const dir = fresh();
  const file = path.join(dir, 'nope.json');
  assert.deepEqual(readJson(file, []), []);
  assert.equal(existsSync(file), false);
});

test('a torn write (all spaces) yields the fallback AND is kept aside, so the next save cannot destroy it', () => {
  const dir = fresh();
  const file = path.join(dir, 'watch.json');
  const torn = ' '.repeat(1001);
  writeFileSync(file, torn);
  assert.deepEqual(readJson(file, {}), {});
  assert.equal(existsSync(file), false, 'corrupt file moved out of the way');
  const aside = readdirSync(dir).find((f) => f.startsWith('watch.json.corrupt-'));
  assert.ok(aside, 'kept under a .corrupt- name');
  assert.equal(readFileSync(path.join(dir, aside), 'utf8'), torn, 'original bytes preserved');
  writeJson(file, { ok: true });
  assert.equal(readFileSync(path.join(dir, aside), 'utf8'), torn, 'a later save does not touch the kept copy');
});

test('writing creates the directory if it does not exist yet', () => {
  const dir = fresh();
  const file = path.join(dir, 'nested', 'data', 'history.json');
  writeJson(file, [1]);
  assert.deepEqual(readJson(file, null), [1]);
});
