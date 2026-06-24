// history.js
// Tiny local price-history store for the "trend over time" feature. Plain JSON file, no DB.
// Every search/scan appends the best price we saw for a route+date, so the longer you use the
// app, the more of a longitudinal trend it accumulates.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'history.json');
const MAX_RECORDS = 8000;

function load() {
  try {
    if (!existsSync(FILE)) return [];
    return JSON.parse(readFileSync(FILE, 'utf8'));
  } catch {
    return [];
  }
}

function save(records) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  const trimmed = records.slice(-MAX_RECORDS);
  writeFileSync(FILE, JSON.stringify(trimmed));
}

function key(r) {
  return `${r.origin}|${r.destination}|${r.departDate}|${r.returnDate || ''}`;
}

/**
 * Record a price observation. Deduplicates to one point per route+date per calendar day
 * (so repeated refreshes in a day update rather than spam the series).
 */
export function record(obs) {
  if (obs == null || obs.price == null) return;
  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const rec = {
    ts: now.toISOString(),
    day,
    origin: obs.origin,
    destination: obs.destination,
    departDate: obs.departDate,
    returnDate: obs.returnDate || null,
    price: Math.round(obs.price),
    status: obs.status || null,
    source: obs.source || null,
  };
  const records = load();
  // Replace a same-day point for the same route+date if present.
  const k = key(rec);
  const idx = records.findIndex((r) => key(r) === k && r.day === day);
  if (idx >= 0) records[idx] = rec;
  else records.push(rec);
  save(records);
}

/** Time series for a given route+date, oldest first. */
export function series({ origin, destination, departDate, returnDate }) {
  const k = key({ origin, destination, departDate, returnDate });
  return load()
    .filter((r) => key(r) === k)
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .map((r) => ({ ts: r.ts, day: r.day, price: r.price, status: r.status, source: r.source }));
}

/** Everything we've ever tracked, grouped by route+date, for a dashboard overview. */
export function summary() {
  const byKey = {};
  for (const r of load()) {
    const k = key(r);
    (byKey[k] ||= { origin: r.origin, destination: r.destination, departDate: r.departDate, returnDate: r.returnDate, points: [] });
    byKey[k].points.push({ ts: r.ts, price: r.price });
  }
  return Object.values(byKey).map((g) => {
    const prices = g.points.map((p) => p.price);
    return {
      ...g,
      count: g.points.length,
      min: Math.min(...prices),
      max: Math.max(...prices),
      latest: g.points[g.points.length - 1]?.price,
    };
  });
}
