import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuyCheckSection } from '@/components/buy-check';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { CARD_PROTECTIONS, FEES, MOVES, feeNum, type CardProtection, type Fee, type Move, type MoneySource } from '@/data/money';
import { useTheme } from '@/hooks/use-theme';

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');

export default function MovesScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[styles.content, { paddingTop: insets.top + TopTabInset + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.four }]}>
      <View style={styles.inner}>
        <View style={styles.hero}>
          <ThemedText style={styles.heroEmoji}>💰</ThemedText>
          <ThemedText style={styles.heroTitle}>The stuff airlines don’t advertise</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.heroText}>
            Real ways to pay less and claw money back — the exact steps, the dollar amount, and the honest catch.
          </ThemedText>
        </View>

        <BuyCheckSection theme={theme} />

        <ThemedText style={[styles.h, { marginTop: Spacing.five }]} themeColor="brandDeep">🃏 The playbook</ThemedText>
        {MOVES.map((m) => (
          <MoveCard key={m.id} m={m} theme={theme} />
        ))}

        <ThemedText style={[styles.h, { marginTop: Spacing.five }]} themeColor="brandDeep">🧮 True price calculator</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>The “cheap” fare usually isn’t. See what it really costs once you add what you need.</ThemedText>
        <TruePrice theme={theme} />

        <ThemedText style={[styles.h, { marginTop: Spacing.five }]} themeColor="brandDeep">🧾 The fees they bury</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>The upfront fee-disclosure rule got struck down in 2026, so airlines don’t have to show these while you shop.</ThemedText>
        {FEES.map((f) => (
          <FeeCard key={f.iata} f={f} theme={theme} />
        ))}

        <ThemedText style={[styles.h, { marginTop: Spacing.five }]} themeColor="brandDeep">💳 Money you already have</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>Most people never claim the trip insurance built into their credit card. Check yours.</ThemedText>
        <CardChecker theme={theme} />
      </View>
    </ScrollView>
  );
}

type Theme = ReturnType<typeof useTheme>;

function Sources({ sources, theme }: { sources?: MoneySource[]; theme: Theme }) {
  if (!sources || !sources.length) return null;
  return (
    <View style={styles.sourcesRow}>
      <ThemedText type="small" themeColor="textSecondary">Sources: </ThemedText>
      {sources.map((s, i) => (
        <Pressable key={i} onPress={() => openBrowserAsync(s.url).catch(() => {})} hitSlop={8} style={{ minHeight: 32, justifyContent: 'center' }}>
          <ThemedText type="small" style={{ color: theme.brand, textDecorationLine: 'underline' }}>{s.label}{i < sources.length - 1 ? '   ' : ''}</ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

function MoveCard({ m, theme }: { m: Move; theme: Theme }) {
  const [open, setOpen] = useState(false);
  const risk = m.riskLevel || 'low';
  const edge = risk === 'high' ? theme.bad : risk === 'medium' ? theme.warn : theme.good;
  const riskBg = risk === 'high' ? theme.badBg : risk === 'medium' ? theme.warnBg : theme.goodBg;
  const riskLabel = risk === 'high' ? 'High risk' : risk === 'medium' ? 'Some risk' : 'Low risk';
  return (
    <ThemedView type="card" style={[styles.card, { borderColor: theme.line, borderLeftColor: edge }]}>
      <View style={styles.cardHead}>
        <ThemedText style={styles.cardTitle}>{m.title}</ThemedText>
        <View style={[styles.pill, { backgroundColor: riskBg }]}><ThemedText style={[styles.pillText, { color: edge }]}>{riskLabel}</ThemedText></View>
      </View>
      <ThemedText type="small" style={{ marginTop: 6, fontWeight: '700' }}>
        💵 {m.tldr}{m.saves ? <ThemedText type="small" style={{ color: theme.good, fontWeight: '800' }}>{'  ' + m.saves}</ThemedText> : null}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6, lineHeight: 20 }}>{m.whatItIs}</ThemedText>
      <Pressable onPress={() => setOpen((v) => !v)} hitSlop={10} style={{ minHeight: 44, justifyContent: 'center' }}>
        <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{open ? '▾ ' : '▸ '}Exact steps & the catch</ThemedText>
      </Pressable>
      {open ? (
        <View style={[styles.detail, { borderTopColor: theme.line }]}>
          {m.steps && m.steps.length ? (
            <View style={{ marginBottom: Spacing.two }}>
              {m.steps.map((s, i) => (
                <ThemedText key={i} type="small" style={{ marginBottom: 4, lineHeight: 20 }}>{i + 1}. {s}</ThemedText>
              ))}
            </View>
          ) : null}
          {m.theCatch ? <Row k="The catch" v={m.theCatch} theme={theme} /> : null}
          {m.legal ? <Row k="Legal?" v={m.legal} theme={theme} /> : null}
          <Sources sources={m.sources} theme={theme} />
        </View>
      ) : null}
    </ThemedView>
  );
}

function Row({ k, v, theme }: { k: string; v: string; theme: Theme }) {
  return (
    <View style={{ marginBottom: Spacing.two }}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontWeight: '800', fontSize: 12 }}>{k.toUpperCase()}</ThemedText>
      <ThemedText type="small" style={{ lineHeight: 20 }}>{v}</ThemedText>
    </View>
  );
}

function Toggle({ on, label, onPress, theme }: { on: boolean; label: string; onPress: () => void; theme: Theme }) {
  return (
    <Pressable onPress={onPress} style={styles.toggleRow} hitSlop={6}>
      <View style={[styles.box, { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.brand : 'transparent' }]}>
        {on ? <ThemedText style={{ color: '#fff', fontSize: 13, fontWeight: '900', lineHeight: 16 }}>✓</ThemedText> : null}
      </View>
      <ThemedText type="small" style={{ fontWeight: '600' }}>{label}</ThemedText>
    </Pressable>
  );
}

function TruePrice({ theme }: { theme: Theme }) {
  const [idx, setIdx] = useState(0);
  const [fare, setFare] = useState('');
  const [basic, setBasic] = useState(true);
  const [carry, setCarry] = useState(true);
  const [bag, setBag] = useState(false);
  const [seat, setSeat] = useState(true);
  const [change, setChange] = useState(false);

  const f = FEES[idx];
  const fareN = Number(fare) || 0;
  const lines: [string, number][] = [];
  let add = 0;
  if (bag) { const b = feeNum(f.checkedBag1); add += b; lines.push(['Checked bag', b]); }
  if (carry) { const c = feeNum(f.carryOn); if (c > 0) { add += c; lines.push(['Carry-on', c]); } }
  if (seat) { const s = feeNum(f.seat); if (s > 0) { add += s; lines.push(['Seat selection', s]); } }
  const total = fareN + add;
  const warns: string[] = [];
  if (basic) {
    if (f.basicEconomy) warns.push('Basic economy: ' + f.basicEconomy);
    if (change) warns.push('Basic economy usually can’t be changed — if plans shift, you lose the whole fare.');
  } else if (change && f.changeFee) {
    warns.push('Changes on this fare: ' + f.changeFee);
  }

  return (
    <ThemedView type="backgroundElement" style={[styles.tool, { borderColor: theme.brand }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {FEES.map((x, i) => (
          <Pressable key={x.iata} onPress={() => setIdx(i)} style={[styles.chip, { borderColor: idx === i ? theme.brand : theme.line, backgroundColor: idx === i ? theme.backgroundSelected : theme.card }]}>
            <ThemedText type="small" style={{ fontWeight: '700', color: idx === i ? theme.brandDeep : theme.textSecondary }}>{x.airline.replace(/\s+(Air Lines|Airlines|Air)$/, '')}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.fareRow}>
        <ThemedText style={{ fontSize: 20, fontWeight: '800' }}>$</ThemedText>
        <TextInput value={fare} onChangeText={setFare} keyboardType="numeric" placeholder="Fare you see (e.g. 129)" placeholderTextColor={theme.textSecondary} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.line, color: theme.text, flex: 1 }]} />
      </View>
      <View style={styles.typeRow}>
        {(['basic', 'main'] as const).map((t) => {
          const on = (t === 'basic') === basic;
          return (
            <Pressable key={t} onPress={() => setBasic(t === 'basic')} style={[styles.typeBtn, { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.backgroundSelected : theme.card }]}>
              <ThemedText type="small" style={{ fontWeight: '700', color: on ? theme.brandDeep : theme.textSecondary }}>{t === 'basic' ? 'Basic economy' : 'Main / regular'}</ThemedText>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.checks}>
        <Toggle on={carry} label="Carry-on" onPress={() => setCarry((v) => !v)} theme={theme} />
        <Toggle on={bag} label="Check a bag" onPress={() => setBag((v) => !v)} theme={theme} />
        <Toggle on={seat} label="Pick my seat" onPress={() => setSeat((v) => !v)} theme={theme} />
        <Toggle on={change} label="Might change it" onPress={() => setChange((v) => !v)} theme={theme} />
      </View>
      <ThemedText style={{ fontSize: 17, fontWeight: '700', marginTop: Spacing.three }}>
        {fareN ? 'That ' + money(fareN) + ' fare can run up to ' : 'Real total: up to '}
        <ThemedText style={{ color: theme.good, fontSize: 20, fontWeight: '900' }}>{money(total)}</ThemedText>
        {add > 0 ? <ThemedText style={{ fontSize: 17, fontWeight: '700' }}> — {money(add)} in add-ons they don’t show you upfront.</ThemedText> : null}
      </ThemedText>
      {lines.map((l, i) => (
        <ThemedText key={i} type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>• {l[0]}: +{money(l[1])}</ThemedText>
      ))}
      {warns.length ? (
        <ThemedView type="card" style={[styles.warn, { borderColor: theme.warn }]}>
          {warns.map((w, i) => <ThemedText key={i} type="small" style={{ lineHeight: 19 }}>⚠ {w}</ThemedText>)}
        </ThemedView>
      ) : null}
    </ThemedView>
  );
}

function FeeCard({ f, theme }: { f: Fee; theme: Theme }) {
  const cell = (k: string, v?: string) => (
    <View style={styles.feeCell}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, fontWeight: '800' }}>{k}</ThemedText>
      <ThemedText type="small" style={{ fontWeight: '700' }}>{v || '—'}</ThemedText>
    </View>
  );
  return (
    <ThemedView type="card" style={[styles.card, { borderColor: theme.line }]}>
      <ThemedText style={{ fontWeight: '800', fontSize: 15, marginBottom: 6 }}>{f.airline}</ThemedText>
      <View style={styles.feeGrid}>
        {cell('1st bag', f.checkedBag1)}
        {cell('Carry-on', f.carryOn)}
        {cell('Seat', f.seat)}
        {cell('Change', f.changeFee)}
      </View>
      {f.basicEconomy ? <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>Basic strips: {f.basicEconomy}</ThemedText> : null}
    </ThemedView>
  );
}

function CardChecker({ theme }: { theme: Theme }) {
  const [idx, setIdx] = useState<number | null>(null);
  const c: CardProtection | null = idx != null ? CARD_PROTECTIONS[idx] : null;
  const cell = (k: string, v?: string) =>
    v ? (
      <View style={styles.feeCell}>
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 11, fontWeight: '800' }}>{k}</ThemedText>
        <ThemedText type="small" style={{ fontWeight: '700' }}>{v}</ThemedText>
      </View>
    ) : null;
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
        {CARD_PROTECTIONS.map((x, i) => (
          <Pressable key={x.card} onPress={() => setIdx(i)} style={[styles.chip, { borderColor: idx === i ? theme.brand : theme.line, backgroundColor: idx === i ? theme.backgroundSelected : theme.card }]}>
            <ThemedText type="small" style={{ fontWeight: '700', color: idx === i ? theme.brandDeep : theme.textSecondary }}>{x.card}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      {c ? (
        <ThemedView type="card" style={[styles.card, { borderColor: theme.line, marginTop: Spacing.two }]}>
          <View style={styles.feeGrid}>
            {cell('Flight delay', c.tripDelay)}
            {cell('Trip cancel', c.tripCancellation)}
            {cell('Bag delayed', c.baggageDelay)}
            {cell('Bag lost', c.baggageLoss)}
          </View>
          {c.howToClaim ? <ThemedText type="small" style={{ marginTop: 8 }}><ThemedText type="smallBold">How to claim: </ThemedText>{c.howToClaim}</ThemedText> : null}
          <ThemedView type="card" style={[styles.warn, { borderColor: theme.warn }]}><ThemedText type="small">⚠ The catch: {c.catch || 'You must pay for the trip with this card.'}</ThemedText></ThemedView>
          <Sources sources={c.sources} theme={theme} />
        </ThemedView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },
  hero: { alignItems: 'center', paddingVertical: Spacing.three, gap: 4 },
  heroEmoji: { fontSize: 40 },
  heroTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  heroText: { textAlign: 'center', maxWidth: 520, marginTop: 4 },
  h: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sub: { marginBottom: Spacing.three, lineHeight: 20 },
  card: { borderWidth: 1, borderLeftWidth: 5, borderRadius: 13, padding: 14, marginBottom: 11 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  cardTitle: { fontWeight: '800', fontSize: 16, flexShrink: 1 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: '800' },
  detail: { marginTop: 10, paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: 4 },
  tool: { borderWidth: 1.5, borderRadius: 14, padding: 14 },
  fareRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.three },
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.two },
  typeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  checks: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: Spacing.three },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 32 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  warn: { borderWidth: 1, borderRadius: 10, padding: 11, marginTop: 10, gap: 3 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 },
  feeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  feeCell: { width: '47%', flexGrow: 1, backgroundColor: 'transparent' },
});
