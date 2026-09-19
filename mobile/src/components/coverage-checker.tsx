/**
 * "Does EU law cover your flight?" — the gateway question, ported from the web checker.
 *
 * EU261 follows the FLIGHT, not your passport: depart the EU on any airline (Delta included) and
 * you are covered for up to €600 cash. Most Americans never find out. The asymmetry is the whole
 * point of the tool — arriving INTO the EU is only covered on an EU carrier — so the UI asks the
 * three questions that decide it and shows what each regime does and does not pay.
 *
 * Set like the rest of the app (constants/theme.ts): the questions are one bordered form sheet of
 * hairline-separated fields, the verdict is a serif headline, and the findings are one ruled sheet
 * with a thin spine — green where a law pays, brand where it is background, none where it doesn't.
 *
 * All rules come from lib/coverage.ts, which is parity-tested against the web module.
 */
import { useMemo, useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
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
  const hasFindings = res.covered.length + res.notCovered.length + res.alsoKnow.length > 0;

  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.lede}>
        EU261 is the strongest passenger-rights law in the world — and it follows the flight, not your
        nationality. Fly out of Europe on any airline, including Delta or United, and you are covered for up
        to €600 cash. Most Americans never find out.
      </ThemedText>

      {/* The four questions as one form sheet, not four loose blocks. */}
      <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <Picker first label="Flying from" options={REGIONS} value={from} onPick={(v) => setFrom(v as Region)} theme={theme} />
        <Picker label="Flying to" options={REGIONS} value={to} onPick={(v) => setTo(v as Region)} theme={theme} />
        <Picker label="On" options={CARRIERS} value={carrier} onPick={(v) => setCarrier(v as CarrierRegion)} theme={theme} />
        <Picker label="Distance" options={BANDS} value={band} onPick={(v) => setBand(v as Band)} theme={theme} />
      </View>

      <View style={[styles.rule, { backgroundColor: theme.line }]} />
      <ThemedText type="section" style={styles.headline}>{res.headline}</ThemedText>

      {hasFindings ? (
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
          {res.covered.map((c, i) => (
            <View
              key={'y' + i}
              style={[
                styles.entry,
                { borderLeftWidth: 3, borderLeftColor: theme.good },
                i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
              ]}>
              <View style={styles.entryHead}>
                <ThemedText style={[styles.regime, styles.regimeGrow]}>{c.regime}</ThemedText>
                {c.amount ? <ThemedText type="money" style={{ color: theme.good }}>{c.amount}</ThemedText> : null}
              </View>
              <ThemedText type="small" style={styles.body}>{c.why}</ThemedText>
              <ThemedText type="small" style={styles.body}><ThemedText type="smallBold">Pays: </ThemedText>{c.pays}</ThemedText>
              {c.deadline ? <ThemedText type="small" themeColor="textSecondary" style={styles.body}>{c.deadline}</ThemedText> : null}
              <Pressable
                onPress={() => Linking.openURL(c.url).catch(() => {})}
                hitSlop={8}
                style={({ pressed }) => [styles.linkTap, pressed ? styles.pressed : null]}>
                <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{c.rule} →</ThemedText>
              </Pressable>
            </View>
          ))}

          {res.notCovered.map((c, i) => (
            <View
              key={'n' + i}
              style={[
                styles.entry,
                (i > 0 || res.covered.length > 0) && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line },
              ]}>
              <ThemedText style={[styles.regime, { color: theme.textSecondary }]}>{c.regime} — not covered</ThemedText>
              <ThemedText type="small" style={styles.body}>{c.why}</ThemedText>
              {c.tip ? <ThemedText type="small" themeColor="textSecondary" style={styles.body}>{c.tip}</ThemedText> : null}
            </View>
          ))}

          {res.alsoKnow.map((k, i) => (
            <View
              key={'k' + i}
              style={[
                styles.entry,
                { borderLeftWidth: 3, borderLeftColor: theme.brand },
                (i > 0 || res.covered.length + res.notCovered.length > 0) && {
                  borderTopWidth: StyleSheet.hairlineWidth,
                  borderTopColor: theme.line,
                },
              ]}>
              <ThemedText style={styles.regime}>{k.title}</ThemedText>
              <ThemedText type="small" style={styles.body}>{k.detail}</ThemedText>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

/** The same bad day, priced in the U.S. and in Europe. One sheet, one scenario per ruled row. */
export function GapTable() {
  const theme = useTheme();
  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.lede}>
        The same disruption, side by side. This is what airlines lobby to keep out of U.S. law.
      </ThemedText>
      <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
        {GAPS.map((g, i) => (
          <View
            key={i}
            style={[styles.entry, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
            <ThemedText style={styles.regime}>{g.scenario}</ThemedText>
            <View style={styles.gapRow}>
              <ThemedText type="eyebrow" style={[styles.gapTag, { color: theme.bad }]}>U.S.</ThemedText>
              <ThemedText type="small" style={styles.gapText}>{g.us}</ThemedText>
            </View>
            <View style={styles.gapRow}>
              <ThemedText type="eyebrow" style={[styles.gapTag, { color: theme.good }]}>EU</ThemedText>
              <ThemedText type="small" style={styles.gapText}>{g.eu}</ThemedText>
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.note}>{g.note}</ThemedText>
          </View>
        ))}
      </View>
    </View>
  );
}

function Picker({ label, options, value, onPick, theme, first }: {
  label: string;
  options: { id: string; label: string; hint?: string }[];
  value: string;
  onPick: (v: string) => void;
  theme: Theme;
  first?: boolean;
}) {
  return (
    <View style={[styles.field, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
      <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.fieldLabel}>{label}</ThemedText>
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
              style={({ pressed }) => [
                styles.chip,
                { borderColor: on ? theme.brandDeep : theme.line, backgroundColor: on ? theme.backgroundSelected : 'transparent' },
                pressed ? styles.pressed : null,
              ]}>
              <ThemedText type="small" style={{ fontWeight: on ? '700' : '400' }}>{o.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lede: { marginBottom: Spacing.three },
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },

  // form
  field: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  fieldLabel: { marginBottom: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.three - 4,
    paddingVertical: Spacing.two + 2,
    minHeight: 44,
    justifyContent: 'center',
  },

  // verdict
  rule: { height: StyleSheet.hairlineWidth, marginTop: Spacing.four },
  headline: { marginTop: Spacing.three, marginBottom: Spacing.three },

  // findings
  entry: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  entryHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two + 2 },
  regime: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  regimeGrow: { flex: 1 }, // only inside the row that carries the amount
  body: { marginTop: Spacing.one + 1 },
  linkTap: { marginTop: Spacing.two + 2, minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: 0.75 },

  // the U.S. / EU comparison
  gapRow: { flexDirection: 'row', gap: Spacing.two + 2, marginTop: Spacing.two, alignItems: 'flex-start' },
  gapTag: { width: 40, paddingTop: 4 },
  gapText: { flex: 1 },
  note: { marginTop: Spacing.two },
});
