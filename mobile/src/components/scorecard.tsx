/**
 * Airline scorecard — the U.S. DOT Air Travel Consumer Report figures, one row per airline,
 * sorted by complaints per 100,000 passengers (worst first). Same period, same metric, same
 * source for everyone; nulls render as "—", never as a guess. Data: src/data/scorecard.ts (generated).
 */
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
    <View style={{ marginBottom: 12 }}>
      <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: 8, lineHeight: 19 }}>
        Straight from the U.S. DOT Air Travel Consumer Report{r?.period ? ` — ${r.period}` : ''}. Sorted by complaints per 100,000 passengers, worst first. Green beats the industry line; red is worse.
      </ThemedText>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <ThemedView type="card" style={[styles.table, { borderColor: theme.line }]}>
          <View style={[styles.row, styles.head, { borderBottomColor: theme.line }]}>
            <ThemedText style={[styles.name, styles.th, { color: theme.textSecondary }]}>AIRLINE</ThemedText>
            {COLS.map((c) => (
              <View key={String(c.key)} style={styles.cell}>
                <ThemedText style={[styles.th, { color: theme.textSecondary }]}>{c.label.toUpperCase()}</ThemedText>
                {c.sub ? <ThemedText style={[styles.sub, { color: theme.textSecondary }]}>{c.sub}</ThemedText> : null}
              </View>
            ))}
          </View>
          {sorted.map((a) => (
            <View key={a.iata || a.name || ''} style={[styles.row, { borderBottomColor: theme.line }]}>
              <ThemedText style={styles.name} numberOfLines={1}>{a.name}{a.notes && /combined|merged|reported with/i.test(a.notes) ? ' †' : ''}</ThemedText>
              {COLS.map((c) => {
                const v = a[c.key] as number | null;
                return <ThemedText key={String(c.key)} style={[styles.cell, styles.num, { color: colorFor(v, c) }]}>{fmt(v, c.pct)}</ThemedText>;
              })}
            </View>
          ))}
          <View style={[styles.row, { borderTopWidth: 1, borderTopColor: theme.text }]}>
            <ThemedText style={[styles.name, { color: theme.textSecondary, fontStyle: 'italic' }]} numberOfLines={1}>All airlines</ThemedText>
            {COLS.map((c) => (
              <ThemedText key={String(c.key)} style={[styles.cell, styles.num, { color: theme.textSecondary, fontStyle: 'italic' }]}>{fmt(c.avg, c.pct)}</ThemedText>
            ))}
          </View>
        </ThemedView>
      </ScrollView>
      <View style={{ marginTop: 6, gap: 2 }}>
        {anyMerged ? <ThemedText type="small" themeColor="textSecondary">† reported combined with a merger partner.</ThemedText> : null}
        {r?.url ? (
          <Pressable onPress={() => Linking.openURL(r.url!)} hitSlop={6}>
            <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>Read the report →{r.publishedDate ? `  (published ${r.publishedDate})` : ''}</ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderRadius: 8, overflow: 'hidden', minWidth: 560 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, paddingHorizontal: 10, borderBottomWidth: 1 },
  head: { paddingVertical: 6 },
  name: { width: 150, fontWeight: '700', fontSize: 14 },
  th: { fontSize: 10.5, fontWeight: '800', letterSpacing: 0.4 },
  sub: { fontSize: 10 },
  cell: { width: 80, alignItems: 'flex-end' },
  num: { textAlign: 'right', fontVariant: ['tabular-nums'], fontSize: 13.5 },
});
