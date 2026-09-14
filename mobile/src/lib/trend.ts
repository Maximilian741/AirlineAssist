/**
 * Price trend — thin client over GET /api/trend. All the math (low seen, slope, direction,
 * buy/wait/watch verdict with its exact reason) lives on the server in src/trends.js and is
 * computed from prices the server itself recorded, so web and mobile show the identical call.
 */
import { API_BASE, HAS_API } from '@/config';

export type TrendPoint = { day: string; price: number };
export type TrendVerdict = 'buy' | 'wait' | 'watch' | 'learn' | 'past';
export type TripTrend = {
  n: number;
  verdict: TrendVerdict;
  reason: string;
  latest?: number; latestDay?: string; prev?: number | null;
  low?: number; lowDay?: string; high?: number; highDay?: string;
  aboveLow?: number; belowHigh?: number; positionPct?: number;
  changeSinceLast?: number; changePct?: number; slopePerDay?: number;
  direction?: 'rising' | 'falling' | 'flat';
  spanDays?: number; daysToDeparture?: number | null;
  points: TrendPoint[];
};
export type RouteStats = { n: number; min?: number; p25?: number; median?: number; p75?: number; max?: number };
export type Trend = {
  origin: string; destination: string; departDate: string | null; returnDate: string | null;
  trip: TripTrend; route: RouteStats; summary: string;
  spark: { path: string; points: [number, number][]; min?: number; max?: number };
};

export const VERDICT_LABEL: Record<TrendVerdict, string> = { buy: 'Buy', wait: 'Wait', watch: 'Watch', learn: 'Learning', past: 'Flown' };

/** Local calendar date (YYYY-MM-DD) — the phone's day, not UTC's. */
export function localToday(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export async function fetchTrend(q: { origin?: string; destination: string; departDate?: string; returnDate?: string }): Promise<Trend | null> {
  if (!HAS_API || !q.destination) return null;
  const qs = new URLSearchParams({ origin: q.origin || 'HLN', destination: q.destination, departDate: q.departDate || '', returnDate: q.returnDate || '', today: localToday() });
  try {
    const res = await fetch(`${API_BASE}/api/trend?${qs.toString()}`);
    if (!res.ok) return null;
    return (await res.json()) as Trend;
  } catch { return null; }
}

/** Judge a specific price (what the user paid, or the fare on screen) against the route's history. */
export function judgeAgainstRoute(price: number | null | undefined, r: RouteStats | undefined): string | null {
  if (!r || r.n < 5 || price == null || r.p25 == null || r.median == null || r.p75 == null) return null;
  if (price <= r.p25) return `cheap for this route — in the lowest quarter of the ${r.n} fares we've seen`;
  if (price <= r.median) return `below the usual $${r.median} for this route`;
  if (price >= r.p75) return `high for this route — it usually runs $${r.median}`;
  return `about normal for this route (usually $${r.median})`;
}
