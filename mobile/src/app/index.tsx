import AsyncStorage from '@react-native-async-storage/async-storage';
import { Href, Link, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
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
        { paddingTop: insets.top + TopTabInset + Spacing.five, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
      ]}>
      <View style={styles.inner}>
        <View style={[styles.mark, { backgroundColor: theme.brand }]}>
          <ThemedText style={styles.markText}>✈</ThemedText>
        </View>
        <ThemedText style={styles.brandTitle}>Fairfare</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.tagline}>
          Cheap companion fares out of Helena — and the receipts to claim what you’re owed when a flight goes wrong.
        </ThemedText>

        <Link href="/crisis" asChild>
          <Pressable style={({ pressed }) => [styles.crisisCard, { backgroundColor: theme.badBg, borderColor: theme.bad }, pressed && styles.pressed]}>
            <ThemedText style={{ fontWeight: '800', fontSize: 15 }}>
              At the airport with a problem <ThemedText style={{ color: theme.bad, fontWeight: '800', fontSize: 15 }}>right now</ThemedText>? Tap here.
            </ThemedText>
          </Pressable>
        </Link>
        <NavCard
          href="/owed"
          emoji="💸"
          title="What am I owed?"
          blurb="Flight go wrong? Get the exact amount the airline owes you, the law behind it, and a ready-to-send demand you can file in a couple of taps."
        />
        <NavCard
          href="/trips"
          emoji="🧳"
          title="My trips & deadlines"
          blurb={needs ? `${needs} thing${needs === 1 ? '' : 's'} need${needs === 1 ? 's' : ''} you: a new watchdog alert or a deadline closing within 3 days.` : 'Claims expire — that’s how airlines keep the money. Save a trip and every deadline counts down for you.'}
          badge={needs || undefined}
        />
        <NavCard
          href="/moves"
          emoji="💰"
          title="Money moves"
          blurb="The tactics airlines don’t advertise — pay less, claw money back. With a true-price calculator and the fees they bury."
        />
        <NavCard
          href="/rights"
          emoji="🛡️"
          title="Know your rights"
          blurb="Refunds, bumping cash, delay rules, and how to actually get paid. Verified, source-linked — works offline."
        />
        <NavCard
          href="/search"
          emoji="🔎"
          title="Find companion deals"
          blurb="Where your Delta companion certificate saves the most flying out of Helena."
        />

        <ThemedView type="backgroundElement" style={[styles.mission, { borderColor: theme.line }]}>
          <ThemedText type="small" themeColor="textSecondary">
            Built to help travelers — not to milk them. No ads, no selling your data, no airline kickbacks.
          </ThemedText>
        </ThemedView>
      </View>
    </ScrollView>
  );
}

function NavCard({ href, emoji, title, blurb, badge }: { href: Href; emoji: string; title: string; blurb: string; badge?: number }) {
  const theme = useTheme();
  return (
    <Link href={href} asChild>
      <Pressable
        style={({ pressed }) => [
          styles.navCard,
          { backgroundColor: theme.card, borderColor: theme.line },
          pressed && styles.pressed,
        ]}>
        <ThemedText style={styles.navEmoji}>{emoji}</ThemedText>
        <View style={styles.navTextWrap}>
          <ThemedText style={styles.navTitle}>{title}{badge ? <ThemedText style={{ color: theme.bad, fontWeight: '800' }}>  {badge}</ThemedText> : null}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.navBlurb}>
            {blurb}
          </ThemedText>
        </View>
        <ThemedText style={[styles.chevron, { color: theme.brand }]}>›</ThemedText>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth, alignItems: 'stretch', gap: Spacing.two },
  mark: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  markText: { fontSize: 32, color: '#ffffff' },
  brandTitle: { fontSize: 30, fontWeight: '800', textAlign: 'center', marginTop: Spacing.two },
  tagline: { textAlign: 'center', maxWidth: 520, alignSelf: 'center', marginBottom: Spacing.three },
  navCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  pressed: { opacity: 0.7 },
  navEmoji: { fontSize: 30 },
  navTextWrap: { flex: 1 },
  navTitle: { fontSize: 17, fontWeight: '800' },
  navBlurb: { marginTop: 2, lineHeight: 20 },
  chevron: { fontSize: 28, fontWeight: '800' },
  crisisCard: { borderWidth: 1.5, borderRadius: Spacing.three, padding: Spacing.three },
  mission: { borderWidth: 1, borderRadius: Spacing.three, padding: Spacing.three, marginTop: Spacing.three },
});
