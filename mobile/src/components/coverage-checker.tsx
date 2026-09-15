/**
 * "Does EU law cover your flight?" — the gateway question, ported from the web checker.
 *
 * EU261 follows the FLIGHT, not your passport: depart the EU on any airline (Delta included) and
 * you are covered for up to €600 cash. Most Americans never find out. The asymmetry is the whole
 * point of the tool — arriving INTO the EU is only covered on an EU carrier — so the UI asks the
 * three questions that decide it and shows what each regime does and does not pay.
 *
 * All rules come from lib/coverage.ts, which is parity-tested against the web module.
 */
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { CARRIERS, check, GAPS, REGIONS, type Band, type CarrierRegion, type Region } from '@/lib/coverage';

type Theme = ReturnType<typeof useTheme>;

const BANDS: { id: Band; label: string }[] = [
  { id: 'short', label: 'Short — under ~930 mi' },
  { id: 'medium', label: 'Medium — ~930–2,175 mi' },
  { id: 'long', label: 'Long — over ~2,175 mi (Europe ⇄ U.S.)' },
];

export function CoverageChecker() {
  const theme = useTheme();
  // Default to the case that matters most: an American flying home from Europe on a U.S. airline.
  const [from, setFrom] = useState<Region>('eu');
  const [to, setTo] = useState<Region>('us');
  const [carrier, setCarrier] = useState<CarrierRegion>('us');
  const [band, setBand] = useState<Band>('long');

  const res = useMemo(() => check({ from, to, carrier, band }), [from, to, carrier, band]);

  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.lede}>
        EU261 is the strongest passenger-rights law in the world — and it follows the flight, not your
        nationality. Fly out of Europe on any airline, including Delta or United, and you are covered for up
        to €600 cash. Most Americans never find out.
      </ThemedText>

      <Picker label="Flying from" options={REGIONS} value={from} onPick={(v) => setFrom(v as Region)} theme={theme} />
      <Picker label="Flying to" options={REGIONS} value={to} onPick={(v) => setTo(v as Region)} theme={theme} />
      <Picker label="On" options={CARRIERS} value={carrier} onPick={(v) => setCarrier(v as CarrierRegion)} theme={theme} />
      <Picker label="Distance" options={BANDS} value={band} onPick={(v) => setBand(v as Band)} theme={theme} />

      <ThemedText style={[styles.headline, { color: res.covered.length ? theme.good : theme.text }]}>
        {res.headline}
      </ThemedText>

      {res.covered.map((c, i) => (
        <ThemedView key={'y' + i} type="card" style={[styles.card, { borderColor: theme.good, borderLeftColor: theme.good }]}>
          <View style={styles.cardHead}>
            <ThemedText style={styles.regime}>{c.regime}</ThemedText>
            {c.amount ? <ThemedText style={{ color: theme.good, fontWeight: '800', fontSize: 15 }}>{c.amount}</ThemedText> : null}
          </View>
          <ThemedText type="small" style={styles.body}>{c.why}</ThemedText>
          <ThemedText type="small" style={styles.body}><ThemedText type="smallBold">Pays: </ThemedText>{c.pays}</ThemedText>
          {c.deadline ? <ThemedText type="small" themeColor="textSecondary" style={styles.body}>{c.deadline}</ThemedText> : null}
          <Pressable onPress={() => Linking.openURL(c.url).catch(() => {})} hitSlop={8} style={styles.linkTap}>
            <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{c.rule} →</ThemedText>
          </Pressable>
        </ThemedView>
      ))}

      {res.notCovered.map((c, i) => (
        <ThemedView key={'n' + i} type="card" style={[styles.card, { borderColor: theme.line, borderLeftColor: theme.line }]}>
          <ThemedText style={[styles.regime, { color: theme.textSecondary }]}>{c.regime} — not covered</ThemedText>
          <ThemedText type="small" style={styles.body}>{c.why}</ThemedText>
          {c.tip ? <ThemedText type="small" themeColor="textSecondary" style={styles.body}>{c.tip}</ThemedText> : null}
        </ThemedView>
      ))}

      {res.alsoKnow.map((k, i) => (
        <ThemedView key={'k' + i} type="card" style={[styles.card, { borderColor: theme.line, borderLeftColor: theme.brand }]}>
          <ThemedText style={styles.regime}>{k.title}</ThemedText>
          <ThemedText type="small" style={styles.body}>{k.detail}</ThemedText>
        </ThemedView>
      ))}
    </View>
  );
}

/** The same bad day, priced in the U.S. and in Europe. */
export function GapTable() {
  const theme = useTheme();
  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.lede}>
        The same disruption, side by side. This is what airlines lobby to keep out of U.S. law.
      </ThemedText>
      {GAPS.map((g, i) => (
        <ThemedView key={i} type="card" style={[styles.card, { borderColor: theme.line, borderLeftColor: theme.warn }]}>
          <ThemedText style={styles.regime}>{g.scenario}</ThemedText>
          <View style={styles.gapRow}>
            <ThemedText type="small" style={[styles.gapTag, { color: theme.bad }]}>U.S.</ThemedText>
            <ThemedText type="small" style={styles.gapText}>{g.us}</ThemedText>
          </View>
          <View style={styles.gapRow}>
            <ThemedText type="small" style={[styles.gapTag, { color: theme.good }]}>EU</ThemedText>
            <ThemedText type="small" style={styles.gapText}>{g.eu}</ThemedText>
          </View>
          <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6, lineHeight: 18, fontSize: 12.5 }}>{g.note}</ThemedText>
        </ThemedView>
      ))}
    </View>
  );
}

function Picker({ label, options, value, onPick, theme }: {
  label: string;
  options: { id: string; label: string; hint?: string }[];
  value: string;
  onPick: (v: string) => void;
  theme: Theme;
}) {
  return (
    <View style={{ marginBottom: 10 }}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.pickerLabel}>{label.toUpperCase()}</ThemedText>
      <View style={styles.chips}>
        {options.map((o) => {
          const on = o.id === value;
          return (
            <Pressable
              key={o.id}
              onPress={() => onPick(o.id)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${label}: ${o.label}`}
              style={[styles.chip, { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.backgroundSelected : theme.card }]}>
              <ThemedText type="small" style={{ fontWeight: on ? '800' : '500' }}>{o.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lede: { lineHeight: 20, marginBottom: 12 },
  pickerLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, minHeight: 44, justifyContent: 'center' },
  headline: { fontSize: 16, fontWeight: '800', lineHeight: 22, marginTop: 10, marginBottom: 4 },
  card: { borderWidth: 1, borderLeftWidth: 3, borderRadius: 8, padding: 12, marginTop: 8 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 4 },
  regime: { fontSize: 15, fontWeight: '800' },
  body: { lineHeight: 19, marginTop: 3 },
  linkTap: { marginTop: 8, minHeight: 36, justifyContent: 'center' },
  gapRow: { flexDirection: 'row', gap: 8, marginTop: 5, alignItems: 'flex-start' },
  gapTag: { width: 34, fontWeight: '800', fontSize: 12 },
  gapText: { flex: 1, lineHeight: 19 },
});
