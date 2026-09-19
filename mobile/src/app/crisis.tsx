import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { EVIDENCE, SCENARIOS, type CrisisScenario } from '@/data/crisis';
import { useTheme } from '@/hooks/use-theme';

type Theme = ReturnType<typeof useTheme>;

export default function CrisisScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [scenario, setScenario] = useState<CrisisScenario | null>(null);
  const pad = { paddingTop: insets.top + TopTabInset + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.four };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: theme.background }} contentContainerStyle={[styles.content, pad]}>
      <View style={styles.inner}>
        {scenario ? (
          <Scenario s={scenario} theme={theme} onBack={() => setScenario(null)} />
        ) : (
          <>
            <ThemedText type="display">What's happening?</ThemedText>
            <View style={[styles.rule, { backgroundColor: theme.line }]} />
            <ThemedText type="lede" themeColor="textSecondary" style={styles.standfirst}>
              The next 20 minutes decide most of the money. Pick the situation — you'll get exactly what to do, what to say, and what not to accept.
            </ThemedText>

            {/* An index of situations: one sheet, hairline-ruled — not a stack of floating cards. */}
            <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
              {SCENARIOS.map((s, i) => (
                <Pressable key={s.id} onPress={() => setScenario(s)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
                  <View style={[styles.pickRow, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
                    <ThemedText style={styles.pickTitle}>{s.title}</ThemedText>
                    <ThemedText style={[styles.arrow, { color: theme.bad }]}>→</ThemedText>
                  </View>
                </Pressable>
              ))}
            </View>

            <View style={[styles.panel, { borderColor: theme.line }]}>
              <ThemedText type="eyebrow" themeColor="textSecondary">Whatever it is — start collecting now</ThemedText>
              <View style={styles.list}>
                {EVIDENCE.map((e, i) => (
                  <Bullet key={i} text={e} />
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Bullet({ text }: { text: string }) {
  return (
    <View style={styles.bullet}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.dot}>•</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.flex1}>{text}</ThemedText>
    </View>
  );
}

function Scenario({ s, theme, onBack }: { s: CrisisScenario; theme: Theme; onBack: () => void }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  return (
    <View>
      <ThemedText type="display">{s.title}</ThemedText>
      <View style={[styles.rule, { backgroundColor: theme.line }]} />

      {/* The running order, numbered: one sheet, a hairline between each move. */}
      <View style={[styles.sheet, styles.afterRule, { backgroundColor: theme.card, borderColor: theme.line }]}>
        {s.now.map((n, i) => (
          <View key={i} style={[styles.step, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
            <View style={[styles.num, { backgroundColor: theme.brandDeep }]}>
              <ThemedText style={styles.numText}>{i + 1}</ThemedText>
            </View>
            <ThemedText type="small" style={styles.flex1}>{n}</ThemedText>
          </View>
        ))}
      </View>

      <View style={[styles.say, { backgroundColor: theme.backgroundElement, borderColor: theme.line, borderLeftColor: theme.good }]}>
        <ThemedText type="eyebrow" themeColor="textSecondary">Word for word, at the counter</ThemedText>
        <ThemedText type="lede" style={styles.quote}>{s.say}</ThemedText>
        <Pressable
          onPress={async () => { await Clipboard.setStringAsync(s.say); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          style={({ pressed }) => (pressed ? styles.pressed : null)}>
          <View style={[styles.copyBtn, { borderColor: theme.line }]}>
            <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{copied ? 'Copied' : 'Copy the script'}</ThemedText>
          </View>
        </Pressable>
      </View>

      <View style={[styles.panel, { borderColor: theme.line }]}>
        <ThemedText type="eyebrow" themeColor="textSecondary">Collect</ThemedText>
        <View style={styles.list}>
          {s.collect.map((c, i) => (
            <Bullet key={i} text={c} />
          ))}
        </View>
      </View>

      <View style={[styles.note, { backgroundColor: theme.card, borderColor: theme.line, borderLeftColor: theme.warn }]}>
        <ThemedText type="small">Don’t accept: {s.dontAccept}</ThemedText>
      </View>
      <View style={[styles.note, { backgroundColor: theme.goodBg, borderColor: theme.line, borderLeftColor: theme.good }]}>
        <ThemedText type="small">{s.money}</ThemedText>
      </View>

      <View style={styles.actions}>
        {s.claimType ? (
          <Pressable onPress={() => router.push({ pathname: '/owed', params: { type: s.claimType } })} style={({ pressed }) => (pressed ? styles.pressed : null)}>
            <View style={[styles.cta, { backgroundColor: theme.brandDeep }]}>
              <ThemedText style={styles.ctaText}>Later: see what this is worth →</ThemedText>
            </View>
          </Pressable>
        ) : null}
        <Pressable onPress={onBack} style={({ pressed }) => (pressed ? styles.pressed : null)}>
          <View style={[styles.cta, styles.ctaGhost, { borderColor: theme.line }]}>
            <ThemedText style={[styles.ctaGhostText, { color: theme.brand }]}>← Other situations</ThemedText>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },
  flex1: { flex: 1 },
  rule: { height: StyleSheet.hairlineWidth, marginTop: Spacing.three },
  afterRule: { marginTop: Spacing.four },
  standfirst: { marginTop: Spacing.three, marginBottom: Spacing.four },

  // the situation index
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },
  pickRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  pickTitle: { flex: 1, fontFamily: Fonts.serif, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  arrow: { fontSize: 17 },

  // the numbered moves
  step: { flexDirection: 'row', gap: Spacing.two + 2, alignItems: 'flex-start', paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  num: { width: 22, height: 22, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  numText: { color: '#fdfbf5', fontWeight: '700', fontSize: 12.5, lineHeight: 20, fontVariant: ['tabular-nums'] },

  // the script
  say: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, padding: Spacing.three, marginTop: Spacing.four },
  quote: { fontFamily: Fonts.serif, fontStyle: 'italic', marginTop: Spacing.two },
  copyBtn: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, marginTop: Spacing.three },

  // evidence + the two notes
  panel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, padding: Spacing.three, marginTop: Spacing.four },
  list: { marginTop: Spacing.two, gap: Spacing.one + 1 },
  bullet: { flexDirection: 'row', gap: Spacing.two },
  dot: { width: 9 },
  note: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, padding: Spacing.three, marginTop: Spacing.three },

  // actions
  actions: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.four, flexWrap: 'wrap' },
  cta: { minHeight: 44, borderRadius: Radius.sm, paddingVertical: Spacing.two + 4, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fdfbf5', fontWeight: '700', fontSize: 15 },
  ctaGhost: { borderWidth: StyleSheet.hairlineWidth },
  ctaGhostText: { fontWeight: '700', fontSize: 15 },
  pressed: { opacity: 0.75 },
});
