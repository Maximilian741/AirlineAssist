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
const TRIPS_KEY = 'ff-trips';

export type WatchAlert = {
  kind: string; severity: string; title: string; detail: string; lever?: string | null; rule?: string | null; delta?: number; at?: string; seen?: boolean;
};
export type WatchLeg = { from?: string; to?: string; dep?: string | null; arr?: string | null; flight?: string | null };
export type WatchSnapshot = { price?: number; outbound?: WatchLeg[]; inbound?: WatchLeg[]; stops?: number } | null;
export type Watch = { id: string; alerts: WatchAlert[]; checks?: number; lastCheckedAt?: string | null; lastError?: string | null; baseline?: WatchSnapshot; latest?: WatchSnapshot };

let handlerInstalled = false;
export function installHandler() {
  if (handlerInstalled) return;
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

export async function ensurePermission(): Promise<boolean> {
  try {
    const cur = await Notifications.getPermissionsAsync();
    if (cur.granted) { await ensureChannel(); return true; }
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

export async function fetchWatches(): Promise<Record<string, Watch>> {
  if (!HAS_API) return {};
  try {
    const res = await fetch(`${API_BASE}/api/watch`);
    if (!res.ok) return {};
    const data = await res.json();
    const out: Record<string, Watch> = {};
    for (const w of data.watches || []) out[w.id] = w;
    return out;
  } catch { return {}; }
}

/** Register a trip with the server watchdog (fire-and-forget). */
export async function watchTrip(t: Trip): Promise<boolean> {
  if (!HAS_API || !t.origin || !t.dest || !t.departDate) return false;
  try {
    const res = await fetch(`${API_BASE}/api/watch`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: t.id, origin: t.origin, destination: t.dest, departDate: t.departDate, returnDate: t.returnDate || '', tier: 'platinum' }),
    });
    return res.ok;
  } catch { return false; }
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
      if (a.kind === 'minor_change') continue;
      const key = `wd:${t.id}:${a.kind}:${a.delta ?? ''}`;
      const money = a.kind === 'price_drop' && a.delta ? `$${a.delta} back` : a.kind === 'significant_change' ? 'cash refund unlocked' : 'free rebooking unlocked';
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
  installHandler();
  const ok = await ensurePermission();
  const [trips, watches, notified] = await Promise.all([loadTrips(), fetchWatches(), loadNotified()]);
  const events = computeEvents(trips, watches);
  let fired = 0;
  for (const e of events) {
    if (notified.has(e.key)) continue;
    notified.add(e.key);
    if (!ok) continue; // record as seen so we don't pile up, but can't show without permission
    try {
      await Notifications.scheduleNotificationAsync({ content: { title: e.title, body: e.body, data: e.data, sound: true }, trigger: null });
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
