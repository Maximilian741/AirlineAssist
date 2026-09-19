import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BuyCheckSection } from '@/components/buy-check';
import { FareClassDecoder } from '@/components/fare-class-decoder';
import { ScheduleLever } from '@/components/schedule-lever';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
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
        <ThemedText type="display">The stuff airlines don’t advertise</ThemedText>
        <View style={[styles.rule, { backgroundColor: theme.line }]} />
        <ThemedText type="lede" themeColor="textSecondary" style={styles.lede}>
          Real ways to pay less and claw money back — the exact steps, the dollar amount, and the honest catch.
        </ThemedText>

        <BuyCheckSection theme={theme} />

        <View style={[styles.sectionHead, { borderTopColor: theme.line }]}>
          <ThemedText type="section">When they move your flight</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>A schedule change you didn’t ask for can be worth a free rebooking — or your money back, even on a nonrefundable ticket.</ThemedText>
        <ScheduleLever />

        <View style={[styles.sectionHead, { borderTopColor: theme.line }]}>
          <ThemedText type="section">The playbook</ThemedText>
        </View>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
          {MOVES.map((m, i) => (
            <MoveCard key={m.id} m={m} theme={theme} first={i === 0} />
          ))}
        </View>

        <View style={[styles.sectionHead, { borderTopColor: theme.line }]}>
          <ThemedText type="section">True price calculator</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>The “cheap” fare usually isn’t. See what it really costs once you add what you need.</ThemedText>
        <TruePrice theme={theme} />

        <View style={[styles.sectionHead, { borderTopColor: theme.line }]}>
          <ThemedText type="section">The fees they bury</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>The upfront fee-disclosure rule got struck down in 2026, so airlines don’t have to show these while you shop.</ThemedText>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
          {FEES.map((f, i) => (
            <FeeCard key={f.iata} f={f} theme={theme} first={i === 0} />
          ))}
        </View>

        <View style={[styles.sectionHead, { borderTopColor: theme.line }]}>
          <ThemedText type="section">Decode the letter on your ticket</ThemedText>
        </View>
        <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>One letter decides whether your companion certificate works.</ThemedText>
        <FareClassDecoder />

        <View style={[styles.sectionHead, { borderTopColor: theme.line }]}>
          <ThemedText type="section">Money you already have</ThemedText>
        </View>
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
    <View style={styles.sources}>
      <ThemedText type="eyebrow" style={{ color: theme.textSecondary }}>Sources: </ThemedText>
      <View style={styles.sourcesRow}>
        {sources.map((s, i) => (
          <Pressable key={i} onPress={() => openBrowserAsync(s.url).catch(() => {})} hitSlop={8} style={styles.sourceTap}>
            <ThemedText type="small" style={{ color: theme.brand, textDecorationLine: 'underline' }}>{s.label}{i < sources.length - 1 ? '   ' : ''}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function MoveCard({ m, theme, first }: { m: Move; theme: Theme; first?: boolean }) {
  const [open, setOpen] = useState(false);
  const risk = m.riskLevel || 'low';
  const edge = risk === 'high' ? theme.bad : risk === 'medium' ? theme.warn : theme.good;
  const riskBg = risk === 'high' ? theme.badBg : risk === 'medium' ? theme.warnBg : theme.goodBg;
  const riskLabel = risk === 'high' ? 'High risk' : risk === 'medium' ? 'Some risk' : 'Low risk';
  return (
    <View style={[styles.move, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
      <View style={styles.moveHead}>
        <ThemedText style={styles.moveTitle}>{m.title}</ThemedText>
        <View style={[styles.badge, { backgroundColor: riskBg, borderColor: edge }]}>
          <ThemedText type="eyebrow" style={{ color: edge }}>{riskLabel}</ThemedText>
        </View>
      </View>
      <ThemedText type="smallBold" style={styles.tldr}>
        {m.tldr}{m.saves ? <ThemedText style={[styles.saves, { color: theme.good }]}>{'  ' + m.saves}</ThemedText> : null}
      </ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.moveBody}>{m.whatItIs}</ThemedText>
      <Pressable onPress={() => setOpen((v) => !v)} hitSlop={10} style={styles.disclose}>
        <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{open ? '▾ ' : '▸ '}Exact steps & the catch</ThemedText>
      </Pressable>
      {open ? (
        <View style={[styles.detail, { borderTopColor: theme.line }]}>
          {m.steps && m.steps.length ? (
            <View style={styles.steps}>
              {m.steps.map((s, i) => (
                <ThemedText key={i} type="small" style={styles.step}>{i + 1}. {s}</ThemedText>
              ))}
            </View>
          ) : null}
          {m.theCatch ? <Row k="The catch" v={m.theCatch} theme={theme} /> : null}
          {m.legal ? <Row k="Legal?" v={m.legal} theme={theme} /> : null}
          <Sources sources={m.sources} theme={theme} />
        </View>
      ) : null}
    </View>
  );
}

function Row({ k, v, theme }: { k: string; v: string; theme: Theme }) {
  return (
    <View style={styles.kv}>
      <ThemedText type="eyebrow" style={{ color: theme.textSecondary }}>{k.toUpperCase()}</ThemedText>
      <ThemedText type="small" style={styles.kvText}>{v}</ThemedText>
    </View>
  );
}

function Toggle({ on, label, onPress, theme }: { on: boolean; label: string; onPress: () => void; theme: Theme }) {
  return (
    <Pressable onPress={onPress} style={styles.toggleRow} hitSlop={6}>
      <View style={[styles.box, { borderColor: on ? theme.brandDeep : theme.line, backgroundColor: on ? theme.brandDeep : 'transparent' }]}>
        {on ? <ThemedText style={styles.boxMark}>✓</ThemedText> : null}
      </View>
      <ThemedText type="small" style={{ color: on ? theme.text : theme.textSecondary }}>{label}</ThemedText>
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
    <View style={[styles.tool, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipTray}>
        {FEES.map((x, i) => (
          <Pressable
            key={x.iata}
            onPress={() => setIdx(i)}
            style={({ pressed }) => [styles.chip, { borderColor: idx === i ? theme.brandDeep : theme.line, backgroundColor: idx === i ? theme.backgroundSelected : 'transparent' }, pressed && styles.pressed]}>
            <ThemedText type="small" style={{ fontWeight: idx === i ? '700' : '400', color: idx === i ? theme.text : theme.textSecondary }}>{x.airline.replace(/\s+(Air Lines|Airlines|Air)$/, '')}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.fareRow}>
        <ThemedText type="money" style={{ color: theme.textSecondary }}>$</ThemedText>
        <TextInput value={fare} onChangeText={setFare} keyboardType="numeric" placeholder="Fare you see (e.g. 129)" placeholderTextColor={theme.textSecondary} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.line, color: theme.text, flex: 1 }]} />
      </View>
      <View style={[styles.segment, { borderColor: theme.line }]}>
        {(['basic', 'main'] as const).map((t, i) => {
          const on = (t === 'basic') === basic;
          return (
            <Pressable
              key={t}
              onPress={() => setBasic(t === 'basic')}
              style={({ pressed }) => [
                styles.segmentBtn,
                i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: theme.line },
                on && { backgroundColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="small" style={{ fontWeight: on ? '700' : '400', color: on ? theme.text : theme.textSecondary }}>{t === 'basic' ? 'Basic economy' : 'Main / regular'}</ThemedText>
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
      <View style={[styles.totalBlock, { borderTopColor: theme.line }]}>
        <ThemedText type="lede">
          {fareN ? 'That ' + money(fareN) + ' fare can run up to ' : 'Real total: up to '}
          <ThemedText type="money" style={[styles.totalMoney, { color: add > 0 ? theme.bad : theme.text }]}>{money(total)}</ThemedText>
          {add > 0 ? <ThemedText type="lede"> — {money(add)} in add-ons they don’t show you upfront.</ThemedText> : null}
        </ThemedText>
        {lines.map((l, i) => (
          <ThemedText key={i} type="small" themeColor="textSecondary" style={styles.breakdown}>· {l[0]}: +{money(l[1])}</ThemedText>
        ))}
      </View>
      {warns.length ? (
        <View style={[styles.note, { backgroundColor: theme.card, borderColor: theme.line, borderLeftColor: theme.warn }]}>
          {warns.map((w, i) => <ThemedText key={i} type="small" style={styles.noteText}>{w}</ThemedText>)}
        </View>
      ) : null}
    </View>
  );
}

function FeeCard({ f, theme, first }: { f: Fee; theme: Theme; first?: boolean }) {
  const cell = (k: string, v?: string) => (
    <View style={styles.feeCell}>
      <ThemedText type="eyebrow" style={{ color: theme.textSecondary }}>{k}</ThemedText>
      <ThemedText type="small" style={styles.feeValue}>{v || '—'}</ThemedText>
    </View>
  );
  return (
    <View style={[styles.feeRow, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
      <ThemedText style={styles.feeAirline}>{f.airline}</ThemedText>
      <View style={styles.feeGrid}>
        {cell('1st bag', f.checkedBag1)}
        {cell('Carry-on', f.carryOn)}
        {cell('Seat', f.seat)}
        {cell('Change', f.changeFee)}
      </View>
      {f.basicEconomy ? <ThemedText type="small" themeColor="textSecondary" style={styles.feeBasic}>Basic strips: {f.basicEconomy}</ThemedText> : null}
    </View>
  );
}

function CardChecker({ theme }: { theme: Theme }) {
  const [idx, setIdx] = useState<number | null>(null);
  const c: CardProtection | null = idx != null ? CARD_PROTECTIONS[idx] : null;
  const cell = (k: string, v?: string) =>
    v ? (
      <View style={styles.feeCell}>
        <ThemedText type="eyebrow" style={{ color: theme.textSecondary }}>{k}</ThemedText>
        <ThemedText type="small" style={styles.feeValue}>{v}</ThemedText>
      </View>
    ) : null;
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipTray}>
        {CARD_PROTECTIONS.map((x, i) => (
          <Pressable
            key={x.card}
            onPress={() => setIdx(i)}
            style={({ pressed }) => [styles.chip, { borderColor: idx === i ? theme.brandDeep : theme.line, backgroundColor: idx === i ? theme.backgroundSelected : 'transparent' }, pressed && styles.pressed]}>
            <ThemedText type="small" style={{ fontWeight: idx === i ? '700' : '400', color: idx === i ? theme.text : theme.textSecondary }}>{x.card}</ThemedText>
          </Pressable>
        ))}
      </ScrollView>
      {c ? (
        <View style={[styles.detailSheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <View style={styles.feeGrid}>
            {cell('Flight delay', c.tripDelay)}
            {cell('Trip cancel', c.tripCancellation)}
            {cell('Bag delayed', c.baggageDelay)}
            {cell('Bag lost', c.baggageLoss)}
          </View>
          {c.howToClaim ? <ThemedText type="small" style={styles.claimLine}><ThemedText type="smallBold">How to claim: </ThemedText>{c.howToClaim}</ThemedText> : null}
          <View style={[styles.note, { backgroundColor: theme.backgroundElement, borderColor: theme.line, borderLeftColor: theme.warn }]}>
            <ThemedText type="small" style={styles.noteText}>The catch: {c.catch || 'You must pay for the trip with this card.'}</ThemedText>
          </View>
          <Sources sources={c.sources} theme={theme} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },

  // ---- editorial rhythm: rule, serif heading, deck, content ----
  rule: { height: StyleSheet.hairlineWidth, marginTop: Spacing.three },
  lede: { marginTop: Spacing.three },
  sectionHead: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three, marginTop: Spacing.five, marginBottom: Spacing.one },
  sub: { marginBottom: Spacing.three, lineHeight: 20 },

  // ---- one sheet, hairline-separated rows ----
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },

  // ---- the playbook ----
  move: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  moveHead: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.two },
  moveTitle: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 23, fontWeight: '700', flexShrink: 1 },
  badge: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.one + 2, paddingVertical: 2 },
  tldr: { marginTop: Spacing.two - 2 },
  saves: { fontSize: 14, lineHeight: 21, fontWeight: '700', fontVariant: ['tabular-nums'] },
  moveBody: { marginTop: Spacing.two - 2, lineHeight: 20 },
  disclose: { minHeight: 44, justifyContent: 'center' },
  detail: { marginTop: Spacing.two, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  steps: { marginBottom: Spacing.two },
  step: { marginBottom: Spacing.one, lineHeight: 20 },
  kv: { marginBottom: Spacing.two },
  kvText: { lineHeight: 20, marginTop: 1 },

  // ---- sources ----
  sources: { marginTop: Spacing.two },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center' },
  sourceTap: { minHeight: 32, justifyContent: 'center' },

  // ---- true price calculator ----
  tool: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, padding: Spacing.three },
  chipTray: { gap: Spacing.two, paddingVertical: Spacing.half },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, minHeight: 44, justifyContent: 'center' },
  fareRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.two + 2, minHeight: 44, fontSize: 16 },
  segment: { flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.two },
  segmentBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.two },
  checks: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.four, rowGap: Spacing.half, marginTop: Spacing.two },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44 },
  box: { width: 20, height: 20, borderRadius: Radius.sm, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  boxMark: { color: '#fdfbf5', fontSize: 12, fontWeight: '700', lineHeight: 16 },
  totalBlock: { marginTop: Spacing.three, paddingTop: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth },
  totalMoney: { fontSize: 21, lineHeight: 26 },
  breakdown: { marginTop: Spacing.half, fontVariant: ['tabular-nums'] },
  note: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 2, borderRadius: Radius.sm, padding: Spacing.two + 2, marginTop: Spacing.two, gap: Spacing.one },
  noteText: { lineHeight: 20 },

  // ---- the fee table ----
  feeRow: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  feeAirline: { fontFamily: Fonts.serif, fontSize: 16, lineHeight: 22, fontWeight: '700', marginBottom: Spacing.two },
  feeGrid: { flexDirection: 'row', flexWrap: 'wrap', rowGap: Spacing.two, columnGap: Spacing.two },
  feeCell: { width: '47%', flexGrow: 1, backgroundColor: 'transparent' },
  feeValue: { fontWeight: '700', fontVariant: ['tabular-nums'], marginTop: 1 },
  feeBasic: { marginTop: Spacing.two },

  // ---- card protections ----
  detailSheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, padding: Spacing.three, marginTop: Spacing.two },
  claimLine: { marginTop: Spacing.two, lineHeight: 20 },

  pressed: { opacity: 0.75 },
});
