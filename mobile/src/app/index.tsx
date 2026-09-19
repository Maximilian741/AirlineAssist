import AsyncStorage from '@react-native-async-storage/async-storage';
import { Href, Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { fetchWatches } from '@/lib/alerts';
import { deadlines, type Trip } from '@/lib/trips';

export default function HomeScreen() {
  const theme = useTheme();
  // "What needs you": unseen watchdog alerts + deadlines within 3 days, recomputed each time Home
  // comes into focus. The phone's stand-in for a badge until you open My Trips.
  const [needs, setNeeds] = useState(0);
  useFocusEffect(useCallback(() => {
    let alive = true;
    (async () => {
      try {
        const v = await AsyncStorage.getItem('ff-trips');
        const trips: Trip[] = v ? JSON.parse(v) : [];
        if (!Array.isArray(trips) || !trips.length) { if (alive) setNeeds(0); return; }
        const watches = await fetchWatches(trips.map((t) => t.id));
        let n = 0;
        for (const t of trips) {
          const w = watches[t.id];
          if (w) n += (w.alerts || []).filter((a) => !a.seen && !a.resolved && a.kind !== 'minor_change').length;
          n += deadlines(t).filter((d) => d.status !== 'expired' && d.daysLeft <= 3).length;
        }
        if (alive) setNeeds(n);
      } catch { if (alive) setNeeds(0); }
    })();
    return () => { alive = false; };
  }, []));
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + TopTabInset + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
      ]}>
      <View style={styles.inner}>
        {/* Masthead: the monogram and wordmark of the web app, set in the same serif. */}
        <View style={styles.masthead}>
          <View style={[styles.monogram, { backgroundColor: theme.brandDeep }]}>
            <ThemedText style={styles.monogramLetter}>F</ThemedText>
          </View>
          <ThemedText type="display">Fairfare</ThemedText>
        </View>
        <View style={[styles.rule, { backgroundColor: theme.line }]} />
        <ThemedText type="lede" themeColor="textSecondary" style={styles.tagline}>
          Cheap companion fares out of Helena — and the receipts to claim what you’re owed when a flight goes wrong.
        </ThemedText>

        {/* The visual block lives INSIDE the pressable: an anchor wrapper (expo-router Link on web)
            doesn't inherit a Pressable's layout, and a row that collapses to a column looks broken. */}
        <Link href="/crisis" asChild>
          <Pressable style={({ pressed }) => (pressed ? styles.pressed : null)}>
            <View style={[styles.crisis, { backgroundColor: theme.card, borderColor: theme.line, borderLeftColor: theme.bad }]}>
              <ThemedText type="eyebrow" style={{ color: theme.bad }}>At the airport right now</ThemedText>
              <ThemedText type="smallBold" style={styles.crisisLine}>
                Delayed, bumped, canceled, or a bag that didn’t come? Start here. <ThemedText type="smallBold" style={{ color: theme.bad }}>→</ThemedText>
              </ThemedText>
            </View>
          </Pressable>
        </Link>

        {/* An index, not a stack of floating cards: one sheet, hairline-ruled. */}
        <View style={[styles.index, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <IndexRow
            href="/owed"
            first
            title="What am I owed?"
            blurb="The exact amount, the rule behind it, and a demand letter ready to send."
          />
          <IndexRow
            href="/trips"
            title="My trips & deadlines"
            blurb={needs ? `${needs} thing${needs === 1 ? '' : 's'} need${needs === 1 ? 's' : ''} you — a watchdog alert or a claim window closing.` : 'Claims expire. Save a trip and every deadline counts down for you.'}
            badge={needs || undefined}
          />
          <IndexRow
            href="/moves"
            title="Money moves"
            blurb="What a fare really costs, the fees they bury, and how to pay less."
          />
          <IndexRow
            href="/rights"
            title="Know your rights"
            blurb="Refunds, bumping cash, delay rules — source-linked, and it works offline."
          />
          <IndexRow
            href="/search"
            title="Find companion deals"
            blurb="Where your Delta companion certificate saves the most out of Helena."
          />
        </View>

        <View style={[styles.rule, styles.footRule, { backgroundColor: theme.line }]} />
        <ThemedText type="small" themeColor="textSecondary" style={styles.mission}>
          Built for travelers, not off them: no ads, no selling your data, no airline kickbacks.
        </ThemedText>
      </View>
    </ScrollView>
  );
}

function IndexRow({ href, title, blurb, badge, first }: { href: Href; title: string; blurb: string; badge?: number; first?: boolean }) {
  const theme = useTheme();
  return (
    <Link href={href} asChild>
      <Pressable style={({ pressed }) => (pressed ? styles.pressed : null)}>
        <View style={[styles.row, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
          <View style={styles.rowText}>
            <View style={styles.rowTitleLine}>
              <ThemedText style={styles.rowTitle}>{title}</ThemedText>
              {badge ? (
                <View style={[styles.badge, { backgroundColor: theme.badBg, borderColor: theme.bad }]}>
                  <ThemedText style={[styles.badgeText, { color: theme.bad }]}>{badge}</ThemedText>
                </View>
              ) : null}
            </View>
            <ThemedText type="small" themeColor="textSecondary" style={styles.rowBlurb}>{blurb}</ThemedText>
          </View>
          <ThemedText style={[styles.arrow, { color: theme.textSecondary }]}>→</ThemedText>
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },
  masthead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two + 2 },
  monogram: { width: 38, height: 38, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  monogramLetter: { fontFamily: Fonts.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 23, lineHeight: 28, color: '#fdfbf5' },
  rule: { height: StyleSheet.hairlineWidth, marginTop: Spacing.three },
  footRule: { marginTop: Spacing.four },
  tagline: { marginTop: Spacing.three, marginBottom: Spacing.four },
  crisis: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three, marginBottom: Spacing.four },
  crisisLine: { marginTop: Spacing.one + 2, lineHeight: 20 },
  index: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  rowText: { flex: 1 },
  rowTitleLine: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  rowTitle: { fontFamily: Fonts.serif, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  rowBlurb: { marginTop: 2 },
  badge: { minWidth: 20, paddingHorizontal: 5, paddingVertical: 1, borderRadius: Radius.sm, borderWidth: StyleSheet.hairlineWidth, alignItems: 'center' },
  badgeText: { fontSize: 11.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  arrow: { fontSize: 17 },
  pressed: { opacity: 0.75 },
  mission: { marginTop: Spacing.three },
});
