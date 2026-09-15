/**
 * "When they move your flight, you gain leverage" — the schedule-change lever, ported from the web.
 *
 * Airlines re-time flights weeks out, by an email most people skim. A big enough change is a federal
 * cash-refund right on any fare (14 CFR 260); smaller ones still unlock free changes by policy.
 * The refund is law; everything else is policy plus the agent, and the copy says so.
 *
 * Data: data/coc-full.ts COC_SCHEDULE (generated from the web decode; parity-tested).
 */
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { COC_SCHEDULE, type ScheduleTactic } from '@/data/coc-full';
import { useTheme } from '@/hooks/use-theme';

type Theme = ReturnType<typeof useTheme>;

export function ScheduleLever() {
  const theme = useTheme();
  const [open, setOpen] = useState<number | null>(null);
  const [whyOpen, setWhyOpen] = useState(false);
  const s = COC_SCHEDULE;

  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.lede}>{s.whatItIs}</ThemedText>

      <ThemedView type="card" style={[styles.card, { borderColor: theme.good, borderLeftColor: theme.good }]}>
        <ThemedText style={styles.cardTitle}>Your floor, by law</ThemedText>
        <ThemedText type="small" style={styles.body}>{s.dotBaseline}</ThemedText>
      </ThemedView>

      <Pressable onPress={() => setWhyOpen(!whyOpen)} accessibilityRole="button" accessibilityState={{ expanded: whyOpen }} style={styles.whyTap}>
        <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{whyOpen ? 'Hide why this works' : 'Why this works →'}</ThemedText>
      </Pressable>
      {whyOpen ? <ThemedText type="small" style={[styles.body, { marginBottom: 6 }]}>{s.whyItWorks}</ThemedText> : null}

      <ThemedText type="small" themeColor="textSecondary" style={styles.listHead}>WHAT TO DO WITH IT</ThemedText>
      {s.tactics.map((t, i) => (
        <Tactic key={t.name} t={t} open={open === i} onToggle={() => setOpen(open === i ? null : i)} theme={theme} />
      ))}

      <ThemedText type="small" themeColor="textSecondary" style={[styles.body, { marginTop: 10 }]}>
        The cash refund on a qualifying change is a firm federal right. Everything else here is airline policy plus the
        individual agent — ask for it as such, and it works far more often than people expect.
      </ThemedText>

      {s.sources.length ? (
        <View style={{ marginTop: 8 }}>
          {s.sources.map((src) => (
            <Pressable key={src.url} onPress={() => Linking.openURL(src.url).catch(() => {})} hitSlop={6} style={styles.srcTap}>
              <ThemedText type="small" style={{ color: theme.brand, fontSize: 12.5 }}>{src.label} →</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Tactic({ t, open, onToggle, theme }: { t: ScheduleTactic; open: boolean; onToggle: () => void; theme: Theme }) {
  const teaser = (t.worth || '').split('.')[0].slice(0, 60);
  return (
    <ThemedView type="card" style={[styles.row, { borderColor: open ? theme.brand : theme.line }]}>
      <Pressable onPress={onToggle} accessibilityRole="button" accessibilityState={{ expanded: open }} style={styles.rowHead}>
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontWeight: '700', fontSize: 14.5, lineHeight: 20 }}>{t.name}</ThemedText>
          {teaser ? <ThemedText type="small" style={{ color: theme.good, fontWeight: '700', fontSize: 12, marginTop: 2 }}>{teaser}</ThemedText> : null}
        </View>
        <ThemedText style={{ color: theme.textSecondary, fontSize: 18, paddingLeft: 8 }}>{open ? '−' : '+'}</ThemedText>
      </Pressable>
      {open ? (
        <View style={styles.rowBody}>
          <ThemedText type="small" style={styles.body}>{t.how}</ThemedText>
          {t.worth ? <ThemedText type="small" style={styles.body}><ThemedText type="smallBold">Worth: </ThemedText>{t.worth}</ThemedText> : null}
          {t.risk ? <ThemedText type="small" style={[styles.body, { color: theme.warn }]}><ThemedText type="smallBold" style={{ color: theme.warn }}>Reality check: </ThemedText>{t.risk}</ThemedText> : null}
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  lede: { lineHeight: 20, marginBottom: 6 },
  card: { borderWidth: 1, borderLeftWidth: 3, borderRadius: 8, padding: 12, marginTop: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  body: { lineHeight: 19, marginTop: 4 },
  whyTap: { minHeight: 44, justifyContent: 'center' },
  listHead: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginTop: 6, marginBottom: 2 },
  row: { borderWidth: 1, borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  rowHead: { flexDirection: 'row', alignItems: 'center', padding: 12, minHeight: 56 },
  rowBody: { paddingHorizontal: 12, paddingBottom: 12 },
  srcTap: { minHeight: 32, justifyContent: 'center' },
});
