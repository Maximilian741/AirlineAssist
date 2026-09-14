import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
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
            <ThemedText style={styles.h1}>What's happening?</ThemedText>
            <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three, lineHeight: 21 }}>
              The next 20 minutes decide most of the money. Pick the situation — you'll get exactly what to do, what to say, and what not to accept.
            </ThemedText>
            {SCENARIOS.map((s) => (
              <Pressable key={s.id} onPress={() => setScenario(s)} style={({ pressed }) => [styles.card, { borderColor: theme.line, backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
                <ThemedText style={{ fontWeight: '700', fontSize: 15.5, flex: 1 }}>{s.title}</ThemedText>
                <ThemedText style={{ color: theme.bad, fontWeight: '800', fontSize: 17 }}>→</ThemedText>
              </Pressable>
            ))}
            <ThemedView type="backgroundElement" style={[styles.evidence, { borderColor: theme.line }]}>
              <ThemedText style={{ fontWeight: '800', fontSize: 14, marginBottom: 6 }}>Whatever it is — start collecting now</ThemedText>
              {EVIDENCE.map((e, i) => (
                <ThemedText key={i} type="small" themeColor="textSecondary" style={{ lineHeight: 21 }}>• {e}</ThemedText>
              ))}
            </ThemedView>
          </>
        )}
      </View>
    </ScrollView>
  );
}

function Scenario({ s, theme, onBack }: { s: CrisisScenario; theme: Theme; onBack: () => void }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  return (
    <View>
      <ThemedText style={styles.h1}>{s.title}</ThemedText>
      <View style={{ marginTop: Spacing.two, gap: 11 }}>
        {s.now.map((n, i) => (
          <View key={i} style={styles.step}>
            <View style={[styles.num, { backgroundColor: theme.brandDeep }]}>
              <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>{i + 1}</ThemedText>
            </View>
            <ThemedText type="small" style={{ flex: 1, lineHeight: 21 }}>{n}</ThemedText>
          </View>
        ))}
      </View>

      <ThemedView type="backgroundElement" style={[styles.say, { borderLeftColor: theme.good }]}>
        <ThemedText style={{ fontWeight: '800', fontSize: 13, marginBottom: 5 }}>Word for word, at the counter</ThemedText>
        <ThemedText type="small" style={{ fontStyle: 'italic', lineHeight: 21 }}>{s.say}</ThemedText>
        <Pressable
          onPress={async () => { await Clipboard.setStringAsync(s.say); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
          style={({ pressed }) => [styles.copyBtn, { borderColor: theme.line }, pressed && { opacity: 0.7 }]}>
          <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{copied ? 'Copied' : 'Copy the script'}</ThemedText>
        </Pressable>
      </ThemedView>

      <ThemedView type="backgroundElement" style={[styles.evidence, { borderColor: theme.line }]}>
        <ThemedText style={{ fontWeight: '800', fontSize: 13, marginBottom: 5 }}>Collect</ThemedText>
        {s.collect.map((c, i) => (
          <ThemedText key={i} type="small" themeColor="textSecondary" style={{ lineHeight: 21 }}>• {c}</ThemedText>
        ))}
      </ThemedView>

      <ThemedView type="card" style={[styles.warn, { borderColor: theme.warn }]}>
        <ThemedText type="small" style={{ lineHeight: 20 }}>Don’t accept: {s.dontAccept}</ThemedText>
      </ThemedView>
      <ThemedView type="card" style={[styles.money, { borderColor: theme.good, backgroundColor: theme.goodBg }]}>
        <ThemedText type="small" style={{ lineHeight: 20 }}>{s.money}</ThemedText>
      </ThemedView>

      <View style={{ flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.three, flexWrap: 'wrap' }}>
        {s.claimType ? (
          <Pressable onPress={() => router.push({ pathname: '/owed', params: { type: s.claimType } })} style={({ pressed }) => [styles.cta, { backgroundColor: theme.brand }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={{ color: '#fff', fontWeight: '800' }}>Later: see what this is worth →</ThemedText>
          </Pressable>
        ) : null}
        <Pressable onPress={onBack} style={({ pressed }) => [styles.cta, { borderWidth: 1.5, borderColor: theme.line }, pressed && { opacity: 0.7 }]}>
          <ThemedText style={{ fontWeight: '700' }}>← Other situations</ThemedText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },
  h1: { fontSize: 22, fontWeight: '800' },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderRadius: 12, padding: 15, marginBottom: 9 },
  evidence: { borderWidth: 1, borderRadius: 10, padding: 13, marginTop: Spacing.three },
  step: { flexDirection: 'row', gap: 11, alignItems: 'flex-start' },
  num: { width: 24, height: 24, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  say: { borderLeftWidth: 4, borderRadius: 10, padding: 13, marginTop: Spacing.three },
  copyBtn: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 7, paddingHorizontal: 12, paddingVertical: 7, marginTop: 9 },
  warn: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: Spacing.two },
  money: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: Spacing.two },
  cta: { borderRadius: 10, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
});
