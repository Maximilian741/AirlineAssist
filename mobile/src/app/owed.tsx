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
import { BottomTabInset, Fonts, MaxContentWidth, Radius, Spacing, TopTabInset } from '@/constants/theme';
import { AIRLINES } from '@/data/airlines';
import { useTheme } from '@/hooks/use-theme';
import {
  assess,
  chargebackLetter,
  fill,
  exactAmount,
  nextQuestion,
  prefilledHistory,
  pruneAnswers,
  smallClaimsNotice,
  type Answers,
  type ClaimResult,
  type Details,
  type Entitlement,
  type Question,
} from '@/lib/claim-engine';
import { caption, cardCopy, type ShareCopy } from '@/lib/viral';
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
  // The answers that still apply: a trip pre-fills `payment`, but a flown downgrade has no refund to charge back.
  const filed = pruneAnswers(answers);
  const airline = airlineIdx != null ? AIRLINES[airlineIdx] : null;
  // null when nothing firm is owed: then there is no share card at all.
  const shareCopy = res ? cardCopy(res, answers, { ...details, airline: shortName(String(details.airline || '')) }) : null;
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
            {/* The verdict, set as the page's headline — then a rule, then the evidence. */}
            <ThemedText type="display">{res.headline}</ThemedText>
            <View style={[styles.rule, { backgroundColor: theme.line }]} />
            {res.entitlements.length ? (
              <View style={[styles.sheet, styles.sheetTop, { backgroundColor: theme.card, borderColor: theme.line }]}>
                {res.entitlements.map((e, i) => (
                  <EntitlementCard key={i} e={e} theme={theme} first={i === 0} />
                ))}
              </View>
            ) : null}

            <Doc title="Your demand letter" body={res.letterBody} theme={theme} onCopy={() => Clipboard.setStringAsync(letterFilled())} hint="Fill the [BRACKETS] below, then send." />
            <Doc title="DOT complaint text" body={res.dotText} theme={theme} onCopy={() => Clipboard.setStringAsync(dotFilled())} />

            {/* FILE IT */}
            <ThemedView type="card" style={[styles.panel, { borderColor: theme.line }]}>
              <ThemedText type="section">File your claim</ThemedText>
              <View style={[styles.panelRule, { backgroundColor: theme.line }]} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.panelBlurb}>
                Pick your airline and enter your details once — they fill in on every letter and form below. You review and send each one yourself.
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipRail}>
                {AIRLINES.map((x, i) => {
                  const on = airlineIdx === i;
                  return (
                    <Pressable key={x.iata} accessibilityRole="button" hitSlop={{ top: 5, bottom: 5 }} onPress={() => { setAirlineIdx(i); setField('airline', shortName(x.name)); }} style={({ pressed }) => [styles.chip, { borderColor: on ? theme.brandDeep : theme.line, backgroundColor: on ? theme.backgroundSelected : 'transparent' }, pressed && styles.pressed]}>
                      <ThemedText type="small" style={{ fontWeight: on ? '700' : '500', color: on ? theme.brandDeep : theme.textSecondary }}>{shortName(x.name)}</ThemedText>
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
                <ActionBtn label="Email the airline" theme={theme} onPress={doEmail} primary />
                <ActionBtn label="DOT complaint" theme={theme} onPress={doDot} />
                <ActionBtn label="Print / PDF" theme={theme} onPress={() => { tracker.track('airline').catch(() => {}); doPrint(letterFilled(), 'Demand letter'); }} />
                {filed.payment === 'credit' ? (
                  <ActionBtn label="Chargeback letter" theme={theme} onPress={() => { tracker.track('chargeback').catch(() => {}); doPrint(fill(chargebackLetter(answers, details), details, answers), 'Chargeback letter'); }} />
                ) : null}
              </View>
            </ThemedView>

            <ClaimTrackerView
              claim={tracker.claim}
              onOutcome={(st) => tracker.outcome(st)}
              onEscalate={(channel) => {
                if (channel === 'file-dot') doDot();
                else if (channel === 'file-charge') { tracker.track('chargeback'); doPrint(fill(chargebackLetter(answers, details), details, answers), 'Chargeback letter'); }
                else if (channel === 'esc-notice') {
                  // From the result on screen, never a figure stored by an older version (which could be a ceiling).
                  const cash = res.entitlements.find((e) => e.strength === 'strong' && exactAmount(e.amountText));
                  tracker.track('smallclaims');
                  doPrint(fill(smallClaimsNotice(answers, details, { amount: (cash && exactAmount(cash.amountText)) || '' }), details, answers), 'Final notice before small claims');
                }
                else doEmail();
              }}
            />

            {/* GO VIRAL */}
            {shareCopy ? (
            <ThemedView type="card" style={[styles.panel, { borderColor: theme.line }]}>
              <ThemedText type="section">Share your receipt</ThemedText>
              <View style={[styles.panelRule, { backgroundColor: theme.line }]} />
              <ThemedText type="small" themeColor="textSecondary" style={styles.panelBlurb}>
                A clear amount plus the rule behind it is what gets shared. Post the receipt so others know to check too.
              </ThemedText>
              <View style={styles.cardStage}>
                <ReceiptCard copy={shareCopy} />
              </View>
              <ThemedText type="eyebrow" themeColor="textSecondary" style={styles.captionLabel}>Caption</ThemedText>
              <Text selectable style={[styles.captionBox, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>
                {caption(res, answers, details, variant)}
              </Text>
              <View style={styles.actions}>
                <ActionBtn label="Remix caption" theme={theme} onPress={() => setVariant((v) => v + 1)} />
                <ActionBtn label="Copy caption" theme={theme} onPress={() => Clipboard.setStringAsync(caption(res, answers, details, variant))} />
                <ActionBtn label="Share to TikTok" theme={theme} onPress={doShareCard} primary />
              </View>
              <ThemedText type="small" themeColor="textSecondary" style={styles.panelFoot}>
                Tap Share → pick TikTok (Photo mode); your caption is copied to paste. Auto-posting needs a free TikTok developer app — get one and it becomes one tap.
              </ThemedText>
            </ThemedView>
            ) : null}

            {status ? (
              <View style={[styles.status, { backgroundColor: theme.backgroundElement, borderColor: theme.line, borderLeftColor: theme.good }]}>
                <ThemedText type="small">{status}</ThemedText>
              </View>
            ) : null}
            <View style={[styles.rule, styles.footRule, { backgroundColor: theme.line }]} />
            <ThemedText type="small" themeColor="textSecondary" style={styles.disclaimer}>{res.disclaimer}</ThemedText>
            {history.length ? (
              <Pressable onPress={back} accessibilityRole="button" style={({ pressed }) => [styles.cta, styles.ctaGhost, { borderColor: theme.line }, pressed && styles.pressed]}>
                <ThemedText type="smallBold" style={{ color: theme.brand }}>← Change an answer</ThemedText>
              </Pressable>
            ) : null}
            <Pressable onPress={restart} accessibilityRole="button" style={({ pressed }) => [styles.cta, { backgroundColor: theme.brandDeep }, pressed && styles.pressed]}>
              <ThemedText style={styles.ctaText}>↺ Check another problem</ThemedText>
            </Pressable>
          </>
        )}
      </View>
      </ScrollView>
      {res && shareCopy ? (
        <View style={{ position: 'absolute', left: -2000, top: 0 }} pointerEvents="none">
          <ReceiptCard refProp={cardRef} copy={shareCopy} />
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
      <ThemedText type="eyebrow" themeColor="textSecondary">Question {count + 1}</ThemedText>
      <ThemedText type="display" style={styles.qtitle}>{q.title}</ThemedText>
      <View style={[styles.rule, { backgroundColor: theme.line }]} />
      {q.help ? <ThemedText type="small" themeColor="textSecondary" style={styles.qhelp}>{q.help}</ThemedText> : null}
      {q.kind === 'choice' ? (
        // One ruled sheet of answers, not a stack of floating buttons.
        <View style={[styles.sheet, styles.sheetTop, { backgroundColor: theme.card, borderColor: theme.line }]}>
          {(q.options || []).map((o, i) => (
            <Pressable key={o.value} accessibilityRole="button" onPress={() => onAnswer(q.id, o.value)} style={({ pressed }) => (pressed ? styles.pressed : null)}>
              <View style={[styles.opt, i > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
                <ThemedText style={styles.optLabel}>{o.label}</ThemedText>
                <ThemedText style={[styles.arrow, { color: theme.textSecondary }]}>→</ThemedText>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
      {q.kind === 'money' ? (
        <View style={styles.fieldBlock}>
          <View style={styles.moneyRow}>
            <ThemedText type="money" style={[styles.cur, { color: theme.textSecondary }]}>$</ThemedText>
            <TextInput value={val} onChangeText={setVal} keyboardType="numeric" placeholder="e.g. 250" placeholderTextColor={theme.textSecondary} style={[...input, styles.grow]} />
          </View>
          <Pressable accessibilityRole="button" onPress={() => onAnswer(q.id, Number(val) || 0)} style={({ pressed }) => [styles.cta, { backgroundColor: theme.brandDeep }, pressed && styles.pressed]}>
            <ThemedText style={styles.ctaText}>Continue →</ThemedText>
          </Pressable>
        </View>
      ) : null}
      {q.kind === 'date' ? (
        <View style={styles.fieldBlock}>
          <TextInput value={val} onChangeText={setVal} placeholder="YYYY-MM-DD" placeholderTextColor={theme.textSecondary} autoCapitalize="none" autoCorrect={false} style={input} />
          <Pressable accessibilityRole="button" onPress={() => onAnswer(q.id, val)} style={({ pressed }) => [styles.cta, { backgroundColor: theme.brandDeep }, pressed && styles.pressed]}>
            <ThemedText style={styles.ctaText}>Continue →</ThemedText>
          </Pressable>
        </View>
      ) : null}
      {count ? (
        <Pressable accessibilityRole="button" hitSlop={12} onPress={onBack} style={({ pressed }) => [styles.backLink, pressed && styles.pressed]}>
          <ThemedText type="smallBold" style={{ color: theme.brand }}>← Back</ThemedText>
        </Pressable>
      ) : null}
    </View>
  );
}

// A row in the entitlements sheet. The thin left rule carries the strength; the money is tabular.
function EntitlementCard({ e, theme, first }: { e: Entitlement; theme: ReturnType<typeof useTheme>; first?: boolean }) {
  const edge = e.strength === 'strong' ? theme.good : e.strength === 'conditional' ? theme.warn : e.strength === 'action' ? theme.brand : theme.textSecondary;
  const showAmt = e.amountText && e.amountText !== '—' && e.amountText !== '';
  const meta = (e.rule && e.rule !== '—') || e.deadline;
  return (
    <View style={[styles.eRow, { borderLeftColor: edge }, !first && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: theme.line }]}>
      <ThemedText style={styles.eTitle}>{e.title}</ThemedText>
      {showAmt ? <ThemedText type="money" style={[styles.eAmount, { color: e.strength === 'strong' ? theme.good : theme.text }]}>{e.amountText}</ThemedText> : null}
      <ThemedText type="small" themeColor="textSecondary" style={styles.eDetail}>{e.detail}</ThemedText>
      {e.condition ? (
        <ThemedText type="small" themeColor="textSecondary" style={styles.eDetail}>
          <ThemedText type="smallBold">Only if: </ThemedText>{e.condition}
        </ThemedText>
      ) : null}
      {meta ? (
        <View style={[styles.eMeta, { borderTopColor: theme.line }]}>
          {e.rule && e.rule !== '—' ? <ThemedText type="small" themeColor="textSecondary">{e.rule}</ThemedText> : null}
          {e.deadline ? <ThemedText type="small" themeColor="textSecondary" style={styles.eDeadline}>{e.deadline}</ThemedText> : null}
        </View>
      ) : null}
    </View>
  );
}

function Doc({ title, body, theme, onCopy, hint }: { title: string; body: string; theme: ReturnType<typeof useTheme>; onCopy: () => void; hint?: string }) {
  return (
    <View style={styles.docBlock}>
      <View style={styles.docHead}>
        <ThemedText type="section" style={styles.grow}>{title}</ThemedText>
        <Pressable accessibilityRole="button" onPress={onCopy} hitSlop={12} style={({ pressed }) => (pressed ? styles.pressed : null)}>
          <ThemedText type="smallBold" style={{ color: theme.brand }}>Copy</ThemedText>
        </Pressable>
      </View>
      <View style={[styles.rule, styles.docRule, { backgroundColor: theme.line }]} />
      {hint ? <ThemedText type="small" themeColor="textSecondary" style={styles.docHint}>{hint}</ThemedText> : null}
      <Text selectable style={[styles.docBody, { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.line }]}>{body}</Text>
    </View>
  );
}

function Field({ label, value, onChange, theme, placeholder }: { label: string; value?: string; onChange: (v: string) => void; theme: ReturnType<typeof useTheme>; placeholder?: string }) {
  return (
    <View style={styles.field}>
      <ThemedText type="eyebrow" themeColor="textSecondary">{label}</ThemedText>
      <TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={theme.textSecondary} autoCapitalize="characters" autoCorrect={false} style={[styles.input, { backgroundColor: theme.backgroundElement, borderColor: theme.line, color: theme.text }]} />
    </View>
  );
}

function ActionBtn({ label, theme, onPress, primary }: { label: string; theme: ReturnType<typeof useTheme>; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.action, primary ? { backgroundColor: theme.brandDeep, borderColor: theme.brandDeep } : { borderColor: theme.line }, pressed && styles.pressed]}>
      <ThemedText type="smallBold" style={{ color: primary ? '#fdfbf5' : theme.brand }}>{label}</ThemedText>
    </Pressable>
  );
}

/** The share card: a paper receipt, set in the same type as the app and the web card. The figure is
 *  the point, so it is set large in the serif and nothing shouts around it. */
function ReceiptCard({ refProp, copy }: { refProp?: React.RefObject<View | null>; copy: ShareCopy }) {
  return (
    <View ref={refProp} collapsable={false} style={card.wrap}>
      <View style={card.spine} />
      <View style={card.body}>
        <View style={card.masthead}>
          <View style={card.monogram}><Text style={card.monogramLetter}>F</Text></View>
          <Text style={card.wordmark}>Fairfare</Text>
        </View>
        <View style={card.rule} />
        <Text style={card.kicker}>WHAT MOST FLYERS NEVER CLAIM</Text>
        <Text style={card.headline}>{copy.headline}</Text>
        <Text style={card.sub} numberOfLines={3}>{copy.sub}</Text>
        <Perforation />
        <Text style={card.label}>{copy.panelLabel.toUpperCase()}</Text>
        <Text style={card.big} numberOfLines={2}>{copy.big}</Text>
        <Text style={[card.label, { marginTop: 14 }]}>THE RULE</Text>
        <Text style={card.ruleText} numberOfLines={2}>{copy.rule}</Text>
        <Perforation />
        <Text style={card.cta}>What does your airline owe you?</Text>
        <Text style={card.ctaAccent}>Check yours free  →</Text>
        <Text style={card.brand}>Fairfare · know your rights, get paid</Text>
      </View>
    </View>
  );
}

/** A torn-off edge, drawn as dashes: RN's dashed borders don't render reliably on Android. */
function Perforation() {
  return (
    <View style={card.perf}>
      {Array.from({ length: 26 }).map((_, i) => <View key={i} style={card.perfDash} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: Spacing.three },
  inner: { width: '100%', maxWidth: MaxContentWidth },
  rule: { height: StyleSheet.hairlineWidth, marginTop: Spacing.three },
  footRule: { marginTop: Spacing.four },
  pressed: { opacity: 0.75 },
  grow: { flex: 1 },

  // ---- the wizard ----
  qtitle: { marginTop: Spacing.two },
  qhelp: { marginTop: Spacing.three },
  sheet: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, overflow: 'hidden' },
  sheetTop: { marginTop: Spacing.four },
  opt: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three, minHeight: 52, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  optLabel: { flex: 1, fontWeight: '600' },
  arrow: { fontSize: 17 },
  fieldBlock: { marginTop: Spacing.four },
  moneyRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  cur: { marginTop: 1 },
  input: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, paddingHorizontal: Spacing.two + 2, paddingVertical: Spacing.two, minHeight: 44, fontSize: 15.5 },
  backLink: { marginTop: Spacing.four, alignSelf: 'flex-start', paddingVertical: Spacing.two },

  // ---- buttons ----
  cta: { borderRadius: Radius.sm, minHeight: 48, paddingVertical: Spacing.three, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.three },
  ctaGhost: { borderWidth: StyleSheet.hairlineWidth },
  ctaText: { color: '#fdfbf5', fontWeight: '700', fontSize: 15.5 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.four },
  action: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, minHeight: 44, paddingHorizontal: Spacing.three, alignItems: 'center', justifyContent: 'center' },

  // ---- entitlement rows ----
  eRow: { borderLeftWidth: 3, paddingVertical: Spacing.three, paddingHorizontal: Spacing.three },
  eTitle: { fontFamily: Fonts.serif, fontSize: 18, lineHeight: 24, fontWeight: '700' },
  eAmount: { marginTop: Spacing.half },
  eDetail: { marginTop: Spacing.one + 1 },
  eMeta: { marginTop: Spacing.two, paddingTop: Spacing.two, borderTopWidth: StyleSheet.hairlineWidth },
  eDeadline: { marginTop: Spacing.half },

  // ---- documents ----
  docBlock: { marginTop: Spacing.four },
  docHead: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  docRule: { marginTop: Spacing.two },
  docHint: { marginTop: Spacing.two },
  docBody: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, padding: Spacing.three, marginTop: Spacing.two, fontFamily: Fonts.serif, fontSize: 14.5, lineHeight: 23 },

  // ---- panels ----
  panel: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.md, padding: Spacing.three, marginTop: Spacing.four },
  panelRule: { height: StyleSheet.hairlineWidth, marginTop: Spacing.two, marginHorizontal: -Spacing.three },
  panelBlurb: { marginTop: Spacing.three },
  panelFoot: { marginTop: Spacing.three },
  chipScroll: { marginTop: Spacing.three, marginHorizontal: -Spacing.three },
  chipRail: { gap: Spacing.two, paddingHorizontal: Spacing.three, paddingVertical: Spacing.half },
  chip: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, minHeight: 38, paddingHorizontal: Spacing.two + 2, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two, marginTop: Spacing.three },
  field: { width: '47%', flexGrow: 1, gap: Spacing.one + 1 },
  cardStage: { alignItems: 'center', marginTop: Spacing.four },
  captionLabel: { marginTop: Spacing.four },
  captionBox: { borderWidth: StyleSheet.hairlineWidth, borderRadius: Radius.sm, padding: Spacing.three, marginTop: Spacing.two, fontSize: 14, lineHeight: 21 },

  // ---- status ----
  status: { borderWidth: StyleSheet.hairlineWidth, borderLeftWidth: 3, borderRadius: Radius.sm, padding: Spacing.three, marginTop: Spacing.four },
  disclaimer: { marginTop: Spacing.three, fontStyle: 'italic' },
});

const card = StyleSheet.create({
  wrap: { width: 320, flexDirection: 'row', backgroundColor: '#f7f4ee', borderWidth: StyleSheet.hairlineWidth, borderColor: '#ddd6c8' },
  spine: { width: 5, backgroundColor: '#16324a' },
  body: { flex: 1, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 22 },
  masthead: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  monogram: { width: 30, height: 30, borderRadius: 3, backgroundColor: '#16324a', alignItems: 'center', justifyContent: 'center' },
  monogramLetter: { fontFamily: Fonts.serif, fontStyle: 'italic', fontWeight: '700', fontSize: 17, lineHeight: 21, color: '#fdfbf5' },
  wordmark: { fontFamily: Fonts.serif, fontWeight: '700', fontSize: 21, color: '#1c2733' },
  rule: { height: StyleSheet.hairlineWidth, backgroundColor: '#cfc7b6', marginTop: 14 },
  kicker: { color: '#b03a2e', fontWeight: '700', fontSize: 10.5, letterSpacing: 1.1, marginTop: 16 },
  headline: { fontFamily: Fonts.serif, color: '#1c2733', fontWeight: '700', fontSize: 26, lineHeight: 31, marginTop: 10 },
  sub: { color: '#5c6670', fontSize: 12.5, lineHeight: 18, marginTop: 10 },
  perf: { flexDirection: 'row', overflow: 'hidden', marginTop: 18, marginBottom: 2 },
  perfDash: { width: 6, height: 1, backgroundColor: '#cfc7b6', marginRight: 5 },
  label: { color: '#5c6670', fontWeight: '700', fontSize: 10, letterSpacing: 1.1, marginTop: 14 },
  big: { fontFamily: Fonts.serif, color: '#1c2733', fontWeight: '700', fontSize: 38, lineHeight: 44, marginTop: 4 },
  ruleText: { fontFamily: Fonts.serif, color: '#1c2733', fontSize: 15, lineHeight: 20, marginTop: 3 },
  cta: { fontFamily: Fonts.serif, color: '#1c2733', fontWeight: '700', fontSize: 17, lineHeight: 22, marginTop: 18 },
  ctaAccent: { color: '#b03a2e', fontWeight: '700', fontSize: 12.5, marginTop: 6 },
  brand: { color: '#5c6670', fontWeight: '600', fontSize: 11, marginTop: 10 },
});
