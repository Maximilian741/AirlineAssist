/**
 * ClaimTracker — the block under a finished claim: every filing on the record, the legal clocks each
 * one started, and the next move the day the airline misses one. Data via lib/claimtrack.ts (pure);
 * persistence in AsyncStorage `ff-claims` (same key/shape as the web).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import { CLAIMS_KEY, fmt, markOutcome, nextAction, recordFiling, start, timeline, type ClaimStatus, type Stage, type TrackedClaim } from '@/lib/claimtrack';
import type { Answers, ClaimResult, Details } from '@/lib/claim-engine';

export async function loadClaims(): Promise<TrackedClaim[]> {
  try { const v = await AsyncStorage.getItem(CLAIMS_KEY); const arr = v ? JSON.parse(v) : []; return Array.isArray(arr) ? arr : []; } catch { return []; }
}
async function saveClaims(list: TrackedClaim[]) { await AsyncStorage.setItem(CLAIMS_KEY, JSON.stringify(list)).catch(() => {}); }

/**
 * Hook: owns the tracked claim for the current wizard result. `track(stage)` is what the filing
 * buttons call — it creates the claim on first use and records the filing (idempotent per day).
 */
export function useClaimTracker(answers: Answers, details: Details, res: ClaimResult | null, initialId?: string | null) {
  const [claim, setClaim] = useState<TrackedClaim | null>(null);
  useEffect(() => {
    let alive = true;
    if (!initialId) { setClaim(null); return; }
    loadClaims().then((list) => { if (alive) setClaim(list.find((c) => c.id === initialId) || null); });
    return () => { alive = false; };
  }, [initialId]);

  const persist = useCallback(async (next: TrackedClaim) => {
    const list = await loadClaims();
    const i = list.findIndex((c) => c.id === next.id);
    if (i >= 0) list[i] = next; else list.push(next);
    await saveClaims(list);
    setClaim(next);
  }, []);

  const track = useCallback(async (stage: Stage) => {
    if (!res) return;
    const base = claim || start(answers, details, res);
    await persist(recordFiling(base, stage));
  }, [claim, answers, details, res, persist]);

  const outcome = useCallback(async (status: ClaimStatus) => {
    if (!claim) return;
    await persist(markOutcome(claim, status));
  }, [claim, persist]);

  return { claim, track, outcome };
}

export function ClaimTrackerView({ claim, onEscalate, onOutcome }: { claim: TrackedClaim | null; onEscalate: (channel: string) => void; onOutcome: (s: ClaimStatus) => void }) {
  const theme = useTheme();
  if (!claim || !claim.filings.length) {
    return (
      <ThemedView type="backgroundElement" style={[styles.panel, { borderColor: theme.line }]}>
        <ThemedText style={styles.title} themeColor="brandDeep">After you send it</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={{ lineHeight: 19 }}>
          The moment you file, the airline is on a legal clock: 30 days to acknowledge, 60 to answer in writing (14 CFR 259.7), 7 business days to refund a card (14 CFR 260.10). Use the buttons above and this block starts counting — and tells you the day they miss one, and what to do next.
        </ThemedText>
      </ThemedView>
    );
  }
  const tl = timeline(claim);
  const na = nextAction(claim);
  const stages = claim.filings.map((f) => `${f.stage === 'airline' ? 'Airline' : f.stage === 'dot' ? 'DOT' : f.stage === 'chargeback' ? 'Chargeback' : 'Final notice'} ${fmt(f.date)}`).join(' · ');
  const overdue = tl.filter((t) => t.status === 'overdue').length;
  const naColor = na.kind === 'escalate' ? theme.bad : na.kind === 'closed' ? theme.good : theme.text;
  return (
    <ThemedView type="backgroundElement" style={[styles.panel, { borderColor: overdue ? theme.bad : theme.line }]}>
      <ThemedText style={styles.title} themeColor="brandDeep">Claim tracker</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">{stages}{claim.amount ? `  ·  ${claim.amount}` : ''}{overdue ? `  ·  ${overdue} clock${overdue === 1 ? '' : 's'} blown` : ''}</ThemedText>
      <View style={[styles.next, { borderColor: naColor }]}>
        <ThemedText type="small" style={{ fontWeight: '800', color: naColor }}>Next</ThemedText>
        <ThemedText type="small" style={{ lineHeight: 19, marginTop: 2 }}>{na.text}</ThemedText>
        {na.kind === 'escalate' && na.channel ? (
          <Pressable onPress={() => onEscalate(na.channel!)} style={({ pressed }) => [styles.btn, { backgroundColor: theme.bad }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={{ color: '#fff', fontWeight: '800', fontSize: 13.5 }}>Escalate now →</ThemedText>
          </Pressable>
        ) : null}
      </View>
      {claim.status === 'open' ? tl.map((t) => {
        const c = t.status === 'overdue' ? theme.bad : t.status === 'due-soon' ? theme.warn : theme.textSecondary;
        const when = t.daysLeft < 0 ? `${-t.daysLeft} day${t.daysLeft === -1 ? '' : 's'} overdue` : t.daysLeft === 0 ? 'due today' : `${t.daysLeft} day${t.daysLeft === 1 ? '' : 's'} left`;
        return (
          <View key={t.stage + t.key} style={[styles.row, { borderLeftColor: c }]}>
            <ThemedText type="small" style={{ fontWeight: '800', color: c, fontSize: 12.5, width: 110 }}>{when}</ThemedText>
            <ThemedText type="small" style={{ flex: 1, lineHeight: 18 }}>{t.label} <ThemedText type="small" themeColor="textSecondary">({t.rule})</ThemedText></ThemedText>
          </View>
        );
      }) : null}
      {claim.status === 'open' ? (
        <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
          <Pressable onPress={() => onOutcome('paid')} style={({ pressed }) => [styles.outcome, { borderColor: theme.good }, pressed && { opacity: 0.7 }]}><ThemedText type="small" style={{ color: theme.good, fontWeight: '800' }}>They paid</ThemedText></Pressable>
          <Pressable onPress={() => onOutcome('denied')} style={({ pressed }) => [styles.outcome, { borderColor: theme.bad }, pressed && { opacity: 0.7 }]}><ThemedText type="small" style={{ color: theme.bad, fontWeight: '800' }}>They refused</ThemedText></Pressable>
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 12 },
  title: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  next: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 8 },
  btn: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, marginTop: 8, minHeight: 36, justifyContent: 'center' },
  row: { flexDirection: 'row', gap: 8, borderLeftWidth: 3, paddingLeft: 8, paddingVertical: 5, marginTop: 6, alignItems: 'flex-start' },
  outcome: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, minHeight: 36, justifyContent: 'center' },
});
