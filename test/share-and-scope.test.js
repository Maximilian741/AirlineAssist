// Share cards and captions may only say what the engine firmly supports, and web and mobile must say
// exactly the same thing. Also sweeps the answers added for legal scope (bump origin, downgrade flown)
// through both engines. Loads the REAL shipped public/*.js and imports the mobile .ts modules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ['claim-engine.js', 'viral.js']) vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', f), 'utf8'), sandbox);
const webCE = sandbox.window.ClaimEngine;
const webViral = sandbox.window.Viral;
const mobCE = await import('../mobile/src/lib/claim-engine.ts');
const mobViral = await import('../mobile/src/lib/viral.ts');
const j = (x) => JSON.parse(JSON.stringify(x ?? null));
const D = { airline: 'Delta Air Lines' };
const base = { incidentDate: '2026-06-01', payment: 'credit' };

const NOTHING_FIRM = {
  'cancellation, flew the rebooking': { type: 'cancelled', traveled: 'yes', region: 'us' },
  'volunteered for the bump': { type: 'bumped', voluntary: 'yes', region: 'us' },
  'bumped, arrived within an hour': { type: 'bumped', voluntary: 'no', region: 'us', fareOneWay: 400, arrDelay: '<1' },
  'bumped leaving the EU': { type: 'bumped', voluntary: 'no', region: 'from_eu', arrDelay: '4-6', distanceBand: 'long' },
  'kept a big schedule change': { type: 'schedule', schedDelta: '6+', schedAccepted: 'yes', region: 'us' },
  'bag back within 12 hours': { type: 'bag_late', bagHours: 'lt12', reportFiled: 'yes', region: 'us' },
  'U.S. delay': { type: 'delayed', arrDelay: '4-6', region: 'us' },
  'EU delay (conditional cash only)': { type: 'delayed', arrDelay: '4-6', region: 'from_eu', distanceBand: 'long' },
};

test('nothing firm owed -> no share card and no caption, on web and mobile alike', () => {
  for (const [name, a] of Object.entries(NOTHING_FIRM)) {
    const answers = { ...base, ...a };
    const wr = webCE.assess(answers), mr = mobCE.assess(answers);
    assert.equal(webViral.shareable(wr), false, 'web shareable: ' + name);
    assert.equal(mobViral.shareable(mr), false, 'mobile shareable: ' + name);
    assert.equal(webViral.cardCopy(wr, answers, D), null, 'web card: ' + name);
    assert.equal(mobViral.cardCopy(mr, answers, D), null, 'mobile card: ' + name);
    assert.equal(webViral.caption(wr, answers, D, 0), '', 'web caption: ' + name);
    assert.equal(mobViral.caption(mr, answers, D, 0), '', 'mobile caption: ' + name);
  }
});

const FIRM = {
  'refused cancellation': { type: 'cancelled', traveled: 'no', region: 'us' },
  'bumped with a fare': { type: 'bumped', voluntary: 'no', region: 'us', fareOneWay: 300, arrDelay: '3-4' },
  'bumped, no fare entered': { type: 'bumped', voluntary: 'no', region: 'us', fareOneWay: 0, arrDelay: '3-4' },
  'lost bag (U.S.)': { type: 'bag_lost', region: 'us' },
  'lost bag (international)': { type: 'bag_lost', region: 'intl_from_us' },
  'late bag with report': { type: 'bag_late', bagHours: '15-30', reportFiled: 'yes', region: 'us' },
  'declined schedule change': { type: 'schedule', schedDelta: '3-4', schedAccepted: 'no', region: 'us' },
  'refused downgrade': { type: 'downgrade', downgradeFlew: 'no', region: 'us' },
  'flew the downgrade (fare difference)': { type: 'downgrade', downgradeFlew: 'yes', region: 'us' },
  'route change declined': { type: 'schedule', schedDelta: 'route', schedAccepted: 'no', region: 'us' },
  'bag still missing, no report': { type: 'bag_late', bagHours: 'missing', reportFiled: 'no', region: 'intl_from_us' },
  'unused extra': { type: 'extra' },
};

test('firm claims produce identical card copy and captions on both platforms', () => {
  for (const [name, a] of Object.entries(FIRM)) {
    const answers = { ...base, ...a };
    const wr = webCE.assess(answers), mr = mobCE.assess(answers);
    const wc = webViral.cardCopy(wr, answers, D);
    assert.ok(wc, 'web has a card: ' + name);
    assert.deepEqual(j(mobViral.cardCopy(mr, answers, D)), j(wc), 'card copy parity: ' + name);
    for (const v of [0, 1, 2]) assert.equal(mobViral.caption(mr, answers, D, v), webViral.caption(wr, answers, D, v), `caption parity v${v}: ${name}`);
  }
});

test('the exact bump amount is shown; a ceiling is never presented as what they owe', () => {
  const paid = { ...base, ...FIRM['bumped with a fare'] };
  assert.equal(webViral.cardCopy(webCE.assess(paid), paid, D).big, '$1,200');

  // With no fare entered there is no dollar figure — so the percentage keeps its cap, and the cap is never
  // presented as the amount owed.
  const noFare = { ...base, ...FIRM['bumped, no fare entered'] };
  const c = webViral.cardCopy(webCE.assess(noFare), noFare, D);
  assert.match(c.headline, /owes me 400% of my fare, capped at \$2,150/);
  assert.doesNotMatch(c.headline, /owes me \$2,150|owes me up to/);
  assert.equal(c.big, '400% of my fare');

  // A bag liability is a ceiling on a provable loss, in either regime — never "owes me".
  for (const [name, figure] of [['lost bag (U.S.)', '$4,700'], ['lost bag (international)', '1,519 SDR'], ['bag still missing, no report', '1,519 SDR']]) {
    const a = { ...base, ...FIRM[name] };
    const lc = webViral.cardCopy(webCE.assess(a), a, D);
    assert.equal(lc.panelLabel, 'COVERED UP TO', name);
    assert.equal(lc.big, figure, name);
    assert.doesNotMatch(lc.headline, /owes me/, name);
    assert.match(lc.sub, /up to/, name);
    assert.match(webViral.caption(webCE.assess(a), a, D, 0), /loses your bag/, name + ': the lost-bag hook');
  }

  // A refund reads as a refund, not as "100% of my fare".
  for (const name of ['refused cancellation', 'declined schedule change', 'refused downgrade']) {
    const a = { ...base, ...FIRM[name] };
    assert.match(webViral.cardCopy(webCE.assess(a), a, D).headline, /owes me a full refund/, name);
  }
  const flew = { ...base, ...FIRM['flew the downgrade (fare difference)'] };
  assert.match(webViral.cardCopy(webCE.assess(flew), flew, D).headline, /owes me the fare difference/);
  assert.match(webViral.caption(webCE.assess(flew), flew, D, 0), /flew it anyway/);

  // A route change is not "changed my flight by hours".
  const route = { ...base, ...FIRM['route change declined'] };
  const cap = webViral.caption(webCE.assess(route), route, D, 0);
  assert.match(cap, /added a connection/);
  assert.doesNotMatch(cap, /by hours/);
});

test('no caption or card anywhere narrates money already received, invents a voucher, or leans on "by law"', () => {
  const banned = /got my money back|got the refund|owed me mine|by law|offered a voucher|real money|That's how I got/i;
  for (const [name, a] of Object.entries(FIRM)) {
    const answers = { ...base, ...a };
    const r = webCE.assess(answers);
    const c = webViral.cardCopy(r, answers, D);
    assert.doesNotMatch([c.headline, c.sub, c.big, c.rule].join(' '), banned, 'card: ' + name);
    for (const v of [0, 1, 2]) assert.doesNotMatch(webViral.caption(r, answers, D, v), banned, `caption v${v}: ${name}`);
  }
});

test('ENGINE parity for the legal-scope answers: bump origin × region × delay, downgrade flown × region', () => {
  const strip = (r) => j({ entitlements: r.entitlements, headline: r.headline, letterBody: r.letterBody, dotText: r.dotText, hasClaim: r.hasClaim });
  let n = 0;
  for (const region of ['us', 'intl_from_us', 'from_eu', 'from_uk', 'canada'])
    for (const bumpOrigin of [undefined, 'us', 'canada'])
      for (const arrDelay of ['<1', '1-2', '3-4', '6-9'])
        for (const fareOneWay of [0, 250]) {
          const a = { ...base, type: 'bumped', voluntary: 'no', region, bumpOrigin, arrDelay, fareOneWay, distanceBand: 'long' };
          assert.deepEqual(strip(mobCE.assess(a)), strip(webCE.assess(a)), JSON.stringify(a));
          n++;
        }
  for (const region of ['us', 'intl_from_us', 'from_eu', 'from_uk', 'canada'])
    for (const downgradeFlew of [undefined, 'yes', 'no'])
      for (const payment of ['credit', 'other']) {
        const a = { ...base, type: 'downgrade', downgradeFlew, region, payment, distanceBand: 'medium' };
        assert.deepEqual(strip(mobCE.assess(a)), strip(webCE.assess(a)), JSON.stringify(a));
        n++;
      }
  for (const traveled of ['no', 'yes']) {
    const a = { ...base, type: 'cancelled', traveled, region: 'canada' };
    assert.deepEqual(strip(mobCE.assess(a)), strip(webCE.assess(a)), JSON.stringify(a));
    n++;
  }
  assert.equal(n, 5 * 3 * 4 * 2 + 5 * 3 * 2 + 2);
  for (const t of ['$800 (400% of your one-way fare, capped at $2,150)', 'Your provable loss, up to $4,700 per passenger', 'CAD 400 / 700 / 1,000 (large airlines)', '€600 per person, in cash']) {
    assert.equal(mobCE.exactAmount(t), webCE.exactAmount(t), t);
  }
});

test('captions read naturally with no airline entered, and match across platforms', () => {
  for (const [name, a] of Object.entries(FIRM)) {
    const answers = { ...base, ...a };
    const wr = webCE.assess(answers), mr = mobCE.assess(answers);
    for (const v of [0, 1, 2]) {
      const c = webViral.caption(wr, answers, {}, v);
      assert.equal(mobViral.caption(mr, answers, {}, v), c, `parity v${v}: ${name}`);
      assert.doesNotMatch(c, /[a-z,;—] The airline|The airline flight/, `no mid-sentence "The airline" v${v}: ${name}`);
    }
  }
});
