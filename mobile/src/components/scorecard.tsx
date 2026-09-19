/**
 * Airline scorecard — the U.S. DOT Air Travel Consumer Report figures, one row per airline,
 * sorted by complaints per 100,000 passengers (worst first). Same period, same metric, same
 * source for everyone; nulls render as "—", never as a guess. Data: src/data/scorecard.ts (generated).
 *
 * Set like a printed table (constants/theme.ts): hairline rules, a recessed header of small-caps
 * labels, names in the serif, figures in tabular numerals, and a ruled industry line at the foot.
 * The only colour is the verdict against that line — green better, oxblood worse.
 */
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { SCORECARD, SCORECARD_REPORT, type ScorecardAirline } from '@/data/scorecard';
import { useTheme } from '@/hooks/use-theme';

type Col = { key: keyof ScorecardAirline; label: string; sub?: string; pct?: boolean; lowerBetter: boolean; avg: number | null };

const fmt = (v: unknown, pct?: boolean) => (v == null ? '—' : pct ? `${Number(v).toFixed(1)}%` : Number(v).toFixed(2));

export function Scorecard() {
  const theme = useTheme();
  const rows = SCORECARD.filter((a) => !a.defunct && [a.onTimePct, a.cancelledPct, a.mishandledBagsRate, a.involuntaryDBPer10k, a.complaintsPer100k].some((v) => v != null));
  if (!rows.length) return null;
  const ind = SCORECARD_REPORT?.industry;
  const COLS: Col[] = [
    { key: 'onTimePct', label: 'On time', pct: true, lowerBetter: false, avg: ind?.onTimePct ?? null },
    { key: 'cancelledPct', label: 'Cancelled', pct: true, lowerBetter: true, avg: ind?.cancelledPct ?? null },
    { key: 'mishandledBagsRate', label: 'Bags', sub: 'per 100', lowerBetter: true, avg: ind?.mishandledBagsRate ?? null },
    { key: 'involuntaryDBPer10k', label: 'Bumped', sub: 'per 10k', lowerBetter: true, avg: ind?.involuntaryDBPer10k ?? null },
    { key: 'complaintsPer100k', label: 'Complaints', sub: 'per 100k', lowerBetter: true, avg: ind?.complaintsPer100k ?? null },
  ];
  const sorted = rows.slice().sort((a, b) => (b.complaintsPer100k ?? -1) - (a.complaintsPer100k ?? -1));
  const colorFor = (v: number | null, c: Col) => {
    if (v == null || c.avg == null) return theme.text;
    const good = c.lowerBetter ? v <= c.avg : v >= c.avg;
    return good ? theme.good : theme.bad;
  };
  const r = SCORECARD_REPORT;
  const anyMerged = rows.some((a) => a.notes && /combined|merged|reported with/i.test(a.notes));
  return (
    <View style={{ marginBottom: Spacing.three }}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.lede}>
        Straight from the U.S. DOT Air Travel Consumer Report{r?.period ? ` — ${r.period}` : ''}. Sorted by complaints per 100,000 passengers, worst first. Green beats the industry line; red is worse.
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={[styles.table, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <View style={[styles.row, styles.head, { backgroundColor: theme.backgroundElement, borderBottomColor: theme.line }]}>
            <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.headName}>AIRLINE</ThemedText>
            {COLS.map((c) => (
              <View key={String(c.key)} style={styles.cell}>
                <ThemedText type="eyebrow" themeColor="textSecondary">{c.label.toUpperCase()}</ThemedText>
                {c.sub ? <ThemedText style={[styles.sub, { color: theme.textSecondary }]}>{c.sub}</ThemedText> : null}
              </View>
            ))}
          </View>
          {sorted.map((a, i) => (
            <View
              key={a.iata || a.name || ''}
              style={[styles.row, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
              <ThemedText style={styles.name} numberOfLines={1}>{a.name}{a.notes && /combined|merged|reported with/i.test(a.notes) ? ' †' : ''}</ThemedText>
              {COLS.map((c) => {
                const v = a[c.key] as number | null;
                return <ThemedText key={String(c.key)} style={[styles.cell, styles.num, { color: colorFor(v, c) }]}>{fmt(v, c.pct)}</ThemedText>;
              })}
            </View>
          ))}
          {/* The industry line the colours are measured against — ruled off, like a total. */}
          <View style={[styles.row, styles.foot, { borderTopColor: theme.line, backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={[styles.name, styles.footText, { color: theme.textSecondary }]} numberOfLines={1}>All airlines</ThemedText>
            {COLS.map((c) => (
              <ThemedText key={String(c.key)} style={[styles.cell, styles.num, styles.footText, { color: theme.textSecondary }]}>{fmt(c.avg, c.pct)}</ThemedText>
            ))}
          </View>
        </View>
      </ScrollView>
      <View style={styles.notes}>
        {anyMerged ? <ThemedText type="small" themeColor="textSecondary">† reported combined with a merger partner.</ThemedText> : null}
        {r?.url ? (
          <Pressable
            onPress={() => Linking.openURL(r.url!)}
            hitSlop={6}
            style={({ pressed }) => [styles.linkTap, pressed ? styles.pressed : null]}>
            <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>Read the report →{r.publishedDate ? `  (published ${r.publishedDate})` : ''}</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lede: { marginBottom: Spacing.two },
  table: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden', minWidth: 560 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.two + 2, paddingHorizontal: Spacing.three - 4 },
  head: { paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  headName: { width: 150 },
  foot: { borderTopWidth: 1.5 },
  footText: { fontStyle: 'italic' },
  name: { width: 150, paddingRight: Spacing.two, fontFamily: Fonts.serif, fontSize: 14.5, lineHeight: 20, fontWeight: '700' },
  sub: { fontSize: 10.5, lineHeight: 14 },
  cell: { width: 80, alignItems: 'flex-end' },
  num: { textAlign: 'right', fontVariant: ['tabular-nums'], fontSize: 13.5, lineHeight: 20, fontWeight: '600' },
  notes: { marginTop: Spacing.two, gap: Spacing.half },
  linkTap: { minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: 0.75 },
});
