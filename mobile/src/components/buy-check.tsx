/**
 * The Buy Check — pre-purchase report, mobile UI over lib/buycheck.ts.
 */
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { FEES } from '@/data/money';
import { useTheme } from '@/hooks/use-theme';
import { runBuyCheck } from '@/lib/buycheck';
import { REGIONS, type Region } from '@/lib/coverage';

type Theme = ReturnType<typeof useTheme>;

const shortAirline = (n: string) => n.replace(/\s+(Air Lines|Airlines|Airways|Air)( Co\.)?$/i, '').replace(/\s*\(.*$/, '');
const shortRegion = (id: Region) => ({ eu: 'EU', uk: 'UK', ch: 'Switzerland', ca: 'Canada', us: 'U.S.', other: 'Elsewhere' }[id]);

export function BuyCheckSection({ theme }: { theme: Theme }) {
  const [airlineIdx, setAirlineIdx] = useState(0);
  const [fare, setFare] = useState('');
  const [basic, setBasic] = useState(false);
  const [from, setFrom] = useState<Region>('us');
  const [to, setTo] = useState<Region>('us');
  const [carry, setCarry] = useState(true);
  const [bag, setBag] = useState(false);
  const [seat, setSeat] = useState(true);
  const [change, setChange] = useState(false);
  const [klass, setKlass] = useState('');
  const [tier, setTier] = useState<'platinum' | 'reserve'>('platinum');

  const isDelta = /^DL$/i.test(FEES[airlineIdx]?.iata || '');
  const report = runBuyCheck({
    airlineIndex: airlineIdx,
    fare: Number(fare) || 0,
    fareType: basic ? 'basic' : 'main',
    needs: { carryOn: carry, bag, seat, change },
    fromRegion: from,
    toRegion: to,
    carrierRegion: 'us',
    band: ['eu', 'uk', 'ch'].includes(to) || ['eu', 'uk', 'ch'].includes(from) ? 'long' : 'medium',
    bookingClass: isDelta ? klass : '',
    tier,
  });

  const input = [styles.input, { backgroundColor: theme.card, borderColor: theme.line, color: theme.text }];

  return (
    <View>
      <View style={[styles.sectionHead, { borderTopColor: theme.line }]}>
        <ThemedText type="section">Before you buy: run the check</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
        Airlines price the fare; the rest they keep quiet. Thirty seconds here shows the real total, whether you're protected if it goes wrong, and the leverage you keep after paying.
      </ThemedText>

      <View style={[styles.form, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
        <ChipRow label="Airline" theme={theme} items={FEES.map((f) => shortAirline(f.airline))} value={airlineIdx} onPick={setAirlineIdx} />
        <View style={styles.fareRow}>
          <ThemedText type="money" style={{ color: theme.textSecondary }}>$</ThemedText>
          <TextInput value={fare} onChangeText={setFare} keyboardType="numeric" placeholder="Fare you see (e.g. 240)" placeholderTextColor={theme.textSecondary} style={[...input, { flex: 1 }]} />
        </View>
        <View style={[styles.segment, { borderColor: theme.line }]}>
          {([['main', 'Main / regular'], ['basic', 'Basic economy']] as const).map(([v, l], i) => {
            const on = basic === (v === 'basic');
            return (
              <Pressable
                key={v}
                onPress={() => setBasic(v === 'basic')}
                style={({ pressed }) => [
                  styles.segmentBtn,
                  i > 0 && { borderLeftWidth: StyleSheet.hairlineWidth, borderLeftColor: theme.line },
                  on && { backgroundColor: theme.backgroundSelected },
                  pressed && styles.pressed,
                ]}>
                <ThemedText type="small" style={{ fontWeight: on ? '700' : '400', color: on ? theme.text : theme.textSecondary }}>{l}</ThemedText>
              </Pressable>
            );
          })}
        </View>
        <ChipRow label="Flying from" theme={theme} items={REGIONS.map((r) => shortRegion(r.id)!)} value={REGIONS.findIndex((r) => r.id === from)} onPick={(i) => setFrom(REGIONS[i].id)} />
        <ChipRow label="Flying to" theme={theme} items={REGIONS.map((r) => shortRegion(r.id)!)} value={REGIONS.findIndex((r) => r.id === to)} onPick={(i) => setTo(REGIONS[i].id)} />
        <View style={styles.checks}>
          <Toggle on={carry} label="Carry-on" onPress={() => setCarry(!carry)} theme={theme} />
          <Toggle on={bag} label="Checked bag" onPress={() => setBag(!bag)} theme={theme} />
          <Toggle on={seat} label="Pick my seat" onPress={() => setSeat(!seat)} theme={theme} />
          <Toggle on={change} label="Might change it" onPress={() => setChange(!change)} theme={theme} />
        </View>
        {isDelta ? (
          <View style={styles.fareRow}>
            <TextInput value={klass} onChangeText={(v) => setKlass(v.slice(0, 1))} autoCapitalize="characters" placeholder="Class (optional, e.g. T)" placeholderTextColor={theme.textSecondary} style={[...input, { flex: 1 }]} />
            <Pressable
              onPress={() => setTier(tier === 'platinum' ? 'reserve' : 'platinum')}
              style={({ pressed }) => [styles.tierBtn, { borderColor: theme.line, backgroundColor: theme.card }, pressed && styles.pressed]}>
              <ThemedText type="small" style={{ fontWeight: '700', color: theme.brand }}>{tier === 'platinum' ? 'Platinum' : 'Reserve'}</ThemedText>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={[styles.report, { backgroundColor: theme.card, borderColor: theme.line }]}>
        {report.sections.map((s, i) => {
          const edge = s.level === 'good' ? theme.good : s.level === 'warn' ? theme.warn : theme.line;
          return (
            <View key={i} style={[styles.sec, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
              <View style={styles.secHeadRow}>
                <View style={[styles.tick, { backgroundColor: edge }]} />
                <ThemedText style={styles.secTitle}>{s.title}</ThemedText>
              </View>
              {s.headline ? <ThemedText type="smallBold" style={styles.headline}>{s.headline}</ThemedText> : null}
              {s.lines.map((l, k) => <ThemedText key={k} type="small" style={styles.line}>{l}</ThemedText>)}
              {s.warns.map((w, k) => (
                <View key={k} style={[styles.note, { backgroundColor: theme.backgroundElement, borderColor: theme.line, borderLeftColor: theme.warn }]}>
                  <ThemedText type="small" style={styles.noteText}>{w}</ThemedText>
                </View>
              ))}
              {s.gem ? (
                <View key="gem" style={[styles.note, { backgroundColor: theme.backgroundElement, borderColor: theme.line, borderLeftColor: theme.good }]}>
                  <ThemedText type="small" style={styles.noteText}>Worth knowing: {s.gem}</ThemedText>
                </View>
              ) : null}
              {s.kind === 'record' ? (
                <Pressable key="rep" onPress={() => s.reportUrl && Linking.openURL(s.reportUrl)} hitSlop={6} disabled={!s.reportUrl} style={styles.reportTap}>
                  <ThemedText type="small" themeColor="textSecondary">U.S. DOT Air Travel Consumer Report{s.period ? `, ${s.period}` : ''}.{s.reportUrl ? '  Read the report →' : ''}</ThemedText>
                </Pressable>
              ) : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}

function ChipRow({ label, items, value, onPick, theme }: { label: string; items: string[]; value: number; onPick: (i: number) => void; theme: Theme }) {
  return (
    <View style={styles.chipBlock}>
      <ThemedText type="eyebrow" style={[styles.chipLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipTray}>
        {items.map((it, i) => {
          const on = i === value;
          return (
            <Pressable
              key={i}
              onPress={() => onPick(i)}
              style={({ pressed }) => [styles.chip, { borderColor: on ? theme.brandDeep : theme.line, backgroundColor: on ? theme.backgroundSelected : 'transparent' }, pressed && styles.pressed]}>
              <ThemedText type="small" style={{ fontWeight: on ? '700' : '400', color: on ? theme.text : theme.textSecondary }}>{it}</ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
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

const styles = StyleSheet.create({
  sectionHead: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: Spacing.three, marginTop: Spacing.five, marginBottom: Spacing.one },
  sub: { marginBottom: Spacing.three, lineHeight: 20 },

  // ---- the instrument: one recessed panel holding the whole form ----
  form: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, padding: Spacing.three },
  chipBlock: { marginTop: Spacing.two },
  chipLabel: { marginBottom: Spacing.one + 1 },
  chipTray: { gap: Spacing.two, paddingVertical: Spacing.half },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, minHeight: 44, justifyContent: 'center' },
  fareRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.three },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.two + 2, minHeight: 44, fontSize: 16 },
  segment: { flexDirection: 'row', borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, overflow: 'hidden', marginTop: Spacing.two },
  segmentBtn: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing.two },
  tierBtn: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, minHeight: 44, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  checks: { flexDirection: 'row', flexWrap: 'wrap', columnGap: Spacing.four, rowGap: Spacing.half, marginTop: Spacing.two },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, minHeight: 44 },
  box: { width: 20, height: 20, borderRadius: Radius.sm, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center', justifyContent: 'center' },
  boxMark: { color: '#fdfbf5', fontSize: 12, fontWeight: '700', lineHeight: 16 },

  // ---- the report: one sheet, hairline-separated findings ----
  report: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.three },
  sec: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  secHeadRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two },
  tick: { width: 2, height: 18, marginTop: 3, borderRadius: 1 },
  secTitle: { fontFamily: Fonts.serif, fontSize: 16, lineHeight: 22, fontWeight: '700', flexShrink: 1 },
  headline: { marginTop: Spacing.one, marginBottom: Spacing.one },
  line: { lineHeight: 20, marginTop: Spacing.half },
  note: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 2, borderRadius: Radius.sm, padding: Spacing.two + 2, marginTop: Spacing.two },
  noteText: { lineHeight: 20 },
  reportTap: { minHeight: 44, justifyContent: 'center', marginTop: Spacing.one },

  pressed: { opacity: 0.75 },
});
