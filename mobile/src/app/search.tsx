import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { TrendBlock } from '@/components/trend-block';
import { API_BASE, HAS_API, ORIGIN } from '@/config';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
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
      setError('Live flight prices aren’t set up in this version yet — but the Your Rights tab works fully, with no internet or setup.');
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
        <ThemedText type="display">Find companion deals</ThemedText>
        <View style={[styles.rule, { backgroundColor: theme.line }]} />
        <ThemedText type="lede" themeColor="textSecondary" style={styles.standfirst}>
          Round trips from {ORIGIN} (Helena). All Delta routes connect through Salt Lake City.
        </ThemedText>

        {!HAS_API ? (
          <View style={[styles.note, { backgroundColor: theme.card, borderColor: theme.line, borderLeftColor: theme.warn }]}>
            <ThemedText type="smallBold">Live flight prices aren’t connected yet.</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>
              This version doesn’t have a flight-price connection set up. Everything in the Your Rights tab
              works right now — no internet or setup needed.
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.field}>
          <ThemedText type="eyebrow" themeColor="textSecondary">Destination</ThemedText>
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
            <ThemedText type="eyebrow" themeColor="textSecondary">Depart</ThemedText>
            <TextInput value={depart} onChangeText={setDepart} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary} autoCorrect={false} style={inputStyle} />
          </View>
          <View style={[styles.field, styles.flex1]}>
            <ThemedText type="eyebrow" themeColor="textSecondary">Return</ThemedText>
            <TextInput value={ret} onChangeText={setRet} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary} autoCorrect={false} style={inputStyle} />
          </View>
        </View>

        <View style={styles.field}>
          <ThemedText type="eyebrow" themeColor="textSecondary">Your Delta card</ThemedText>
          <View style={styles.toggleRow}>
            {(['platinum', 'reserve'] as const).map((t) => {
              const on = tier === t;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTier(t)}
                  style={[
                    styles.toggle,
                    { borderColor: on ? theme.brandDeep : theme.line, backgroundColor: on ? theme.backgroundSelected : 'transparent' },
                  ]}>
                  <ThemedText type="small" style={{ fontWeight: on ? '700' : '500', color: on ? theme.text : theme.textSecondary }}>
                    {t === 'platinum' ? 'Platinum' : 'Reserve'}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable onPress={run} disabled={loading} style={({ pressed }) => ((pressed || loading) ? styles.pressed : null)}>
          <View style={[styles.cta, { backgroundColor: theme.brandDeep }]}>
            {loading ? <ActivityIndicator color="#fdfbf5" /> : <ThemedText style={styles.ctaText}>Find companion value</ThemedText>}
          </View>
        </Pressable>

        {error ? (
          <View style={[styles.note, { backgroundColor: theme.card, borderColor: theme.line, borderLeftColor: theme.bad }]}>
            <ThemedText type="small" style={{ color: theme.bad }}>{error}</ThemedText>
          </View>
        ) : null}

        {offers ? (
          <View style={styles.results}>
            <View style={[styles.rule, styles.resultsRule, { backgroundColor: theme.line }]} />
            <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.resultsCount}>
              {offers.length} Delta option{offers.length === 1 ? '' : 's'} to {destination.trim().toUpperCase()}
              {source ? ` · ${source.startsWith('amadeus') ? 'live · Amadeus' : source.startsWith('googleflights') ? 'live · Google Flights' : source}` : ''}
            </ThemedText>
            {offers.length && asked ? (
              <View style={{ marginBottom: Spacing.three }}>
                <TrendBlock origin={ORIGIN} destination={asked.dest} departDate={asked.depart} returnDate={asked.ret} refreshKey={asked.n}
                  price={Math.min(...offers.map((o) => Number(o.price?.total) || Infinity).filter((n) => isFinite(n))) || null} />
              </View>
            ) : null}
            {offers.length === 0 ? (
              <View style={[styles.note, styles.emptyNote, { backgroundColor: theme.card, borderColor: theme.line, borderLeftColor: theme.textSecondary }]}>
                <ThemedText type="small" themeColor="textSecondary">No Delta offers for those dates. Try different dates.</ThemedText>
              </View>
            ) : (
              <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
                {offers.map((o, i) => <OfferCard key={i} offer={o} dest={destination.trim().toUpperCase()} first={i === 0} />)}
              </View>
            )}
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function OfferCard({ offer, dest, first }: { offer: Offer; dest: string; first?: boolean }) {
  const theme = useTheme();
  const status = offer.companion?.status ?? 'unknown';
  const edge = status === 'eligible' ? theme.good : status === 'ineligible' ? theme.bad : theme.warn;
  const tag = status === 'eligible' ? 'Companion flies free ✓' : status === 'unknown' ? 'Likely — confirm on Delta' : 'Not on this fare';
  const v = offer.value ?? {};
  return (
    <View style={[styles.offer, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
      <View style={styles.offerHead}>
        <ThemedText style={styles.route}>
          {ORIGIN} → {dest}
          {offer.stops != null ? <ThemedText type="small" themeColor="textSecondary">{'  '}{offer.stops === 0 ? 'nonstop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}</ThemedText> : null}
        </ThemedText>
        <View style={[styles.tag, { borderColor: edge }]}>
          <ThemedText style={[styles.tagText, { color: edge }]}>{tag}</ThemedText>
        </View>
      </View>
      <View style={styles.metrics}>
        <Metric k="One ticket" val={money(v.secondTicketPrice ?? offer.price?.total, v.currency ?? offer.price?.currency)} />
        <Metric k={`Companion pays${v.estimate ? ' (est.)' : ''}`} val={status === 'ineligible' ? '—' : money(v.companionTaxes, v.currency)} />
        <Metric k="You save" val={v.netSavings == null ? '—' : money(v.netSavings, v.currency)} highlight={theme.good} />
      </View>
    </View>
  );
}

function Metric({ k, val, highlight }: { k: string; val: string; highlight?: string }) {
  return (
    <View style={styles.metric}>
      <ThemedText type="eyebrow" themeColor="textSecondary">{k}</ThemedText>
      <ThemedText type="money" style={[styles.metricVal, highlight ? { color: highlight } : null]}>{val}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },
  flex1: { flex: 1 },
  rule: { height: StyleSheet.hairlineWidth, marginTop: Spacing.three },
  standfirst: { marginTop: Spacing.three },

  // form
  field: { gap: Spacing.two, marginTop: Spacing.three },
  row: { flexDirection: 'row', gap: Spacing.two },
  input: { minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.two + 2, fontSize: 16 },
  toggleRow: { flexDirection: 'row', gap: Spacing.two },
  toggle: { flex: 1, minHeight: 44, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing.two },
  cta: { minHeight: 48, marginTop: Spacing.four, borderRadius: Radius.sm, paddingVertical: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fdfbf5', fontWeight: '700', fontSize: 15.5 },

  // notices
  note: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, padding: Spacing.three, marginTop: Spacing.three },
  emptyNote: { marginTop: 0 },

  // results
  results: { marginTop: Spacing.four },
  resultsRule: { marginTop: 0 },
  resultsCount: { marginTop: Spacing.three, marginBottom: Spacing.three },
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },
  offer: { padding: Spacing.three },
  offerHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.two, flexWrap: 'wrap' },
  route: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  tag: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.two, paddingVertical: 3 },
  tagText: { fontSize: 10.5, lineHeight: 14, fontWeight: '700', letterSpacing: 0.7, textTransform: 'uppercase' },
  metrics: { flexDirection: 'row', gap: Spacing.four, marginTop: Spacing.three, flexWrap: 'wrap' },
  metric: { minWidth: 90 },
  metricVal: { marginTop: 2 },
  pressed: { opacity: 0.75 },
});
