// jsonstore.js — durable JSON files for the watchdog registry and the price history.
//
// Guards against two failures that compound: a write torn by a crash or power loss (the file ends up
// empty or zero-filled), followed by a load that silently treats the corrupt file as "no data" and a
// save that then overwrites whatever might have been recovered.
import { closeSync, existsSync, fsyncSync, mkdirSync, openSync, readFileSync, renameSync, writeSync } from 'node:fs';
import path from 'node:path';

/**
 * Read a JSON file. A missing file yields `fallback`. A corrupt file is moved aside — never overwritten
 * by the next save — and yields `fallback`.
 */
export function readJson(file, fallback) {
  if (!existsSync(file)) return fallback;
  const text = readFileSync(file, 'utf8');
  try {
    return JSON.parse(text);
  } catch (err) {
    const aside = `${file}.corrupt-${Date.now()}`;
    try { renameSync(file, aside); } catch { /* leave it in place rather than lose it */ }
    console.error(`  ${path.basename(file)} was unreadable (${String(err && err.message).slice(0, 60)}); kept as ${path.basename(aside)}`);
    return fallback;
  }
}

/** Write JSON atomically: flushed to a temp file in the same directory, then renamed over the target. */
export function writeJson(file, data) {
  mkdirSync(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}`;
  const fd = openSync(tmp, 'w');
  try {
    writeSync(fd, JSON.stringify(data));
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  renameSync(tmp, file);
}
