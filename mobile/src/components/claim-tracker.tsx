/**
 * ClaimTracker — the block under a finished claim: every filing on the record, the legal clocks each
 * one started, and the next move the day the airline misses one. Data via lib/claimtrack.ts (pure);
 * persistence in AsyncStorage `ff-claims` (same key/shape as the web).
 *
 * Set as one bordered sheet: a serif masthead, a recessed "next move" band with an accent rail down
 * its margin, then the clocks as hairline-separated rows. Rules in constants/theme.ts.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Radius, Spacing } from '@/constants/theme';
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
      <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
        <View style={styles.head}>
          <ThemedText type="section">After you send it</ThemedText>
        </View>
        <View style={[styles.rule, { backgroundColor: theme.line }]} />
        <View style={styles.body}>
          <ThemedText type="small" themeColor="textSecondary">
            The moment you file, the airline is on a legal clock: 30 days to acknowledge, 60 to answer in writing (14 CFR 259.7), 7 business days to refund a card (14 CFR 260.10). Use the buttons above and this block starts counting — and tells you the day they miss one, and what to do next.
          </ThemedText>
        </View>
      </View>
    );
  }
  const tl = timeline(claim);
  const na = nextAction(claim);
  const stages = claim.filings.map((f) => `${f.stage === 'airline' ? 'Airline' : f.stage === 'dot' ? 'DOT' : f.stage === 'chargeback' ? 'Chargeback' : 'Final notice'} ${fmt(f.date)}`).join(' · ');
  const overdue = tl.filter((t) => t.status === 'overdue').length;
  const naColor = na.kind === 'escalate' ? theme.bad : na.kind === 'closed' ? theme.good : theme.text;
  return (
    <View
      style={[
        styles.sheet,
        { backgroundColor: theme.card },
        // A blown clock is the one thing that lets this sheet raise its voice.
        overdue ? { borderColor: theme.bad, borderWidth: 1.5 } : { borderColor: theme.line },
      ]}>
      <View style={styles.head}>
        <ThemedText type="section">Claim tracker</ThemedText>
        <ThemedText type="small" themeColor="textSecondary" style={styles.filings}>{stages}{claim.amount ? `  ·  ${claim.amount}` : ''}{overdue ? `  ·  ${overdue} clock${overdue === 1 ? '' : 's'} blown` : ''}</ThemedText>
      </View>
      <View style={[styles.next, { backgroundColor: theme.backgroundElement, borderTopColor: theme.line, borderLeftColor: naColor }]}>
        <ThemedText type="eyebrow" style={{ color: naColor }}>Next</ThemedText>
        <ThemedText type="small" style={styles.nextLine}>{na.text}</ThemedText>
        {na.kind === 'escalate' && na.channel ? (
          <Pressable onPress={() => onEscalate(na.channel!)} style={({ pressed }) => [styles.btnHit, pressed && styles.pressed]}>
            <View style={[styles.btn, { backgroundColor: theme.brandDeep }]}>
              <ThemedText style={styles.btnText}>Escalate now →</ThemedText>
            </View>
          </Pressable>
        ) : null}
      </View>
      {claim.status === 'open' ? tl.map((t) => {
        const c = t.status === 'overdue' ? theme.bad : t.status === 'due-soon' ? theme.warn : theme.textSecondary;
        const when = t.daysLeft < 0 ? `${-t.daysLeft} day${t.daysLeft === -1 ? '' : 's'} overdue` : t.daysLeft === 0 ? 'due today' : `${t.daysLeft} day${t.daysLeft === 1 ? '' : 's'} left`;
        return (
          <View key={t.stage + t.key} style={[styles.row, { borderTopColor: theme.line }]}>
            <ThemedText type="small" style={[styles.when, { color: c }]}>{when}</ThemedText>
            <ThemedText type="small" style={styles.clock}>{t.label} <ThemedText type="small" themeColor="textSecondary">({t.rule})</ThemedText></ThemedText>
          </View>
        );
      }) : null}
      {claim.status === 'open' ? (
        <View style={[styles.outcomes, { borderTopColor: theme.line }]}>
          <Pressable onPress={() => onOutcome('paid')} style={({ pressed }) => (pressed ? styles.pressed : null)}>
            <View style={[styles.outcome, { borderColor: theme.line }]}><ThemedText type="smallBold" style={{ color: theme.good }}>They paid</ThemedText></View>
          </Pressable>
          <Pressable onPress={() => onOutcome('denied')} style={({ pressed }) => (pressed ? styles.pressed : null)}>
            <View style={[styles.outcome, { borderColor: theme.line }]}><ThemedText type="smallBold" style={{ color: theme.bad }}>They refused</ThemedText></View>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.three },
  head: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two + 2 },
  rule: { height: StyleSheet.hairlineWidth },
  body: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  filings: { marginTop: Spacing.one, fontVariant: ['tabular-nums'] },
  // The next move: a recessed band, the accent carried by a rail down its margin.
  next: { borderTopWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, paddingVertical: Spacing.three, paddingRight: Spacing.three, paddingLeft: Spacing.three - 3 },
  nextLine: { marginTop: Spacing.one + 1 },
  // The tap area is the button, not the whole band it sits in.
  btnHit: { alignSelf: 'flex-start' },
  btn: { borderRadius: Radius.sm, paddingHorizontal: Spacing.three, minHeight: 44, justifyContent: 'center', marginTop: Spacing.two + 2 },
  btnText: { color: '#fdfbf5', fontWeight: '700', fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.two + 2, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two + 2 },
  when: { width: 112, fontSize: 13.5, fontWeight: '700', fontVariant: ['tabular-nums'] },
  clock: { flex: 1 },
  outcomes: { flexDirection: 'row', gap: Spacing.two + 2, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: Spacing.three, paddingVertical: Spacing.three },
  outcome: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.three, minHeight: 44, justifyContent: 'center' },
  pressed: { opacity: 0.75 },
});
