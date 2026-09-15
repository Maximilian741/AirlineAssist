// history.js
// Tiny local price-history store for the "trend over time" feature. Plain JSON file, no DB.
// Every search/scan appends the best price we saw for a route+date, so the longer you use the
// app, the more of a longitudinal trend it accumulates.

import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readJson, writeJson } from './jsonstore.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE = path.join(DATA_DIR, 'history.json');
const MAX_RECORDS = 8000;

function load() {
  const records = readJson(FILE, []);
  return Array.isArray(records) ? records : [];
}

function save(records) {
  writeJson(FILE, records.slice(-MAX_RECORDS));
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
  // Never let sample/fallback prices into the series: a fake low would drive a real "buy" verdict.
  if (obs.source && /sample|mock|fallback/i.test(String(obs.source))) return;
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
  // Replace a same-day point for the same route+date if present, but never lose the day's low —
  // the "lowest we've seen" claim depends on it.
  const k = key(rec);
  const idx = records.findIndex((r) => key(r) === k && r.day === day);
  if (idx >= 0) {
    const prevLow = records[idx].low != null ? records[idx].low : records[idx].price;
    records[idx] = { ...rec, low: Math.min(prevLow, rec.price) };
  } else records.push({ ...rec, low: rec.price });
  save(records);
}

/** Time series for a given route+date, oldest first. */
export function series({ origin, destination, departDate, returnDate }) {
  const k = key({ origin, destination, departDate, returnDate });
  return load()
    .filter((r) => key(r) === k)
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .map((r) => ({ ts: r.ts, day: r.day, price: r.price, low: r.low != null ? r.low : r.price, status: r.status, source: r.source }));
}

/** Every observation for a route regardless of travel date — for "what does this route usually cost". */
export function routeSeries({ origin, destination }) {
  return load()
    .filter((r) => r.origin === origin && r.destination === destination)
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .map((r) => ({ ts: r.ts, day: r.day, departDate: r.departDate, returnDate: r.returnDate, price: r.price }));
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
