/**
 * "Decode the letter on your ticket" — the fare-class decoder, ported from the web.
 *
 * The one-letter booking class decides whether the companion certificate works, whether you can
 * upgrade, and whether you can change the flight. Printed on every confirmation, explained on none.
 * Certificate eligibility comes from Delta's own certificate terms (certain); the wider cabin map is
 * the typical structure and says so.
 *
 * Logic: lib/fareclass.ts (parity-tested against the web module across every letter × tier).
 *
 * Looks: the editorial system in constants/theme.ts — the letter is set in the mono face, because it
 * is a code; the verdict is the only place colour is allowed to speak.
 */
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { decode, eligibleList, type TierId } from '@/lib/fareclass';

type Theme = ReturnType<typeof useTheme>;

export function FareClassDecoder() {
  const theme = useTheme();
  const [code, setCode] = useState('');
  const [tier, setTier] = useState<TierId>('platinum');

  const raw = code.trim();
  const d = raw ? decode(raw, tier) : null;

  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.lede}>
        Every ticket has a one-letter booking class. It decides whether your companion certificate works, whether you can
        upgrade, and whether you can change your flight — and two people in neighbouring seats can hold completely different
        rights. Find it on your confirmation (often labelled “Class” or “Fare class”).
      </ThemedText>

      <View style={styles.inputRow}>
        <View>
          <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.label}>BOOKING CLASS</ThemedText>
          <TextInput
            value={code}
            // Keep the LAST letter typed, so typing over an old letter replaces it instead of being ignored.
            onChangeText={(v) => setCode(v.replace(/[^a-zA-Z]/g, '').slice(-1).toUpperCase())}
            selectTextOnFocus
            autoCapitalize="characters"
            autoCorrect={false}
            placeholder="T"
            placeholderTextColor={theme.textSecondary}
            accessibilityLabel="Booking class letter"
            style={[styles.input, { borderColor: theme.line, color: theme.text, backgroundColor: theme.backgroundElement }]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.label}>YOUR CARD</ThemedText>
          <View style={styles.chips}>
            {(['platinum', 'reserve'] as TierId[]).map((t) => {
              const on = t === tier;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTier(t)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={({ pressed }) => [
                    styles.chip,
                    { borderColor: on ? theme.brandDeep : theme.line, backgroundColor: on ? theme.backgroundSelected : 'transparent' },
                    pressed ? styles.pressed : null,
                  ]}>
                  <ThemedText type="small" style={{ fontWeight: on ? '700' : '400' }}>{t === 'reserve' ? 'Reserve' : 'Platinum'}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {raw && !d ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.hint}>Enter a single letter from your confirmation.</ThemedText>
      ) : null}

      {d && !d.known ? (
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
          <View style={styles.sheetRow}>
            <ThemedText style={styles.cardTitle}>Class {d.code}</ThemedText>
            <ThemedText type="small" style={styles.body}>{d.summary}</ThemedText>
          </View>
        </View>
      ) : null}

      {d && d.known ? (
        <View style={[styles.verdict, { backgroundColor: theme.card, borderColor: theme.line, borderLeftColor: d.cert.ok ? theme.good : theme.bad }]}>
          <View style={styles.cardHead}>
            <ThemedText style={[styles.cardTitle, { flex: 1 }]}>Class {d.code} — {d.tier}</ThemedText>
            <ThemedText type="eyebrow" style={{ color: d.cert.ok ? theme.good : theme.bad }}>
              {d.cert.ok ? 'Certificate works' : 'Not eligible'}
            </ThemedText>
          </View>
          <ThemedText type="small" style={styles.body}>
            {d.cert.ok
              ? `This books into ${d.cert.cabin}, which your ${tier === 'reserve' ? 'Reserve' : 'Platinum'} certificate can ticket. If the fare looks right, the companion should price out at taxes only.`
              : d.cert.why}
          </ThemedText>
          {d.note ? <ThemedText type="small" themeColor="textSecondary" style={styles.body}>{d.note}</ThemedText> : null}
          <ThemedText type="small" themeColor="textSecondary" style={styles.body}>Cabin: {d.cabin} · Changes/refunds: {d.flexibility}</ThemedText>
          {!d.certain ? (
            <ThemedText type="small" themeColor="textSecondary" style={styles.body}>
              Delta rotates inventory codes, so treat the cabin as the typical structure and confirm on your ticket. The certificate
              eligibility above is from Delta’s own certificate terms.
            </ThemedText>
          ) : null}
          {d.cert.upgradeHint ? (
            <ThemedText type="small" style={[styles.body, { color: theme.brand }]}>
              Worth knowing: this is exactly what the Reserve card buys you over Platinum — the higher cabins.
            </ThemedText>
          ) : null}
        </View>
      ) : null}

      <EligibleList tier={tier} theme={theme} />
    </View>
  );
}

function EligibleList({ tier, theme }: { tier: TierId; theme: Theme }) {
  return (
    <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.line }]}>
      <View style={styles.sheetHead}>
        <ThemedText type="eyebrow" themeColor="textSecondary">WHAT YOUR CERTIFICATE CAN ACTUALLY TICKET</ThemedText>
      </View>
      {eligibleList(tier).map((g) => (
        <View key={g.cabin} style={[styles.elRow, { borderTopColor: theme.line }]}>
          <ThemedText style={styles.elCabin}>{g.cabin}</ThemedText>
          <View style={styles.codes}>
            {g.codes.map((c) => (
              <View key={c} style={[styles.code, { borderColor: theme.line, backgroundColor: theme.backgroundElement }]}>
                <ThemedText type="code" style={styles.codeText}>{c}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      ))}
      <View style={[styles.elFoot, { borderTopColor: theme.line }]}>
        <ThemedText type="small" themeColor="textSecondary">
          These seats have to be open for sale in that exact bucket — that’s why a flight can show plenty of empty seats and still
          refuse the certificate.
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  lede: { marginBottom: Spacing.three },
  inputRow: { flexDirection: 'row', gap: Spacing.three, alignItems: 'flex-start' },
  label: { marginBottom: Spacing.two },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, width: 64, height: 48, fontFamily: Fonts.mono, fontSize: 22, fontWeight: '700', textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.three - 4, paddingVertical: Spacing.two, minHeight: 44, justifyContent: 'center' },
  hint: { marginTop: Spacing.three },

  // the verdict: the one place colour speaks
  verdict: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three, marginTop: Spacing.three },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cardTitle: { fontFamily: Fonts.serif, fontSize: 17, lineHeight: 23, fontWeight: '700' },
  body: { marginTop: Spacing.one + 2 },

  // one sheet, hairline-separated rows
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden', marginTop: Spacing.three },
  sheetHead: { paddingHorizontal: Spacing.three, paddingTop: Spacing.three, paddingBottom: Spacing.two },
  sheetRow: { paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  elRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.two + 2, paddingHorizontal: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth },
  elCabin: { fontFamily: Fonts.serif, fontSize: 15.5, lineHeight: 21, fontWeight: '700', flex: 1 },
  codes: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.one, justifyContent: 'flex-end' },
  code: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: 7, paddingVertical: 2 },
  codeText: { fontSize: 13, fontWeight: '700' },
  elFoot: { paddingHorizontal: Spacing.three, paddingVertical: Spacing.three, borderTopWidth: StyleSheet.hairlineWidth },
  pressed: { opacity: 0.75 },
});
