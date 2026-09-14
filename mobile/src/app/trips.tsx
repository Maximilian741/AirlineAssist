import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrendBlock } from '@/components/trend-block';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { API_BASE, HAS_API } from '@/config';
import { AIRLINES } from '@/data/airlines';
import { FAREDROP, FAREDROP_VERIFIED } from '@/data/faredrop';
import { useTheme } from '@/hooks/use-theme';
import { loadClaims } from '@/components/claim-tracker';
import { checkAndNotify, fetchWatches, watchTrip, type Watch } from '@/lib/alerts';
import { fmt as fmtDay, nextAction, timeline, type TrackedClaim } from '@/lib/claimtrack';
import { assess } from '@/lib/claim-engine';
import { airlineFromFlightNo, claimAnswers, deadlines, fmt, ISSUE_LABELS, newId, type Deadline, type Trip, type TripIssue } from '@/lib/trips';

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

  const refreshWatches = useCallback(() => {
    fetchWatches().then(setWatches).catch(() => {});
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(KEY)
      .then((v) => { if (v) { try { const p = JSON.parse(v); if (Array.isArray(p)) setTrips(p); } catch {} } })
      .finally(() => setLoaded(true));
    refreshWatches();
    // Opening the vault is a natural moment to fire anything new.
    checkAndNotify().catch(() => {});
  }, [refreshWatches]);

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
    watchTrip(withId).then((ok) => { if (ok) refreshWatches(); });
  };
  const del = (id: string) => {
    Alert.alert('Remove trip?', 'This deletes it from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => persist(trips.filter((t) => t.id !== id)) },
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
            <ThemedText style={{ fontSize: 40 }}>🧳</ThemedText>
            <ThemedText style={styles.heroTitle}>Never miss a deadline again</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={styles.heroText}>
              Every way to get money back from an airline has a clock on it — some as short as 7 days. Save a trip and this counts every one down, then files the claim with your details already filled in.
            </ThemedText>
            <Pressable onPress={() => setEditing({ id: '', region: 'us', payment: 'credit', issue: 'none' })} style={({ pressed }) => [styles.cta, { backgroundColor: theme.brand }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={styles.ctaText}>＋ Add your first trip</ThemedText>
            </Pressable>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two, textAlign: 'center' }}>
              Stored only on this device. No account, nothing sent anywhere.
            </ThemedText>
          </View>
        ) : (
          <>
            {soon.length ? (
              <ThemedView type="card" style={[styles.alert, { borderColor: theme.warn }]}>
                <ThemedText type="small" style={{ fontWeight: '800', color: theme.warn }}>
                  ⏰ {soon.length} deadline{soon.length === 1 ? '' : 's'} in the next 2 weeks
                </ThemedText>
                <ThemedText type="small" style={{ marginTop: 2 }}>
                  {soon[0].d.label} — {soon[0].d.daysLeft <= 0 ? 'due today' : soon[0].d.daysLeft + ' day' + (soon[0].d.daysLeft === 1 ? '' : 's') + ' left'}
                </ThemedText>
              </ThemedView>
            ) : null}
            <View style={styles.listHead}>
              <ThemedText style={{ fontWeight: '800' }}>{trips.length} trip{trips.length === 1 ? '' : 's'} tracked</ThemedText>
              <Pressable onPress={() => setEditing({ id: '', region: 'us', payment: 'credit', issue: 'none' })} hitSlop={8}>
                <ThemedText type="small" style={{ color: theme.brand, fontWeight: '800' }}>＋ Add trip</ThemedText>
              </Pressable>
            </View>
            {claims.length ? (
              <View style={{ marginBottom: 12 }}>
                <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6 }}>CLAIMS IN PROGRESS</ThemedText>
                {claims.map((c) => {
                  const na = nextAction(c);
                  const blown = timeline(c).filter((t) => t.status === 'overdue').length;
                  const route = [c.details?.origin, c.details?.dest].filter(Boolean).join(' → ') || c.details?.airline || 'Claim';
                  return (
                    <Pressable key={c.id} onPress={() => router.push({ pathname: '/owed', params: { claimId: c.id } })} style={({ pressed }) => [styles.card, { borderColor: blown ? theme.bad : theme.line, marginBottom: 8 }, pressed && { opacity: 0.7 }]}>
                      <ThemedText style={{ fontSize: 15, fontWeight: '800' }}>{route}{c.amount ? `  ·  ${c.amount}` : ''}</ThemedText>
                      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>{c.details?.airline || ''}{c.filings.length ? ` · filed ${fmtDay(c.filings[0].date)}` : ''}{blown ? ` · ${blown} clock${blown === 1 ? '' : 's'} blown` : ''}</ThemedText>
                      <ThemedText type="small" style={{ marginTop: 6, lineHeight: 18, color: na.kind === 'escalate' ? theme.bad : theme.text, fontWeight: na.kind === 'escalate' ? '700' : '400' }}>{na.text}</ThemedText>
                      <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700', marginTop: 6 }}>Open →</ThemedText>
                    </Pressable>
                  );
                })}
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
    <ThemedView type="backgroundElement" style={[styles.fdBlock, { borderColor: theme.line }]}>
      <ThemedText type="small" style={{ fontWeight: '700', lineHeight: 19 }}>{head}</ThemedText>
      {p.howTo.map((step, i) => (
        <ThemedText key={i} type="small" style={{ lineHeight: 19, marginTop: 2 }}>{i + 1}. {step}</ThemedText>
      ))}
      {p.basicEconomy ? <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>Basic Economy: {p.basicEconomy}</ThemedText> : null}
      {p.creditExpiry ? <ThemedText type="small" themeColor="textSecondary">Credit expiry: {p.creditExpiry}</ThemedText> : null}
      {p.sameDayNote ? <ThemedText type="small" themeColor="textSecondary">{p.sameDayNote}</ThemedText> : null}
      {p.sourceUrls[0] ? (
        <Pressable onPress={() => Linking.openURL(p.sourceUrls[0])} hitSlop={6} style={{ marginTop: 4 }}>
          <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{p.name}’s policy →{FAREDROP_VERIFIED ? `  (verified ${FAREDROP_VERIFIED})` : ''}</ThemedText>
        </Pressable>
      ) : null}
    </ThemedView>
  );
}

function WatchAlerts({ watch, theme, tripId, airline }: { watch?: Watch; theme: Theme; tripId: string; airline?: string }) {
  const router = useRouter();
  if (!watch) return null;
  const alerts = (watch.alerts || []).filter((a) => a.kind !== 'minor_change');
  if (!alerts.length) {
    return <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8 }}>Watchdog on it — no changes yet{watch.checks ? ` (checked ${watch.checks}×)` : ''}.</ThemedText>;
  }
  return (
    <View style={{ marginTop: 8, gap: 7 }}>
      {alerts.map((a, i) => (
        <ThemedView key={i} type="card" style={[styles.wdAlert, { borderColor: theme.line, borderLeftColor: a.severity === 'high' ? theme.good : theme.warn }]}>
          <ThemedText style={{ fontWeight: '800', fontSize: 14 }}>{a.title}{!a.seen ? <ThemedText style={{ color: theme.good, fontSize: 11, fontWeight: '800' }}>  NEW</ThemedText> : null}</ThemedText>
          <ThemedText type="small" style={{ marginTop: 3, lineHeight: 19 }}>{a.detail}</ThemedText>
          {a.lever ? (
            <ThemedView style={[styles.wdLever, { backgroundColor: theme.goodBg }]}>
              <ThemedText type="small" style={{ lineHeight: 19 }}><ThemedText type="smallBold">Do this: </ThemedText>{a.lever}{a.rule ? ` (${a.rule})` : ''}</ThemedText>
            </ThemedView>
          ) : null}
          {a.kind === 'price_drop' ? <FareDropPlaybook airline={airline} drop={a.delta} theme={theme} /> : null}
          {a.kind === 'significant_change' ? (
            <Pressable
              onPress={() => {
                const leg = /^Return/.test(a.title || '') ? 'inbound' : 'outbound';
                const routeChange = /connection|different airport/i.test(a.detail || '') ? '1' : '0';
                router.push({ pathname: '/owed', params: { tripId, type: 'schedule', delta: String(a.delta ?? ''), route: routeChange, earlier: /earlier/i.test(a.detail || '') ? '1' : '0', from: legSummary(watch.baseline?.[leg]), to: legSummary(watch.latest?.[leg]) } });
              }}
              style={({ pressed }) => [styles.wdBtn, { backgroundColor: theme.brand }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 13.5 }}>Write the refund request →</ThemedText>
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
      const res = assess(claimAnswers(t));
      const cash = res.entitlements.find((e) => (e.strength === 'strong' || e.strength === 'conditional') && /\$|€|£|CAD/.test(e.amountText || ''));
      stake = cash ? cash.amountText : null;
    } catch {}
  }
  const route = [t.origin, t.dest].filter(Boolean).join(' → ') || '—';
  return (
    <ThemedView type="card" style={[styles.card, { borderColor: theme.line }]}>
      <View style={styles.cardHead}>
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontSize: 16, fontWeight: '800' }}>{route}{t.flightNo ? '  ' + t.flightNo : ''}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">{t.airline || 'Airline not set'}{t.departDate ? ' · ' + fmt(t.departDate) : ''}</ThemedText>
        </View>
        <Pressable onPress={onEdit} hitSlop={8} style={{ minHeight: 36, justifyContent: 'center' }}><ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>Edit</ThemedText></Pressable>
        <Pressable onPress={onDelete} hitSlop={8} style={{ minHeight: 36, justifyContent: 'center', marginLeft: 12 }}><ThemedText type="small" themeColor="textSecondary">✕</ThemedText></Pressable>
      </View>
      {hasIssue ? (
        <ThemedView type="backgroundElement" style={styles.issue}>
          <ThemedText type="small">⚠ {ISSUE_LABELS[t.issue as TripIssue]}</ThemedText>
          {stake ? <ThemedText type="small" style={{ color: theme.good, fontWeight: '800', marginTop: 2 }}>You may be owed {stake}</ThemedText> : null}
        </ThemedView>
      ) : null}
      <WatchAlerts watch={watch} theme={theme} tripId={t.id} airline={t.airline} />
      {t.origin && t.dest && t.departDate ? (
        <TrendBlock origin={t.origin} destination={t.dest} departDate={t.departDate} returnDate={t.returnDate} paid={t.fare ? Number(t.fare) || null : null} refreshKey={(watch?.checks || 0) * 1000 + checkBump} />
      ) : null}
      {dls.slice(0, 5).map((d) => <DeadlineRow key={d.key} d={d} theme={theme} />)}
      {!dls.length ? <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 8 }}>No open deadlines. If something went wrong, tap Edit and say what happened.</ThemedText> : null}
      {checkNote ? <ThemedText type="small" style={{ marginTop: 8, lineHeight: 19, fontWeight: /dropped/.test(checkNote) ? '700' : '400', color: /dropped/.test(checkNote) ? theme.good : theme.text }}>{checkNote}</ThemedText> : null}
      {canCheck ? (
        <Pressable onPress={checkFare} disabled={checking} hitSlop={6} style={{ marginTop: 8, minHeight: 36, justifyContent: 'center', alignSelf: 'flex-start' }}>
          <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{checking ? 'Checking today’s fare…' : 'Check today’s fare →'}</ThemedText>
        </Pressable>
      ) : null}
      <Pressable onPress={hasIssue ? onClaim : onEdit} style={({ pressed }) => [styles.cta, { backgroundColor: hasIssue ? theme.brand : 'transparent', borderWidth: hasIssue ? 0 : 1.5, borderColor: theme.line, marginTop: Spacing.three }, pressed && { opacity: 0.7 }]}>
        <ThemedText style={hasIssue ? styles.ctaText : { fontWeight: '700' }}>{hasIssue ? '💸 See what I’m owed & file it →' : 'Something go wrong on this trip?'}</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

function DeadlineRow({ d, theme }: { d: Deadline; theme: Theme }) {
  const c = d.status === 'urgent' ? theme.bad : d.status === 'soon' ? theme.warn : theme.good;
  const bg = d.status === 'urgent' ? theme.badBg : d.status === 'soon' ? theme.warnBg : 'transparent';
  const when = d.daysLeft <= 0 ? 'Due today' : d.daysLeft === 1 ? '1 day left' : `${d.daysLeft} days left`;
  return (
    <View style={[styles.dl, { borderLeftColor: c, backgroundColor: bg }]}>
      <ThemedText type="small" style={{ fontWeight: '800', color: c, fontSize: 12.5 }}>{when}</ThemedText>
      <ThemedText type="small" style={{ flex: 1 }}>{d.label}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12 }}>{fmt(d.due)}</ThemedText>
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
  const input = [styles.input, { backgroundColor: theme.card, borderColor: theme.line, color: theme.text }];
  const Field = ({ label, k, ph, kb }: { label: string; k: keyof Trip; ph?: string; kb?: 'numeric' }) => (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontWeight: '700', fontSize: 12 }}>{label}</ThemedText>
      <TextInput value={(t[k] as string) || ''} onChangeText={(v) => set(k, v)} placeholder={ph} placeholderTextColor={theme.textSecondary} keyboardType={kb} autoCorrect={false} style={input} />
    </View>
  );
  const Chips = <T extends string>({ label, opts, cur, onPick }: { label: string; opts: { v: T; l: string }[]; cur?: T; onPick: (v: T) => void }) => (
    <View style={{ marginTop: Spacing.two }}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontWeight: '700', fontSize: 12, marginBottom: 5 }}>{label}</ThemedText>
      <View style={styles.chipWrap}>
        {opts.map((o) => {
          const on = cur === o.v;
          return (
            <Pressable key={o.v} onPress={() => onPick(o.v)} style={[styles.chip, { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.backgroundSelected : theme.card }]}>
              <ThemedText type="small" style={{ fontWeight: '700', color: on ? theme.brandDeep : theme.textSecondary }}>{o.l}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );

  return (
    <View>
      <ThemedText style={{ fontSize: 22, fontWeight: '800' }}>{trip.id ? 'Edit trip' : 'Add a trip'}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>Only the airline and date are needed. The more you add, the more it can file for you later.</ThemedText>
      <Chips label="Airline" opts={AIRLINES.map((a) => ({ v: shortName(a.name), l: shortName(a.name) }))} cur={t.airline} onPick={(v) => set('airline', v)} />
      <View style={styles.grid}>
        <Field label="Flight #" k="flightNo" ph="DL1234" />
        <Field label="Confirmation #" k="confirmation" ph="ABC123" />
        <Field label="From" k="origin" ph="HLN" />
        <Field label="To" k="dest" ph="JFK" />
        <Field label="Flight date" k="departDate" ph="YYYY-MM-DD" />
        <Field label="Date booked" k="bookedDate" ph="YYYY-MM-DD" />
      </View>
      <Chips label="Where" opts={REGIONS} cur={t.region} onPick={(v) => set('region', v)} />
      <Chips label="Paid with" opts={[{ v: 'credit' as const, l: 'Credit card' }, { v: 'other' as const, l: 'Debit / cash' }]} cur={t.payment} onPick={(v) => set('payment', v)} />
      <Chips label="What happened?" opts={ISSUE_KEYS.map((k) => ({ v: k, l: ISSUE_LABELS[k] }))} cur={t.issue} onPick={(v) => set('issue', v)} />
      {t.issue && t.issue !== 'none' ? (
        <View style={styles.grid}>
          <Field label="When did it happen?" k="issueDate" ph="YYYY-MM-DD" />
          {t.issue === 'bumped' ? <Field label="Your one-way fare" k="fare" ph="250" kb="numeric" /> : null}
        </View>
      ) : null}
      {t.issue === 'delayed' || t.issue === 'bumped' ? (
        <Chips
          label="How late did you arrive?"
          opts={[{ v: '<1', l: '<1h' }, { v: '1-2', l: '1–2h' }, { v: '2-3', l: '2–3h' }, { v: '3-4', l: '3–4h' }, { v: '4-6', l: '4–6h' }, { v: '6-9', l: '6–9h' }, { v: '9+', l: '9h+' }]}
          cur={t.arrDelay || '3-4'}
          onPick={(v) => set('arrDelay', v)}
        />
      ) : null}
      <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four }}>
        <Pressable onPress={() => onSave(t)} style={({ pressed }) => [styles.cta, { backgroundColor: theme.brand, flex: 1 }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={styles.ctaText}>{trip.id ? 'Save changes' : 'Save trip'}</ThemedText>
        </Pressable>
        <Pressable onPress={onCancel} style={({ pressed }) => [styles.cta, { borderWidth: 1.5, borderColor: theme.line }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={{ fontWeight: '700' }}>Cancel</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },
  hero: { alignItems: 'center', paddingVertical: Spacing.four, gap: 6 },
  heroTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  heroText: { textAlign: 'center', maxWidth: 520, lineHeight: 21 },
  alert: { borderWidth: 1.5, borderRadius: 12, padding: 12, marginBottom: Spacing.three },
  listHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.two },
  card: { borderWidth: 1, borderRadius: 14, padding: 15, marginBottom: 13 },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start' },
  issue: { borderRadius: 9, padding: 10, marginTop: 10 },
  dl: { flexDirection: 'row', alignItems: 'center', gap: 10, borderLeftWidth: 4, borderRadius: 8, paddingVertical: 7, paddingHorizontal: 10, marginTop: 6 },
  cta: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 20, alignItems: 'center', marginTop: Spacing.three },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.two },
  field: { width: '47%', flexGrow: 1, gap: 4 },
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  wdAlert: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 8, padding: 10 },
  wdLever: { borderRadius: 6, padding: 8, marginTop: 6 },
  fdBlock: { borderWidth: 1, borderRadius: 6, padding: 9, marginTop: 6 },
  wdBtn: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8, minHeight: 36, justifyContent: 'center' },
});
