import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Hero,
  IntlCardView,
  LadderStepView,
  LawCardView,
  ResourceCardView,
  RightCardView,
  SectionHeader,
} from '@/components/rights-ui';
import { CoverageChecker, GapTable } from '@/components/coverage-checker';
import { Scorecard } from '@/components/scorecard';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import {
  ALLIES,
  CATEGORIES,
  INTERNATIONAL,
  LADDER,
  LEGISLATION,
  REVIEW_LINKS,
  RIGHTS_CARDS,
  STATS_LINKS,
} from '@/data/rights';
import { useTheme } from '@/hooks/use-theme';

export default function RightsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: theme.background }}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + TopTabInset + Spacing.three, paddingBottom: insets.bottom + BottomTabInset + Spacing.four },
      ]}>
      <View style={styles.inner}>
        <Hero />

        <SectionHeader
          emoji="🌍"
          title="Does EU law cover your flight?"
          subtitle="The answer is counterintuitive — and worth up to €600."
        />
        <CoverageChecker />

        <SectionHeader
          emoji="💰"
          title="What the airline owes you"
          subtitle="Tap any card for the exact amounts, deadlines, and how to claim it."
        />
        {CATEGORIES.map((c) => {
          const items = RIGHTS_CARDS.filter((x) => x.category === c.key);
          if (!items.length) return null;
          return (
            <View key={c.key} style={styles.cat}>
              <ThemedText themeColor="textSecondary" style={styles.catLabel}>
                {c.emoji}  {c.label.toUpperCase()}
              </ThemedText>
              {items.map((card, i) => (
                <RightCardView key={i} card={card} />
              ))}
            </View>
          );
        })}

        <SectionHeader
          emoji="🪜"
          title="How to actually get paid"
          subtitle="Work down the ladder — most cases settle by step 3, the free DOT complaint."
        />
        {LADDER.map((s) => (
          <LadderStepView key={s.step} step={s} />
        ))}

        <SectionHeader
          emoji="🌍"
          title="Europe / UK / Canada? They may owe you cash"
          subtitle="These laws pay real money for delays and cancellations — most Americans never claim it. A flight home from Europe counts, even on a U.S. airline."
        />
        {INTERNATIONAL.map((it, i) => (
          <IntlCardView key={i} item={it} />
        ))}

        <SectionHeader
          emoji="📜"
          title="The law — what’s real, what’s not"
          subtitle="🟢 in force today · 🟡 proposed or promised but not enforceable · 🔴 struck down. Kept honest so you never claim something that isn’t actually law."
        />
        {LEGISLATION.map((l, i) => (
          <LawCardView key={i} law={l} />
        ))}

        <SectionHeader
          emoji="⚖️"
          title="Same bad day, two continents"
          subtitle="What you'd be owed in the U.S. versus in Europe."
        />
        <GapTable />

        <SectionHeader emoji="📊" title="The airlines, by the government’s numbers" subtitle="Same period, same metric, same source for every airline." />
        <Scorecard />

        <SectionHeader title="Check the airline’s record" subtitle="Public data — independent sources." />
        {STATS_LINKS.map((r, i) => (
          <ResourceCardView key={i} item={r} />
        ))}

        <SectionHeader emoji="✍️" title="Leave a review" subtitle="Document a bad experience where other travelers will see it." />
        {REVIEW_LINKS.map((r, i) => (
          <ResourceCardView key={i} item={r} />
        ))}

        <SectionHeader emoji="🤝" title="Who’s on your side" />
        {ALLIES.map((r, i) => (
          <ResourceCardView key={i} item={r} />
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },
  cat: { marginBottom: Spacing.three },
  catLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4, marginBottom: Spacing.two, marginTop: Spacing.one },
});
