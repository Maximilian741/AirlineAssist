// Web ⇄ mobile parity — the guard against silent drift in hand-ported logic.
// Run:  node --test   (Node 22.18+ strips TS types natively, so the ACTUAL mobile modules load)
//
// coverage and fareclass exist twice: public/*.js (web, vm-loaded) and mobile/src/lib/*.ts.
// A fix applied to one and not the other would make the two apps give different legal/money
// answers for the same question. These tests sweep the ENTIRE input space of both modules and
// require identical output.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ['coverage.js', 'fareclass.js']) {
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', f), 'utf8'), sandbox);
}
const webCoverage = sandbox.window.Coverage;
const webFareClass = sandbox.window.FareClass;

const mobileCoverage = await import('../mobile/src/lib/coverage.ts');
const mobileFareClass = await import('../mobile/src/lib/fareclass.ts');

// vm objects live in another realm — compare through JSON, which is also what the UIs render from.
const j = (x) => JSON.parse(JSON.stringify(x ?? null));

test('COVERAGE: web and mobile agree on every region × carrier × band combination', () => {
  const regions = ['eu', 'uk', 'ch', 'ca', 'us', 'other'];
  const carriers = ['us', 'eu', 'uk', 'ca', 'other'];
  const bands = ['short', 'medium', 'long'];
  let checked = 0;
  for (const from of regions) for (const to of regions) for (const carrier of carriers) for (const band of bands) {
    const input = { from, to, carrier, band };
    assert.deepEqual(
      j(mobileCoverage.check(input)),
      j(webCoverage.check(input)),
      `diverged on ${JSON.stringify(input)}`
    );
    checked++;
  }
  assert.equal(checked, 6 * 6 * 5 * 3, 'swept the full matrix');
});

test('COVERAGE: the picker options and the US-vs-EU gap table are identical on both platforms', () => {
  // These drive the UI, not check() — so the sweep above would not catch a drifted label or a
  // gap row edited on one side. Both are user-facing legal copy; they must not diverge.
  assert.deepEqual(j(mobileCoverage.REGIONS), j(webCoverage.REGIONS));
  assert.deepEqual(j(mobileCoverage.CARRIERS), j(webCoverage.CARRIERS));
  assert.deepEqual(j(mobileCoverage.GAPS), j(webCoverage.GAPS));
  assert.ok(mobileCoverage.GAPS.length >= 6, 'gap table is populated');
});

test('FARECLASS: web and mobile agree on every letter × tier', () => {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  for (const tier of ['platinum', 'reserve', 'gold']) {
    for (const letter of letters) {
      assert.deepEqual(
        j(mobileFareClass.decode(letter, tier)),
        j(webFareClass.decode(letter, tier)),
        `diverged on ${letter}/${tier}`
      );
    }
    assert.deepEqual(j(mobileFareClass.eligibleList(tier)), j(webFareClass.eligibleList(tier)), `eligibleList diverged for ${tier}`);
  }
});

test('FARECLASS: invalid inputs behave identically', () => {
  for (const bad of ['', '  ', '4', '!', null, undefined]) {
    assert.deepEqual(j(mobileFareClass.decode(bad, 'platinum')), j(webFareClass.decode(bad, 'platinum')), JSON.stringify(bad));
  }
});

// ---------------------------------------------------------------- claim engine (web ⇄ mobile)
// The money engine exists twice too. Sweep every incident type across the full answer space and
// require identical entitlements, letters and DOT text. Any one-sided rule change now fails here.
{
  const ceSandbox = { window: {} };
  vm.createContext(ceSandbox);
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', 'claim-engine.js'), 'utf8'), ceSandbox);
  const webCE = ceSandbox.window.ClaimEngine;
  const mobileCE = await import('../mobile/src/lib/claim-engine.ts');

  const REGIONS = ['us', 'intl_from_us', 'from_eu', 'from_uk', 'canada'];
  const strip = (r) => j({ entitlements: r.entitlements, headline: r.headline, letterBody: r.letterBody, dotText: r.dotText, hasClaim: r.hasClaim });

  test('CLAIM ENGINE parity: schedule change — every delta × accepted × region × notice × band × payment', () => {
    let n = 0;
    for (const schedDelta of ['<1', '1-2', '2-3', '3-4', '4-6', '6+', 'route'])
      for (const schedAccepted of ['no', 'yes'])
        for (const region of REGIONS)
          for (const schedNotice of ['14+', '7-13', '<7'])
            for (const schedDirection of ['later', 'earlier'])
              for (const distanceBand of ['short', 'medium', 'long'])
                for (const payment of ['credit', 'other']) {
                  const a = { type: 'schedule', schedDelta, schedAccepted, region, schedNotice, schedDirection, distanceBand, payment, incidentDate: '2026-06-01', flightDate: '2026-06-20', schedFrom: 'dep 08:10 / arr 14:35', schedTo: 'dep 08:10 / arr 18:05' };
                  assert.deepEqual(strip(mobileCE.assess(a)), strip(webCE.assess(a)), JSON.stringify(a));
                  n++;
                }
    assert.equal(n, 7 * 2 * 5 * 3 * 2 * 3 * 2);
  });

  test('CLAIM ENGINE parity: cancelled / delayed / bumped / bags / downgrade / extra', () => {
    const DELAYS = ['<1', '1-2', '2-3', '3-4', '4-6', '6-9', '9+'];
    const cases = [];
    for (const region of REGIONS) for (const traveled of ['no', 'yes']) for (const payment of ['credit', 'other']) for (const distanceBand of ['short', 'long'])
      cases.push({ type: 'cancelled', traveled, region, payment, distanceBand, incidentDate: '2026-06-01' });
    for (const region of REGIONS) for (const arrDelay of DELAYS) for (const distanceBand of ['short', 'medium', 'long'])
      cases.push({ type: 'delayed', region, arrDelay, distanceBand, incidentDate: '2026-06-01' });
    for (const region of REGIONS) for (const voluntary of ['no', 'yes']) for (const arrDelay of DELAYS) for (const fareOneWay of [0, 100, 900])
      cases.push({ type: 'bumped', region, voluntary, arrDelay, fareOneWay, distanceBand: 'long', incidentDate: '2026-06-01' });
    for (const region of REGIONS) for (const bagHours of ['lt12', '12-15', '15-30', '30+', 'missing']) for (const reportFiled of ['yes', 'no']) for (const payment of ['credit', 'other'])
      cases.push({ type: 'bag_late', region, bagHours, reportFiled, payment, incidentDate: '2026-06-01' });
    for (const region of REGIONS) cases.push({ type: 'bag_lost', region, incidentDate: '2026-06-01' });
    for (const region of REGIONS) for (const payment of ['credit', 'other']) for (const distanceBand of ['short', 'long'])
      cases.push({ type: 'downgrade', region, payment, distanceBand, incidentDate: '2026-06-01' });
    for (const payment of ['credit', 'other']) cases.push({ type: 'extra', payment, incidentDate: '2026-06-01' });
    for (const a of cases) assert.deepEqual(strip(mobileCE.assess(a)), strip(webCE.assess(a)), JSON.stringify(a));
    assert.ok(cases.length > 400, `swept ${cases.length} cases`);
  });

  test('CLAIM ENGINE parity: small-claims notice, evidence pack, chargeback letter, fill()', () => {
    const d = { airline: 'Delta Air Lines', flightNo: 'DL1234', origin: 'HLN', dest: 'JFK', confirmation: 'ABC123', name: 'Pat', email: 'pat@example.com' };
    for (const type of ['cancelled', 'schedule', 'delayed', 'bumped', 'bag_late', 'bag_lost', 'downgrade', 'extra']) {
      const a = { type, incidentDate: '2026-06-01', payment: 'credit', region: 'us', schedDelta: '3-4', schedAccepted: 'no', traveled: 'no', voluntary: 'no' };
      // the notice embeds today's date + 14 — same clock on both sides within the same second
      assert.equal(mobileCE.smallClaimsNotice(a, d, { amount: '$1,200' }), webCE.smallClaimsNotice(a, d, { amount: '$1,200' }), type);
      assert.equal(mobileCE.smallClaimsNotice(a, {}, {}), webCE.smallClaimsNotice(a, {}, {}), type + ' bare');
      assert.deepEqual(j(mobileCE.evidencePack(a)), j(webCE.evidencePack(a)), type + ' evidence');
      assert.equal(mobileCE.chargebackLetter(a, d), webCE.chargebackLetter(a, d), type + ' chargeback');
      assert.equal(mobileCE.fill('X [AIRLINE] [FLIGHT #] [DATE] [YOUR NAME]', d, a), webCE.fill('X [AIRLINE] [FLIGHT #] [DATE] [YOUR NAME]', d, a));
    }
  });

  test('CLAIM ENGINE parity: the wizard asks the same questions in the same order for every type', () => {
    const seeds = [
      { type: 'schedule', schedDelta: '3-4', schedAccepted: 'no', region: 'from_eu', schedDirection: 'earlier', schedNotice: '<7', distanceBand: 'long', payment: 'credit', incidentDate: '2026-06-01' },
      { type: 'schedule', schedDelta: '3-4', schedAccepted: 'yes', region: 'from_uk', schedDirection: 'later', distanceBand: 'long', incidentDate: '2026-06-01' },
      { type: 'schedule', schedDelta: 'route', schedAccepted: 'no', region: 'canada', payment: 'other', incidentDate: '2026-06-01' },
      { type: 'schedule', schedDelta: '1-2', schedAccepted: 'yes', region: 'us', incidentDate: '2026-06-01' },
      { type: 'cancelled', traveled: 'no', region: 'us', payment: 'credit', incidentDate: '2026-06-01' },
      { type: 'bumped', voluntary: 'no', region: 'from_uk', fareOneWay: 300, arrDelay: '3-4', distanceBand: 'long', incidentDate: '2026-06-01' },
      { type: 'bag_late', region: 'us', bagHours: '12-15', reportFiled: 'yes', payment: 'credit', incidentDate: '2026-06-01' },
    ];
    for (const full of seeds) {
      const walk = (CE) => { const a = {}; const ids = []; for (let i = 0; i < 20; i++) { const q = CE.nextQuestion(a); if (!q) break; ids.push(q.id); a[q.id] = full[q.id]; } return ids; };
      assert.deepEqual(walk(mobileCE), walk(webCE), JSON.stringify(full));
    }
  });
}

// ---------------------------------------------------------------- rights data (web ⇄ mobile)
// The rights guide is hand-ported. A card, law or regime added on one side and not the other is
// exactly the drift a review once caught by hand — now it fails the suite instead.
{
  const rSandbox = { window: {} };
  vm.createContext(rSandbox);
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', 'rights-data.js'), 'utf8'), rSandbox);
  const web = rSandbox.window.RIGHTS_DATA;
  const mob = await import('../mobile/src/data/rights.ts');

  test('RIGHTS parity: same cards (headline + legal basis + amounts + sources), same order', () => {
    const pick = (c) => ({ headline: c.headline, category: c.category, legalBasis: c.legalBasis, amounts: c.amounts, sources: (c.sources || []).map((s) => s.url) });
    assert.deepEqual(j(mob.RIGHTS_CARDS.map(pick)), j(web.rightsCards.map(pick)));
  });
  test('RIGHTS parity: legislation names + statuses, intl regimes, ladder steps, resource links', () => {
    assert.deepEqual(j(mob.LEGISLATION.map((l) => [l.name, l.status])), j(web.legislation.map((l) => [l.name, l.status])));
    assert.equal(mob.INTERNATIONAL.length, web.internationalCompensation.length);
    assert.equal(mob.LADDER.length, web.escalationLadder.length);
    assert.deepEqual(j(mob.STATS_LINKS.map((x) => x.url)), j(web.statsLinks.map((x) => x.url)));
    assert.deepEqual(j(mob.REVIEW_LINKS.map((x) => x.url)), j(web.reviewLinks.map((x) => x.url)));
    assert.deepEqual(j(mob.ALLIES.map((x) => x.url)), j(web.advocacyGroups.map((x) => x.url)));
  });
}

// ---------------------------------------------------------------- crisis mode (web ⇄ mobile)
{
  const cSandbox = { window: {} };
  vm.createContext(cSandbox);
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', 'crisis.js'), 'utf8'), cSandbox);
  const web = cSandbox.window.Crisis;
  const mob = await import('../mobile/src/data/crisis.ts');
  test('CRISIS parity: same scenarios (id/title/steps/script/evidence/money/dont-accept) and evidence list', () => {
    const pick = (s) => ({ id: s.id, title: s.title, now: s.now, say: s.say, collect: s.collect, money: s.money, dontAccept: s.dontAccept });
    assert.deepEqual(j(mob.SCENARIOS.map(pick)), j(web.SCENARIOS.map(pick)));
    assert.deepEqual(j(mob.EVIDENCE), j(web.EVIDENCE));
  });
}

// ---------------------------------------------------------------- claim tracker (web ⇄ mobile)
// The ladder-as-code must be identical: same clocks per stage, same next action after the same
// filings, same overdue verdicts. Web is vm-loaded with a fake localStorage; mobile is pure.
{
  const store = new Map();
  const tSandbox = { window: {}, localStorage: { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) } };
  vm.createContext(tSandbox);
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', 'claimtrack.js'), 'utf8'), tSandbox);
  const webCT = tSandbox.window.ClaimTrack;
  const mobCT = await import('../mobile/src/lib/claimtrack.ts');
  const iso = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };
  const result = { headline: 'You appear to be owed: full cash refund.', entitlements: [{ strength: 'strong', amountText: '$1,200 in cash' }] };

  test('CLAIM TRACKER parity: clocks per stage for every answer shape', () => {
    const shapes = [
      { type: 'cancelled', payment: 'credit', region: 'us' }, { type: 'cancelled', payment: 'other', region: 'from_eu' },
      { type: 'schedule', payment: 'credit', region: 'us' }, { type: 'bumped', payment: 'credit', region: 'canada' },
      { type: 'bag_late', payment: 'other', region: 'from_uk' }, { type: 'delayed', region: 'us' }, { type: 'extra', payment: 'credit' },
    ];
    for (const a of shapes) for (const stage of ['airline', 'dot', 'chargeback', 'smallclaims']) {
      const w = webCT.STAGES[stage].clocks(a, {}).map((c) => [c.key, c.label, c.rule, c.due('2026-06-01')]);
      const m = mobCT.STAGES[stage].clocks(a, {}).map((c) => [c.key, c.label, c.rule, c.due('2026-06-01')]);
      assert.deepEqual(j(m), j(w), `${stage} ${JSON.stringify(a)}`);
    }
  });

  test('CLAIM TRACKER parity: same next action + timeline through the whole ladder (fresh, 70d stale, DOT ignored)', () => {
    const answers = { type: 'bumped', payment: 'credit', region: 'us', voluntary: 'no', arrDelay: '3-4', fareOneWay: 300 };
    // web
    let wc = webCT.start(answers, { airline: 'Delta Air Lines' }, result);
    // mobile (pure) — same id/created for comparison
    let mc = mobCT.start(answers, { airline: 'Delta Air Lines' }, result);
    mc = { ...mc, id: wc.id, created: wc.created };
    const norm = (c, tl, na) => j({ filings: c.filings, status: c.status, amount: c.amount, tl: tl.map((t) => [t.stage, t.key, t.due, t.status]), na: { kind: na.kind, channel: na.channel || null, text: na.text } });
    assert.deepEqual(norm(mc, mobCT.timeline(mc), mobCT.nextAction(mc)), norm(wc, webCT.timeline(wc), webCT.nextAction(wc)), 'fresh');
    // file with the airline today
    wc = webCT.recordFiling(wc.id, 'airline'); mc = mobCT.recordFiling(mc, 'airline');
    assert.deepEqual(norm(mc, mobCT.timeline(mc), mobCT.nextAction(mc)), norm(wc, webCT.timeline(wc), webCT.nextAction(wc)), 'filed');
    // backdate 70 days -> answer/bump overdue -> escalate to DOT
    wc = webCT.update(wc.id, { filings: wc.filings.map((f) => ({ ...f, date: iso(-70) })) }); mc = { ...mc, filings: mc.filings.map((f) => ({ ...f, date: iso(-70) })) };
    assert.deepEqual(norm(mc, mobCT.timeline(mc), mobCT.nextAction(mc)), norm(wc, webCT.timeline(wc), webCT.nextAction(wc)), 'stale');
    assert.equal(mobCT.nextAction(mc).channel, 'file-dot');
    // DOT filed, backdated 65 days -> ignored -> small claims (not chargeback)
    wc = webCT.recordFiling(wc.id, 'dot'); mc = mobCT.recordFiling(mc, 'dot');
    wc = webCT.update(wc.id, { filings: wc.filings.map((f) => (f.stage === 'dot' ? { ...f, date: iso(-65) } : f)) }); mc = { ...mc, filings: mc.filings.map((f) => (f.stage === 'dot' ? { ...f, date: iso(-65) } : f)) };
    assert.deepEqual(norm(mc, mobCT.timeline(mc), mobCT.nextAction(mc)), norm(wc, webCT.timeline(wc), webCT.nextAction(wc)), 'dot ignored');
    assert.equal(mobCT.nextAction(mc).channel, 'esc-notice');
    // paid
    wc = webCT.markOutcome(wc.id, 'paid'); mc = mobCT.markOutcome(mc, 'paid');
    assert.equal(mobCT.nextAction(mc).text, webCT.nextAction(wc).text);
    assert.deepEqual(j(mobCT.summary([mc])), j(webCT.summary()));
  });
}

// ---------------------------------------------------------------- contract of carriage (web ⇄ mobile)
// Rule numbers and verbatim quotes are what a traveler cites at the counter. The phone must never
// quote a different rule than the web. Regenerate with scripts/extract-coc-mobile.mjs.
{
  const cocSandbox = { window: {} };
  vm.createContext(cocSandbox);
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', 'coc-data.js'), 'utf8'), cocSandbox);
  const mobCoc = await import('../mobile/src/data/coc-full.ts');
  test('COC DECODER parity: the mobile dataset is identical to the web decode (every airline, provision, quote)', () => {
    assert.deepEqual(j(mobCoc.COC_FULL), j(cocSandbox.window.COC_DATA.airlines));
    assert.ok(mobCoc.COC_FULL.length >= 9, 'all airlines present');
  });
}

// ---------------------------------------------------------------- schedule-change lever (web ⇄ mobile)
{
  const schSandbox = { window: {} };
  vm.createContext(schSandbox);
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', 'coc-data.js'), 'utf8'), schSandbox);
  const mobSch = await import('../mobile/src/data/coc-full.ts');
  test('SCHEDULE LEVER parity: the federal floor, tactics and sources are identical on both platforms', () => {
    assert.deepEqual(j(mobSch.COC_SCHEDULE), j(schSandbox.window.COC_DATA.schedule));
    assert.ok(mobSch.COC_SCHEDULE.tactics.length >= 9, 'all tactics present');
  });
}
