/**
 * "Your airline's own contract" — the Contract of Carriage decoder, ported from the web.
 *
 * Most consumer-protection suits against airlines are preempted by federal law, but breach of the
 * airline's OWN contract is not (American Airlines v. Wolens, 513 U.S. 219). So the contract is the
 * enforceable document — and nobody reads it. Each provision here carries the rule number to cite,
 * the verbatim quote, the words to say at the counter, and the catch.
 *
 * Data: data/coc-full.ts (generated from the web decode; parity-tested).
 *
 * Looks: the editorial system in constants/theme.ts — the provisions are an index in ONE
 * hairline-ruled sheet, the contract is quoted in serif italic, oxblood is kept for the catch.
 */
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { COC_FULL, type CocProvision } from '@/data/coc-full';
import { useTheme } from '@/hooks/use-theme';

type Theme = ReturnType<typeof useTheme>;

const shortName = (name: string) => name.replace(/\s*\(.*$/, '');

export function CocDecoder() {
  const theme = useTheme();
  const [idx, setIdx] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const a = COC_FULL[idx];
  if (!a) return null;

  const pick = (i: number) => { setIdx(i); setOpen(null); };
  const divider = { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line };

  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.lede}>
        Every ticket is governed by a 50–100 page Contract of Carriage that almost nobody reads. Most lawsuits
        against airlines are blocked by federal law — but breach of the airline&apos;s own contract is not
        (American Airlines v. Wolens). We read them and pulled out the parts you can use, with the rule
        numbers to quote.
      </ThemedText>

      <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.pickerLabel}>WHICH AIRLINE</ThemedText>
      <View style={styles.chips}>
        {COC_FULL.map((x, i) => {
          const on = i === idx;
          return (
            <Pressable
              key={x.iata + i}
              onPress={() => pick(i)}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`Contract of carriage: ${shortName(x.airline)}`}
              style={({ pressed }) => [
                styles.chip,
                { borderColor: on ? theme.brandDeep : theme.line, backgroundColor: on ? theme.backgroundSelected : 'transparent' },
                pressed ? styles.pressed : null,
              ]}>
              <ThemedText type="small" style={{ fontWeight: on ? '700' : '400' }}>{shortName(x.airline)}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.meta}>
        <Pressable
          onPress={() => Linking.openURL(a.cocUrl.split(' ')[0]).catch(() => {})}
          hitSlop={8}
          style={({ pressed }) => [styles.linkTap, pressed ? styles.pressed : null]}>
          <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>Read the full contract →</ThemedText>
        </Pressable>
        {a.confidence && a.confidence !== 'high' ? (
          <ThemedText type="eyebrow" style={{ color: theme.warn }}>Verify before relying on this</ThemedText>
        ) : null}
      </View>
      {a.lastUpdated ? (
        <ThemedText type="small" themeColor="textSecondary" numberOfLines={3}>{a.lastUpdated}</ThemedText>
      ) : null}

      {/* The contract at a glance: one sheet of hairline-separated facts, not a stack of cards. */}
      <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
        {a.buriedGem ? (
          <View style={styles.sheetRow}>
            <ThemedText style={styles.rowLabel}>The buried one</ThemedText>
            <ThemedText type="small" style={styles.body}>{a.buriedGem}</ThemedText>
          </View>
        ) : null}
        <View style={[styles.sheetRow, a.buriedGem ? divider : null]}>
          <ThemedText style={styles.rowLabel}>Schedule change that triggers a refund</ThemedText>
          <ThemedText type="small" style={styles.body}>{a.scheduleChangeThreshold}</ThemedText>
        </View>
        <View style={[styles.sheetRow, divider]}>
          <ThemedText style={styles.rowLabel}>Will they put you on another airline?</ThemedText>
          <ThemedText type="small" style={styles.body}>{a.rebooksOnOtherAirlines}</ThemedText>
        </View>
      </View>

      <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.sectionLabel}>
        WHAT YOU CAN QUOTE AT THEM ({a.provisions.length})
      </ThemedText>
      <View style={[styles.sheet, styles.sheetFlush, { backgroundColor: theme.card, borderColor: theme.line }]}>
        {a.provisions.map((p, i) => (
          <Provision key={p.topic + i} p={p} first={i === 0} open={open === i} onToggle={() => setOpen(open === i ? null : i)} theme={theme} />
        ))}
      </View>
    </View>
  );
}

function Provision({ p, open, onToggle, theme, first }: { p: CocProvision; open: boolean; onToggle: () => void; theme: Theme; first?: boolean }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!p.howToUse) return;
    try {
      await Clipboard.setStringAsync(p.howToUse);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };
  return (
    <View style={first ? null : { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.provHead, pressed ? styles.pressed : null]}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.provTopic}>{p.topic}</ThemedText>
          <ThemedText type="eyebrow" style={{ color: theme.brand, marginTop: 3 }}>{p.ruleNumber}</ThemedText>
        </View>
        <ThemedText style={[styles.toggle, { color: theme.textSecondary }]}>{open ? '−' : '+'}</ThemedText>
      </Pressable>
      {open ? (
        <View style={styles.provBody}>
          {p.ruleNote ? <ThemedText type="small" themeColor="textSecondary" style={styles.body}><ThemedText type="smallBold">Where to find it: </ThemedText>{p.ruleNote}</ThemedText> : null}
          <ThemedText type="small" style={styles.body}>{p.plainEnglish}</ThemedText>
          {p.exactQuote ? (
            <View style={[styles.quote, { borderLeftColor: theme.line }]}>
              <ThemedText style={styles.quoteText}>“{p.exactQuote}”</ThemedText>
            </View>
          ) : null}
          {p.howToUse ? (
            <View style={[styles.say, { backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
              <View style={styles.sayHead}>
                <ThemedText type="eyebrow" themeColor="textSecondary">How to invoke it</ThemedText>
                <Pressable
                  onPress={copy}
                  hitSlop={8}
                  style={({ pressed }) => [styles.copyTap, pressed ? styles.pressed : null]}
                  accessibilityLabel="Copy what to say">
                  <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{copied ? 'Copied' : 'Copy'}</ThemedText>
                </Pressable>
              </View>
              <ThemedText type="small" style={styles.body}>{p.howToUse}</ThemedText>
            </View>
          ) : null}
          {p.catch ? <ThemedText type="small" style={styles.body}><ThemedText type="smallBold" style={{ color: theme.bad }}>The catch: </ThemedText>{p.catch}</ThemedText> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  lede: { marginBottom: Spacing.three },
  pickerLabel: { marginBottom: Spacing.two },
  sectionLabel: { marginTop: Spacing.four, marginBottom: Spacing.two },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.three - 4, paddingVertical: Spacing.two, minHeight: 44, justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: Spacing.three, marginTop: Spacing.two },
  linkTap: { minHeight: 44, justifyContent: 'center' },

  // one sheet, hairline-separated rows
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.three },
  sheetFlush: { marginTop: 0 },
  sheetRow: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  rowLabel: { fontFamily: Fonts.serif, fontSize: 16, lineHeight: 22, fontWeight: '700' },
  body: { marginTop: Spacing.one + 2 },

  provHead: { flexDirection: 'row', alignItems: 'center', paddingVertical: Spacing.three, paddingHorizontal: Spacing.three, minHeight: 56 },
  provTopic: { fontFamily: Fonts.serif, fontSize: 16.5, lineHeight: 22, fontWeight: '700' },
  toggle: { fontSize: 19, paddingLeft: Spacing.two },
  provBody: { paddingHorizontal: Spacing.three, paddingBottom: Spacing.three },
  quote: { borderLeftWidth: 2, paddingLeft: Spacing.two + 2, marginTop: Spacing.two + 2 },
  quoteText: { fontFamily: Fonts.serif, fontStyle: 'italic', fontSize: 14.5, lineHeight: 21 },
  say: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, padding: Spacing.two + 2, marginTop: Spacing.three },
  sayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copyTap: { minHeight: 36, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
  pressed: { opacity: 0.75 },
});
