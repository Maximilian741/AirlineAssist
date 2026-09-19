/**
 * Buy Check — run a fare through everything the app knows BEFORE the airline gets your money.
 * Faithful TS port of web public/buycheck.js (locked by test/buycheck.test.js); keep in sync.
 * Pure and synchronous.
 */
import { COC_LITE } from '@/data/coc';
import { FEES, feeNum, type Fee } from '@/data/money';
import { check as coverageCheck, type Band, type CarrierRegion, type Region } from '@/lib/coverage';
import { decode as fareDecode } from '@/lib/fareclass';
import { SCORECARD, SCORECARD_REPORT } from '@/data/scorecard';

const money = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
const firstSentence = (s?: string) => {
  const m = String(s || '').match(/^.*?[.!?](?=\s|$)/);
  return m ? m[0] : String(s || '');
};

export type BuySection = {
  kind: 'price' | 'coverage' | 'leverage' | 'record' | 'cert' | 'basics';
  title: string;
  level: 'good' | 'warn' | 'info';
  headline?: string;
  lines: string[];
  warns: string[];
  gem?: string | null;
  total?: number;
  addons?: number;
  period?: string | null;
  reportUrl?: string | null;
};

export type BuyInput = {
  airlineIndex: number;
  fare?: number;
  fareType: 'basic' | 'main';
  needs: { carryOn?: boolean; bag?: boolean; seat?: boolean; change?: boolean };
  fromRegion: Region;
  toRegion: Region;
  carrierRegion?: CarrierRegion;
  band?: Band;
  bookingClass?: string;
  tier?: 'platinum' | 'reserve';
};

export function runBuyCheck(inp: BuyInput): { sections: BuySection[]; summary: { trueTotal: number | null; addons: number; euNudge: boolean } } {
  const sections: BuySection[] = [];
  const f: Fee | null = FEES[inp.airlineIndex] || null;
  // The letter on the ticket outranks the toggle: class E IS Basic Economy, so a Main-fare report
  // would be fiction. (lib/fareclass.ts is the source for that mapping.)
  const klass = String(inp.bookingClass || '').trim().toUpperCase().slice(0, 1);
  const fareType = klass === 'E' ? 'basic' : inp.fareType;

  // ---- 1. the real price ----
  if (f) {
    const fare = Number(inp.fare) || 0;
    const needs = inp.needs || {};
    const lines: string[] = [];
    let add = 0;
    if (needs.bag) { const n = feeNum(f.checkedBag1); if (n) { add += n; lines.push(`Checked bag: up to +${money(n)}`); } }
    if (needs.carryOn) { const n = feeNum(f.carryOn); if (n) { add += n; lines.push(`Carry-on: up to +${money(n)}`); } }
    if (needs.seat) { const n = feeNum(f.seat); if (n) { add += n; lines.push(`Seat selection: up to +${money(n)}`); } }
    const total = fare + add;
    const warns: string[] = [];
    if (fareType === 'basic' && f.basicEconomy) warns.push('This airline’s basic fare strips: ' + f.basicEconomy);
    if (fareType === 'basic' && needs.change) warns.push('Basic fares usually can’t be changed — if plans shift, the whole fare is gone.');
    if (fareType !== 'basic' && needs.change && f.changeFee) warns.push('Changes on this fare: ' + f.changeFee);
    // "No change fees" is a promise about the standard fare, not the cheapest one on the same flight.
    if (fareType !== 'basic' && needs.change) warns.push('That no-change-fee promise covers the standard fare (on Delta, Main Classic and above). The cheapest fare on the same flight — Main Basic / Basic Economy — still can’t be changed at all.');
    if (klass === 'E' && inp.fareType !== 'basic') warns.push('You entered class E, which IS Basic Economy — this report uses the basic-fare rules, not the ones for the fare type you picked.');
    sections.push({
      kind: 'price',
      title: 'What it really costs',
      level: add > 0 ? 'warn' : 'good',
      headline: fare
        ? (add > 0 ? `That ${money(fare)} fare can run up to ${money(total)} with what you need.` : `${money(fare)} — no add-on fees for what you selected.`)
        : (add > 0 ? `Add-ons alone can reach ${money(add)}.` : 'No add-on fees for what you selected.'),
      lines,
      warns,
      total,
      addons: add,
    });
  }

  // ---- 2. protection: outbound vs return ----
  let euNudge = false;
  if (inp.fromRegion && inp.toRegion) {
    const carrier = inp.carrierRegion || 'us';
    const band = inp.band || 'long';
    const out = coverageCheck({ from: inp.fromRegion, to: inp.toRegion, carrier, band });
    const back = coverageCheck({ from: inp.toRegion, to: inp.fromRegion, carrier, band });
    const lines = ['Outbound: ' + out.headline, 'Return: ' + back.headline];
    const warns: string[] = [];
    let level: BuySection['level'] = out.covered.length && back.covered.length ? 'good' : out.covered.length || back.covered.length ? 'warn' : 'info';
    euNudge = ['eu', 'ch'].includes(inp.toRegion) && carrier !== 'eu' && inp.fromRegion === 'us';
    if (euNudge) {
      warns.push('The move: on this route, a U.S. airline leaves your outbound unprotected — the same trip on an EU airline (Air France, KLM, Lufthansa…) is covered up to €600 in BOTH directions, often at the same price. Check who OPERATES the plane, not the code on the ticket.');
      level = 'warn';
    }
    sections.push({ kind: 'coverage', title: 'If it goes wrong, are you covered?', level, lines, warns });
  }

  // ---- 3. the leverage you keep after buying ----
  if (f) {
    const iata = (f.iata || '').split(/\s*\/\s*/)[0];
    const a = COC_LITE.find((x) => (x.iata || '').split(/\s*\/\s*/).includes(iata) || x.airline.toLowerCase().startsWith((f.airline || '').toLowerCase().slice(0, 6)));
    if (a) {
      sections.push({
        kind: 'leverage',
        title: 'Leverage you keep after buying',
        level: 'info',
        lines: [
          'If they move your flight: ' + firstSentence(a.scheduleChangeThreshold),
          'Rebooking on a competitor: ' + firstSentence(a.rebooksOnOtherAirlines),
        ],
        warns: [],
        gem: a.buriedGem ? firstSentence(a.buriedGem) : null,
      });
    }
  }


  // ---- 3b. the airline's record (DOT Air Travel Consumer Report) ----
  if (f) {
    const iata = (f.iata || '').split(/\s*\/\s*/)[0];
    const rec = SCORECARD.find((x) => x.iata === iata && !x.defunct);
    const ind = SCORECARD_REPORT?.industry;
    if (rec && (rec.onTimePct != null || rec.cancelledPct != null || rec.complaintsPer100k != null)) {
      const lines: string[] = [], warns: string[] = [];
      const vs = (v: number | null, avg: number | null | undefined, lowerBetter: boolean, fmt: (n: number) => string) => (v == null ? null : avg == null ? fmt(v) : `${fmt(v)} (industry ${fmt(avg)}${(lowerBetter ? v <= avg : v >= avg) ? ' — better' : ' — worse'})`);
      const pct = (n: number) => `${Number(n).toFixed(1)}%`;
      const two = (n: number) => Number(n).toFixed(2);
      const ot = vs(rec.onTimePct, ind?.onTimePct, false, pct); if (ot) lines.push('On time: ' + ot + (rec.onTimeRank ? `, ranked ${rec.onTimeRank}` : ''));
      const cx = vs(rec.cancelledPct, ind?.cancelledPct, true, pct); if (cx) lines.push('Cancelled: ' + cx);
      const cp = vs(rec.complaintsPer100k, ind?.complaintsPer100k, true, two); if (cp) lines.push('Complaints per 100,000 passengers: ' + cp);
      const bg = vs(rec.mishandledBagsRate, ind?.mishandledBagsRate, true, two); if (bg) lines.push('Bags mishandled per 100: ' + bg);
      const db = vs(rec.involuntaryDBPer10k, ind?.involuntaryDBPer10k, true, two); if (db) lines.push('Bumped per 10,000: ' + db);
      let level: BuySection['level'] = 'info';
      const worseCount = [
        rec.cancelledPct != null && ind?.cancelledPct != null && rec.cancelledPct > ind.cancelledPct,
        rec.complaintsPer100k != null && ind?.complaintsPer100k != null && rec.complaintsPer100k > ind.complaintsPer100k,
        rec.onTimePct != null && ind?.onTimePct != null && rec.onTimePct < ind.onTimePct,
      ].filter(Boolean).length;
      if (worseCount >= 2) { level = 'warn'; warns.push('Worse than the industry on most of the government’s measures for this period. Price it in — and know the levers above.'); }
      else if (worseCount === 0 && lines.length >= 3) level = 'good';
      sections.push({ kind: 'record', title: 'Their record, by the government’s numbers', level, lines, warns, period: rec.period || SCORECARD_REPORT?.period || null, reportUrl: SCORECARD_REPORT?.url || null });
    }
  }

  // ---- 4. certificate check (Delta + class letter) ----
  if (inp.bookingClass && f && /^DL$/i.test(f.iata || '')) {
    const d = fareDecode(inp.bookingClass, inp.tier || 'platinum');
    if (d) {
      sections.push({
        kind: 'cert',
        title: 'Companion certificate on this fare',
        level: d.cert.ok ? 'good' : 'warn',
        lines: d.cert.ok
          ? [`Class ${d.code} books into ${d.cert.cabin} — the certificate can ticket it. The companion should price at taxes only.`]
          : [`Class ${d.code}: ${d.cert.why || 'not eligible.'}`],
        warns: [],
      });
    }
  }

  // ---- 5. before you click buy ----
  sections.push({
    kind: 'basics',
    title: 'Before you click buy',
    level: 'info',
    lines: [
      'Book directly with the airline — the 24-hour free-cancel rule is cleanest there, and schedule-change leverage is easier to use without a middleman.',
      'Booked 7+ days before departure? You have 24 hours to cancel free, whatever the fare says. Lock it in, keep shopping.',
      'Screenshot the fare page at purchase — the schedule, the price, the fare rules. It’s your evidence for every lever later.',
    ],
    warns: [],
  });

  const price = sections.find((s) => s.kind === 'price');
  return {
    sections,
    summary: { trueTotal: price ? price.total ?? null : null, addons: price ? price.addons ?? 0 : 0, euNudge },
  };
}
