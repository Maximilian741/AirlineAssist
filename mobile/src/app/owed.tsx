import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import * as Print from 'expo-print';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { openBrowserAsync } from 'expo-web-browser';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ClaimTrackerView, loadClaims, useClaimTracker } from '@/components/claim-tracker';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing, TopTabInset } from '@/constants/theme';
import { AIRLINES } from '@/data/airlines';
import { useTheme } from '@/hooks/use-theme';
import {
  assess,
  chargebackLetter,
  fill,
  nextQuestion,
  prefilledHistory,
  smallClaimsNotice,
  type Answers,
  type ClaimResult,
  type Details,
  type Entitlement,
  type Question,
} from '@/lib/claim-engine';
import { bigAmount, caption, topRule } from '@/lib/viral';
import { claimAnswers, claimDetails, type Trip } from '@/lib/trips';

const shortName = (n: string) => n.replace(/\s*\(.*\)\s*$/, '');
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function docHtml(title: string, body: string) {
  return `<html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapeHtml(title)}</title><style>body{font:15px/1.7 Georgia,'Times New Roman',serif;padding:36px;white-space:pre-wrap;color:#111}</style></head><body>${escapeHtml(body)}</body></html>`;
}

// Minutes of schedule shift -> the wizard's band. Mirrors web app.js deltaBand().
function deltaBand(min: number): NonNullable<Answers['schedDelta']> {
  if (!isFinite(min)) return '3-4';
  if (min < 60) return '<1';
  if (min < 120) return '1-2';
  if (min < 180) return '2-3';
  if (min < 240) return '3-4';
  if (min < 360) return '4-6';
  return '6+';
}

export default function OwedScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [answers, setAnswers] = useState<Answers>({});
  const [history, setHistory] = useState<string[]>([]);
  const [details, setDetails] = useState<Details>({});
  const [airlineIdx, setAirlineIdx] = useState<number | null>(null);
  const [variant, setVariant] = useState(0);
  const [status, setStatus] = useState('');
  const cardRef = useRef<View>(null);
  // `delta`/`from`/`to`/`route` arrive when the watchdog found a significant schedule change and the
  // user tapped "Write the refund request" — the letter carries the old and new times as evidence.
  const { tripId, type, delta, from, to, route, earlier } = useLocalSearchParams<{ tripId?: string; type?: string; delta?: string; from?: string; to?: string; route?: string; earlier?: string }>();

  // Opened from crisis mode? Pre-answer the incident type so the wizard starts one step in.
  useEffect(() => {
    if (!type || tripId) return;
    const valid = ['cancelled', 'schedule', 'delayed', 'bumped', 'bag_late', 'bag_lost', 'downgrade', 'extra'];
    if (valid.includes(type)) {
      setAnswers({ type: type as Answers['type'] });
      setHistory(['type']);
    }
  }, [type, tripId]);

  // Opened from a saved trip? Answer the whole wizard and pre-fill the filing details.
  useEffect(() => {
    if (!tripId) return;
    let cancelled = false;
    AsyncStorage.getItem('ff-trips')
      .then((v) => {
        if (cancelled || !v) return;
        const list: Trip[] = JSON.parse(v);
        const t = Array.isArray(list) ? list.find((x) => x.id === tripId) : null;
        if (!t) return;
        const a = claimAnswers(t);
        if (type === 'schedule') {
          // Watchdog evidence overrides the trip's own issue: this is a declined significant change.
          a.type = 'schedule';
          a.schedAccepted = 'no';
          a.schedDelta = route === '1' ? 'route' : deltaBand(Number(delta));
          a.incidentDate = new Date().toISOString().slice(0, 10);
          if (from) a.schedFrom = String(from);
          if (to) a.schedTo = String(to);
          a.schedDirection = earlier === '1' ? 'earlier' : 'later';
          a.flightDate = t.departDate;
          if (a.region === 'from_eu' || a.region === 'from_uk') {
            const days = t.departDate ? Math.round((new Date(t.departDate + 'T00:00:00').getTime() - Date.now()) / 86400000) : null;
            a.schedNotice = days == null ? '14+' : days < 7 ? '<7' : days < 14 ? '7-13' : '14+';
          }
        }
        setAnswers(a);
        setHistory(prefilledHistory(a));
        setDetails(claimDetails(t));
        const i = AIRLINES.findIndex((a) => shortName(a.name) === (t.airline || ''));
        if (i >= 0) setAirlineIdx(i);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [tripId]);

  const q = nextQuestion(answers);
  const res: ClaimResult | null = q ? null : assess(answers);
  const airline = airlineIdx != null ? AIRLINES[airlineIdx] : null;
  // The tracker: filing buttons record the stage; the block below shows the clocks + next move.
  const { claimId } = useLocalSearchParams<{ claimId?: string }>();
  const tracker = useClaimTracker(answers, details, res, claimId || null);
  // Reopened from "Claims in progress": restore the wizard exactly as it was filed.
  useEffect(() => {
    if (!claimId) return;
    let alive = true;
    loadClaims().then((list) => {
      const c = list.find((x) => x.id === claimId);
      if (!alive || !c) return;
      const restored = c.answers || {};
      setAnswers(restored);
      setDetails(c.details || {});
      setHistory(prefilledHistory(restored));
      const i = AIRLINES.findIndex((a) => shortName(a.name) === (c.details?.airline || ''));
      if (i >= 0) setAirlineIdx(i);
    });
    return () => { alive = false; };
  }, [claimId]);

  function answer(id: string, val: unknown) {
    setAnswers((p) => ({ ...p, [id]: val }));
    setHistory((p) => [...p, id]);
  }
  function back() {
    const h = [...history];
    const last = h.pop();
    setHistory(h);
    if (last) setAnswers((a) => { const n = { ...a }; delete n[last]; return n; });
  }
  function restart() {
    setAnswers({});
    setHistory([]);
    setDetails({});
    setAirlineIdx(null);
    setVariant(0);
    setStatus('');
  }

  const setField = (key: keyof Details, v: string) => setDetails((p) => ({ ...p, [key]: v }));
  const letterFilled = () => (res ? fill(res.letterBody, details, answers) : '');
  const dotFilled = () => (res ? fill(res.dotText, details, answers) : '');

  async function doEmail() {
    tracker.track('airline').catch(() => {});
    const body = letterFilled();
    const subj = 'Refund / compensation request' + (details.flightNo ? ' — flight ' + details.flightNo : '');
    if (airline?.defunct) {
      await Clipboard.setStringAsync(body);
      await openBrowserAsync(airline.complaintUrl).catch(() => {});
      setStatus(`${shortName(airline.name)} ceased operations — claims go through its wind-down process. Card purchases usually auto-refund. Letter copied; opened the guest page.`);
      return;
    }
    if (airline?.email) {
      const full = `mailto:${airline.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent(body)}`;
      if (full.length > 1900) {
        // Long letters exceed the OS mailto length cap — copy it and open a short pre-addressed email.
        await Clipboard.setStringAsync(body);
        const short = `mailto:${airline.email}?subject=${encodeURIComponent(subj)}&body=${encodeURIComponent('My demand letter is on my clipboard — pasting it below:\n\n')}`;
        await Linking.openURL(short).catch(() => {});
        setStatus(`Your letter is long, so we copied it — opening email to ${airline.email}; just paste and send.`);
      } else {
        try {
          await Linking.openURL(full);
          setStatus(`Opening your email app, pre-addressed to ${airline.email} — review and hit Send.`);
        } catch {
          await Clipboard.setStringAsync(body);
          setStatus('Couldn’t open your email app — letter copied. Paste it into a new email.');
        }
      }
      return;
    }
    await Clipboard.setStringAsync(body);
    const url = answers.type === 'delayed' || answers.type === 'bumped' ? airline?.complaintUrl || airline?.refundUrl : airline?.refundUrl || airline?.complaintUrl;
    if (url) await openBrowserAsync(url).catch(() => {});
    setStatus('This airline takes claims through its web form (no public email). Letter copied — paste it into the form that opened.');
  }
  async function doDot() {
    tracker.track('dot').catch(() => {});
    await Clipboard.setStringAsync(dotFilled());
    await openBrowserAsync('https://www.transportation.gov/airconsumer/file-consumer-complaint').catch(() => {});
    setStatus('Your DOT complaint text is copied — paste it into the form that opened.');
  }
  async function doPrint(text: string, title: string) {
    try {
      await Print.printAsync({ html: docHtml(title, text) });
    } catch {
      await Clipboard.setStringAsync(text);
      setStatus('Print unavailable here — copied the letter instead.');
    }
  }
  async function doShareCard() {
    try {
      const uri = await captureRef(cardRef, { format: 'png', quality: 1, result: 'tmpfile' });
      if (!uri) {
        setStatus('Couldn’t create the image — try again.');
        return;
      }
      await Clipboard.setStringAsync(caption(res as ClaimResult, answers, details, variant));
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'image/png', dialogTitle: 'Share to TikTok', UTI: 'public.png' });
      }
      setStatus('Caption copied — pick TikTok (Photo mode) and paste it.');
    } catch {
      setStatus('Couldn’t create the image on this device.');
    }
  }

  const contentPad = { paddingTop: insets.top + TopTabInset + Spacing.four, paddingBottom: insets.bottom + BottomTabInset + Spacing.four };

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.content, contentPad]}>
      <View style={styles.inner}>
        {!res ? (
          <QuestionView key={(q as Question).id} q={q as Question} count={history.length} onAnswer={answer} onBack={back} theme={theme} />
        ) : (
          <>
            <ThemedText style={styles.headline} themeColor="brandDeep">{res.headline}</ThemedText>
            {res.entitlements.map((e, i) => (
              <EntitlementCard key={i} e={e} theme={theme} />
            ))}

            <Doc title="✉️ Your demand letter" body={res.letterBody} theme={theme} onCopy={() => Clipboard.setStringAsync(letterFilled())} hint="Fill the [BRACKETS] below, then send." />
            <Doc title="🏛️ DOT complaint text" body={res.dotText} theme={theme} onCopy={() => Clipboard.setStringAsync(dotFilled())} />

            {/* FILE IT */}
            <ThemedView type="backgroundElement" style={[styles.panel, { borderColor: theme.brand }]}>
              <ThemedText style={styles.panelTitle} themeColor="brandDeep">📨 File your claim</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>
                Pick your airline and enter your details once — they fill in on every letter and form below. You review and send each one yourself.
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 4 }}>
                {AIRLINES.map((x, i) => {
                  const on = airlineIdx === i;
                  return (
                    <Pressable key={x.iata} onPress={() => { setAirlineIdx(i); setField('airline', shortName(x.name)); }} style={[styles.chip, { borderColor: on ? theme.brand : theme.line, backgroundColor: on ? theme.backgroundSelected : theme.card }]}>
                      <ThemedText type="small" style={{ fontWeight: '700', color: on ? theme.brandDeep : theme.textSecondary }}>{shortName(x.name)}</ThemedText>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <View style={styles.grid}>
                <Field label="Flight #" value={details.flightNo} onChange={(v) => setField('flightNo', v)} theme={theme} placeholder="DL1234" />
                <Field label="Confirmation #" value={details.confirmation} onChange={(v) => setField('confirmation', v)} theme={theme} placeholder="ABC123" />
                <Field label="From" value={details.origin} onChange={(v) => setField('origin', v)} theme={theme} placeholder="HLN" />
                <Field label="To" value={details.dest} onChange={(v) => setField('dest', v)} theme={theme} placeholder="JFK" />
                <Field label="Your name" value={details.name} onChange={(v) => setField('name', v)} theme={theme} />
                <Field label="Your email/phone" value={details.email} onChange={(v) => setField('email', v)} theme={theme} />
              </View>
              <View style={styles.actions}>
                <ActionBtn label="📧 Email the airline" theme={theme} onPress={doEmail} />
                <ActionBtn label="🏛️ DOT complaint" theme={theme} onPress={doDot} />
                <ActionBtn label="🖨️ Print / PDF" theme={theme} onPress={() => { tracker.track('airline').catch(() => {}); doPrint(letterFilled(), 'Demand letter'); }} />
                {answers.payment === 'credit' ? (
                  <ActionBtn label="💳 Chargeback letter" theme={theme} onPress={() => { tracker.track('chargeback').catch(() => {}); doPrint(fill(chargebackLetter(answers, details), details, answers), 'Chargeback letter'); }} />
                ) : null}
              </View>
            </ThemedView>

            <ClaimTrackerView
              claim={tracker.claim}
              onOutcome={(st) => tracker.outcome(st)}
              onEscalate={(channel) => {
                if (channel === 'file-dot') doDot();
                else if (channel === 'file-charge') { tracker.track('chargeback'); doPrint(fill(chargebackLetter(answers, details), details, answers), 'Chargeback letter'); }
                else if (channel === 'esc-notice') { tracker.track('smallclaims'); doPrint(fill(smallClaimsNotice(answers, details, { amount: tracker.claim?.amount || '' }), details, answers), 'Final notice before small claims'); }
                else doEmail();
              }}
            />

            {/* GO VIRAL */}
            <ThemedView type="backgroundElement" style={[styles.panel, { borderColor: theme.line }]}>
              <ThemedText style={styles.panelTitle} themeColor="brandDeep">📱 Share your receipt</ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.three }}>
                A clear amount plus the rule behind it is what gets shared. Post the receipt so others know to check too.
              </ThemedText>
              <View style={{ alignItems: 'center' }}>
                <ReceiptCard airline={shortName(details.airline || 'The airline')} amount={bigAmount(res, answers)} rule={topRule(res)} />
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.three }}>Caption</ThemedText>
              <Text selectable style={[styles.caption, { color: theme.text, backgroundColor: theme.card, borderColor: theme.line }]}>
                {caption(res, answers, details, variant)}
              </Text>
              <View style={styles.actions}>
                <ActionBtn label="🎲 Remix caption" theme={theme} onPress={() => setVariant((v) => v + 1)} />
                <ActionBtn label="📋 Copy caption" theme={theme} onPress={() => Clipboard.setStringAsync(caption(res, answers, details, variant))} />
                <ActionBtn label="📲 Share to TikTok" theme={theme} onPress={doShareCard} />
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.two }}>
                Tap Share → pick TikTok (Photo mode); your caption is copied to paste. Auto-posting needs a free TikTok developer app — get one and it becomes one tap.
              </ThemedText>
            </ThemedView>

            {status ? <ThemedText type="small" style={{ color: theme.good, fontWeight: '600', marginTop: Spacing.two }}>{status}</ThemedText> : null}
            <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: Spacing.three, fontStyle: 'italic' }}>⚖️ {res.disclaimer}</ThemedText>
            {history.length ? (
              <Pressable onPress={back} accessibilityRole="button" style={({ pressed }) => [styles.cta, { borderWidth: 1.5, borderColor: theme.line, marginTop: Spacing.three }, pressed && { opacity: 0.7 }]}>
                <ThemedText style={{ fontWeight: '700' }}>← Change an answer</ThemedText>
              </Pressable>
            ) : null}
            <Pressable onPress={restart} style={({ pressed }) => [styles.cta, { backgroundColor: theme.brand, marginTop: Spacing.three }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={styles.ctaText}>↺ Check another problem</ThemedText>
            </Pressable>
          </>
        )}
      </View>
      </ScrollView>
      {res ? (
        <View style={{ position: 'absolute', left: -2000, top: 0 }} pointerEvents="none">
          <ReceiptCard refProp={cardRef} airline={shortName(details.airline || 'The airline')} amount={bigAmount(res, answers)} rule={topRule(res)} />
        </View>
      ) : null}
    </View>
  );
}

function QuestionView({ q, count, onAnswer, onBack, theme }: { q: Question; count: number; onAnswer: (id: string, v: unknown) => void; onBack: () => void; theme: ReturnType<typeof useTheme> }) {
  const [val, setVal] = useState('');
  const input = [styles.input, { backgroundColor: theme.card, borderColor: theme.line, color: theme.text }];
  return (
    <View>
      <ThemedText type="small" themeColor="textSecondary" style={styles.qstep}>Question {count + 1}</ThemedText>
      <ThemedText style={styles.qtitle}>{q.title}</ThemedText>
      {q.help ? <ThemedText type="small" themeColor="textSecondary" style={{ marginBottom: Spacing.two }}>{q.help}</ThemedText> : null}
      {q.kind === 'choice' ? (
        <View style={{ gap: 9, marginTop: Spacing.two }}>
          {(q.options || []).map((o) => (
            <Pressable key={o.value} onPress={() => onAnswer(q.id, o.value)} style={({ pressed }) => [styles.opt, { backgroundColor: theme.card, borderColor: theme.line }, pressed && { opacity: 0.7 }]}>
              <ThemedText style={{ fontWeight: '600' }}>{o.label}</ThemedText>
            </Pressable>
          ))}
        </View>
      ) : null}
      {q.kind === 'money' ? (
        <View style={{ marginTop: Spacing.two }}>
          <View style={styles.moneyRow}>
            <ThemedText style={styles.cur}>$</ThemedText>
            <TextInput value={val} onChangeText={setVal} keyboardType="numeric" placeholder="e.g. 250" placeholderTextColor={theme.textSecondary} style={[...input, { flex: 1 }]} />
          </View>
          <Pressable onPress={() => onAnswer(q.id, Number(val) || 0)} style={({ pressed }) => [styles.cta, { backgroundColor: theme.brand, marginTop: Spacing.three }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={styles.ctaText}>Continue →</ThemedText>
          </Pressable>
        </View>
      ) : null}
      {q.kind === 'date' ? (
        <View style={{ marginTop: Spacing.two }}>
          <TextInput value={val} onChangeText={setVal} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary} autoCapitalize="none" autoCorrect={false} style={input} />
          <Pressable onPress={() => onAnswer(q.id, val)} style={({ pressed }) => [styles.cta, { backgroundColor: theme.brand, marginTop: Spacing.three }, pressed && { opacity: 0.7 }]}>
            <ThemedText style={styles.ctaText}>Continue →</ThemedText>
          </Pressable>
        </View>
      ) : null}
      {count ? (
        <Pressable onPress={onBack} style={{ marginTop: Spacing.four }}>
          <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>← Back</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

function EntitlementCard({ e, theme }: { e: Entitlement; theme: ReturnType<typeof useTheme> }) {
  const edge = e.strength === 'strong' ? theme.good : e.strength === 'conditional' ? theme.warn : e.strength === 'action' ? theme.brand : theme.textSecondary;
  const showAmt = e.amountText && e.amountText !== '—' && e.amountText !== '';
  return (
    <ThemedView type="card" style={[styles.eCard, { borderColor: theme.line, borderLeftColor: edge }]}>
      <ThemedText style={{ fontWeight: '800', fontSize: 15.5 }}>{e.title}</ThemedText>
      {showAmt ? <ThemedText style={{ fontWeight: '800', color: e.strength === 'strong' ? theme.good : theme.text, marginTop: 2 }}>{e.amountText}</ThemedText> : null}
      <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 4, lineHeight: 20 }}>{e.detail}</ThemedText>
      {e.rule && e.rule !== '—' ? <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 6 }}>📜 {e.rule}</ThemedText> : null}
      {e.deadline ? <ThemedText type="small" themeColor="textSecondary" style={{ marginTop: 2 }}>⏰ {e.deadline}</ThemedText> : null}
    </ThemedView>
  );
}

function Doc({ title, body, theme, onCopy, hint }: { title: string; body: string; theme: ReturnType<typeof useTheme>; onCopy: () => void; hint?: string }) {
  return (
    <View style={{ marginTop: Spacing.three }}>
      <View style={styles.docHead}>
        <ThemedText style={{ fontWeight: '800' }}>{title}</ThemedText>
        <Pressable onPress={onCopy} hitSlop={8}><ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>Copy</ThemedText></Pressable>
      </View>
      {hint ? <ThemedText type="small" themeColor="textSecondary">{hint}</ThemedText> : null}
      <Text selectable style={[styles.caption, { color: theme.text, backgroundColor: theme.card, borderColor: theme.line }]}>{body}</Text>
    </View>
  );
}

function Field({ label, value, onChange, theme, placeholder }: { label: string; value?: string; onChange: (v: string) => void; theme: ReturnType<typeof useTheme>; placeholder?: string }) {
  return (
    <View style={styles.field}>
      <ThemedText type="small" themeColor="textSecondary" style={{ fontWeight: '700', fontSize: 12 }}>{label}</ThemedText>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={theme.textSecondary} autoCapitalize="characters" autoCorrect={false} style={[styles.input, { backgroundColor: theme.card, borderColor: theme.line, color: theme.text }]} />
    </View>
  );
}

function ActionBtn({ label, theme, onPress }: { label: string; theme: ReturnType<typeof useTheme>; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.action, { borderColor: theme.brand, backgroundColor: theme.card }, pressed && { opacity: 0.7 }]}>
      <ThemedText type="small" style={{ color: theme.brand, fontWeight: '700' }}>{label}</ThemedText>
    </Pressable>
  );
}

function ReceiptCard({ refProp, airline, amount, rule }: { refProp?: React.RefObject<View | null>; airline: string; amount: string; rule: string }) {
  return (
    <View ref={refProp} collapsable={false} style={card.wrap}>
      <View style={card.accent} />
      <Text style={card.kicker}>Most travelers never claim this</Text>
      <Text style={card.headline}>{airline} owes me {amount}.</Text>
      <Text style={card.sub}>They offered a voucher — but federal rules entitle me to a cash refund.</Text>
      <View style={card.receipt}>
        <Text style={card.rlabel}>They owe me</Text>
        <Text style={card.ramt}>{amount}</Text>
        <Text style={card.rlabel}>The law that says so</Text>
        <Text style={card.rrule}>{rule}</Text>
      </View>
      <Text style={card.cta}>What does your airline owe you?</Text>
      <Text style={card.ctaOrange}>Find out free ↓</Text>
      <Text style={card.brand}>Fairfare · know your rights, get paid</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },
  qstep: { fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  qtitle: { fontSize: 22, fontWeight: '800', marginTop: 4, marginBottom: 2 },
  opt: { borderWidth: 1.5, borderRadius: Spacing.three, padding: Spacing.three },
  moneyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cur: { fontSize: 22, fontWeight: '800' },
  input: { borderWidth: 1.5, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two, fontSize: 16 },
  cta: { borderRadius: Spacing.three, paddingVertical: Spacing.three, alignItems: 'center' },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  headline: { fontSize: 21, fontWeight: '800', marginBottom: Spacing.three, lineHeight: 28 },
  eCard: { borderWidth: 1, borderLeftWidth: 5, borderRadius: Spacing.three, padding: Spacing.three, marginBottom: Spacing.two },
  docHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  caption: { borderWidth: 1, borderRadius: Spacing.two, padding: Spacing.three, marginTop: Spacing.one, fontSize: 14, lineHeight: 21 },
  panel: { borderWidth: 1.5, borderRadius: Spacing.three, padding: Spacing.three, marginTop: Spacing.four },
  panelTitle: { fontSize: 17, fontWeight: '800', marginBottom: 4 },
  chip: { borderWidth: 1.5, borderRadius: 999, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
  field: { width: '47%', flexGrow: 1, gap: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
  action: { borderWidth: 1.5, borderRadius: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});

const card = StyleSheet.create({
  wrap: { width: 300, backgroundColor: '#0e1c33', borderRadius: 22, padding: 24, paddingTop: 20 },
  accent: { width: 70, height: 8, borderRadius: 4, backgroundColor: '#1565c0', marginBottom: 16 },
  kicker: { color: '#f3a93c', fontWeight: '800', fontSize: 13 },
  headline: { color: '#ffffff', fontWeight: '900', fontSize: 30, marginTop: 10, lineHeight: 34 },
  sub: { color: '#9db4d6', fontWeight: '600', fontSize: 15, marginTop: 12 },
  receipt: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 18, padding: 18, marginTop: 18 },
  rlabel: { color: '#7fa9e0', fontWeight: '800', fontSize: 13 },
  ramt: { color: '#2bcf86', fontWeight: '900', fontSize: 44, marginVertical: 4 },
  rrule: { color: '#ffffff', fontWeight: '700', fontSize: 18, marginTop: 4 },
  cta: { color: '#ffffff', fontWeight: '900', fontSize: 20, marginTop: 22, lineHeight: 25 },
  ctaOrange: { color: '#f3a93c', fontWeight: '900', fontSize: 18, marginTop: 8 },
  brand: { color: '#9db4d6', fontWeight: '700', fontSize: 13, marginTop: 12 },
});
