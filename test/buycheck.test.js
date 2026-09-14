// Deterministic proof for the Buy Check — the pre-purchase synthesis of fees, coverage,
// contract leverage, and certificate eligibility. Run:  node --test
//
// Loads the REAL shipped modules (buycheck.js + coverage.js + fareclass.js) into one vm sandbox,
// with small fee/contract fixtures, so the assembly logic is tested against the actual code.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const sandbox = { window: {} };
vm.createContext(sandbox);
for (const f of ['coverage.js', 'fareclass.js', 'buycheck.js']) {
  vm.runInContext(readFileSync(path.join(__dirname, '..', 'public', f), 'utf8'), sandbox);
}
const BuyCheck = sandbox.window.BuyCheck;

const FEES = [
  { airline: 'Delta Air Lines', iata: 'DL', checkedBag1: '$45', carryOn: 'Free', seat: '$9–$150', changeFee: '$0', basicEconomy: 'No seat choice, no changes; carry-on allowed' },
  { airline: 'Frontier Airlines', iata: 'F9', checkedBag1: '$30–$75', carryOn: '$30–$115', seat: '$17–$60', changeFee: '$0 (7+ days out)', basicEconomy: 'Everything unbundled' },
];
const COC = { airlines: [
  { airline: 'Delta Air Lines', iata: 'DL', cocUrl: 'https://example.com/coc',
    scheduleChangeThreshold: 'Rule 19(A): cancellation, 180+ min, or any missed connection. More detail here.',
    rebooksOnOtherAirlines: 'No — purely discretionary under Rule 19(A). Longer explanation follows.',
    buriedGem: 'The missed-connection trigger has no minimum size. And more words.' },
] };
const deps = { fees: FEES, coc: COC, coverage: sandbox.window.Coverage, fareClass: sandbox.window.FareClass };

const run = (inp) => BuyCheck.run(inp, deps);
const sec = (r, kind) => r.sections.find((s) => s.kind === kind);

test('true price: Frontier basic with bag + carry-on + seat lands at fare + max fees', () => {
  const r = run({ airlineIndex: 1, fare: 50, fareType: 'basic', needs: { carryOn: true, bag: true, seat: true }, fromRegion: 'us', toRegion: 'us' });
  const p = sec(r, 'price');
  assert.equal(p.total, 50 + 75 + 115 + 60, 'uses the top of each range — the honest ceiling');
  assert.match(p.headline, /can run up to \$300/);
  assert.ok(p.warns.some((w) => /unbundled/.test(w)), 'basic-economy strip warning shown');
});

test('true price: Delta main with free carry-on adds only what costs money', () => {
  const r = run({ airlineIndex: 0, fare: 200, fareType: 'main', needs: { carryOn: true, bag: false, seat: false }, fromRegion: 'us', toRegion: 'us' });
  const p = sec(r, 'price');
  assert.equal(p.addons, 0, 'free carry-on adds nothing');
  assert.equal(p.level, 'good');
});

test('THE NUDGE: US→EU on a US carrier flags the EU-metal move', () => {
  const r = run({ airlineIndex: 0, fare: 600, fareType: 'main', needs: {}, fromRegion: 'us', toRegion: 'eu' });
  const c = sec(r, 'coverage');
  assert.equal(r.summary.euNudge, true);
  assert.ok(c.warns.some((w) => /EU airline/.test(w) && /OPERATES/.test(w)), 'names the move and the operating-carrier catch');
  assert.match(c.lines[0], /^Outbound: No /, 'outbound honestly not covered');
  assert.match(c.lines[1], /^Return: Yes/, 'return covered — the asymmetry visible in one place');
});

test('no false nudge when both directions are already covered (US⇄Canada)', () => {
  const r = run({ airlineIndex: 0, fare: 300, fareType: 'main', needs: {}, fromRegion: 'us', toRegion: 'ca' });
  const c = sec(r, 'coverage');
  assert.equal(r.summary.euNudge, false);
  assert.equal(c.level, 'good');
});

test('leverage section pulls the airline’s own contract facts, first sentence only', () => {
  const r = run({ airlineIndex: 0, fare: 100, fareType: 'main', needs: {}, fromRegion: 'us', toRegion: 'us' });
  const l = sec(r, 'leverage');
  assert.ok(l, 'section present when the airline is in COC data');
  assert.match(l.lines[0], /Rule 19\(A\)/);
  assert.ok(!/More detail here/.test(l.lines[0]), 'clipped to the first sentence');
  assert.match(l.gem, /no minimum size/);
});

test('certificate check appears for Delta with a class letter — and only for Delta', () => {
  const dl = run({ airlineIndex: 0, fare: 100, fareType: 'main', needs: {}, fromRegion: 'us', toRegion: 'us', bookingClass: 'T', tier: 'platinum' });
  const c = sec(dl, 'cert');
  assert.equal(c.level, 'good');
  assert.match(c.lines[0], /Main Cabin/);

  const f9 = run({ airlineIndex: 1, fare: 100, fareType: 'main', needs: {}, fromRegion: 'us', toRegion: 'us', bookingClass: 'T' });
  assert.equal(sec(f9, 'cert'), undefined, 'no Delta cert talk on a Frontier fare');
});

test('the basics section always closes the report with the 24-hour rule', () => {
  const r = run({ airlineIndex: 1, fare: 80, fareType: 'basic', needs: {}, fromRegion: 'us', toRegion: 'us' });
  const b = sec(r, 'basics');
  assert.ok(b.lines.some((l) => /24 hours to cancel free/.test(l)));
  assert.equal(r.sections[r.sections.length - 1].kind, 'basics');
});

test('missing airline index degrades to coverage + basics, never throws', () => {
  const r = run({ airlineIndex: 99, fare: 100, fareType: 'main', needs: {}, fromRegion: 'us', toRegion: 'eu' });
  assert.equal(sec(r, 'price'), undefined);
  assert.ok(sec(r, 'coverage'), 'coverage still runs');
  assert.ok(sec(r, 'basics'));
  assert.equal(r.summary.trueTotal, null);
});

// ---------------------------------------------------------------- the airline's record (DOT ATCR)
const SCORECARD = {
  report: { url: 'https://example.gov/atcr.pdf', period: 'January–June 2026', industry: { onTimePct: 76.14, cancelledPct: 2.23, mishandledBagsRate: 0.5, complaintsPer100k: 6.67, involuntaryDBPer10k: 0.21 } },
  airlines: [
    { iata: 'F9', name: 'Frontier Airlines', defunct: false, onTimePct: 72.06, onTimeRank: '7 of 9', cancelledPct: 1.99, mishandledBagsRate: 0.51, involuntaryDBPer10k: 1.42, complaintsPer100k: 21.07, period: 'January-June 2026', notes: null },
    { iata: 'DL', name: 'Delta Air Lines', defunct: false, onTimePct: 79.33, onTimeRank: '2 of 9', cancelledPct: 2.35, mishandledBagsRate: 0.37, involuntaryDBPer10k: 0, complaintsPer100k: 4.94, period: 'January-June 2026', notes: null },
    { iata: 'NK', name: 'Spirit Airlines', defunct: true, onTimePct: 59.84, cancelledPct: 7.47, complaintsPer100k: 27.81 },
  ],
};
const runSc = (inp) => BuyCheck.run(inp, { ...deps, scorecard: SCORECARD });

test('record: worse than industry on 2+ measures -> warn, each line names the industry figure and direction', () => {
  const r = runSc({ airlineIndex: 1, fare: 50, fareType: 'basic', from: 'us', to: 'us' }); // Frontier
  const s = sec(r, 'record');
  assert.ok(s, 'record section present');
  assert.equal(s.level, 'warn');
  assert.ok(s.lines.some((l) => l === 'On time: 72.1% (industry 76.1% — worse), ranked 7 of 9'), JSON.stringify(s.lines));
  assert.ok(s.lines.some((l) => l === 'Cancelled: 2.0% (industry 2.2% — better)'));
  assert.ok(s.lines.some((l) => l === 'Complaints per 100,000 passengers: 21.07 (industry 6.67 — worse)'));
  assert.ok(s.lines.some((l) => l === 'Bumped per 10,000: 1.42 (industry 0.21 — worse)'));
  assert.equal(s.warns.length, 1);
  assert.equal(s.period, 'January-June 2026');
  assert.equal(s.reportUrl, 'https://example.gov/atcr.pdf');
});

test('record: better than industry across the board -> good, no warning; absent airline -> no section', () => {
  const dl = sec(runSc({ airlineIndex: 0, fare: 300, fareType: 'main', from: 'us', to: 'us' }), 'record');
  assert.equal(dl.level, 'info'); // Delta cancels slightly MORE than industry (2.35 vs 2.23) -> one "worse" -> info, not good
  assert.equal(dl.warns.length, 0);
  assert.ok(dl.lines.some((l) => /Cancelled: 2\.4% \(industry 2\.2% — worse\)/.test(l)));
  const none = sec(BuyCheck.run({ airlineIndex: 0, fare: 300, fareType: 'main', from: 'us', to: 'us' }, { ...deps, scorecard: { report: null, airlines: [] } }), 'record');
  assert.equal(none, undefined);
});
