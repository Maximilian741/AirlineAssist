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
import { CocDecoder } from '@/components/coc-decoder';
import { CoverageChecker, GapTable } from '@/components/coverage-checker';
import { Scorecard } from '@/components/scorecard';
import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
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
  // Every group of rows shares one bordered sheet; the rows rule themselves off with a hairline.
  const sheet = [styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }];

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
          title="Does EU law cover your flight?"
          subtitle="The answer is counterintuitive — and worth up to €600."
        />
        <CoverageChecker />

        <SectionHeader
          title="Your airline's own contract"
          subtitle="The rules they wrote — with the rule number to quote back at them."
        />
        <CocDecoder />

        <SectionHeader
          title="What the airline owes you"
          subtitle="Tap any card for the exact amounts, deadlines, and how to claim it."
        />
        {CATEGORIES.map((c) => {
          const items = RIGHTS_CARDS.filter((x) => x.category === c.key);
          if (!items.length) return null;
          return (
            <View key={c.key} style={styles.cat}>
              <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.catLabel}>
                {c.label.toUpperCase()}
              </ThemedText>
              <View style={sheet}>
                {items.map((card, i) => (
                  <RightCardView key={i} card={card} first={i === 0} />
                ))}
              </View>
            </View>
          );
        })}

        <SectionHeader
          title="How to actually get paid"
          subtitle="Work down the ladder — most cases settle by step 3, the free DOT complaint."
        />
        <View style={sheet}>
          {LADDER.map((s, i) => (
            <LadderStepView key={s.step} step={s} first={i === 0} />
          ))}
        </View>

        <SectionHeader
          title="Europe / UK / Canada? They may owe you cash"
          subtitle="These laws pay real money for delays and cancellations — most Americans never claim it. A flight home from Europe counts, even on a U.S. airline."
        />
        <View style={sheet}>
          {INTERNATIONAL.map((it, i) => (
            <IntlCardView key={i} item={it} first={i === 0} />
          ))}
        </View>

        <SectionHeader
          title="The law — what’s real, what’s not"
          subtitle="in force today · proposed or promised but not enforceable · struck down. Kept honest so you never claim something that isn’t actually law."
        />
        <View style={sheet}>
          {LEGISLATION.map((l, i) => (
            <LawCardView key={i} law={l} first={i === 0} />
          ))}
        </View>

        <SectionHeader
          title="Same bad day, two continents"
          subtitle="What you'd be owed in the U.S. versus in Europe."
        />
        <GapTable />

        <SectionHeader title="The airlines, by the government’s numbers" subtitle="Same period, same metric, same source for every airline." />
        <Scorecard />

        <SectionHeader title="Check the airline’s record" subtitle="Public data — independent sources." />
        <View style={sheet}>
          {STATS_LINKS.map((r, i) => (
            <ResourceCardView key={i} item={r} first={i === 0} />
          ))}
        </View>

        <SectionHeader title="Leave a review" subtitle="Document a bad experience where other travelers will see it." />
        <View style={sheet}>
          {REVIEW_LINKS.map((r, i) => (
            <ResourceCardView key={i} item={r} first={i === 0} />
          ))}
        </View>

        <SectionHeader title="Who’s on your side" />
        <View style={sheet}>
          {ALLIES.map((r, i) => (
            <ResourceCardView key={i} item={r} first={i === 0} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },
  cat: { marginBottom: Spacing.three },
  catLabel: { marginBottom: Spacing.two, marginTop: Spacing.one },
});
