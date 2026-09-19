/**
 * "When they move your flight, you gain leverage" — the schedule-change lever, ported from the web.
 *
 * Airlines re-time flights weeks out, by an email most people skim. A big enough change is a federal
 * cash-refund right on any fare (14 CFR 260); smaller ones still unlock free changes by policy.
 * The refund is law; everything else is policy plus the agent, and the copy says so.
 *
 * Data: data/coc-full.ts COC_SCHEDULE (generated from the web decode; parity-tested).
 *
 * Looks: the editorial system in constants/theme.ts — one accent block for the legal floor, then the
 * tactics as an index in a single hairline-ruled sheet.
 */
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
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

      {/* The one thing here that is law, not policy — so it gets the accent rule. */}
      <View style={[styles.floor, { backgroundColor: theme.card, borderColor: theme.line, borderLeftColor: theme.good }]}>
        <ThemedText type="eyebrow" style={{ color: theme.good }}>Your floor, by law</ThemedText>
        <ThemedText type="small" style={styles.body}>{s.dotBaseline}</ThemedText>
      </View>

      <Pressable
        onPress={() => setWhyOpen(!whyOpen)}
        accessibilityRole="button"
        accessibilityState={{ expanded: whyOpen }}
        style={({ pressed }) => [styles.whyTap, pressed ? styles.pressed : null]}>
        <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{whyOpen ? 'Hide why this works' : 'Why this works →'}</ThemedText>
      </Pressable>
      {whyOpen ? <ThemedText type="small" style={[styles.body, { marginBottom: Spacing.two }]}>{s.whyItWorks}</ThemedText> : null}

      <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.listHead}>WHAT TO DO WITH IT</ThemedText>
      <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
        {s.tactics.map((t, i) => (
          <Tactic key={t.name} t={t} first={i === 0} open={open === i} onToggle={() => setOpen(open === i ? null : i)} theme={theme} />
        ))}
      </View>

      <ThemedText type="small" themeColor="textSecondary" style={styles.coda}>
        The cash refund on a qualifying change is a firm federal right. Everything else here is airline policy plus the
        individual agent — ask for it as such, and it works far more often than people expect.
      </ThemedText>

      {s.sources.length ? (
        <View style={styles.sources}>
          {s.sources.map((src) => (
            <Pressable
              key={src.url}
              onPress={() => Linking.openURL(src.url).catch(() => {})}
              hitSlop={6}
              style={({ pressed }) => [styles.srcTap, pressed ? styles.pressed : null]}>
              <ThemedText type="small" style={{ color: theme.brand }}>{src.label} →</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Tactic({ t, open, onToggle, theme, first }: { t: ScheduleTactic; open: boolean; onToggle: () => void; theme: Theme; first?: boolean }) {
  const teaser = (t.worth || '').split('.')[0].slice(0, 60);
  return (
    <View style={first ? null : { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.rowHead, pressed ? styles.pressed : null]}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.rowTitle}>{t.name}</ThemedText>
          {teaser ? <ThemedText type="small" themeColor="textSecondary" style={styles.teaser}>{teaser}</ThemedText> : null}
        </View>
        <ThemedText style={[styles.toggle, { color: theme.textSecondary }]}>{open ? '−' : '+'}</ThemedText>
      </Pressable>
      {open ? (
        <View style={styles.rowBody}>
          <ThemedText type="small" style={styles.body}>{t.how}</ThemedText>
          {t.worth ? <ThemedText type="small" style={styles.body}><ThemedText type="smallBold">Worth: </ThemedText>{t.worth}</ThemedText> : null}
          {t.risk ? <ThemedText type="small" style={styles.body}><ThemedText type="smallBold" style={{ color: theme.bad }}>Reality check: </ThemedText>{t.risk}</ThemedText> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lede: { marginBottom: Spacing.three },
  floor: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  body: { marginTop: Spacing.one + 2 },
  whyTap: { minHeight: 44, justifyContent: 'center', marginTop: Spacing.two },
  listHead: { marginTop: Spacing.three, marginBottom: Spacing.two },

  // one sheet, hairline-separated rows
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },
  rowHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.three, paddingHorizontal: Spacing.three, minHeight: 56 },
  rowTitle: { fontFamily: Fonts.serif, fontSize: 16.5, lineHeight: 22, fontWeight: '700' },
  teaser: { marginTop: 2 },
  toggle: { fontSize: 19, paddingLeft: Spacing.two },
  rowBody: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },

  coda: { marginTop: Spacing.three },
  sources: { marginTop: Spacing.two },
  srcTap: { minHeight: 36, justifyContent: 'center' },
  pressed: { opacity: 0.75 },
});
