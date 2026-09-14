// trends.js — turn a recorded price series into a decision.
//
// Pure functions over the observations this app itself has stored (data/history.json). Nothing
// here is a forecast model dressed up as certainty: every number is computed from points we
// actually saw, and the verdict states the exact observation it rests on. Below MIN_POINTS we say
// "still learning" instead of inventing a call.
//
// series: [{ day: 'YYYY-MM-DD', price: number, ts?: string }] (oldest first)

export const MIN_POINTS = 3;
export const RECENT_WINDOW = 3;     // points used for direction / slope — short on purpose: the last few checks are what matter
export const FLAT_BAND_PCT = 2;     // |change| under this % counts as flat
export const CLOSE_IN_DAYS = 21;    // inside this many days to departure fares are treated as closing in

const round = (n) => Math.round(n);

export function daysBetween(a, b) {
  if (!a || !b) return null;
  const da = new Date(a + 'T00:00:00Z'), db = new Date(b + 'T00:00:00Z');
  if (isNaN(da) || isNaN(db)) return null;
  return Math.round((db - da) / 86400000);
}

/** Least-squares slope in $/day over the given points (uses day index, not wall-clock). */
export function slopePerDay(points) {
  if (!points || points.length < 2) return 0;
  const first = points[0].day;
  const xs = points.map((p) => daysBetween(first, p.day) ?? 0);
  const ys = points.map((p) => p.price);
  const n = xs.length;
  const mx = xs.reduce((s, x) => s + x, 0) / n, my = ys.reduce((s, y) => s + y, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  return den === 0 ? 0 : num / den;
}

/**
 * Analyze a series. Returns null-safe stats and, when there is enough data, a verdict:
 *   buy   — the fare is at/near the low we've seen, or it's climbing with departure close
 *   wait  — it's above the low AND trending down with time to spare
 *   watch — mixed signals; keep the watchdog on it
 *   learn — fewer than MIN_POINTS observations
 */
/** Local calendar date (YYYY-MM-DD) — NOT toISOString(), which is UTC and rolls a day early in the U.S. evening. */
export function localToday(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function analyze(series, { departDate = null, today = null } = {}) {
  // Each day keeps its last price AND its low (history.js records both); "lowest we've seen" uses the lows.
  const pts = (series || []).filter((p) => p && p.price != null && !isNaN(Number(p.price)))
    .map((p) => ({ day: p.day || (p.ts || '').slice(0, 10), price: Number(p.price), low: p.low != null && !isNaN(Number(p.low)) ? Math.min(Number(p.low), Number(p.price)) : Number(p.price) }))
    .filter((p) => p.day)
    .sort((a, b) => a.day.localeCompare(b.day));
  const n = pts.length;
  const todayStr = today || localToday();
  const daysToDeparture = departDate ? daysBetween(todayStr, departDate) : null;

  if (!n) return { n: 0, verdict: 'learn', reason: 'No prices recorded for this trip yet.', daysToDeparture, points: [] };

  const prices = pts.map((p) => p.price);
  const latest = pts[n - 1];
  const prev = n > 1 ? pts[n - 2] : null;
  const lows = pts.map((p) => p.low);
  const lowIdx = lows.indexOf(Math.min(...lows));
  const highIdx = prices.indexOf(Math.max(...prices));
  const low = { day: pts[lowIdx].day, price: pts[lowIdx].low }, high = pts[highIdx];
  const recent = pts.slice(-RECENT_WINDOW);
  const slope = slopePerDay(recent);
  const changeSinceLast = prev ? latest.price - prev.price : 0;
  const changePct = prev && prev.price ? (changeSinceLast / prev.price) * 100 : 0;
  const spanDays = daysBetween(pts[0].day, latest.day) ?? 0;
  const recentChangePct = recent.length > 1 && recent[0].price ? ((latest.price - recent[0].price) / recent[0].price) * 100 : 0;
  const direction = Math.abs(recentChangePct) < FLAT_BAND_PCT ? 'flat' : recentChangePct > 0 ? 'rising' : 'falling';
  const aboveLow = latest.price - low.price;
  const belowHigh = high.price - latest.price;
  const range = high.price - low.price;
  const positionPct = range > 0 ? round(((latest.price - low.price) / range) * 100) : 0; // 0 = at the low, 100 = at the high

  const base = {
    n, latest: latest.price, latestDay: latest.day, prev: prev ? prev.price : null,
    low: low.price, lowDay: low.day, high: high.price, highDay: high.day,
    aboveLow: round(aboveLow), belowHigh: round(belowHigh), positionPct,
    changeSinceLast: round(changeSinceLast), changePct: Math.round(changePct * 10) / 10,
    slopePerDay: Math.round(slope * 100) / 100, direction, spanDays, daysToDeparture,
    points: pts.map((p) => ({ day: p.day, price: p.price })),
  };

  if (n < MIN_POINTS) {
    return { ...base, verdict: 'learn', reason: `Only ${n} price${n === 1 ? '' : 's'} recorded so far — verdicts start at ${MIN_POINTS}. Keep it watched and this fills in on its own.` };
  }

  // ---- verdict rules (each names its evidence; no forecasts) ----
  if (daysToDeparture != null && daysToDeparture < 0) {
    return { ...base, verdict: 'past', reason: `This trip departed ${-daysToDeparture} day${daysToDeparture === -1 ? '' : 's'} ago — the price history is kept for the record.` };
  }
  const closeIn = daysToDeparture != null && daysToDeparture <= CLOSE_IN_DAYS;
  const moveOverWindow = recent.length > 1 ? round(latest.price - recent[0].price) : 0;
  const windowText = `${moveOverWindow < 0 ? 'down' : 'up'} $${Math.abs(moveOverWindow)} over the last ${recent.length} checks`;
  const lowText = aboveLow === 0
    ? `$${round(latest.price)} is the lowest we've seen across ${n} check${n === 1 ? '' : 's'} over ${spanDays} day${spanDays === 1 ? '' : 's'}`
    : `$${round(latest.price)} is within $${round(aboveLow)} of the $${round(low.price)} low we saw on ${low.day} (${n} checks over ${spanDays} day${spanDays === 1 ? '' : 's'})`;
  if (aboveLow <= Math.max(5, low.price * 0.02)) {
    return { ...base, verdict: 'buy', reason: `${lowText}.` };
  }
  if (closeIn && direction !== 'falling') {
    return { ...base, verdict: 'buy', reason: `${daysToDeparture} day${daysToDeparture === 1 ? '' : 's'} to departure and the price is ${direction === 'rising' ? windowText : 'flat over the last ' + recent.length + ' checks'}. It's $${round(aboveLow)} over the $${round(low.price)} low we saw on ${low.day}.` };
  }
  if (direction === 'falling' && !closeIn) {
    return { ...base, verdict: 'wait', reason: `Price is ${windowText}, with ${daysToDeparture == null ? 'no departure date set' : `${daysToDeparture} days to go`}. Still $${round(aboveLow)} above the $${round(low.price)} we saw on ${low.day}.` };
  }
  if (direction === 'rising' && !closeIn) {
    return { ...base, verdict: 'buy', reason: `Price is ${windowText}. Book now inside the free 24-hour cancel window, keep watching, and cancel/rebook if it dips.` };
  }
  return { ...base, verdict: 'watch', reason: `Sitting $${round(aboveLow)} above the $${round(low.price)} low (${positionPct}% of the way to the $${round(high.price)} high). No clear direction over the last ${recent.length} checks — keep it watched.` };
}

/** Human summary line, e.g. "↓ $12 since last check · low $214 (Aug 3)". */
export function summaryLine(a) {
  if (!a || !a.n) return 'No price history yet.';
  const parts = [];
  if (a.prev != null && a.changeSinceLast !== 0) parts.push(`${a.changeSinceLast < 0 ? '↓' : '↑'} $${Math.abs(a.changeSinceLast)} since last check`);
  else if (a.prev != null) parts.push('unchanged since last check');
  parts.push(`low $${a.low} (${a.lowDay.slice(5)})`);
  if (a.n >= 2) parts.push(`high $${a.high}`);
  return parts.join(' · ');
}

/**
 * Sparkline path for an SVG of the given width/height. Returns { path, minY, maxY } with the
 * path in a viewBox coordinate system (0..w, 0..h, y down). Pure so it can be tested.
 */
export function sparkline(points, w = 120, h = 28, pad = 2) {
  const pts = (points || []).filter((p) => p && p.price != null);
  if (pts.length < 2) return { path: '', points: [] };
  const ys = pts.map((p) => Number(p.price));
  const min = Math.min(...ys), max = Math.max(...ys);
  const span = max - min || 1;
  const stepX = (w - pad * 2) / (pts.length - 1);
  const coords = pts.map((p, i) => {
    const x = pad + i * stepX;
    const y = pad + (h - pad * 2) * (1 - (Number(p.price) - min) / span);
    return [Math.round(x * 10) / 10, Math.round(y * 10) / 10];
  });
  const path = coords.map(([x, y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  return { path, points: coords, min, max };
}
