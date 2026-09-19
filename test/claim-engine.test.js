// Deterministic proof for the claim engine — the math behind every dollar amount a user demands
// from an airline. Run:  node --test
//
// This loads the ACTUAL shipped browser file (public/claim-engine.js) rather than a copy, so the
// tests fail if the real thing drifts. Expected values are derived from the verified rules in
// rights-data.js (14 CFR 250.5/260, EU261, UK261, Canada APPR).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = readFileSync(path.join(__dirname, '..', 'public', 'claim-engine.js'), 'utf8');
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(src, sandbox);
const CE = sandbox.window.ClaimEngine;

const amountOf = (res, kw) => res.entitlements.find((e) => e.title.includes(kw))?.amountText || '';
const strongTitles = (res) => res.entitlements.filter((e) => e.strength === 'strong').map((e) => e.title);

test('engine loads and exposes its API', () => {
  assert.ok(CE, 'ClaimEngine attached to window');
  for (const fn of ['nextQuestion', 'assess', 'fill', 'chargebackLetter']) {
    assert.equal(typeof CE[fn], 'function', `${fn}() exists`);
  }
});

// ---------------------------------------------------------------- bumping (14 CFR 250.5)
test('DOMESTIC bumping: 1–2h late = 200% of fare, capped $1,075', () => {
  const r = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 100, arrDelay: '1-2', incidentDate: '2026-06-01' });
  assert.match(amountOf(r, 'forced off'), /^\$200\b/, '2 × $100');
  const capped = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 900, arrDelay: '1-2', incidentDate: '2026-06-01' });
  assert.match(amountOf(capped, 'forced off'), /^\$1,075\b/, '2 × $900 = $1,800 -> capped at $1,075');
});

test('DOMESTIC bumping: 2h+ late = 400% of fare, capped $2,150', () => {
  const r = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 300, arrDelay: '3-4', incidentDate: '2026-06-01' });
  assert.match(amountOf(r, 'forced off'), /^\$1,200\b/, '4 × $300');
  const capped = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 800, arrDelay: '9+', incidentDate: '2026-06-01' });
  assert.match(amountOf(capped, 'forced off'), /^\$2,150\b/, '4 × $800 = $3,200 -> capped at $2,150');
});

test('INTERNATIONAL bumping uses the wider 1–4h / 4h+ tiers, not 2h', () => {
  // 3-4h is the 200% tier internationally but the 400% tier domestically — the classic mix-up.
  const intl = CE.assess({ type: 'bumped', region: 'intl_from_us', voluntary: 'no', fareOneWay: 200, arrDelay: '3-4', incidentDate: '2026-06-01' });
  assert.match(amountOf(intl, 'forced off'), /^\$400\b/, 'intl 3–4h = 200% = 2 × $200');
  const dom = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 200, arrDelay: '3-4', incidentDate: '2026-06-01' });
  assert.match(amountOf(dom, 'forced off'), /^\$800\b/, 'domestic 3–4h = 400% = 4 × $200');

  const intl4 = CE.assess({ type: 'bumped', region: 'intl_from_us', voluntary: 'no', fareOneWay: 200, arrDelay: '4-6', incidentDate: '2026-06-01' });
  assert.match(amountOf(intl4, 'forced off'), /^\$800\b/, 'intl 4h+ crosses into 400%');
});

test('Bumping under 1 hour late pays nothing — and says so plainly', () => {
  const r = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 500, arrDelay: '<1', incidentDate: '2026-06-01' });
  assert.equal(strongTitles(r).length, 0, 'no "strong" claim');
  assert.match(amountOf(r, 'no bumping payment'), /\$0/);
});

test('Volunteering is a negotiation with NO legal minimum (must not promise cash)', () => {
  const r = CE.assess({ type: 'bumped', region: 'us', voluntary: 'yes', incidentDate: '2026-06-01' });
  const e = r.entitlements.find((x) => x.title.includes('volunteered'));
  assert.ok(e, 'explains the voluntary case');
  assert.equal(e.strength, 'info', 'not presented as an enforceable claim');
  assert.equal(strongTitles(r).length, 0);
});

test('A cheap fare pays the percentage, never the headline cap', () => {
  const r = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 150, arrDelay: '4-6', incidentDate: '2026-06-01' });
  assert.match(amountOf(r, 'forced off'), /^\$600\b/, '4 × $150 = $600, well under the $2,150 cap');
});

// ---------------------------------------------------------------- refunds (14 CFR Part 260)
test('Cancelled + did NOT travel = full cash refund (strong)', () => {
  const r = CE.assess({ type: 'cancelled', traveled: 'no', region: 'us', payment: 'credit', incidentDate: '2026-06-01' });
  assert.ok(strongTitles(r).some((t) => /full cash refund/i.test(t)));
  const e = r.entitlements.find((x) => /full cash refund/i.test(x.title));
  assert.match(e.deadline, /7 business days/, 'credit-card refund clock');
});

test('Cancelled but DID travel = no fare refund (must not overpromise)', () => {
  const r = CE.assess({ type: 'cancelled', traveled: 'yes', region: 'us', payment: 'credit', incidentDate: '2026-06-01' });
  assert.equal(strongTitles(r).filter((t) => /refund of your fare/i.test(t)).length, 0);
});

test('Refund deadline switches to 20 calendar days for non-card payment', () => {
  const r = CE.assess({ type: 'cancelled', traveled: 'no', region: 'us', payment: 'other', incidentDate: '2026-06-01' });
  const e = r.entitlements.find((x) => /full cash refund/i.test(x.title));
  assert.match(e.deadline, /20 calendar days/);
});

test('A pure U.S. delay pays NO cash — the app says so instead of inventing a claim', () => {
  const r = CE.assess({ type: 'delayed', region: 'us', arrDelay: '6-9', incidentDate: '2026-06-01' });
  assert.ok(r.entitlements.some((e) => /no cash for a delay/i.test(e.title)), 'states it plainly');
  assert.equal(strongTitles(r).length, 0, 'no fabricated cash entitlement');
});

// ---------------------------------------------------------------- international regimes
test('EU261 pays by distance band: €250 / €400 / €600', () => {
  const bands = { short: '€250', medium: '€400', long: '€600' };
  for (const [band, expected] of Object.entries(bands)) {
    const r = CE.assess({ type: 'delayed', region: 'from_eu', arrDelay: '3-4', distanceBand: band, incidentDate: '2026-06-01' });
    assert.match(amountOf(r, 'EU261'), new RegExp(expected), `${band} haul`);
  }
});

test('EU/UK/APPR cash is CONDITIONAL and always carries its condition', () => {
  const r = CE.assess({ type: 'delayed', region: 'from_eu', arrDelay: '6-9', distanceBand: 'long', incidentDate: '2026-06-01' });
  const e = r.entitlements.find((x) => x.title.includes('EU261'));
  assert.equal(e.strength, 'conditional', 'never presented as guaranteed');
  assert.ok(e.condition, 'carries a machine-readable condition');
  assert.match(e.condition, /control/i, 'condition names the airline-control test');
  assert.match(r.letterBody, /within the airline’s control|within the airline's control/, 'and the letter repeats it');
});

test('EU261 does NOT trigger below the 3-hour threshold', () => {
  const r = CE.assess({ type: 'delayed', region: 'from_eu', arrDelay: '2-3', distanceBand: 'long', incidentDate: '2026-06-01' });
  assert.equal(r.entitlements.find((x) => x.title.includes('EU261')), undefined);
});

test('Canada APPR denied boarding is tiered 900 / 1,800 / 2,400 — not a flat number', () => {
  const t = (d) => amountOf(CE.assess({ type: 'bumped', region: 'canada', voluntary: 'no', fareOneWay: 200, arrDelay: d, incidentDate: '2026-06-01' }), 'APPR');
  assert.match(t('3-4'), /CAD 900\b/);
  assert.match(t('6-9'), /CAD 1,800\b/);
  assert.match(t('9+'), /CAD 2,400\b/);
});

test('Canada APPR cancellation: refunded ticket = fixed CAD 400 / 125 (s.19(2)); flown = the arrival-delay ladder (s.19(1))', () => {
  const refunded = CE.assess({ type: 'cancelled', traveled: 'no', region: 'canada', payment: 'credit', incidentDate: '2026-06-01' });
  const amt = amountOf(refunded, 'APPR');
  assert.match(amt, /^CAD 400 \(large airline; CAD 125 small\)/);
  assert.doesNotMatch(amt, /1,000/, 'no top tier for a passenger who never flew');
  const e = refunded.entitlements.find((x) => /APPR/.test(x.title));
  assert.match(e.condition, /14 days or less/);
  assert.match(e.rule, /s\.12 & s\.19/);
  // Flying the rebooking pays by how late you finally arrived — so the wizard asks, and the amount is exact.
  assert.equal(CE.nextQuestion({ type: 'cancelled', traveled: 'yes', region: 'canada' }).id, 'arrDelay');
  const flew = CE.assess({ type: 'cancelled', traveled: 'yes', region: 'canada', arrDelay: '6-9', incidentDate: '2026-06-01' });
  assert.equal(amountOf(flew, 'APPR'), 'CAD 700 (CAD 250 on a small airline), in cash');
  const short = CE.assess({ type: 'cancelled', traveled: 'yes', region: 'canada', arrDelay: '1-2', incidentDate: '2026-06-01' });
  assert.equal(short.entitlements.filter((e) => /APPR/.test(e.title) && e.strength === 'conditional').length, 0, 'under 3 hours nothing is owed');
  assert.match(short.entitlements.find((e) => /APPR/.test(e.title)).title, /no cash under 3 hours/);
  const unknown = CE.assess({ type: 'cancelled', traveled: 'yes', region: 'canada', incidentDate: '2026-06-01' });
  assert.match(amountOf(unknown, 'APPR'), /CAD 400 \/ 700 \/ 1,000 \(large airlines; small airlines CAD 125 \/ 250 \/ 500\)/);
  assert.match(unknown.entitlements.find((e) => /APPR/.test(e.title)).condition, /3\+ hours/);
});

// ---------------------------------------------------------------- baggage
test('Domestic bag fee refund needs the 12-hour threshold AND a filed report', () => {
  const under = CE.assess({ type: 'bag_late', region: 'us', bagHours: 'lt12', reportFiled: 'yes', payment: 'credit', incidentDate: '2026-06-01' });
  assert.equal(under.entitlements.find((e) => /bag fee/i.test(e.title)), undefined, 'under 12h = no claim');

  const filed = CE.assess({ type: 'bag_late', region: 'us', bagHours: '12-15', reportFiled: 'yes', payment: 'credit', incidentDate: '2026-06-01' });
  assert.equal(filed.entitlements.find((e) => /bag fee/i.test(e.title)).strength, 'strong');

  const notFiled = CE.assess({ type: 'bag_late', region: 'us', bagHours: '12-15', reportFiled: 'no', payment: 'credit', incidentDate: '2026-06-01' });
  const e = notFiled.entitlements.find((x) => /bag fee/i.test(x.title));
  assert.equal(e.strength, 'conditional', 'downgraded without a mishandled-baggage report');
  assert.match(e.condition, /Mishandled Baggage Report/i);
});

test('International bag threshold is 15h, not the domestic 12h', () => {
  const r = CE.assess({ type: 'bag_late', region: 'intl_from_us', bagHours: '12-15', reportFiled: 'yes', payment: 'credit', incidentDate: '2026-06-01' });
  assert.equal(r.entitlements.find((e) => /bag fee/i.test(e.title)), undefined, '12–15h does not clear the intl threshold');
});

test('Lost bag: $4,700 domestic vs 1,519 SDR international', () => {
  const dom = CE.assess({ type: 'bag_lost', region: 'us', incidentDate: '2026-06-01' });
  assert.match(amountOf(dom, '4,700'), /\$4,700/);
  const intl = CE.assess({ type: 'bag_lost', region: 'intl_from_us', incidentDate: '2026-06-01' });
  assert.match(amountOf(intl, '1,519'), /1,519 SDR/);
});

// ---------------------------------------------------------------- generated documents
test('The demand letter cites the actual regulation and refuses vouchers', () => {
  const r = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 300, arrDelay: '3-4', incidentDate: '2026-06-01' });
  assert.match(r.letterBody, /14 CFR 250\.5/, 'cites the rule');
  assert.match(r.letterBody, /\$1,200/, 'states the computed amount');
  assert.match(r.letterBody, /decline any travel voucher/i);
  assert.match(r.letterBody, /original form of payment/i);
});

test('The DOT complaint is field-labeled to match the real form', () => {
  const r = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 300, arrDelay: '3-4', incidentDate: '2026-06-01' });
  for (const field of ['Complaint category:', 'Airline:', 'Flight number:', 'Confirmation/ticket #:']) {
    assert.ok(r.dotText.includes(field), `has "${field}"`);
  }
  assert.match(r.dotText, /Oversales \/ denied boarding/, 'correct category routed');
});

test('fill() substitutes real details and leaves unknown placeholders intact', () => {
  const a = { type: 'cancelled', traveled: 'no', region: 'us', payment: 'credit', incidentDate: '2026-06-01' };
  const out = CE.fill(CE.assess(a).letterBody, { airline: 'Delta Air Lines', flightNo: 'DL1234' }, a);
  assert.ok(out.includes('Delta Air Lines') && !out.includes('[AIRLINE]'), 'airline filled');
  assert.ok(out.includes('DL1234') && !out.includes('[FLIGHT #]'), 'flight filled');
  assert.ok(out.includes('[CONFIRMATION #]'), 'unknown field still flagged for the user');
});

test('The chargeback letter invokes the FCBA and the 60-day window', () => {
  const letter = CE.chargebackLetter({ type: 'cancelled', incidentDate: '2026-06-01' }, { airline: 'Delta Air Lines', name: 'Jane Doe' });
  assert.match(letter, /Fair Credit Billing Act/);
  assert.match(letter, /15 U\.S\.C\. § 1666/);
  assert.match(letter, /within 60 days/);
  assert.match(letter, /billing inquiries|Billing Inquiries/i, 'sent to the right address');
});

test('Every result carries the not-legal-advice disclaimer', () => {
  for (const type of ['cancelled', 'delayed', 'bumped', 'bag_late', 'bag_lost', 'downgrade', 'extra']) {
    const r = CE.assess({ type, region: 'us', payment: 'credit', incidentDate: '2026-06-01', traveled: 'no', voluntary: 'no', arrDelay: '3-4', bagHours: '30+', reportFiled: 'yes' });
    assert.match(r.disclaimer, /not legal advice/i, `${type} carries the disclaimer`);
  }
});

test('The wizard asks the right follow-ups and terminates', () => {
  // Answering the flow must always reach a complete state (nextQuestion -> null), never loop.
  const answers = { type: 'bumped' };
  let guard = 0;
  let q;
  while ((q = CE.nextQuestion(answers)) && guard++ < 20) {
    answers[q.id] = q.kind === 'money' ? 300 : q.kind === 'date' ? '2026-06-01' : q.options[0].value;
  }
  assert.equal(CE.nextQuestion(answers), null, 'flow completes');
  assert.ok(guard < 20, 'no infinite loop');
  assert.ok(CE.assess(answers).entitlements.length > 0);
});

// ---------------------------------------------------------------- schedule change (14 CFR 260.2 / 260.6)
// The watchdog's best lever: a big enough pre-trip schedule change, DECLINED, is a full cash refund
// on any fare. Thresholds are the federal "significant change" line: 3h domestic / 6h international,
// or an added connection / airport change. Accepting the change forfeits the refund.
test('SCHEDULE domestic 3h+ declined = strong full refund, cites 260.2/260.6, refund clock stated', () => {
  const r = CE.assess({ type: 'schedule', schedDelta: '3-4', schedAccepted: 'no', region: 'us', payment: 'credit', incidentDate: '2026-06-01' });
  assert.ok(strongTitles(r).some((t) => /full cash refund/i.test(t)));
  const e = r.entitlements.find((x) => /full cash refund/i.test(x.title));
  assert.match(e.amountText, /100% of what you paid/);
  assert.match(e.amountText, /nonrefundable or basic economy/);
  assert.match(e.rule, /260\.2 & 260\.6/);
  assert.match(e.deadline, /7 business days/);
});

test('SCHEDULE domestic 2–3h is NOT significant federally -> action (contract-of-carriage lever), no strong', () => {
  const r = CE.assess({ type: 'schedule', schedDelta: '2-3', schedAccepted: 'no', region: 'us', payment: 'credit', incidentDate: '2026-06-01' });
  assert.equal(strongTitles(r).length, 0);
  const e = r.entitlements.find((x) => x.strength === 'action' && /Below the federal line/.test(x.title));
  assert.ok(e);
  assert.match(e.detail, /3-hour change/);
  assert.match(e.detail, /United 30 min/);
});

test('SCHEDULE international needs 6h: 4–6h is not significant, 6+ is', () => {
  const no = CE.assess({ type: 'schedule', schedDelta: '4-6', schedAccepted: 'no', region: 'intl_from_us', payment: 'credit', incidentDate: '2026-06-01' });
  assert.equal(strongTitles(no).length, 0);
  assert.match(no.entitlements.find((x) => x.strength === 'action').detail, /6-hour change on international/);
  const yes = CE.assess({ type: 'schedule', schedDelta: '6+', schedAccepted: 'no', region: 'intl_from_us', payment: 'other', incidentDate: '2026-06-01' });
  assert.ok(strongTitles(yes).some((t) => /full cash refund/i.test(t)));
  assert.match(yes.entitlements.find((x) => /full cash refund/i.test(x.title)).deadline, /20 calendar days/);
});

test('SCHEDULE added connection / airport change is significant regardless of hours', () => {
  const r = CE.assess({ type: 'schedule', schedDelta: 'route', schedAccepted: 'no', region: 'intl_from_us', payment: 'credit', incidentDate: '2026-06-01' });
  assert.ok(strongTitles(r).some((t) => /full cash refund/i.test(t)));
});

test('SCHEDULE accepted (kept the flight) forfeits the refund -> info only, never strong', () => {
  const r = CE.assess({ type: 'schedule', schedDelta: '6+', schedAccepted: 'yes', region: 'us', incidentDate: '2026-06-01' });
  assert.equal(strongTitles(r).length, 0);
  assert.ok(r.entitlements.some((x) => x.strength === 'info' && /refund right does not apply/.test(x.title)));
});

test('SCHEDULE EU, LATER arrival: a delay (Sturgeon) — 3h+ and you FLY it -> conditional comp; declined -> info, no cash; under 3h -> nothing', () => {
  const fly = CE.assess({ type: 'schedule', schedDelta: '3-4', schedAccepted: 'yes', region: 'from_eu', schedDirection: 'later', distanceBand: 'long', incidentDate: '2026-06-01' });
  const eu = fly.entitlements.find((x) => /EU261/.test(x.title));
  assert.ok(eu && eu.strength === 'conditional');
  assert.match(eu.amountText, /€600/);
  assert.match(eu.condition, /fly it and actually arrive 3\+ hours later/);
  assert.match(eu.detail, /Sturgeon/);
  const declined = CE.assess({ type: 'schedule', schedDelta: '3-4', schedAccepted: 'no', region: 'from_eu', schedDirection: 'later', distanceBand: 'long', payment: 'credit', incidentDate: '2026-06-01' });
  const info = declined.entitlements.find((x) => /EU261/.test(x.title));
  assert.equal(info.strength, 'info');
  assert.match(info.title, /delay compensation needs you to fly/);
  const small = CE.assess({ type: 'schedule', schedDelta: '2-3', schedAccepted: 'yes', region: 'from_eu', schedDirection: 'later', distanceBand: 'long', incidentDate: '2026-06-01' });
  assert.ok(!small.entitlements.some((x) => /EU261/.test(x.title)));
});

test('SCHEDULE EU, EARLIER departure: a cancellation (Azurair) — >1h with <7 days notice, or >2h with 7–13 days; 14+ days = none; UK mirrors', () => {
  const late = CE.assess({ type: 'schedule', schedDelta: '1-2', schedAccepted: 'no', region: 'from_eu', schedDirection: 'earlier', schedNotice: '<7', distanceBand: 'medium', payment: 'credit', incidentDate: '2026-06-01' });
  const eu = late.entitlements.find((x) => /EU261/.test(x.title));
  assert.ok(eu && eu.strength === 'conditional');
  assert.match(eu.amountText, /€400/);
  assert.match(eu.detail, /Azurair/);
  assert.match(late.letterBody, /EU261 cash compensation[^\n]*\(owed only if the airline cannot show extraordinary/);
  // 7–13 days: 1–2h earlier is exempt (Art. 5(1)(c)(ii): within 2h), 2–3h is not
  assert.ok(!CE.assess({ type: 'schedule', schedDelta: '1-2', schedAccepted: 'no', region: 'from_eu', schedDirection: 'earlier', schedNotice: '7-13', distanceBand: 'long', payment: 'credit', incidentDate: '2026-06-01' }).entitlements.some((x) => /EU261/.test(x.title)));
  assert.match(CE.assess({ type: 'schedule', schedDelta: '2-3', schedAccepted: 'no', region: 'from_eu', schedDirection: 'earlier', schedNotice: '7-13', distanceBand: 'long', payment: 'credit', incidentDate: '2026-06-01' }).entitlements.find((x) => /EU261/.test(x.title)).amountText, /€600/);
  assert.ok(!CE.assess({ type: 'schedule', schedDelta: '6+', schedAccepted: 'no', region: 'from_eu', schedDirection: 'earlier', schedNotice: '14+', distanceBand: 'long', payment: 'credit', incidentDate: '2026-06-01' }).entitlements.some((x) => /EU261/.test(x.title)));
  const uk = CE.assess({ type: 'schedule', schedDelta: '3-4', schedAccepted: 'no', region: 'from_uk', schedDirection: 'earlier', schedNotice: '<7', distanceBand: 'long', payment: 'credit', incidentDate: '2026-06-01' }).entitlements.find((x) => /UK261/.test(x.title));
  assert.match(uk.amountText, /£520/);
});

test('SCHEDULE EU, route change: conditional on the new times, never a flat award', () => {
  const r = CE.assess({ type: 'schedule', schedDelta: 'route', schedAccepted: 'no', region: 'from_eu', schedNotice: '<7', distanceBand: 'long', payment: 'credit', incidentDate: '2026-06-01' });
  const eu = r.entitlements.find((x) => /EU261/.test(x.title));
  assert.equal(eu.strength, 'conditional');
  assert.match(eu.condition, /arrive 3\+ hours later/);
  assert.match(eu.condition, /more than 1 hour earlier/);
});

test('SCHEDULE Canada APPR: needs 3h+ (or route); declined = fixed CAD 400; flying = 400/700/1,000 by arrival delay; under 3h = nothing', () => {
  const declined = CE.assess({ type: 'schedule', schedDelta: '3-4', schedAccepted: 'no', region: 'canada', payment: 'credit', incidentDate: '2026-06-01' });
  const c = declined.entitlements.find((x) => /APPR/.test(x.title));
  assert.equal(c.strength, 'conditional');
  assert.match(c.amountText, /^CAD 400 \(large airline; CAD 125 small\)/);
  assert.match(c.rule, /s\.12 & s\.19/);
  const flew = CE.assess({ type: 'schedule', schedDelta: '6+', schedAccepted: 'yes', region: 'canada', incidentDate: '2026-06-01' });
  assert.match(flew.entitlements.find((x) => /APPR/.test(x.title)).amountText, /CAD 400 \/ 700 \/ 1,000/);
  const small = CE.assess({ type: 'schedule', schedDelta: '1-2', schedAccepted: 'no', region: 'canada', payment: 'credit', incidentDate: '2026-06-01' });
  assert.ok(!small.entitlements.some((x) => /APPR/.test(x.title)));
});

test('SCHEDULE: the U.S. refund is STRONG only when the trip touches the U.S.; elsewhere it is conditional with the covered-flight condition', () => {
  const eu = CE.assess({ type: 'schedule', schedDelta: '6+', schedAccepted: 'no', region: 'from_eu', schedDirection: 'later', distanceBand: 'long', payment: 'credit', incidentDate: '2026-06-01' });
  const refund = eu.entitlements.find((x) => /full cash refund/i.test(x.title));
  assert.equal(refund.strength, 'conditional');
  assert.match(refund.condition, /starts or ends in the United States/);
  const us = CE.assess({ type: 'schedule', schedDelta: '6+', schedAccepted: 'no', region: 'intl_from_us', payment: 'credit', incidentDate: '2026-06-01' });
  assert.equal(us.entitlements.find((x) => /full cash refund/i.test(x.title)).strength, 'strong');
});

test('SCHEDULE DOT text: [DATE] is the FLIGHT date, not the day the airline changed it', () => {
  const r = CE.assess({ type: 'schedule', schedDelta: '3-4', schedAccepted: 'no', region: 'us', payment: 'credit', incidentDate: '2026-06-01', flightDate: '2026-06-20' });
  const dot = CE.fill(r.dotText, { airline: 'Delta Air Lines' }, { type: 'schedule', incidentDate: '2026-06-01', flightDate: '2026-06-20' });
  assert.match(dot, /Flight date: 2026-06-20/);
  const noDate = CE.fill(r.dotText, {}, { type: 'schedule', incidentDate: '2026-06-01' });
  assert.match(noDate, /Flight date: \[DATE\]/, 'left for the user when unknown, never the change date');
});

test('SCHEDULE letter declines the itinerary in writing and carries the exact times when known', () => {
  const r = CE.assess({ type: 'schedule', schedDelta: '3-4', schedAccepted: 'no', region: 'us', payment: 'credit', incidentDate: '2026-06-01', schedFrom: 'dep 08:10 / arr 14:35', schedTo: 'dep 08:10 / arr 18:05' });
  assert.match(r.letterBody, /changed my itinerary after purchase by 3–4 hours \(originally dep 08:10 \/ arr 14:35, now dep 08:10 \/ arr 18:05\)\. I do not accept the new itinerary and am declining it in writing here\./);
  assert.match(r.letterBody, /A full cash refund of your fare: 100% of what you paid/);
  assert.match(r.dotText, /Complaint category: Refunds/);
});

test('SCHEDULE wizard asks delta -> accepted -> region -> (payment when declined) -> date, and terminates', () => {
  const a = { type: 'schedule' };
  const ids = [];
  for (let i = 0; i < 12; i++) {
    const q = CE.nextQuestion(a);
    if (!q) break;
    ids.push(q.id);
    a[q.id] = { schedDelta: '3-4', schedAccepted: 'no', region: 'us', payment: 'credit', incidentDate: '2026-06-01' }[q.id];
  }
  assert.deepEqual(ids, ['schedDelta', 'schedAccepted', 'region', 'payment', 'incidentDate']);
  const b = { type: 'schedule', schedDelta: '3-4', schedAccepted: 'yes', region: 'us' };
  assert.equal(CE.nextQuestion(b).id, 'incidentDate', 'no payment question when the flight is kept');
  // EU: direction is asked; the notice question only when it matters (earlier / route)
  const later = { type: 'schedule', schedDelta: '3-4', schedAccepted: 'yes', region: 'from_eu' };
  assert.equal(CE.nextQuestion(later).id, 'schedDirection');
  later.schedDirection = 'later';
  assert.equal(CE.nextQuestion(later).id, 'distanceBand', 'no notice question for a later arrival');
  const earlier = { type: 'schedule', schedDelta: '1-2', schedAccepted: 'no', region: 'from_eu', schedDirection: 'earlier' };
  assert.equal(CE.nextQuestion(earlier).id, 'schedNotice');
});

// ---------------------------------------------------------------- which law covers a bump (14 CFR 250.2)
test('U.S. bumping cash is never claimed for a flight leaving the EU or UK; the fare is not even asked', () => {
  for (const region of ['from_eu', 'from_uk']) {
    const r = CE.assess({ type: 'bumped', region, voluntary: 'no', arrDelay: '4-6', distanceBand: 'long', incidentDate: '2026-06-01' });
    assert.ok(!r.entitlements.some((e) => /250\.5/.test(e.rule || '')), region + ': no 250.5 entitlement');
    assert.equal(strongTitles(r).length, 0, region + ': nothing claimed as a firm U.S. right');
    assert.doesNotMatch(r.letterBody, /250\.5/);
    assert.ok(r.entitlements.some((e) => e.strength === 'info' && /250\.2/.test(e.rule || '')), region + ': says why');
    assert.equal(CE.nextQuestion({ type: 'bumped', region, voluntary: 'no' }).id, 'arrDelay', region + ': the fare does not set this amount');
  }
});

test('Canada bump: the wizard asks which way the flight left; only a U.S. departure earns 250.5 cash, on the international tiers', () => {
  assert.equal(CE.nextQuestion({ type: 'bumped', region: 'canada', voluntary: 'no' }).id, 'bumpOrigin');
  const fromCanada = CE.assess({ type: 'bumped', region: 'canada', voluntary: 'no', bumpOrigin: 'canada', arrDelay: '3-4', incidentDate: '2026-06-01' });
  assert.ok(!fromCanada.entitlements.some((e) => /250\.5/.test(e.rule || '')));
  assert.ok(fromCanada.entitlements.some((e) => /APPR/.test(e.title)));
  const fromUs = CE.assess({ type: 'bumped', region: 'canada', voluntary: 'no', bumpOrigin: 'us', fareOneWay: 200, arrDelay: '3-4', incidentDate: '2026-06-01' });
  assert.match(amountOf(fromUs, 'forced off'), /^\$400\b/, 'international 1–4h tier = 200% of $200');
});

test('A U.S. bump entitlement carries its conditions (30+ seats, on-time check-in) into the letter', () => {
  const r = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 300, arrDelay: '3-4', incidentDate: '2026-06-01' });
  const cond = r.entitlements.find((x) => /forced off/.test(x.title)).condition;
  assert.match(cond, /30\+ seats/);
  assert.match(cond, /smaller plane/, '250.6(b): a swap to a smaller aircraft takes the payment away');
  assert.match(r.letterBody, /30\+ seats/);
  assert.match(r.letterBody, /smaller plane/);
});

// ---------------------------------------------------------------- downgrade (14 CFR 260.2(5) & 260.6)
test('Downgrade REFUSED = full refund (260.2 & 260.6); downgrade FLOWN = the fare difference, which DOT still requires', () => {
  const refused = CE.assess({ type: 'downgrade', downgradeFlew: 'no', region: 'us', payment: 'credit', incidentDate: '2026-06-01' });
  const full = refused.entitlements.find((e) => /full cash refund/i.test(e.title));
  assert.equal(full.strength, 'strong');
  assert.match(full.rule, /260\.2 & 260\.6/);

  // 14 CFR 250.6(c) + DOT's Part 260 final rule (89 FR 32778): flying the lower cabin ends the FULL refund,
  // not the fare difference. It is not a contract courtesy.
  const flew = CE.assess({ type: 'downgrade', downgradeFlew: 'yes', region: 'us', incidentDate: '2026-06-01' });
  const diff = flew.entitlements.find((e) => /fare difference/i.test(e.title));
  assert.equal(diff.strength, 'strong');
  assert.match(diff.rule, /250\.6\(c\)/);
  assert.match(diff.rule, /89 FR 32778/);
  assert.equal(diff.condition, undefined, 'nothing left to condition it on for a U.S. flight');
  assert.doesNotMatch(diff.rule, /contract of carriage/);
  assert.doesNotMatch(diff.rule, /260\.2/, 'the full-refund rule is not the fare-difference rule');
  assert.match(flew.letterBody, /250\.6\(c\)/);
  assert.match(flew.headline, /owed/i, 'no longer reads "there may be no cash owed"');

  // Outside the U.S. rule's reach it keeps the covered-flight condition instead of disappearing.
  const eu = CE.assess({ type: 'downgrade', downgradeFlew: 'yes', region: 'from_eu', distanceBand: 'long', incidentDate: '2026-06-01' });
  const euDiff = eu.entitlements.find((e) => /fare difference/i.test(e.title));
  assert.equal(euDiff.strength, 'conditional');
  assert.match(euDiff.condition, /to, from or within the United States/);
});

test('Downgrade wizard asks whether you flew, and asks how you paid only when a refund is owed', () => {
  assert.equal(CE.nextQuestion({ type: 'downgrade' }).id, 'downgradeFlew');
  assert.equal(CE.nextQuestion({ type: 'downgrade', downgradeFlew: 'yes', region: 'us' }).id, 'incidentDate');
  assert.equal(CE.nextQuestion({ type: 'downgrade', downgradeFlew: 'no', region: 'us' }).id, 'payment');
});

// ---------------------------------------------------------------- a demand is an exact figure, never a ceiling
test('exactAmount accepts only a figure the text leads with — never a ceiling or a range', () => {
  assert.equal(CE.exactAmount('$800 (400% of your one-way fare, capped at $2,150)'), '$800');
  assert.equal(CE.exactAmount('€600 per person, in cash'), '€600');
  assert.equal(CE.exactAmount('Your provable loss, up to $4,700 per passenger'), null);
  assert.equal(CE.exactAmount('400% of your one-way fare, up to $2,150'), null);
  assert.equal(CE.exactAmount('CAD 400 / 700 / 1,000 (large airlines), by how late you ultimately arrived'), null);
});

// ---------------------------------------------------------------- EU261 / UK261: Art. 7(2), Art. 4(3), Art. 5(1)(c)
test('EU/UK Art. 7(2): the possible half is shown beside the figure, never inside the amount the letter demands', () => {
  const detailOf = (res, kw) => res.entitlements.find((e) => e.title.includes(kw)).detail;
  const euBump = CE.assess({ type: 'bumped', region: 'from_eu', voluntary: 'no', arrDelay: '1-2', distanceBand: 'long', incidentDate: '2026-06-01' });
  assert.equal(amountOf(euBump, 'EU261'), '€600 per person, in cash', 'the demand is the full figure');
  assert.match(detailOf(euBump, 'EU261'), /may pay €300 instead/);
  assert.doesNotMatch(euBump.letterBody, /may pay/, 'the letter asks for €600 without conceding the cut');

  const ukBump = CE.assess({ type: 'bumped', region: 'from_uk', voluntary: 'no', arrDelay: '1-2', distanceBand: 'long', incidentDate: '2026-06-01' });
  assert.match(detailOf(ukBump, 'UK261'), /may pay £260 instead/);
  // EU and UK now treat the same long-haul 3–4h delay the same way (Sturgeon para 63).
  for (const [region, name, half] of [['from_eu', 'EU261', '€300'], ['from_uk', 'UK261', '£260']]) {
    const r = CE.assess({ type: 'delayed', region, arrDelay: '3-4', distanceBand: 'long', incidentDate: '2026-06-01' });
    assert.match(detailOf(r, name), new RegExp('may pay ' + half + ' instead'));
  }
  for (const [band, d] of [['long', '4-6'], ['medium', '3-4'], ['short', '3-4']]) {
    const r = CE.assess({ type: 'delayed', region: 'from_eu', arrDelay: d, distanceBand: band, incidentDate: '2026-06-01' });
    assert.doesNotMatch(detailOf(r, 'EU261'), /may pay/, `${band} ${d}: outside the Art. 7(2) window`);
  }
});

test('EU/UK denied boarding has no extraordinary-circumstances defence (Art. 4(3)); only reasonable grounds (Art. 2(j))', () => {
  const r = CE.assess({ type: 'bumped', region: 'from_eu', voluntary: 'no', arrDelay: '4-6', distanceBand: 'long', incidentDate: '2026-06-01' });
  const e = r.entitlements.find((x) => /EU261/.test(x.title));
  assert.match(e.condition, /reasonable grounds — health, safety, security, or inadequate travel documents/);
  assert.doesNotMatch(e.condition + e.detail, /not extraordinary weather/i);
});

test('EU cancellation: 14+ days’ notice means nothing is owed — not a "reduction" (Art. 5(1)(c))', () => {
  const r = CE.assess({ type: 'cancelled', traveled: 'no', region: 'from_eu', distanceBand: 'long', payment: 'credit', incidentDate: '2026-06-01' });
  const e = r.entitlements.find((x) => /EU261/.test(x.title));
  assert.match(e.detail, /Nothing is owed if they told you 14\+ days before departure/);
  assert.match(e.detail, /OFFERED you a replacement flight/, 'the exemption turns on the offer, not on taking it');
  assert.match(e.condition, /less than 14 days before departure/);
  assert.match(e.condition, /without offering you a replacement/);
  assert.doesNotMatch(e.detail + e.condition, /reduced/i);
});

test('SCHEDULE: a later arrival can be halved; a flight brought FORWARD cannot (CJEU Azurair, C-146/20)', () => {
  const later = CE.assess({ type: 'schedule', schedDelta: '3-4', schedAccepted: 'yes', region: 'from_uk', schedDirection: 'later', distanceBand: 'long', incidentDate: '2026-06-01' });
  const l = later.entitlements.find((x) => /UK261/.test(x.title));
  assert.equal(l.amountText, '£520 per person, in cash');
  assert.match(l.detail, /may pay £260 instead/);
  const earlier = CE.assess({ type: 'schedule', schedDelta: '3-4', schedAccepted: 'no', region: 'from_eu', schedDirection: 'earlier', schedNotice: '<7', distanceBand: 'long', payment: 'credit', incidentDate: '2026-06-01' });
  const e = earlier.entitlements.find((x) => /EU261/.test(x.title));
  assert.match(e.detail, /not halved/);
  assert.match(e.detail, /Azurair/);
  assert.doesNotMatch(e.detail, /may pay/);
});

test('The bump figure names the fare it was computed from', () => {
  const r = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 300, arrDelay: '3-4', incidentDate: '2026-06-01' });
  assert.match(amountOf(r, 'forced off'), /^\$1,200 \(400% of the \$300 one-way fare you entered, capped at \$2,150\)/);
  const help = CE.nextQuestion({ type: 'bumped', region: 'us', voluntary: 'no' }).help;
  assert.match(help, /including taxes and mandatory fees/, '14 CFR 250.1 fare');
  assert.match(help, /lowest cash fare/, 'an award ticket is not a $6 fare');
});

// ---------------------------------------------------------------- volunteers, double recovery, stale answers, cents
test('A volunteer is never shown the fixed denied-boarding cash — not in the U.S., the EU, the UK or Canada', () => {
  for (const [region, extra] of [['us', {}], ['from_eu', { distanceBand: 'long' }], ['from_uk', { distanceBand: 'short' }], ['canada', {}]]) {
    const r = CE.assess({ type: 'bumped', voluntary: 'yes', region, ...extra, incidentDate: '2026-06-01' });
    assert.equal(strongTitles(r).length, 0, region);
    assert.ok(!r.entitlements.some((e) => /APPR|EU261|UK261/.test(e.title)), region + ': no involuntary-bump cash');
    assert.doesNotMatch(r.letterBody, /€|£|CAD/, region + ': the letter demands none of it');
    const e = r.entitlements.find((x) => /volunteered/.test(x.title));
    assert.equal(e.strength, 'info');
    if (region === 'from_eu') assert.match(e.rule, /EU Regulation 261\/2004, Art\. 4\(1\)/);
    if (region === 'us') assert.match(e.rule, /250\.2b/);
    if (region === 'canada') assert.doesNotMatch(e.rule, /250\.2b/, 'a Canadian departure is not a U.S. rule');
  }
});

test('A U.S.-origin bump to Canada carries the no-double-recovery limit (Canada Transportation Act s.86.11(3))', () => {
  const fromUs = CE.assess({ type: 'bumped', region: 'canada', voluntary: 'no', bumpOrigin: 'us', fareOneWay: 200, arrDelay: '3-4', incidentDate: '2026-06-01' });
  const appr = fromUs.entitlements.find((e) => /APPR/.test(e.title));
  assert.match(appr.condition, /s\.86\.11\(3\)/);
  assert.match(fromUs.letterBody, /86\.11\(3\)/, 'the demand says so too');
  const fromCanada = CE.assess({ type: 'bumped', region: 'canada', voluntary: 'no', bumpOrigin: 'canada', arrDelay: '3-4', incidentDate: '2026-06-01' });
  assert.doesNotMatch(fromCanada.entitlements.find((e) => /APPR/.test(e.title)).condition, /86\.11/, 'nothing was paid under U.S. rules');
});

test('APPR’s control test is Canada’s own — "mechanical" never qualifies a Canadian claim', () => {
  const r = CE.assess({ type: 'cancelled', traveled: 'yes', region: 'canada', arrDelay: '6-9', incidentDate: '2026-06-01' });
  const e = r.entitlements.find((x) => /APPR/.test(x.title));
  assert.doesNotMatch(e.detail, /mechanical/i);
  assert.match(e.detail, /not required for safety/);
});

test('An answer whose question no longer applies is dropped, so a flown downgrade offers no chargeback', () => {
  const stale = { type: 'downgrade', downgradeFlew: 'yes', region: 'us', payment: 'credit', incidentDate: '2026-06-01' };
  assert.equal(CE.pruneAnswers(stale).payment, undefined, 'payment is only asked when a refund is owed');
  assert.equal(CE.pruneAnswers(stale).downgradeFlew, 'yes');
  const r = CE.assess(stale);
  assert.doesNotMatch(r.letterBody, /Fair Credit/, 'no FCBA threat for a refund that was never due');
  assert.ok(!r.entitlements.some((e) => /Fair Credit/.test(e.detail || '')));
  // The evidence fields a schedule-change letter needs are not wizard answers, and survive untouched.
  const sched = CE.pruneAnswers({ type: 'schedule', schedDelta: '3-4', schedAccepted: 'no', region: 'us', payment: 'credit', schedFrom: 'dep 05:40', flightDate: '2026-07-04', incidentDate: '2026-06-01' });
  assert.equal(sched.schedFrom, 'dep 05:40');
  assert.equal(sched.flightDate, '2026-07-04');
  assert.equal(sched.payment, 'credit', 'still asked when the refund is declined');
});

test('The chargeback letter cites a refund rule only when this claim has one', () => {
  const refund = CE.chargebackLetter({ type: 'cancelled', traveled: 'no', region: 'us', payment: 'credit', incidentDate: '2026-06-01' }, { airline: 'Delta Air Lines' });
  assert.match(refund, /14 CFR Part 260/);
  const flown = CE.chargebackLetter({ type: 'downgrade', downgradeFlew: 'yes', region: 'us', incidentDate: '2026-06-01' }, { airline: 'Delta Air Lines' });
  assert.doesNotMatch(flown, /14 CFR Part 260/, 'Part 260 gives nothing here');
  assert.match(flown, /did not provide as agreed/);
});

test('Money is stated to the cent, and the exact-amount reader accepts cents but stops at punctuation', () => {
  const r = CE.assess({ type: 'bumped', region: 'us', voluntary: 'no', fareOneWay: 200.4, arrDelay: '1-2', incidentDate: '2026-06-01' });
  assert.match(amountOf(r, 'forced off'), /^\$400\.80 \(200% of the \$200\.40 one-way fare you entered/);
  assert.equal(CE.exactAmount('$400.80 (200% of the $200.40 one-way fare you entered, capped at $1,075)'), '$400.80');
  assert.equal(CE.exactAmount('CAD 400, in cash'), 'CAD 400', 'a trailing comma is punctuation, not part of the figure');
  assert.equal(CE.exactAmount('CAD 400 / 700 / 1,000 (large airlines)'), null);
  assert.equal(CE.exactAmount('Your provable loss, up to $4,700 per passenger'), null);
});
