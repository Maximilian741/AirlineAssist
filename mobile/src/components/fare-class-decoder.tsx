/**
 * "Decode the letter on your ticket" — the fare-class decoder, ported from the web.
 *
 * The one-letter booking class decides whether the companion certificate works, whether you can
 * upgrade, and whether you can change the flight. Printed on every confirmation, explained on none.
 * Certificate eligibility comes from Delta's own certificate terms (certain); the wider cabin map is
 * the typical structure and says so.
 *
 * Logic: lib/fareclass.ts (parity-tested against the web module across every letter × tier).
 */
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
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
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>BOOKING CLASS</ThemedText>
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
            style={[styles.input, { borderColor: theme.line, color: theme.text, backgroundColor: theme.card }]}
          />
        </View>
        <View style={{ flex: 1 }}>
          <ThemedText type="small" themeColor="textSecondary" style={styles.label}>YOUR CARD</ThemedText>
          <View style={styles.chips}>
            {(['platinum', 'reserve'] as TierId[]).map((t) => {
              const on = t === tier;
              return (
                <Pressable
                  key={t}
                  onPress={() => setTier(t)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  style={[styles.chip, { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.backgroundSelected : theme.card }]}>
                  <ThemedText type="small" style={{ fontWeight: on ? '800' : '500' }}>{t === 'reserve' ? 'Reserve' : 'Platinum'}</ThemedText>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      {raw && !d ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.body}>Enter a single letter from your confirmation.</ThemedText>
      ) : null}

      {d && !d.known ? (
        <ThemedView type="card" style={[styles.card, { borderColor: theme.line, borderLeftColor: theme.line }]}>
          <ThemedText style={styles.cardTitle}>Class {d.code}</ThemedText>
          <ThemedText type="small" style={styles.body}>{d.summary}</ThemedText>
        </ThemedView>
      ) : null}

      {d && d.known ? (
        <ThemedView type="card" style={[styles.card, { borderColor: d.cert.ok ? theme.good : theme.bad, borderLeftColor: d.cert.ok ? theme.good : theme.bad }]}>
          <View style={styles.cardHead}>
            <ThemedText style={[styles.cardTitle, { flex: 1 }]}>Class {d.code} — {d.tier}</ThemedText>
            <ThemedText type="small" style={{ fontWeight: '800', color: d.cert.ok ? theme.good : theme.bad }}>
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
        </ThemedView>
      ) : null}

      <EligibleList tier={tier} theme={theme} />
    </View>
  );
}

function EligibleList({ tier, theme }: { tier: TierId; theme: Theme }) {
  return (
    <ThemedView type="card" style={[styles.card, { borderColor: theme.line, borderLeftColor: theme.brand }]}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.label}>WHAT YOUR CERTIFICATE CAN ACTUALLY TICKET</ThemedText>
      {eligibleList(tier).map((g) => (
        <View key={g.cabin} style={[styles.elRow, { borderBottomColor: theme.line }]}>
          <ThemedText type="small" style={{ fontWeight: '700', flex: 1 }}>{g.cabin}</ThemedText>
          <View style={styles.codes}>
            {g.codes.map((c) => (
              <View key={c} style={[styles.code, { borderColor: theme.line }]}>
                <ThemedText type="small" style={{ fontWeight: '800', color: theme.brand }}>{c}</ThemedText>
              </View>
            ))}
          </View>
        </View>
      ))}
      <ThemedText type="small" themeColor="textSecondary" style={[styles.body, { fontSize: 12.5 }]}>
        These seats have to be open for sale in that exact bucket — that’s why a flight can show plenty of empty seats and still
        refuse the certificate.
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  lede: { lineHeight: 20, marginBottom: 10 },
  inputRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  label: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4, marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 8, width: 64, height: 48, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, minHeight: 44, justifyContent: 'center' },
  card: { borderWidth: 1, borderLeftWidth: 3, borderRadius: 8, padding: 12, marginTop: 10 },
  cardHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: '800' },
  body: { lineHeight: 19, marginTop: 4 },
  elRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, gap: 8 },
  codes: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' },
  code: { borderWidth: 1, borderRadius: 4, paddingHorizontal: 7, paddingVertical: 1 },
});
