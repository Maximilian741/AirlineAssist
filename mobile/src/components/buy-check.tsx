/**
 * The Buy Check — pre-purchase report, mobile UI over lib/buycheck.ts.
 */
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
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
      <ThemedText style={styles.h}>Before you buy: run the check</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.sub}>
        Airlines price the fare; the rest they keep quiet. Thirty seconds here shows the real total, whether you're protected if it goes wrong, and the leverage you keep after paying.
      </ThemedText>

      <ChipRow label="Airline" theme={theme} items={FEES.map((f) => shortAirline(f.airline))} value={airlineIdx} onPick={setAirlineIdx} />
      <View style={styles.fareRow}>
        <ThemedText style={{ fontSize: 20, fontWeight: '800' }}>$</ThemedText>
        <TextInput value={fare} onChangeText={setFare} keyboardType="numeric" placeholder="Fare you see (e.g. 240)" placeholderTextColor={theme.textSecondary} style={[...input, { flex: 1 }]} />
      </View>
      <View style={styles.typeRow}>
        {([['main', 'Main / regular'], ['basic', 'Basic economy']] as const).map(([v, l]) => {
          const on = basic === (v === 'basic');
          return (
            <Pressable key={v} onPress={() => setBasic(v === 'basic')} style={[styles.typeBtn, { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.backgroundSelected : theme.card }]}>
              <ThemedText type="small" style={{ fontWeight: '700', color: on ? theme.brandDeep : theme.textSecondary }}>{l}</ThemedText>
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
          <Pressable onPress={() => setTier(tier === 'platinum' ? 'reserve' : 'platinum')} style={[styles.typeBtn, { borderColor: theme.line, backgroundColor: theme.card, flex: 0, paddingHorizontal: 14 }]}>
            <ThemedText type="small" style={{ fontWeight: '700' }}>{tier === 'platinum' ? 'Platinum' : 'Reserve'}</ThemedText>
          </Pressable>
        </View>
      ) : null}

      {report.sections.map((s, i) => {
        const edge = s.level === 'good' ? theme.good : s.level === 'warn' ? theme.warn : theme.brand;
        return (
          <ThemedView key={i} type="card" style={[styles.sec, { borderColor: theme.line, borderLeftColor: edge }]}>
            <ThemedText style={styles.secTitle}>{s.title}</ThemedText>
            {s.headline ? <ThemedText type="small" style={{ fontWeight: '700', marginBottom: 4 }}>{s.headline}</ThemedText> : null}
            {s.lines.map((l, k) => <ThemedText key={k} type="small" style={{ lineHeight: 20, marginBottom: 3 }}>{l}</ThemedText>)}
            {s.warns.map((w, k) => (
              <ThemedView key={k} type="backgroundElement" style={[styles.warnBox, { borderColor: theme.warn }]}>
                <ThemedText type="small" style={{ lineHeight: 20 }}>{w}</ThemedText>
              </ThemedView>
            ))}
            {s.gem ? (
              <ThemedView key="gem" style={[styles.warnBox, { borderColor: theme.good, backgroundColor: theme.goodBg }]}>
                <ThemedText type="small" style={{ lineHeight: 20 }}>Worth knowing: {s.gem}</ThemedText>
              </ThemedView>
            ) : null}
            {s.kind === 'record' ? (
              <Pressable key="rep" onPress={() => s.reportUrl && Linking.openURL(s.reportUrl)} hitSlop={6} disabled={!s.reportUrl}>
                <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4 }}>U.S. DOT Air Travel Consumer Report{s.period ? `, ${s.period}` : ''}.{s.reportUrl ? '  Read the report →' : ''}</ThemedText>
              </Pressable>
            ) : null}
          </ThemedView>
        );
      })}
    </View>
  );
}

function ChipRow({ label, items, value, onPick, theme }: { label: string; items: string[]; value: number; onPick: (i: number) => void; theme: Theme }) {
  return (
    <View style={{ marginTop: Spacing.two }}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontWeight: '700', fontSize: 12, marginBottom: 5 }}>{label}</ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 7, paddingVertical: 2 }}>
        {items.map((it, i) => {
          const on = i === value;
          return (
            <Pressable key={i} onPress={() => onPick(i)} style={[styles.chip, { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.backgroundSelected : theme.card }]}>
              <ThemedText type="small" style={{ fontWeight: '700', color: on ? theme.brandDeep : theme.textSecondary }}>{it}</ThemedText>
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
      <View style={[styles.box, { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.brand : 'transparent' }]}>
        {on ? <ThemedText style={{ color: '#fff', fontSize: 13, fontWeight: '900', lineHeight: 16 }}>✓</ThemedText> : null}
      </View>
      <ThemedText type="small" style={{ fontWeight: '600' }}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  h: { fontSize: 18, fontWeight: '800', marginBottom: 4 },
  sub: { marginBottom: Spacing.two, lineHeight: 20 },
  fareRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: Spacing.two },
  input: { borderWidth: 1.5, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.two },
  typeBtn: { flex: 1, borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  checks: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: Spacing.three },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 7, minHeight: 32 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 8 },
  sec: { borderWidth: 1, borderLeftWidth: 4, borderRadius: 10, padding: 13, marginTop: Spacing.two },
  secTitle: { fontWeight: '800', fontSize: 14.5, marginBottom: 5 },
  warnBox: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 7 },
});
