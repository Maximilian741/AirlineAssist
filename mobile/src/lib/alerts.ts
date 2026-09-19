/**
 * Alerts — the thing that makes the machine reach INTO the pocket.
 *
 * Two sources of money-relevant events, one notification pipe:
 *   1. The server watchdog (fare drops / schedule shifts on watched trips) — pulled from
 *      GET /api/watch when a server is configured.
 *   2. Claim deadlines computed locally from the trip vault (no server needed): a claim window
 *      closing in ≤3 days is a notification-worthy event even offline.
 *
 * Idempotent by design: every event has a stable key and we persist the set of keys already
 * notified, so re-running the check (app foreground, pull-to-refresh, background task) never
 * double-fires. Local notifications only — no push server, works in Expo Go.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { API_BASE, HAS_API } from '@/config';
import { deadlines, type Trip } from '@/lib/trips';

const NOTIFIED_KEY = 'ff-notified';
const OWNER_KEY = 'ff-owner';
const TRIPS_KEY = 'ff-trips';

export type WatchAlert = {
  kind: string; severity: string; title: string; detail: string; lever?: string | null; rule?: string | null; delta?: number | null; at?: string; seen?: boolean;
  resolved?: boolean; basis?: 'paid' | 'watch'; leg?: 'outbound' | 'inbound'; was?: string; now?: string;
};
export type WatchLeg = { from?: string; to?: string; dep?: string | null; arr?: string | null; flight?: string | null };
export type WatchSnapshot = { price?: number; outbound?: WatchLeg[]; inbound?: WatchLeg[]; stops?: number } | null;
export type Watch = {
  id: string; alerts: WatchAlert[]; checks?: number; lastCheckedAt?: string | null; lastError?: string | null; baseline?: WatchSnapshot; latest?: WatchSnapshot;
  status?: 'active' | 'unsupported'; match?: 'matched' | 'not_found' | 'unmatchable' | 'route_only' | null; booking?: unknown;
};

let handlerInstalled = false;
export function installHandler() {
  if (handlerInstalled || Platform.OS === 'web') return;
  handlerInstalled = true;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Whether we may notify. Only shows the OS prompt when `prompt` is true: the dialog should follow a
 *  user action (saving a trip), not appear at first launch before there is anything to notify about. */
export async function ensurePermission(prompt = false): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) { await ensureChannel(); return true; }
    if (!prompt || !cur.canAskAgain) return false;
    const req = await Notifications.requestPermissionsAsync({ ios: { allowAlert: true, allowBadge: true, allowSound: true } });
    if (req.granted) await ensureChannel();
    return req.granted;
  } catch { return false; }
}

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  try {
    await Notifications.setNotificationChannelAsync('money', {
      name: 'Money alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#16324a',
    });
  } catch {}
}

async function loadNotified(): Promise<Set<string>> {
  try { const v = await AsyncStorage.getItem(NOTIFIED_KEY); const arr = v ? JSON.parse(v) : []; return new Set(Array.isArray(arr) ? arr : []); } catch { return new Set(); }
}
async function saveNotified(s: Set<string>) {
  // Keep it bounded — the last 500 keys is plenty.
  const arr = Array.from(s).slice(-500);
  await AsyncStorage.setItem(NOTIFIED_KEY, JSON.stringify(arr)).catch(() => {});
}
async function loadTrips(): Promise<Trip[]> {
  try { const v = await AsyncStorage.getItem(TRIPS_KEY); const arr = v ? JSON.parse(v) : []; return Array.isArray(arr) ? arr : []; } catch { return []; }
}

/** This device's own watches, by trip id. null when the server couldn't be asked, so callers don't mistake
 *  "unreachable" for "the server has none". */
/** One random key per install, stored beside the trips it protects. Not an account: it only stops another
 *  device from reading, overwriting or deleting the watches this one registered. */
let ownerKey: string | null = null;
async function ownerHeaders(extra?: Record<string, string>): Promise<Record<string, string>> {
  if (!ownerKey) {
    try { ownerKey = await AsyncStorage.getItem(OWNER_KEY); } catch { ownerKey = null; }
    if (!ownerKey) {
      ownerKey = 'o' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) + Date.now().toString(36);
      await AsyncStorage.setItem(OWNER_KEY, ownerKey).catch(() => {});
    }
  }
  return { 'X-FF-Owner': ownerKey, ...(extra || {}) };
}

export async function fetchWatchesOrNull(ids: string[]): Promise<Record<string, Watch> | null> {
  if (!HAS_API) return null;
  if (!ids.length) return {};
  try {
    const res = await fetch(`${API_BASE}/api/watch?ids=${encodeURIComponent(ids.join(','))}`, { headers: await ownerHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    const out: Record<string, Watch> = {};
    for (const w of data.watches || []) out[w.id] = w;
    return out;
  } catch { return null; }
}
export async function fetchWatches(ids: string[]): Promise<Record<string, Watch>> {
  return (await fetchWatchesOrNull(ids)) || {};
}

/** Register a trip with the server watchdog (fire-and-forget). The flight number and what was paid are what
 *  let it follow THIS booking instead of whatever flight is cheapest on the route. */
export async function watchTrip(t: Trip): Promise<boolean> {
  if (!HAS_API || !t.origin || !t.dest || !t.departDate) return false;
  try {
    const res = await fetch(`${API_BASE}/api/watch`, {
      method: 'POST', headers: await ownerHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify({ id: t.id, origin: t.origin, destination: t.dest, departDate: t.departDate, returnDate: t.returnDate || '', tier: 'platinum', airline: t.airline || '', flightNo: t.flightNo || '', fare: t.fare || '' }),
    });
    return res.ok;
  } catch { return false; }
}

/** Stop the server re-checking a trip that was removed from this device. */
export async function unwatchTrip(id: string): Promise<void> {
  if (!HAS_API) return;
  try { await fetch(`${API_BASE}/api/watch/${encodeURIComponent(id)}`, { method: 'DELETE', headers: await ownerHeaders() }); } catch {}
}

/** Re-register upcoming trips the server lost (a free host wipes its disk when it sleeps or redeploys) or
 *  registered before it knew which flight was booked. Safe to repeat: keyed on the trip id. */
export async function resyncWatches(trips: Trip[], watches: Record<string, Watch>, today: string): Promise<number> {
  const lost = trips.filter((t) => t.origin && t.dest && t.departDate && t.departDate >= today && (!watches[t.id] || !watches[t.id].booking));
  for (const t of lost) await watchTrip(t);
  return lost.length;
}

export type PendingEvent = { key: string; title: string; body: string; data: Record<string, string> };

/** Compute every notification-worthy event right now. Pure over the inputs; no side effects. */
export const computeEvents = (trips: Trip[], watches: Record<string, Watch>) => computeEventsCore(trips, watches, deadlines);

// The core is factored so it can be tested in plain Node without loading the native modules
// above: pass in the deadlines function and get pure output.
export function computeEventsCore(trips: Trip[], watches: Record<string, Watch>, deadlinesFn: (t: Trip) => ReturnType<typeof deadlines>): PendingEvent[] {
  const events: PendingEvent[] = [];
  const route = (t: Trip) => [t.origin, t.dest].filter(Boolean).join('→') || (t.airline || 'your trip');

  // 1) watchdog money alerts
  for (const t of trips) {
    const w = watches[t.id];
    if (!w) continue;
    for (const a of w.alerts || []) {
      // Retired alerts, sub-threshold retimes and "couldn't find your flight" notes never buzz a phone.
      if (a.resolved || a.kind === 'minor_change' || a.kind === 'flight_not_found') continue;
      const key = `wd:${t.id}:${a.kind}:${a.delta ?? ''}`;
      const money = a.kind === 'price_drop' && a.delta
        ? `$${a.delta} below ${a.basis === 'watch' ? 'the price when the watch started' : 'what you paid'}`
        : a.kind === 'significant_change' ? 'Full refund if you decline it' : 'Free rebooking unlocked';
      events.push({
        key,
        title: `${route(t)}: ${a.title}`,
        body: `${money}. ${(a.lever || a.detail || '').slice(0, 140)}`,
        data: { screen: 'trips', tripId: t.id, kind: a.kind },
      });
    }
  }

  // 2) claim deadlines closing soon (computed locally — works offline)
  for (const t of trips) {
    for (const d of deadlinesFn(t)) {
      if (d.status === 'expired') continue;
      if (d.daysLeft <= 3) {
        const when = d.daysLeft <= 0 ? 'today' : d.daysLeft === 1 ? 'tomorrow' : `in ${d.daysLeft} days`;
        events.push({
          key: `dl:${t.id}:${d.key}:${d.due}`,
          title: `${route(t)}: ${d.label} closes ${when}`,
          body: d.why.slice(0, 160),
          data: { screen: 'trips', tripId: t.id, kind: 'deadline' },
        });
      }
    }
  }
  return events;
}

/**
 * Check everything and fire notifications for anything new. Returns how many fired.
 * Safe to call often: previously-notified keys are skipped.
 */
export async function checkAndNotify(): Promise<{ fired: number; pending: number }> {
  if (Platform.OS === 'web') return { fired: 0, pending: 0 };
  installHandler();
  const ok = await ensurePermission();
  const [trips, notified] = await Promise.all([loadTrips(), loadNotified()]);
  const watches = await fetchWatches(trips.map((t) => t.id));
  const events = computeEvents(trips, watches);
  let fired = 0;
  // Without permission nothing is recorded as sent, so granting it later still delivers what's pending.
  if (!ok) return { fired: 0, pending: events.length };
  for (const e of events) {
    if (notified.has(e.key)) continue;
    try {
      await Notifications.scheduleNotificationAsync({ content: { title: e.title, body: e.body, data: e.data, sound: true }, trigger: null });
      notified.add(e.key);
      fired++;
    } catch {}
  }
  await saveNotified(notified);
  return { fired, pending: events.length };
}

/**
 * Pre-schedule reminders for upcoming deadlines (7 days out and 1 day out) so the phone pings even
 * if the app hasn't been opened. Clears and re-schedules each time — idempotent.
 */
export async function scheduleDeadlineReminders(): Promise<number> {
  if (Platform.OS === 'web') return 0;
  installHandler();
  const ok = await ensurePermission();
  if (!ok) return 0;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});
  const trips = await loadTrips();
  let n = 0;
  const now = Date.now();
  for (const t of trips) {
    for (const d of deadlines(t)) {
      if (d.status === 'expired') continue;
      const due = new Date(d.due + 'T09:00:00').getTime();
      for (const daysBefore of [7, 1]) {
        const at = due - daysBefore * 86400000;
        if (at <= now + 60000) continue; // already past (or about to be) — the live check covers it
        try {
          await Notifications.scheduleNotificationAsync({
            content: {
              title: `${[t.origin, t.dest].filter(Boolean).join('→') || 'Trip'}: ${d.label} — ${daysBefore === 7 ? '1 week' : '1 day'} left`,
              body: d.why.slice(0, 160),
              data: { screen: 'trips', tripId: t.id, kind: 'deadline' },
            },
            trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(at) },
          });
          n++;
        } catch {}
      }
    }
  }
  return n;
}
