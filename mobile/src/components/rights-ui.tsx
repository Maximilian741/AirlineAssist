/**
 * Presentational components for the "Your Rights" guide. Data comes from src/data/rights.ts.
 * Links open in the in-app browser (expo-web-browser) so we don't fight typed-route Href typing
 * for dynamic external URLs.
 *
 * Styling follows constants/theme.ts: warm paper, hairline rules, and ONE bordered sheet per group
 * (the sheet belongs to the screen) whose rows are separated by a hairline. Every row takes a
 * `first` flag so it can skip that top rule. No emoji in the chrome, no shadows, no pills.
 */
import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { IntlComp, Law, LadderStep, ResourceLink, RightCard, Source } from '@/data/rights';
import { statusKind } from '@/data/rights';

function openUrl(url?: string) {
  if (url) openBrowserAsync(url).catch(() => {});
}

/** Hairline above every row but the first — the rule that turns a stack into a sheet. */
function useTopRule(first?: boolean) {
  const theme = useTheme();
  return first ? null : { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line };
}

export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const theme = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={[styles.sectionRule, { backgroundColor: theme.line }]} />
      <ThemedText type="section">{title}</ThemedText>
      {subtitle ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionSub}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function Hero() {
  const theme = useTheme();
  return (
    <View style={styles.hero}>
      <ThemedText type="display">Your rights against the airline</ThemedText>
      <View style={[styles.heroRule, { backgroundColor: theme.line }]} />
      <ThemedText type="lede" themeColor="textSecondary" style={styles.heroText}>
        Airlines count on you not knowing the rules. Here’s what they legally owe you — the exact
        amounts, the deadlines, and a link to the government source behind every one. Works offline.
      </ThemedText>
    </View>
  );
}

function SourceLinks({ sources }: { sources: Source[] }) {
  const theme = useTheme();
  if (!sources?.length) return null;
  return (
    <View style={styles.sourcesRow}>
      <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.sourcesLabel}>
        Sources:{' '}
      </ThemedText>
      {sources.map((s, i) => (
        <Pressable key={i} onPress={() => openUrl(s.url)} hitSlop={10} style={styles.sourceTap}>
          <ThemedText type="small" style={{ color: theme.brand, textDecorationLine: 'underline' }}>
            {s.label}
            {i < sources.length - 1 ? '   ' : ''}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <ThemedText type="eyebrow" themeColor="textSecondary">
        {label.toUpperCase()}
      </ThemedText>
      <ThemedText type="small" style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

/** The disclosure line under a row: a functional caret, never an icon tile. */
function Disclosure({ open, onPress, label }: { open: boolean; onPress: () => void; label: string }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      accessibilityRole="button"
      style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={{ color: theme.brand }}>
        {open ? '▾ ' : '▸ '}
        {label}
      </ThemedText>
    </Pressable>
  );
}

export function RightCardView({ card, first }: { card: RightCard; first?: boolean }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const topRule = useTopRule(first);
  return (
    <View style={[styles.row, topRule]}>
      <ThemedText style={styles.rowHead}>{card.headline}</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.rowBody}>
        {card.plain}
      </ThemedText>
      <Disclosure
        open={open}
        onPress={() => setOpen((v) => !v)}
        label="How to claim it & the fine print"
      />
      {open ? (
        <View style={[styles.detailWrap, { borderTopColor: theme.line }]}>
          <DetailRow label="How much / the numbers" value={card.amounts} />
          <DetailRow label="When it applies" value={card.triggers} />
          <DetailRow label="How to claim it" value={card.howToClaim} />
          <DetailRow label="The law" value={card.legalBasis} />
          <SourceLinks sources={card.sources} />
        </View>
      ) : null}
    </View>
  );
}

export function LadderStepView({ step, first }: { step: LadderStep; first?: boolean }) {
  const theme = useTheme();
  const topRule = useTopRule(first);
  return (
    <View style={[styles.row, styles.ladderRow, topRule]}>
      <View style={[styles.ladderNum, { backgroundColor: theme.brandDeep }]}>
        <ThemedText style={styles.ladderNumText}>{step.step}</ThemedText>
      </View>
      <View style={styles.ladderBody}>
        <ThemedText style={styles.ladderAction}>{step.action}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.ladderDetail}>
          {step.detail}
        </ThemedText>
        {step.url ? (
          <Pressable onPress={() => openUrl(step.url)} hitSlop={10} style={styles.sourceTap}>
            <ThemedText type="smallBold" style={{ color: theme.brand }}>
              Open ↗
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function IntlCardView({ item, first }: { item: IntlComp; first?: boolean }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const topRule = useTopRule(first);
  return (
    <View style={[styles.row, topRule]}>
      <View style={styles.intlHead}>
        <ThemedText style={styles.rowHead}>{item.regime}</ThemedText>
        <ThemedText type="money">{item.amount}</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.intlRegion}>
        {item.region}
      </ThemedText>
      <Disclosure
        open={open}
        onPress={() => setOpen((v) => !v)}
        label="Who qualifies & how to claim"
      />
      {open ? (
        <View style={[styles.detailWrap, { borderTopColor: theme.line }]}>
          <DetailRow label="Who qualifies" value={item.eligibility} />
          <DetailRow label="How to claim it" value={item.howToClaim} />
          <SourceLinks sources={item.sources} />
        </View>
      ) : null}
    </View>
  );
}

/** Legislation status: a small-caps tag with a hairline border, not a coloured pill. */
function StatusTag({ kind, label }: { kind: 'in-force' | 'pending' | 'dead'; label: string }) {
  const theme = useTheme();
  const fg = kind === 'in-force' ? theme.good : kind === 'dead' ? theme.bad : theme.warn;
  return (
    <View style={[styles.tag, { borderColor: fg }]}>
      <ThemedText style={[styles.tagText, { color: fg }]}>{label}</ThemedText>
    </View>
  );
}

export function LawCardView({ law, first }: { law: Law; first?: boolean }) {
  const theme = useTheme();
  const kind = statusKind(law.status);
  const topRule = useTopRule(first);
  return (
    <View style={[styles.row, topRule]}>
      <View style={styles.lawHead}>
        <ThemedText style={styles.lawName}>
          {law.name}
          {law.year ? <ThemedText type="small" themeColor="textSecondary">{'  ' + law.year}</ThemedText> : null}
        </ThemedText>
      </View>
      <View style={styles.tagWrap}>
        <StatusTag kind={kind} label={law.status} />
      </View>
      <ThemedText type="small" style={styles.lawSummary}>
        {law.summary}
      </ThemedText>
      {law.whyItMatters ? (
        <View style={[styles.whyBox, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
          <ThemedText type="small">
            <ThemedText type="smallBold">Why it matters: </ThemedText>
            {law.whyItMatters}
          </ThemedText>
        </View>
      ) : null}
      <SourceLinks sources={law.sources} />
    </View>
  );
}

export function ResourceCardView({ item, first }: { item: ResourceLink; first?: boolean }) {
  const theme = useTheme();
  const topRule = useTopRule(first);
  // The visual block lives inside the Pressable: on web an anchor wrapper doesn't inherit a
  // Pressable's layout, so only the pressed opacity rides on the Pressable itself.
  return (
    <Pressable onPress={() => openUrl(item.url)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
      <View style={[styles.row, topRule]}>
        <ThemedText style={styles.resourceTitle}>{item.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.resourceBlurb}>
          {item.blurb}
        </ThemedText>
        {item.url ? (
          <ThemedText type="smallBold" style={{ color: theme.brand, marginTop: Spacing.two }}>
            Open ↗
          </ThemedText>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // ---- section rhythm: rule, serif title, deck ----
  sectionHeader: { marginTop: Spacing.five, marginBottom: Spacing.three },
  sectionRule: { height: StyleSheet.hairlineWidth, marginBottom: Spacing.three },
  sectionSub: { marginTop: Spacing.one + 2, maxWidth: 620 },

  hero: { paddingTop: Spacing.two, paddingBottom: Spacing.four },
  heroRule: { height: StyleSheet.hairlineWidth, marginTop: Spacing.three },
  heroText: { marginTop: Spacing.three, maxWidth: 620 },

  // ---- one row of a sheet ----
  row: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  rowHead: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 24, fontWeight: '700', flexShrink: 1 },
  rowBody: { marginTop: Spacing.one + 2 },

  pressed: { opacity: 0.75 },
  toggle: { minHeight: 44, justifyContent: 'center', marginTop: Spacing.one },
  sourceTap: { minHeight: 36, justifyContent: 'center' },

  detailWrap: {
    marginTop: Spacing.two,
    paddingTop: Spacing.three,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: Spacing.three,
  },
  detailRow: { gap: 3 },
  detailValue: { lineHeight: 21 },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: Spacing.one },
  sourcesLabel: { marginRight: Spacing.one },

  ladderRow: { flexDirection: 'row', gap: Spacing.three },
  ladderNum: { width: 26, height: 26, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  ladderNumText: { color: '#fdfbf5', fontWeight: '700', fontSize: 13.5, lineHeight: 18, fontVariant: ['tabular-nums'] },
  ladderBody: { flex: 1 },
  ladderAction: { fontFamily: Fonts.serif, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  ladderDetail: { marginTop: Spacing.one },

  intlHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two },
  intlRegion: { marginTop: 2 },

  lawHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  lawName: { fontFamily: Fonts.serif, fontSize: 16, lineHeight: 22, fontWeight: '700', flexShrink: 1 },
  tagWrap: { flexDirection: 'row', marginTop: Spacing.two },
  tag: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.two - 1, paddingVertical: 2 },
  tagText: { fontSize: 11, lineHeight: 15, fontWeight: '700', letterSpacing: 0.9, textTransform: 'uppercase' },
  lawSummary: { marginTop: Spacing.two, lineHeight: 21 },
  whyBox: { marginTop: Spacing.three, borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, padding: Spacing.two + 2 },

  resourceTitle: { fontFamily: Fonts.serif, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  resourceBlurb: { marginTop: 2 },
});
