/**
 * Presentational components for the "Your Rights" guide. Data comes from src/data/rights.ts.
 * Links open in the in-app browser (expo-web-browser) so we don't fight typed-route Href typing
 * for dynamic external URLs.
 */
import { openBrowserAsync } from 'expo-web-browser';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { IntlComp, Law, LadderStep, ResourceLink, RightCard, Source } from '@/data/rights';
import { statusKind } from '@/data/rights';

function openUrl(url?: string) {
  if (url) openBrowserAsync(url).catch(() => {});
}

export function SectionHeader({ emoji, title, subtitle }: { emoji?: string; title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <ThemedText style={styles.sectionTitle} themeColor="brandDeep">
        {emoji ? emoji + '  ' : ''}
        {title}
      </ThemedText>
      {subtitle ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.sectionSub}>
          {subtitle}
        </ThemedText>
      ) : null}
    </View>
  );
}

export function Hero() {
  return (
    <View style={styles.hero}>
      <ThemedText style={styles.heroEmoji}>🛡️</ThemedText>
      <ThemedText style={styles.heroTitle}>Your rights against the airline</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.heroText}>
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
      <ThemedText type="small" themeColor="textSecondary">
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
      <ThemedText type="small" themeColor="textSecondary" style={styles.detailLabel}>
        {label.toUpperCase()}
      </ThemedText>
      <ThemedText type="small" style={styles.detailValue}>
        {value}
      </ThemedText>
    </View>
  );
}

export function RightCardView({ card }: { card: RightCard }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <ThemedView type="card" style={[styles.card, { borderLeftColor: theme.good, borderColor: theme.line }]}>
      <ThemedText style={styles.cardHead}>{card.headline}</ThemedText>
      <ThemedText type="small" style={styles.cardPlain}>
        {card.plain}
      </ThemedText>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        hitSlop={10}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
        <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>
          {open ? '▾ ' : '▸ '}How to claim it &amp; the fine print
        </ThemedText>
      </Pressable>
      {open ? (
        <View style={[styles.detailWrap, { borderTopColor: theme.line }]}>
          <DetailRow label="How much / the numbers" value={card.amounts} />
          <DetailRow label="When it applies" value={card.triggers} />
          <DetailRow label="How to claim it" value={card.howToClaim} />
          <DetailRow label="The law" value={card.legalBasis} />
          <SourceLinks sources={card.sources} />
        </View>
      ) : null}
    </ThemedView>
  );
}

export function LadderStepView({ step }: { step: LadderStep }) {
  const theme = useTheme();
  return (
    <View style={styles.ladderRow}>
      <View style={[styles.ladderNum, { backgroundColor: theme.brand }]}>
        <ThemedText style={styles.ladderNumText}>{step.step}</ThemedText>
      </View>
      <View style={styles.ladderBody}>
        <ThemedText style={styles.ladderAction}>{step.action}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.ladderDetail}>
          {step.detail}
        </ThemedText>
        {step.url ? (
          <Pressable onPress={() => openUrl(step.url)} hitSlop={10} style={styles.sourceTap}>
            <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>
              Open ↗
            </ThemedText>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export function IntlCardView({ item }: { item: IntlComp }) {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  return (
    <ThemedView type="backgroundElement" style={[styles.card, { borderColor: theme.line, borderLeftColor: theme.brand }]}>
      <View style={styles.intlHead}>
        <ThemedText style={styles.intlRegime} themeColor="brandDeep">
          {item.regime}
        </ThemedText>
        <ThemedText style={[styles.intlAmount, { color: theme.good }]}>{item.amount}</ThemedText>
      </View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.intlRegion}>
        {item.region}
      </ThemedText>
      <Pressable
        onPress={() => setOpen((v) => !v)}
        hitSlop={10}
        style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
        <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>
          {open ? '▾ ' : '▸ '}Who qualifies &amp; how to claim
        </ThemedText>
      </Pressable>
      {open ? (
        <View style={[styles.detailWrap, { borderTopColor: theme.line }]}>
          <DetailRow label="Who qualifies" value={item.eligibility} />
          <DetailRow label="How to claim it" value={item.howToClaim} />
          <SourceLinks sources={item.sources} />
        </View>
      ) : null}
    </ThemedView>
  );
}

function Pill({ kind, label }: { kind: 'in-force' | 'pending' | 'dead'; label: string }) {
  const theme = useTheme();
  const map = {
    'in-force': { bg: theme.goodBg, fg: theme.good },
    pending: { bg: theme.warnBg, fg: theme.warn },
    dead: { bg: theme.badBg, fg: theme.bad },
  } as const;
  const c = map[kind];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }]}>
      <ThemedText style={[styles.pillText, { color: c.fg }]}>{label}</ThemedText>
    </View>
  );
}

export function LawCardView({ law }: { law: Law }) {
  const theme = useTheme();
  const kind = statusKind(law.status);
  const edge = kind === 'in-force' ? theme.good : kind === 'dead' ? theme.bad : theme.warn;
  return (
    <ThemedView type="card" style={[styles.card, { borderColor: theme.line, borderLeftColor: edge }]}>
      <View style={styles.lawHead}>
        <ThemedText style={styles.lawName}>
          {law.name}
          {law.year ? <ThemedText type="small" themeColor="textSecondary">{'  ' + law.year}</ThemedText> : null}
        </ThemedText>
      </View>
      <View style={styles.pillWrap}>
        <Pill kind={kind} label={law.status} />
      </View>
      <ThemedText type="small" style={styles.lawSummary}>
        {law.summary}
      </ThemedText>
      {law.whyItMatters ? (
        <ThemedView type="backgroundElement" style={styles.whyBox}>
          <ThemedText type="small">
            <ThemedText type="smallBold">Why it matters: </ThemedText>
            {law.whyItMatters}
          </ThemedText>
        </ThemedView>
      ) : null}
      <SourceLinks sources={law.sources} />
    </ThemedView>
  );
}

export function ResourceCardView({ item }: { item: ResourceLink }) {
  const theme = useTheme();
  return (
    <Pressable onPress={() => openUrl(item.url)} style={({ pressed }) => pressed && styles.pressed}>
      <ThemedView type="backgroundElement" style={[styles.resource, { borderColor: theme.line }]}>
        <ThemedText style={styles.resourceTitle}>{item.title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.resourceBlurb}>
          {item.blurb}
        </ThemedText>
        {item.url ? (
          <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700', marginTop: Spacing.one }}>
            Open ↗
          </ThemedText>
        ) : null}
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionHeader: { marginTop: Spacing.five, marginBottom: Spacing.three },
  sectionTitle: { fontSize: 19, fontWeight: '800', lineHeight: 26 },
  sectionSub: { marginTop: Spacing.one },
  hero: { alignItems: 'center', paddingVertical: Spacing.four, gap: Spacing.one },
  heroEmoji: { fontSize: 44, lineHeight: 52 },
  heroTitle: { fontSize: 24, fontWeight: '800', textAlign: 'center' },
  heroText: { textAlign: 'center', maxWidth: 560, marginTop: Spacing.one },
  pressed: { opacity: 0.6 },
  toggle: { minHeight: 44, justifyContent: 'center', marginTop: Spacing.one },
  sourceTap: { minHeight: 36, justifyContent: 'center' },
  card: {
    borderWidth: 1,
    borderLeftWidth: 4,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    marginBottom: Spacing.two,
  },
  cardHead: { fontSize: 16, fontWeight: '800', lineHeight: 22 },
  cardPlain: { marginTop: Spacing.one, lineHeight: 21 },
  detailWrap: { marginTop: Spacing.two, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth, gap: Spacing.two },
  detailRow: { gap: 2 },
  detailLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  detailValue: { lineHeight: 20 },
  sourcesRow: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: Spacing.one },
  ladderRow: { flexDirection: 'row', gap: Spacing.three, marginBottom: Spacing.three },
  ladderNum: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ladderNumText: { color: '#ffffff', fontWeight: '800' },
  ladderBody: { flex: 1, gap: Spacing.one },
  ladderAction: { fontSize: 15, fontWeight: '800' },
  ladderDetail: { lineHeight: 20 },
  intlHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', justifyContent: 'space-between', gap: Spacing.two },
  intlRegime: { fontSize: 17, fontWeight: '800' },
  intlAmount: { fontSize: 15, fontWeight: '800' },
  intlRegion: { marginTop: 2 },
  lawHead: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' },
  lawName: { fontSize: 15, fontWeight: '800', flexShrink: 1 },
  pillWrap: { flexDirection: 'row', marginTop: Spacing.two },
  pill: { borderRadius: 999, paddingHorizontal: Spacing.two, paddingVertical: 4 },
  pillText: { fontSize: 12.5, fontWeight: '800' },
  lawSummary: { marginTop: Spacing.two, lineHeight: 21 },
  whyBox: { marginTop: Spacing.two, borderRadius: Spacing.two, padding: Spacing.two },
  resource: { borderWidth: 1, borderRadius: Spacing.three, padding: Spacing.three, marginBottom: Spacing.two },
  resourceTitle: { fontSize: 15, fontWeight: '800' },
  resourceBlurb: { marginTop: 2, lineHeight: 20 },
});
