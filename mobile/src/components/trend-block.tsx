/**
 * TrendBlock — the price verdict for one trip: Buy / Wait / Watch / Learning, the exact reason,
 * a summary line, a bar-strip sparkline (plain Views, no svg dep) and route-wide context.
 * Everything shown comes from GET /api/trend (see lib/trend.ts).
 */
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
        <View style={[styles.verdict, { borderColor: accent }]}>
          <ThemedText style={{ color: accent, fontWeight: '800', fontSize: 13.5, letterSpacing: 0.2 }}>{VERDICT_LABEL[v]}</ThemedText>
        </View>
        {t.n >= 2 ? <Spark points={t.points} color={theme.brand} /> : null}
        {t.n ? <ThemedText type="small" themeColor="textSecondary" style={{ flex: 1, fontSize: 12, fontVariant: ['tabular-nums'] }}>{trend.summary}</ThemedText> : null}
      </View>
      <ThemedText type="small" style={{ lineHeight: 19, marginTop: 6 }}>{t.reason}</ThemedText>
      {r && r.n >= 5 ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 5, lineHeight: 18, fontSize: 12.5 }}>
          {judged ? which + judged + ' · ' : ''}route low ${r.min} · typical ${r.median} · {r.n} fares recorded
        </ThemedText>
      ) : r && r.n ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 5, fontSize: 12.5 }}>Route history: {r.n} fare{r.n === 1 ? '' : 's'} recorded so far (route verdicts start at 5).</ThemedText>
      ) : null}
      {paidLine ? (
        <ThemedText type="small" style={{ marginTop: 7, lineHeight: 19, color: paidGood ? theme.good : theme.textSecondary, fontWeight: paidGood ? '700' : '400' }}>{paidLine}</ThemedText>
      ) : null}
    </ThemedView>
  );
}

/** Bar-strip sparkline: one thin bar per observation, height normalized to the series range. */
function Spark({ points, color }: { points: TrendPoint[]; color: string }) {
  const pts = points.slice(-24);
  const ys = pts.map((p) => p.price);
  const min = Math.min(...ys), max = Math.max(...ys);
  const span = max - min || 1;
  return (
    <View style={styles.spark} accessible accessibilityLabel={`Price trend, ${pts.length} points, low $${min}, high $${max}`}>
      {pts.map((p, i) => {
        const h = 4 + Math.round(((p.price - min) / span) * 20);
        const last = i === pts.length - 1;
        return <View key={p.day + i} style={{ width: 3, height: h, borderRadius: 1, backgroundColor: color, opacity: last ? 1 : 0.55 }} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderWidth: 1, borderLeftWidth: 3, borderRadius: 8, padding: 10, marginTop: 8 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  verdict: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 8, paddingVertical: 2 },
  spark: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, height: 24 },
});
