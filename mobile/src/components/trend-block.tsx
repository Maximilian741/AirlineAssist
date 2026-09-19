/**
 * TrendBlock — the price verdict for one trip: Buy / Wait / Watch / Learning, the exact reason,
 * a summary line, a bar-strip sparkline (plain Views, no svg dep) and route-wide context.
 * Everything shown comes from GET /api/trend (see lib/trend.ts).
 *
 * Set as a quiet bordered block with the verdict carried by a rail down its margin and a tracked
 * label, not a coloured pill. The sparkline is ink on paper, sitting on a hairline baseline, with
 * the judged fare — the last bar — struck in the verdict's accent.
 */
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchTrend, judgeAgainstRoute, VERDICT_LABEL, type Trend, type TrendPoint } from '@/lib/trend';
import { fmt } from '@/lib/trips';

type Props = {
  origin?: string; destination: string; departDate?: string; returnDate?: string;
  /** What the user paid — judged against the last recorded fare and the route. */
  paid?: number | null;
  /** A fare on screen (search results) — judged against the route only. */
  price?: number | null;
  /** Bump to refetch (e.g. after a manual fare check). */
  refreshKey?: number;
};

export function useTrend(q: Props): Trend | null | undefined {
  const [trend, setTrend] = useState<Trend | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    setTrend(undefined);
    fetchTrend(q).then((t) => { if (alive) setTrend(t); });
    return () => { alive = false; };
  }, [q.origin, q.destination, q.departDate, q.returnDate, q.refreshKey]);
  return trend;
}

export function TrendBlock(props: Props) {
  const theme = useTheme();
  const trend = useTrend(props);
  if (!trend) return null; // still loading, no server, or nothing recorded
  const t = trend.trip, r = trend.route;
  if (!t.n && !(r && r.n)) return null;

  const v = t.verdict || 'learn';
  const accent = v === 'buy' ? theme.good : v === 'wait' ? theme.brand : v === 'watch' ? theme.warn : theme.textSecondary;
  const judgedPrice = props.price ?? props.paid ?? t.latest;
  const judged = judgeAgainstRoute(judgedPrice, r);
  const which = props.price != null ? `This fare ($${Math.round(props.price)}) is ` : props.paid != null ? `What you paid ($${Math.round(props.paid)}) is ` : t.latest != null ? `The last fare we saw ($${Math.round(t.latest)}) is ` : '';
  const today = new Date().toISOString().slice(0, 10);

  let paidLine: string | null = null;
  let paidGood = false;
  if (props.paid && t.n && t.latest != null) {
    const diff = Math.round(props.paid - t.latest);
    const when = t.latestDay === today ? "Today's fare" : `The fare we last saw (${fmt(t.latestDay || '')})`;
    if (diff > 0) { paidLine = `${when} is $${diff} under what you paid — on a no-change-fee fare that difference comes back as credit when you rebook.`; paidGood = true; }
    else if (diff < 0) paidLine = `You paid $${Math.abs(diff)} less than ${t.latestDay === today ? "today's fare" : 'the last fare we saw'} — you bought well.`;
  }

  return (
    <ThemedView type="card" style={[styles.block, { borderColor: theme.line, borderLeftColor: accent }]}>
      <View style={styles.top}>
        <ThemedText type="eyebrow" style={{ color: accent }}>{VERDICT_LABEL[v]}</ThemedText>
        {t.n >= 2 ? <Spark points={t.points} color={theme.text} accent={accent} baseline={theme.line} /> : null}
        {t.n ? <ThemedText type="small" themeColor="textSecondary" style={styles.summary}>{trend.summary}</ThemedText> : null}
      </View>
      <View style={[styles.rule, { backgroundColor: theme.line }]} />
      <ThemedText type="small">{t.reason}</ThemedText>
      {r && r.n >= 5 ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>
          {judged ? which + judged + ' · ' : ''}route low ${r.min} · typical ${r.median} · {r.n} fares recorded
        </ThemedText>
      ) : r && r.n ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.note}>Route history: {r.n} fare{r.n === 1 ? '' : 's'} recorded so far (route verdicts start at 5).</ThemedText>
      ) : null}
      {paidLine ? (
        <ThemedText type="small" style={[styles.note, { color: paidGood ? theme.good : theme.textSecondary, fontWeight: paidGood ? '700' : '400' }]}>{paidLine}</ThemedText>
      ) : null}
    </ThemedView>
  );
}

/** Bar-strip sparkline: one thin bar per observation, height normalized to the series range. */
function Spark({ points, color, accent, baseline }: { points: TrendPoint[]; color: string; accent: string; baseline: string }) {
  const pts = points.slice(-24);
  const ys = pts.map((p) => p.price);
  const min = Math.min(...ys), max = Math.max(...ys);
  const span = max - min || 1;
  return (
    <View style={[styles.spark, { borderBottomColor: baseline }]} accessible accessibilityLabel={`Price trend, ${pts.length} points, low $${min}, high $${max}`}>
      {pts.map((p, i) => {
        const h = 4 + Math.round(((p.price - min) / span) * 20);
        const last = i === pts.length - 1;
        return <View key={p.day + i} style={{ width: 3, height: h, backgroundColor: last ? accent : color, opacity: last ? 1 : 0.32 }} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, paddingVertical: Spacing.three, paddingRight: Spacing.three, paddingLeft: Spacing.three - 3, marginTop: Spacing.two },
  top: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2, flexWrap: 'wrap' },
  summary: { flex: 1, minWidth: 150, fontVariant: ['tabular-nums'] },
  rule: { height: StyleSheet.hairlineWidth, marginVertical: Spacing.two + 2 },
  note: { marginTop: Spacing.two },
  // Ink bars standing on a hairline baseline — a chart axis, not a widget.
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 24, borderBottomWidth: StyleSheet.hairlineWidth },
});
