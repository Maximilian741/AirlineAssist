/**
 * "Your airline's own contract" — the Contract of Carriage decoder, ported from the web.
 *
 * Most consumer-protection suits against airlines are preempted by federal law, but breach of the
 * airline's OWN contract is not (American Airlines v. Wolens, 513 U.S. 219). So the contract is the
 * enforceable document — and nobody reads it. Each provision here carries the rule number to cite,
 * the verbatim quote, the words to say at the counter, and the catch.
 *
 * Data: data/coc-full.ts (generated from the web decode; parity-tested).
 */
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { Linking, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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

  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.lede}>
        Every ticket is governed by a 50–100 page Contract of Carriage that almost nobody reads. Most lawsuits
        against airlines are blocked by federal law — but breach of the airline&apos;s own contract is not
        (American Airlines v. Wolens). We read them and pulled out the parts you can use, with the rule
        numbers to quote.
      </ThemedText>

      <ThemedText type="small" themeColor="textSecondary" style={styles.pickerLabel}>WHICH AIRLINE</ThemedText>
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
              style={[styles.chip, { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.backgroundSelected : theme.card }]}>
              <ThemedText type="small" style={{ fontWeight: on ? '800' : '500' }}>{shortName(x.airline)}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.meta}>
        <Pressable onPress={() => Linking.openURL(a.cocUrl.split(' ')[0]).catch(() => {})} hitSlop={8} style={styles.linkTap}>
          <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>Read the full contract →</ThemedText>
        </Pressable>
        {a.confidence && a.confidence !== 'high' ? (
          <ThemedText type="small" style={{ color: theme.warn, fontWeight: '700' }}>Verify before relying on this</ThemedText>
        ) : null}
      </View>
      {a.lastUpdated ? (
        <ThemedText type="small" themeColor="textSecondary" style={{ fontSize: 12, lineHeight: 17 }} numberOfLines={3}>{a.lastUpdated}</ThemedText>
      ) : null}

      {a.buriedGem ? (
        <ThemedView type="card" style={[styles.card, { borderColor: theme.good, borderLeftColor: theme.good }]}>
          <ThemedText style={styles.cardTitle}>The buried one</ThemedText>
          <ThemedText type="small" style={styles.body}>{a.buriedGem}</ThemedText>
        </ThemedView>
      ) : null}

      <ThemedView type="card" style={[styles.card, { borderColor: theme.line, borderLeftColor: theme.brand }]}>
        <ThemedText type="smallBold" style={styles.factK}>Schedule change that triggers a refund</ThemedText>
        <ThemedText type="small" style={styles.body}>{a.scheduleChangeThreshold}</ThemedText>
        <ThemedText type="smallBold" style={[styles.factK, { marginTop: 10 }]}>Will they put you on another airline?</ThemedText>
        <ThemedText type="small" style={styles.body}>{a.rebooksOnOtherAirlines}</ThemedText>
      </ThemedView>

      <ThemedText type="small" themeColor="textSecondary" style={[styles.pickerLabel, { marginTop: 14 }]}>
        WHAT YOU CAN QUOTE AT THEM ({a.provisions.length})
      </ThemedText>
      {a.provisions.map((p, i) => (
        <Provision key={p.topic + i} p={p} open={open === i} onToggle={() => setOpen(open === i ? null : i)} theme={theme} />
      ))}
    </View>
  );
}

function Provision({ p, open, onToggle, theme }: { p: CocProvision; open: boolean; onToggle: () => void; theme: Theme }) {
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
    <ThemedView type="card" style={[styles.prov, { borderColor: open ? theme.brand : theme.line }]}>
      <Pressable
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={styles.provHead}>
        <View style={{ flex: 1 }}>
          <ThemedText style={{ fontWeight: '700', fontSize: 14.5, lineHeight: 20 }}>{p.topic}</ThemedText>
          <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700', fontSize: 12, marginTop: 2 }}>{p.ruleNumber}</ThemedText>
        </View>
        <ThemedText style={{ color: theme.textSecondary, fontSize: 18, paddingLeft: 8 }}>{open ? '−' : '+'}</ThemedText>
      </Pressable>
      {open ? (
        <View style={styles.provBody}>
          {p.ruleNote ? <ThemedText type="small" themeColor="textSecondary" style={styles.body}><ThemedText type="smallBold">Where to find it: </ThemedText>{p.ruleNote}</ThemedText> : null}
          <ThemedText type="small" style={styles.body}>{p.plainEnglish}</ThemedText>
          {p.exactQuote ? (
            <View style={[styles.quote, { borderLeftColor: theme.line }]}>
              <ThemedText type="small" style={{ fontStyle: 'italic', lineHeight: 19 }}>“{p.exactQuote}”</ThemedText>
            </View>
          ) : null}
          {p.howToUse ? (
            <ThemedView type="backgroundElement" style={styles.say}>
              <View style={styles.sayHead}>
                <ThemedText type="smallBold">How to invoke it</ThemedText>
                <Pressable onPress={copy} hitSlop={8} style={styles.copyTap} accessibilityLabel="Copy what to say">
                  <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{copied ? 'Copied' : 'Copy'}</ThemedText>
                </Pressable>
              </View>
              <ThemedText type="small" style={styles.body}>{p.howToUse}</ThemedText>
            </ThemedView>
          ) : null}
          {p.catch ? <ThemedText type="small" style={[styles.body, { color: theme.warn }]}><ThemedText type="smallBold" style={{ color: theme.warn }}>The catch: </ThemedText>{p.catch}</ThemedText> : null}
        </View>
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  lede: { lineHeight: 20, marginBottom: 12 },
  pickerLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, minHeight: 44, justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  linkTap: { minHeight: 44, justifyContent: 'center' },
  card: { borderWidth: 1, borderLeftWidth: 3, borderRadius: 8, padding: 12, marginTop: 10 },
  cardTitle: { fontSize: 15, fontWeight: '800', marginBottom: 4 },
  factK: { fontSize: 13 },
  body: { lineHeight: 19, marginTop: 4 },
  prov: { borderWidth: 1, borderRadius: 8, marginTop: 8, overflow: 'hidden' },
  provHead: { flexDirection: 'row', alignItems: 'center', padding: 12, minHeight: 56 },
  provBody: { paddingHorizontal: 12, paddingBottom: 12 },
  quote: { borderLeftWidth: 3, paddingLeft: 10, marginTop: 8 },
  say: { borderRadius: 8, padding: 10, marginTop: 10 },
  sayHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copyTap: { minHeight: 36, minWidth: 44, alignItems: 'flex-end', justifyContent: 'center' },
});
