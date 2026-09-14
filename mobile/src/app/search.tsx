import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { TrendBlock } from '@/components/trend-block';
import { API_BASE, HAS_API, ORIGIN } from '@/config';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type Offer = {
  price?: { total?: number; currency?: string };
  stops?: number;
  operator?: string;
  companion?: { status?: 'eligible' | 'unknown' | 'ineligible'; reason?: string; eligibleCabinLabel?: string };
  value?: { secondTicketPrice?: number; companionTaxes?: number; netSavings?: number | null; currency?: string; estimate?: boolean };
};

function isoOffset(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function isYmd(s: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim());
}

function money(n?: number | null, cur = 'USD') {
  if (n == null) return '—';
  try {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(n);
  } catch {
    return `$${Math.round(n)}`;
  }
}

export default function SearchScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const [destination, setDestination] = useState('');
  const [depart, setDepart] = useState(isoOffset(30));
  const [ret, setRet] = useState(isoOffset(37));
  const [tier, setTier] = useState<'platinum' | 'reserve'>('platinum');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offers, setOffers] = useState<Offer[] | null>(null);
  const [source, setSource] = useState<string | null>(null);
  // The exact query the current results came from — the trend verdict is fetched for it.
  const [asked, setAsked] = useState<{ dest: string; depart: string; ret: string; n: number } | null>(null);

  async function run() {
    const dest = destination.trim().toUpperCase();
    setOffers(null);
    setError(null);
    if (!dest) {
      setError('Enter a destination airport code (e.g. JFK, LAX, MCO).');
      return;
    }
    if (!isYmd(depart) || !isYmd(ret)) {
      setError('Please enter the dates as Year-Month-Day, like 2026-06-30.');
      return;
    }
    if (!HAS_API) {
      setError('Live flight prices aren’t set up in this version yet — but the 🛡️ Your Rights tab works fully, with no internet or setup.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: ORIGIN, destination: dest, departDate: depart, returnDate: ret, tier }),
      });
      if (!res.ok) {
        setError(`The flight server responded with an error (${res.status}). Try again in a moment.`);
        return;
      }
      const data = await res.json();
      if (data?.error) {
        setError(String(data.error));
        return;
      }
      setOffers(Array.isArray(data?.offers) ? data.offers : []);
      setSource(typeof data?.source === 'string' ? data.source : null);
      setAsked((p) => ({ dest, depart, ret, n: (p?.n ?? 0) + 1 }));
    } catch (e: any) {
      setError(`Couldn't reach the flight server at ${API_BASE}. Is it running and on the same network? (${String(e?.message || e)})`);
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = [styles.input, { backgroundColor: theme.card, borderColor: theme.line, color: theme.text }];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + TopTabInset + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
      ]}>
      <View style={styles.inner}>
        <ThemedText style={styles.title}>Find companion deals</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Round trips from {ORIGIN} (Helena). All Delta routes connect through Salt Lake City.
        </ThemedText>

        {!HAS_API ? (
          <ThemedView type="backgroundElement" style={[styles.banner, { borderColor: theme.warn }]}>
            <ThemedText type="smallBold">Live flight prices aren’t connected yet.</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
              This version doesn’t have a flight-price connection set up. Everything in the 🛡️ Your Rights tab
              works right now — no internet or setup needed.
            </ThemedText>
          </ThemedView>
        ) : null}

        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">Destination</ThemedText>
          <TextInput
            value={destination}
            onChangeText={setDestination}
            placeholder="e.g. JFK"
            placeholderTextColor={theme.textSecondary}
            autoCapitalize="characters"
            autoCorrect={false}
            style={inputStyle}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.flex1]}>
            <ThemedText type="small" themeColor="textSecondary">Depart</ThemedText>
            <TextInput value={depart} onChangeText={setDepart} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary} autoCorrect={false} style={inputStyle} />
          </View>
          <View style={[styles.field, styles.flex1]}>
            <ThemedText type="small" themeColor="textSecondary">Return</ThemedText>
            <TextInput value={ret} onChangeText={setRet} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary} autoCorrect={false} style={inputStyle} />
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="small" themeColor="textSecondary">Your Delta card</ThemedText>
          <View style={styles.toggleRow}>
            {(['platinum', 'reserve'] as const).map((t) => {
              const on = tier === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTier(t)}
                  style={[
                    styles.toggle,
                    { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.backgroundSelected : theme.card },
                  ]}>
                  <ThemedText type="small" style={{ fontWeight: '700', color: on ? theme.brandDeep : theme.textSecondary }}>
                    {t === 'platinum' ? 'Platinum' : 'Reserve'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable onPress={run} disabled={loading} style={({ pressed }) => [styles.cta, { backgroundColor: theme.brand }, (pressed || loading) && { opacity: 0.7 }]}>
          {loading ? <ActivityIndicator color="#fff" /> : <ThemedText style={styles.ctaText}>Find companion value</ThemedText>}
        </Pressable>

        {error ? (
          <ThemedView type="backgroundElement" style={[styles.banner, { borderColor: theme.bad }]}>
            <ThemedText type="small" style={{ color: theme.bad }}>{error}</ThemedText>
          </ThemedView>
        ) : null}

        {offers ? (
          <View style={{ marginTop: Spacing.three }}>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
              {offers.length} Delta option{offers.length === 1 ? '' : 's'} to {destination.trim().toUpperCase()}
              {source ? ` · ${source.startsWith('amadeus') ? 'live · Amadeus' : source.startsWith('googleflights') ? 'live · Google Flights' : source}` : ''}
            </ThemedText>
            {offers.length && asked ? (
              <View style={{ marginBottom: Spacing.two }}>
                <TrendBlock origin={ORIGIN} destination={asked.dest} departDate={asked.depart} returnDate={asked.ret} refreshKey={asked.n}
                  price={Math.min(...offers.map((o) => Number(o.price?.total) || Infinity).filter((n) => isFinite(n))) || null} />
              </View>
            ) : null}
            {offers.length === 0 ? (
              <ThemedText type="small" themeColor="textSecondary">No Delta offers for those dates. Try different dates.</ThemedText>
            ) : (
              offers.map((o, i) => <OfferCard key={i} offer={o} dest={destination.trim().toUpperCase()} />)
            )}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function OfferCard({ offer, dest }: { offer: Offer; dest: string }) {
  const theme = useTheme();
  const status = offer.companion?.status ?? 'unknown';
  const edge = status === 'eligible' ? theme.good : status === 'ineligible' ? theme.bad : theme.warn;
  const tag = status === 'eligible' ? 'Companion flies free ✓' : status === 'unknown' ? 'Likely — confirm on Delta' : 'Not on this fare';
  const tagBg = status === 'eligible' ? theme.goodBg : status === 'ineligible' ? theme.badBg : theme.warnBg;
  const v = offer.value ?? {};
  return (
    <ThemedView type="card" style={[styles.offer, { borderColor: theme.line, borderLeftColor: edge }]}>
      <View style={styles.offerHead}>
        <ThemedText style={{ fontWeight: '800' }}>
          {ORIGIN} → {dest}
          {offer.stops != null ? <ThemedText type="small" themeColor="textSecondary">{'  '}{offer.stops === 0 ? 'nonstop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}</ThemedText> : null}
        </ThemedText>
        <View style={[styles.tag, { backgroundColor: tagBg }]}>
          <ThemedText style={[styles.tagText, { color: edge }]}>{tag}</ThemedText>
        </View>
      </View>
      <View style={styles.metrics}>
        <Metric k="One ticket" val={money(v.secondTicketPrice ?? offer.price?.total, v.currency ?? offer.price?.currency)} />
        <Metric k={`Companion pays${v.estimate ? ' (est.)' : ''}`} val={status === 'ineligible' ? '—' : money(v.companionTaxes, v.currency)} />
        <Metric k="You save" val={v.netSavings == null ? '—' : money(v.netSavings, v.currency)} highlight={theme.good} />
      </View>
    </ThemedView>
  );
}

function Metric({ k, val, highlight }: { k: string; val: string; highlight?: string }) {
  return (
    <View style={styles.metric}>
      <ThemedText type="small" themeColor="textSecondary">{k}</ThemedText>
      <ThemedText style={[styles.metricVal, highlight ? { color: highlight } : null]}>{val}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth, gap: Spacing.two },
  title: { fontSize: 24, fontWeight: '800' },
  banner: { borderWidth: 1, borderRadius: Spacing.three, padding: Spacing.three, marginTop: Spacing.two },
  field: { gap: Spacing.one, marginTop: Spacing.two },
  row: { flexDirection: 'row', gap: Spacing.two },
  flex1: { flex: 1 },
  input: { borderWidth: 1, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, fontSize: 16 },
  toggleRow: { flexDirection: 'row', gap: Spacing.two },
  toggle: { flex: 1, borderWidth: 1, borderRadius: Spacing.two, paddingVertical: Spacing.two, alignItems: 'center' },
  cta: { marginTop: Spacing.three, borderRadius: Spacing.three, paddingVertical: Spacing.three, alignItems: 'center' },
  ctaText: { color: '#ffffff', fontWeight: '800', fontSize: 16 },
  offer: { borderWidth: 1, borderLeftWidth: 4, borderRadius: Spacing.three, padding: Spacing.three, marginBottom: Spacing.two },
  offerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  tag: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 3 },
  tagText: { fontSize: 11.5, fontWeight: '800' },
  metrics: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.two, flexWrap: 'wrap' },
  metric: { minWidth: 90 },
  metricVal: { fontSize: 18, fontWeight: '800', marginTop: 2 },
});
