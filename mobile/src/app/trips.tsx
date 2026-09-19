import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrendBlock } from '@/components/trend-block';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { API_BASE, HAS_API } from '@/config';
import { AIRLINES } from '@/data/airlines';
import { FAREDROP, FAREDROP_VERIFIED } from '@/data/faredrop';
import { useTheme } from '@/hooks/use-theme';
import { loadClaims } from '@/components/claim-tracker';
import { checkAndNotify, ensurePermission, fetchWatches, fetchWatchesOrNull, resyncWatches, scheduleDeadlineReminders, unwatchTrip, watchTrip, type Watch } from '@/lib/alerts';
import { fmt as fmtDay, nextAction, timeline, type TrackedClaim } from '@/lib/claimtrack';
import { assess, nextQuestion } from '@/lib/claim-engine';
import { airlineFromFlightNo, claimAnswers, deadlines, fmt, ISSUE_LABELS, newId, today, type Deadline, type Trip, type TripIssue } from '@/lib/trips';

const KEY = 'ff-trips';
const shortName = (n: string) => n.replace(/\s*\(.*\)\s*$/, '');
type Theme = ReturnType<typeof useTheme>;

const ISSUE_KEYS: TripIssue[] = ['none', 'cancelled', 'delayed', 'bumped', 'bag_late', 'bag_lost', 'downgrade', 'extra'];
const REGIONS: { v: NonNullable<Trip['region']>; l: string }[] = [
  { v: 'us', l: 'Within the U.S.' },
  { v: 'intl_from_us', l: 'International from U.S.' },
  { v: 'from_eu', l: 'Leaving the EU' },
  { v: 'from_uk', l: 'Leaving the UK' },
  { v: 'canada', l: 'To/from Canada' },
];

export default function TripsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [editing, setEditing] = useState<Trip | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [watches, setWatches] = useState<Record<string, Watch>>({});
  const [claims, setClaims] = useState<TrackedClaim[]>([]);
  useEffect(() => { loadClaims().then((l) => setClaims(l.filter((c) => c.status === 'open' && c.filings.length))); }, []);

  const refreshWatches = useCallback((list: Trip[]) => {
    fetchWatches(list.map((t) => t.id)).then(setWatches).catch(() => {});
  }, []);

  // Once per visit: put back any watch the server lost (a free host wipes its disk) or registered before it
  // knew which flight was booked. Skipped when the server can't be reached — unreachable isn't "none".
  const resynced = useRef(false);
  const resync = useCallback((list: Trip[]) => {
    if (resynced.current || !list.length) return;
    resynced.current = true;
    fetchWatchesOrNull(list.map((t) => t.id))
      .then(async (ws) => { if (ws && (await resyncWatches(list, ws, today()))) refreshWatches(list); })
      .catch(() => {});
  }, [refreshWatches]);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => {
        let list: Trip[] = [];
        if (v) { try { const p = JSON.parse(v); if (Array.isArray(p)) list = p; } catch {} }
        setTrips(list);
        refreshWatches(list);
        resync(list);
      })
      .finally(() => setLoaded(true));
    // Opening the vault is a natural moment to fire anything new.
    checkAndNotify().catch(() => {});
  }, [refreshWatches, resync]);

  const persist = useCallback((list: Trip[]) => {
    setTrips(list);
    AsyncStorage.setItem(KEY, JSON.stringify(list)).catch(() => {});
  }, []);

  const save = (t: Trip) => {
    const withId = { ...t, id: t.id || newId() };
    const list = t.id && trips.some((x) => x.id === t.id)
      ? trips.map((x) => (x.id === t.id ? withId : x))
      : [...trips, withId];
    persist(list);
    setEditing(null);
    // Put the machine on it: the server re-checks this trip for fare drops + schedule shifts.
    watchTrip(withId).then((ok) => { if (ok) refreshWatches(list); });
    // Saving a trip is when reminders become useful, so this is where the OS permission prompt belongs.
    ensurePermission(true).then((ok) => {
      if (!ok) return;
      scheduleDeadlineReminders().catch(() => {});
      checkAndNotify().catch(() => {});
    });
  };
  const del = (id: string) => {
    Alert.alert('Remove trip?', 'This deletes it from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => { unwatchTrip(id); persist(trips.filter((t) => t.id !== id)); } },
    ]);
  };

  const pad = { paddingTop: insets.top + TopTabInset + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.four };

  if (editing) {
    return (
      <ScrollView style={{ flex: 1, backgroundColor: theme.background }} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, pad]}>
        <View style={styles.inner}>
          <TripForm trip={editing} theme={theme} onSave={save} onCancel={() => setEditing(null)} />
        </View>
      </ScrollView>
    );
  }

  const soon = trips.flatMap((t) => deadlines(t).filter((d) => d.status !== 'expired' && d.daysLeft <= 14).map((d) => ({ t, d })))
    .sort((a, b) => a.d.daysLeft - b.d.daysLeft);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={[styles.content, pad]}>
      <View style={styles.inner}>
        {!trips.length && !claims.length ? (
          <View style={styles.hero}>
            <ThemedText type="display">Never miss a deadline again</ThemedText>
            <View style={[styles.rule, { backgroundColor: theme.line }]} />
            <ThemedText type="lede" themeColor="textSecondary" style={styles.heroText}>
              Every way to get money back from an airline has a clock on it — some as short as 7 days. Save a trip and this counts every one down, then files the claim with your details already filled in.
            </ThemedText>
            <Pressable
              onPress={() => setEditing({ id: '', region: 'us', payment: 'credit', issue: 'none' })}
              accessibilityRole="button"
              style={({ pressed }) => [styles.btnPrimary, styles.heroBtn, { backgroundColor: theme.brandDeep }, pressed && styles.pressed]}>
              <ThemedText style={styles.btnPrimaryText}>＋ Add your first trip</ThemedText>
            </Pressable>
            <ThemedView type="backgroundElement" style={[styles.note, { borderColor: theme.line }]}>
              <ThemedText type="small" themeColor="textSecondary">
                Trips are stored on this device, with no account. To watch fares, only the route and dates are checked on our server — never your name or confirmation number.
              </ThemedText>
            </ThemedView>
          </View>
        ) : (
          <>
            {soon.length ? (
              <ThemedView type="card" style={[styles.banner, { borderColor: theme.line, borderLeftColor: theme.bad }]}>
                <ThemedText type="eyebrow" style={{ color: theme.bad }}>
                  {soon.length} deadline{soon.length === 1 ? '' : 's'} in the next 2 weeks
                </ThemedText>
                <ThemedText type="small" style={styles.bannerLine}>
                  {soon[0].d.label} — {soon[0].d.daysLeft <= 0 ? 'due today' : soon[0].d.daysLeft + ' day' + (soon[0].d.daysLeft === 1 ? '' : 's') + ' left'}
                </ThemedText>
              </ThemedView>
            ) : null}
            <View style={styles.listHead}>
              <ThemedText type="section">{trips.length} trip{trips.length === 1 ? '' : 's'} tracked</ThemedText>
              <Pressable
                onPress={() => setEditing({ id: '', region: 'us', payment: 'credit', issue: 'none' })}
                hitSlop={8}
                accessibilityRole="button"
                style={({ pressed }) => [styles.btnGhost, { borderColor: theme.line }, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={{ color: theme.brand }}>＋ Add trip</ThemedText>
              </Pressable>
            </View>
            <View style={[styles.rule, styles.headRule, { backgroundColor: theme.line }]} />
            {claims.length ? (
              <View style={styles.claimsBlock}>
                <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.claimsHead}>CLAIMS IN PROGRESS</ThemedText>
                <ThemedView type="card" style={[styles.sheet, { borderColor: theme.line }]}>
                  {claims.map((c, i) => {
                    const na = nextAction(c);
                    const blown = timeline(c).filter((t) => t.status === 'overdue').length;
                    const route = [c.details?.origin, c.details?.dest].filter(Boolean).join(' → ') || c.details?.airline || 'Claim';
                    return (
                      <Pressable key={c.id} onPress={() => router.push({ pathname: '/owed', params: { claimId: c.id } })} accessibilityRole="button" style={({ pressed }) => (pressed ? styles.pressed : null)}>
                        <View style={[
                          styles.claimRow,
                          { borderLeftColor: blown ? theme.bad : 'transparent' },
                          i ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line } : null,
                        ]}>
                          <ThemedText style={styles.claimRoute}>{route}{c.amount ? `  ·  ${c.amount}` : ''}</ThemedText>
                          <ThemedText type="small" themeColor="textSecondary" style={styles.claimMeta}>{c.details?.airline || ''}{c.filings.length ? ` · filed ${fmtDay(c.filings[0].date)}` : ''}{blown ? ` · ${blown} clock${blown === 1 ? '' : 's'} blown` : ''}</ThemedText>
                          <ThemedText type="small" style={{ marginTop: Spacing.two, lineHeight: 19, color: na.kind === 'escalate' ? theme.bad : theme.text, fontWeight: na.kind === 'escalate' ? '700' : '400' }}>{na.text}</ThemedText>
                          <ThemedText type="smallBold" style={{ color: theme.brand, marginTop: Spacing.two }}>Open →</ThemedText>
                        </View>
                      </Pressable>
                    );
                  })}
                </ThemedView>
              </View>
            ) : null}
            {trips.map((t) => (
              <TripCard key={t.id} t={t} watch={watches[t.id]} theme={theme} onEdit={() => setEditing(t)} onDelete={() => del(t.id)} onClaim={() => router.push({ pathname: '/owed', params: { tripId: t.id } })} />
            ))}
          </>
        )}
        {!loaded ? <ThemedText type="small" themeColor="textSecondary">Loading…</ThemedText> : null}
      </View>
    </ScrollView>
  );
}

// Old vs new times for one leg, from the watch's baseline/latest snapshots ("dep 08:10 / arr 14:35 / 1 stop").
function legSummary(legs?: { dep?: string | null; arr?: string | null }[] | null): string {
  if (!Array.isArray(legs) || !legs.length) return '';
  const t = (v?: string | null) => { if (!v) return ''; const m = String(v).match(/T(\d{2}):(\d{2})/); return m ? `${m[1]}:${m[2]}` : String(v); };
  const first = legs[0], last = legs[legs.length - 1];
  const bits: string[] = [];
  if (first.dep) bits.push('dep ' + t(first.dep));
  if (last.arr) bits.push('arr ' + t(last.arr));
  if (legs.length > 1) bits.push(`${legs.length - 1} stop${legs.length > 2 ? 's' : ''}`);
  return bits.join(' / ');
}

// "Your fare dropped $N — here is exactly what THIS airline does about it." (data/faredrop.ts, verified policy)
function FareDropPlaybook({ airline, drop, theme }: { airline?: string; drop?: number; theme: Theme }) {
  const clean = (airline || '').replace(/\s*\(.*\)\s*$/, '').toLowerCase();
  const iata = AIRLINES.find((a) => a.name.replace(/\s*\(.*\)\s*$/, '').toLowerCase() === clean)?.iata;
  const p = FAREDROP.find((x) => x.iata === iata);
  if (!p || p.defunct) return null;
  const amount = drop ? `$${Math.round(drop)}` : 'the difference';
  const form = p.refundForm === 'original_payment' ? 'back to your card' : p.refundForm === 'credit' ? 'as travel credit' : p.refundForm === 'mixed' ? 'as credit (or cash in some cases)' : '';
  const head = p.canReprice === true
    ? `On ${p.name}, you can move to the lower fare and get ${amount} ${form}${p.changeFeeNum ? ` (minus the ${p.changeFee} change fee)` : ' with no change fee'}.`
    : p.canReprice === 'partial'
      ? `On ${p.name}, repricing works only in some cases: ${p.notes || p.changeFee || ''}`
      : `On ${p.name}, standard tickets can’t be repriced after purchase${p.changeFee ? ` (${p.changeFee})` : ''}. ${p.notes || ''}`;
  return (
    <ThemedView type="card" style={[styles.fdBlock, { borderColor: theme.line }]}>
      <ThemedText type="smallBold" style={{ lineHeight: 19 }}>{head}</ThemedText>
      {p.howTo.map((step, i) => (
        <ThemedText key={i} type="small" style={{ lineHeight: 19, marginTop: 2 }}>{i + 1}. {step}</ThemedText>
      ))}
      {p.basicEconomy ? <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.one }}>Basic Economy: {p.basicEconomy}</ThemedText> : null}
      {p.creditExpiry ? <ThemedText type="small" themeColor="textSecondary">Credit expiry: {p.creditExpiry}</ThemedText> : null}
      {p.sameDayNote ? <ThemedText type="small" themeColor="textSecondary">{p.sameDayNote}</ThemedText> : null}
      {p.sourceUrls[0] ? (
        <Pressable onPress={() => Linking.openURL(p.sourceUrls[0])} hitSlop={6} accessibilityRole="link" style={({ pressed }) => [styles.inlineLink, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.brand }}>{p.name}’s policy →{FAREDROP_VERIFIED ? `  (verified ${FAREDROP_VERIFIED})` : ''}</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

function WatchAlerts({ watch, theme, tripId, airline }: { watch?: Watch; theme: Theme; tripId: string; airline?: string }) {
  const router = useRouter();
  if (!watch) return null;
  const why = watch.status === 'unsupported'
    ? 'Automatic re-checks work for Delta flights only for now — the live fare sources list Delta alone. Your deadlines are still tracked.'
    : watch.match === 'unmatchable'
      ? 'This fare source doesn’t list flight numbers, so the watchdog can’t follow your flight — fare drops and schedule changes on it won’t be caught automatically.'
      : watch.match === 'route_only'
        ? 'Add your flight number so the watchdog knows which flight is yours — until then it can’t tell your flight from the others on this route.'
        : '';
  const alerts = watch.status === 'unsupported' ? [] : (watch.alerts || []).filter((a) => a.kind !== 'minor_change' && !a.resolved);
  if (!alerts.length) {
    return <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>{why || `Watchdog on it — no changes to your flight yet${watch.checks ? ` (checked ${watch.checks}×)` : ''}.`}</ThemedText>;
  }
  return (
    <View style={{ marginTop: Spacing.two, gap: Spacing.two }}>
      {why ? <ThemedText type="small" themeColor="textSecondary">{why}</ThemedText> : null}
      {alerts.map((a, i) => (
        <ThemedView key={i} type="backgroundElement" style={[styles.wdAlert, { borderColor: theme.line, borderLeftColor: a.severity === 'high' ? theme.good : theme.warn }]}>
          <ThemedText type="smallBold" style={styles.wdTitle}>{a.title}{!a.seen ? <ThemedText style={[styles.wdNew, { color: theme.good }]}>  NEW</ThemedText> : null}</ThemedText>
          <ThemedText type="small" style={{ marginTop: 3, lineHeight: 19 }}>{a.detail}</ThemedText>
          {a.lever ? (
            <ThemedView type="card" style={[styles.wdLever, { borderColor: theme.line, borderLeftColor: theme.good }]}>
              <ThemedText type="small" style={{ lineHeight: 19 }}><ThemedText type="smallBold">Do this: </ThemedText>{a.lever}{a.rule ? ` (${a.rule})` : ''}</ThemedText>
            </ThemedView>
          ) : null}
          {a.kind === 'price_drop' ? <FareDropPlaybook airline={airline} drop={a.delta ?? undefined} theme={theme} /> : null}
          {a.kind === 'significant_change' ? (
            <Pressable
              onPress={() => {
                const leg = a.leg || (/^Return/.test(a.title || '') ? 'inbound' : 'outbound');
                const routeChange = /connection|different airport/i.test(a.detail || '') ? '1' : '0';
                router.push({ pathname: '/owed', params: { tripId, type: 'schedule', delta: String(a.delta ?? ''), route: routeChange, earlier: /earlier/i.test(a.detail || '') ? '1' : '0', from: a.was || legSummary(watch.baseline?.[leg]), to: a.now || legSummary(watch.latest?.[leg]) } });
              }}
              accessibilityRole="button"
              style={({ pressed }) => [styles.wdBtn, { backgroundColor: theme.brandDeep }, pressed && styles.pressed]}>
              <ThemedText style={styles.btnSmallText}>Write the refund request →</ThemedText>
            </Pressable>
          ) : null}
        </ThemedView>
      ))}
    </View>
  );
}

function TripCard({ t, watch, theme, onEdit, onDelete, onClaim }: { t: Trip; watch?: Watch; theme: Theme; onEdit: () => void; onDelete: () => void; onClaim: () => void }) {
  const dls = deadlines(t).filter((d) => d.status !== 'expired');
  // Manual "check today's fare": one live search through the server (which records the point into
  // the trend series), then the trend block re-fetches. Degrades honestly when the source is throttled.
  const [checking, setChecking] = useState(false);
  const [checkNote, setCheckNote] = useState<string | null>(null);
  const [checkBump, setCheckBump] = useState(0);
  const canCheck = HAS_API && !!t.origin && !!t.dest && !!t.departDate;
  const checkFare = async () => {
    if (!canCheck || checking) return;
    setChecking(true); setCheckNote(null);
    try {
      const res = await fetch(`${API_BASE}/api/search`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ origin: t.origin, destination: t.dest, departDate: t.departDate, returnDate: t.returnDate || '', tier: 'platinum' }) });
      const data = res.ok ? await res.json() : null;
      const offers: { price?: { total?: number } }[] = data && Array.isArray(data.offers) ? data.offers : [];
      const cur = Math.min(...offers.map((o) => Number(o.price?.total) || Infinity).filter((n) => isFinite(n)));
      if (!isFinite(cur)) setCheckNote(data?.blocked ? 'Couldn’t check right now — the free price source is rate-limited. Try again in a minute.' : 'No fares found for that route and date.');
      else {
        const paid = Number(t.fare) || 0;
        setCheckNote(paid && cur < paid ? `Fare dropped $${Math.round(paid - cur)} — it’s $${Math.round(cur)} today vs the $${Math.round(paid)} you paid.` : `Today’s fare: $${Math.round(cur)}.`);
        setCheckBump((n) => n + 1);
      }
    } catch { setCheckNote('Couldn’t reach the price service.'); }
    setChecking(false);
  };
  const hasIssue = !!t.issue && t.issue !== 'none';
  let stake: string | null = null;
  if (hasIssue) {
    try {
      const answers = claimAnswers(t);
      // No figure from a partial picture: an unanswered money question would otherwise read as "$0 owed".
      if (!nextQuestion(answers)) {
        const res = assess(answers);
        const cash = res.entitlements.find((e) => (e.strength === 'strong' || e.strength === 'conditional') && /\$|€|£|CAD/.test(e.amountText || ''));
        stake = cash ? cash.amountText : null;
      }
    } catch {}
  }
  const route = [t.origin, t.dest].filter(Boolean).join(' → ') || '—';
  return (
    <ThemedView type="card" style={[styles.sheet, styles.tripSheet, { borderColor: theme.line }]}>
      <View style={styles.cardBody}>
        <View style={styles.cardHead}>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.cardRoute}>{route}{t.flightNo ? '  ' + t.flightNo : ''}</ThemedText>
            <ThemedText type="small" themeColor="textSecondary">{t.airline || 'Airline not set'}{t.departDate ? ' · ' + fmt(t.departDate) : ''}</ThemedText>
          </View>
          <Pressable onPress={onEdit} hitSlop={8} accessibilityRole="button" style={styles.headAction}><ThemedText type="smallBold" style={{ color: theme.brand }}>Edit</ThemedText></Pressable>
          <Pressable onPress={onDelete} hitSlop={8} accessibilityRole="button" accessibilityLabel="Remove trip" style={[styles.headAction, styles.headActionLast]}><ThemedText type="small" themeColor="textSecondary">✕</ThemedText></Pressable>
        </View>
        {hasIssue ? (
          <ThemedView type="backgroundElement" style={[styles.issue, { borderColor: theme.line, borderLeftColor: theme.bad }]}>
            <ThemedText type="smallBold" style={{ color: theme.bad }}>{ISSUE_LABELS[t.issue as TripIssue]}</ThemedText>
            {stake ? <ThemedText type="money" style={{ color: theme.good, marginTop: Spacing.one }}>You may be owed {stake}</ThemedText> : null}
          </ThemedView>
        ) : null}
        <WatchAlerts watch={watch} theme={theme} tripId={t.id} airline={t.airline} />
        {t.origin && t.dest && t.departDate ? (
          <TrendBlock origin={t.origin} destination={t.dest} departDate={t.departDate} returnDate={t.returnDate} paid={t.fare ? Number(t.fare) || null : null} refreshKey={(watch?.checks || 0) * 1000 + checkBump} />
        ) : null}
      </View>
      {dls.slice(0, 5).map((d) => <DeadlineRow key={d.key} d={d} theme={theme} />)}
      <View style={[styles.cardFoot, { borderTopColor: theme.line }]}>
        {!dls.length ? <ThemedText type="small" themeColor="textSecondary">No open deadlines. If something went wrong, tap Edit and say what happened.</ThemedText> : null}
        {checkNote ? <ThemedText type="small" style={{ lineHeight: 19, fontWeight: /dropped/.test(checkNote) ? '700' : '400', color: /dropped/.test(checkNote) ? theme.good : theme.text }}>{checkNote}</ThemedText> : null}
        {canCheck ? (
          <Pressable onPress={checkFare} disabled={checking} hitSlop={6} accessibilityRole="button" style={({ pressed }) => [styles.inlineLink, pressed && styles.pressed]}>
            <ThemedText type="smallBold" style={{ color: theme.brand }}>{checking ? 'Checking today’s fare…' : 'Check today’s fare →'}</ThemedText>
          </Pressable>
        ) : null}
        <Pressable
          onPress={hasIssue ? onClaim : onEdit}
          accessibilityRole="button"
          style={({ pressed }) => [
            hasIssue ? styles.btnPrimary : styles.btnGhost,
            hasIssue ? { backgroundColor: theme.brandDeep } : { borderColor: theme.line },
            pressed && styles.pressed,
          ]}>
          <ThemedText style={hasIssue ? styles.btnPrimaryText : [styles.btnGhostText, { color: theme.brand }]}>{hasIssue ? 'See what I’m owed & file it →' : 'Something go wrong on this trip?'}</ThemedText>
        </Pressable>
      </View>
    </ThemedView>
  );
}

function DeadlineRow({ d, theme }: { d: Deadline; theme: Theme }) {
  const c = d.status === 'urgent' ? theme.bad : d.status === 'soon' ? theme.warn : theme.good;
  const when = d.daysLeft <= 0 ? 'Due today' : d.daysLeft === 1 ? '1 day left' : `${d.daysLeft} days left`;
  return (
    <View style={[styles.dl, { borderLeftColor: d.status === 'urgent' || d.status === 'soon' ? c : 'transparent', borderTopColor: theme.line }]}>
      <ThemedText type="eyebrow" style={[styles.dlWhen, { color: c }]}>{when}</ThemedText>
      <ThemedText type="small" style={{ flex: 1 }}>{d.label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.dlDue}>{fmt(d.due)}</ThemedText>
    </View>
  );
}

// Form controls live at module scope. Declared inside TripForm they became a new component type on
// every keystroke, so React remounted the TextInput and the phone keyboard closed after each letter.
function FormField({ label, value, onChange, ph, kb, theme }: { label: string; value?: string; onChange: (v: string) => void; ph?: string; kb?: 'numeric'; theme: Theme }) {
  return (
    <View style={styles.field}>
      <ThemedText type="eyebrow" themeColor="textSecondary">{label}</ThemedText>
      <TextInput
        value={value || ''}
        onChangeText={onChange}
        placeholder={ph}
        placeholderTextColor={theme.textSecondary}
        keyboardType={kb}
        autoCorrect={false}
        accessibilityLabel={label}
        style={[styles.input, { backgroundColor: theme.card, borderColor: theme.line, color: theme.text }]}
      />
    </View>
  );
}

function FormChips<T extends string>({ label, opts, cur, onPick, theme }: { label: string; opts: { v: T; l: string }[]; cur?: T; onPick: (v: T) => void; theme: Theme }) {
  return (
    <View style={styles.chipGroup}>
      <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.chipLabel}>{label}</ThemedText>
      <View style={styles.chipWrap}>
        {opts.map((o) => {
          const on = cur === o.v;
          return (
            <Pressable
              key={o.v}
              onPress={() => onPick(o.v)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              style={({ pressed }) => [
                styles.chip,
                { borderColor: on ? theme.brandDeep : theme.line, backgroundColor: on ? theme.backgroundSelected : 'transparent' },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="small" style={{ fontWeight: on ? '700' : '600', color: on ? theme.brandDeep : theme.textSecondary }}>{o.l}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function TripForm({ trip, theme, onSave, onCancel }: { trip: Trip; theme: Theme; onSave: (t: Trip) => void; onCancel: () => void }) {
  const [t, setT] = useState<Trip>({ ...trip });
  const set = (k: keyof Trip, v: string) =>
    setT((p) => {
      const next = { ...p, [k]: v };
      // Typing "DL1234" fills the airline (and with it, the right filing channel).
      if (k === 'flightNo' && !p.airline?.trim()) {
        const guess = airlineFromFlightNo(v);
        if (guess) next.airline = guess;
      }
      return next;
    });

  return (
    <View>
      <ThemedText type="display">{trip.id ? 'Edit trip' : 'Add a trip'}</ThemedText>
      <View style={[styles.rule, { backgroundColor: theme.line }]} />
      <ThemedText type="lede" themeColor="textSecondary" style={styles.formLede}>Only the airline and date are needed. The more you add, the more it can file for you later.</ThemedText>
      <FormChips label="Airline" opts={AIRLINES.map((a) => ({ v: shortName(a.name), l: shortName(a.name) }))} cur={t.airline} onPick={(v) => set('airline', v)} theme={theme} />
      <View style={styles.grid}>
        <FormField label="Flight #" value={t.flightNo} onChange={(v) => set('flightNo', v)} ph="DL1234" theme={theme} />
        <FormField label="Confirmation #" value={t.confirmation} onChange={(v) => set('confirmation', v)} ph="ABC123" theme={theme} />
        <FormField label="From" value={t.origin} onChange={(v) => set('origin', v)} ph="HLN" theme={theme} />
        <FormField label="To" value={t.dest} onChange={(v) => set('dest', v)} ph="JFK" theme={theme} />
        <FormField label="Flight date" value={t.departDate} onChange={(v) => set('departDate', v)} ph="YYYY-MM-DD" theme={theme} />
        <FormField label="Date booked" value={t.bookedDate} onChange={(v) => set('bookedDate', v)} ph="YYYY-MM-DD" theme={theme} />
      </View>
      <FormChips label="Where" opts={REGIONS} cur={t.region} onPick={(v) => set('region', v)} theme={theme} />
      <FormChips label="Paid with" opts={[{ v: 'credit' as const, l: 'Credit card' }, { v: 'other' as const, l: 'Debit / cash' }]} cur={t.payment} onPick={(v) => set('payment', v)} theme={theme} />
      <FormChips label="What happened?" opts={ISSUE_KEYS.map((k) => ({ v: k, l: ISSUE_LABELS[k] }))} cur={t.issue} onPick={(v) => set('issue', v)} theme={theme} />
      {t.issue && t.issue !== 'none' ? (
        <View style={styles.grid}>
          <FormField label="When did it happen?" value={t.issueDate} onChange={(v) => set('issueDate', v)} ph="YYYY-MM-DD" theme={theme} />
          {t.issue === 'bumped' ? <FormField label="Your one-way fare" value={t.fare} onChange={(v) => set('fare', v)} ph="250" kb="numeric" theme={theme} /> : null}
        </View>
      ) : null}
      {t.issue === 'delayed' || t.issue === 'bumped' ? (
        <FormChips
          label="How late did you arrive?"
          opts={[{ v: '<1', l: '<1h' }, { v: '1-2', l: '1–2h' }, { v: '2-3', l: '2–3h' }, { v: '3-4', l: '3–4h' }, { v: '4-6', l: '4–6h' }, { v: '6-9', l: '6–9h' }, { v: '9+', l: '9h+' }]}
          cur={t.arrDelay}
          onPick={(v) => set('arrDelay', v)}
          theme={theme}
        />
      ) : null}
      <View style={styles.formButtons}>
        <Pressable onPress={() => onSave(t)} accessibilityRole="button" style={({ pressed }) => [styles.btnPrimary, { backgroundColor: theme.brandDeep, flex: 1 }, pressed && styles.pressed]}>
          <ThemedText style={styles.btnPrimaryText}>{trip.id ? 'Save changes' : 'Save trip'}</ThemedText>
        </Pressable>
        <Pressable onPress={onCancel} accessibilityRole="button" style={({ pressed }) => [styles.btnGhost, { borderColor: theme.line }, pressed && styles.pressed]}>
          <ThemedText style={[styles.btnGhostText, { color: theme.brand }]}>Cancel</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },

  // ---- rhythm: a rule under a title, an eyebrow over a block ----
  rule: { height: StyleSheet.hairlineWidth, marginTop: Spacing.three },
  headRule: { marginTop: 0, marginBottom: Spacing.three },

  // ---- empty state: an editorial opening, not a centred icon hero ----
  hero: { paddingTop: Spacing.two },
  heroText: { marginTop: Spacing.three, maxWidth: 560 },
  heroBtn: { alignSelf: 'flex-start', marginTop: Spacing.four },
  note: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, padding: Spacing.three, marginTop: Spacing.four },

  // ---- the deadline banner: hairline sheet with an oxblood spine ----
  banner: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three, marginBottom: Spacing.four },
  bannerLine: { marginTop: Spacing.one + 2, lineHeight: 20 },

  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.three, marginBottom: Spacing.two },

  // ---- one sheet, hairline-separated rows ----
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },
  claimsBlock: { marginBottom: Spacing.four },
  claimsHead: { marginBottom: Spacing.two },
  claimRow: { borderLeftWidth: 3, paddingVertical: Spacing.three, paddingRight: Spacing.three, paddingLeft: Spacing.three - 3 },
  claimRoute: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 23, fontWeight: '700', fontVariant: ['tabular-nums'] },
  claimMeta: { marginTop: 2 },

  // ---- trip sheet ----
  tripSheet: { marginBottom: Spacing.three },
  cardBody: { padding: Spacing.three },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start' },
  cardRoute: { fontFamily: Fonts.serif, fontSize: 19, lineHeight: 25, fontWeight: '700' },
  headAction: { minHeight: 44, justifyContent: 'center', paddingHorizontal: Spacing.two },
  headActionLast: { marginLeft: Spacing.one, marginRight: -Spacing.two },
  issue: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, padding: Spacing.two + 2, marginTop: Spacing.three },
  cardFoot: { borderTopWidth: StyleSheet.hairlineWidth, padding: Spacing.three, gap: Spacing.two + 2 },

  // ---- deadlines: full-bleed rows, a spine for the clock that is running out ----
  dl: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2, borderTopWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, paddingVertical: Spacing.two + 2, paddingRight: Spacing.three, paddingLeft: Spacing.three - 3 },
  dlWhen: { minWidth: 92, fontVariant: ['tabular-nums'] },
  dlDue: { fontSize: 12.5, fontVariant: ['tabular-nums'] },

  // ---- buttons ----
  btnPrimary: { borderRadius: Radius.sm, paddingVertical: Spacing.three - 3, paddingHorizontal: Spacing.four, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  btnPrimaryText: { color: '#fdfbf5', fontWeight: '700', fontSize: 15 },
  btnGhost: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingVertical: Spacing.two, paddingHorizontal: Spacing.three, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  btnGhostText: { fontWeight: '700', fontSize: 14.5 },
  btnSmallText: { color: '#fdfbf5', fontWeight: '700', fontSize: 14 },
  inlineLink: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: 0.75 },

  // ---- form ----
  formLede: { marginTop: Spacing.three, marginBottom: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
  field: { width: '47%', flexGrow: 1, gap: Spacing.one + 1 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.two + 2, paddingVertical: 11, fontSize: 16, minHeight: 44 },
  chipGroup: { marginTop: Spacing.three },
  chipLabel: { marginBottom: Spacing.two },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two - 2 },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.three - 2, minHeight: 44, justifyContent: 'center' },
  formButtons: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.five },

  // ---- watchdog ----
  wdAlert: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, padding: Spacing.two + 2 },
  wdTitle: { fontSize: 14.5 },
  wdNew: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1 },
  wdLever: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, padding: Spacing.two, marginTop: Spacing.two },
  fdBlock: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, padding: Spacing.two + 2, marginTop: Spacing.two },
  wdBtn: { alignSelf: 'flex-start', borderRadius: Radius.sm, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, marginTop: Spacing.two + 2, minHeight: 44, justifyContent: 'center' },
});
