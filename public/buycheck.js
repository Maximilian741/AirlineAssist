// buycheck.js — run a fare through everything we know BEFORE the airline gets your money.
//
// Airlines' structural advantage peaks at the moment of purchase: you see one number, they know
// the rest — the fees that surface at checkout, the coverage asymmetry between your outbound and
// return, the contract leverage you keep (or give up), whether the certificate can even ticket the
// fare. This module synthesizes the app's verified datasets (fees, coverage rules, contract of
// carriage, fare classes) into one pre-purchase report. Pure and synchronous so it's testable;
// the deal-verdict-vs-history line is layered on by the renderer, which can fetch.

window.BuyCheck = (function () {
  'use strict';

  function feeNum(s) {
    if (!s) return 0;
    const nums = [...String(s).matchAll(/\$\s?(\d+)/g)].map((m) => Number(m[1]));
    return nums.length ? Math.max(...nums) : 0;
  }
  const money = (n) => '$' + Math.round(n).toLocaleString('en-US');
  const firstSentence = (s) => {
    const m = String(s || '').match(/^.*?[.!?](?=\s|$)/);
    return m ? m[0] : String(s || '');
  };

  /**
   * @param {object} inp
   *   airlineIndex  index into deps.fees
   *   fare          number (USD)
   *   fareType      'basic' | 'main'
   *   needs         { carryOn, bag, seat, change }
   *   fromRegion/toRegion  Coverage region ids
   *   bookingClass  optional letter (Delta cert check)
   *   tier          'platinum' | 'reserve'
   * @param {object} [deps]  { fees, coverage, fareClass, coc, airlines } — defaults to window.*
   */
  function run(inp, deps) {
    deps = deps || {};
    const fees = deps.fees || (window.MONEY_DATA && window.MONEY_DATA.fees) || [];
    const Coverage = deps.coverage || window.Coverage;
    const FareClass = deps.fareClass || window.FareClass;
    const coc = deps.coc || window.COC_DATA;
    const sections = [];
    const f = fees[Number(inp.airlineIndex)] || null;

    // ---------- 1. the real price ----------
    if (f) {
      const fare = Number(inp.fare) || 0;
      const needs = inp.needs || {};
      const lines = [];
      let add = 0;
      if (needs.bag) { const n = feeNum(f.checkedBag1); if (n) { add += n; lines.push(`Checked bag: up to +${money(n)}`); } }
      if (needs.carryOn) { const n = feeNum(f.carryOn); if (n) { add += n; lines.push(`Carry-on: up to +${money(n)}`); } }
      if (needs.seat) { const n = feeNum(f.seat); if (n) { add += n; lines.push(`Seat selection: up to +${money(n)}`); } }
      const total = fare + add;
      const warns = [];
      if (inp.fareType === 'basic' && f.basicEconomy) warns.push('This airline’s basic fare strips: ' + f.basicEconomy);
      if (inp.fareType === 'basic' && needs.change) warns.push('Basic fares usually can’t be changed — if plans shift, the whole fare is gone.');
      if (inp.fareType !== 'basic' && needs.change && f.changeFee) warns.push('Changes on this fare: ' + f.changeFee);
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

    // ---------- 2. protection: outbound vs return ----------
    if (Coverage && inp.fromRegion && inp.toRegion) {
      const carrier = inp.carrierRegion || 'us';
      const out = Coverage.check({ from: inp.fromRegion, to: inp.toRegion, carrier, band: inp.band || 'long' });
      const back = Coverage.check({ from: inp.toRegion, to: inp.fromRegion, carrier, band: inp.band || 'long' });
      const lines = [
        'Outbound: ' + out.headline,
        'Return: ' + back.headline,
      ];
      const warns = [];
      let level = out.covered.length && back.covered.length ? 'good' : out.covered.length || back.covered.length ? 'warn' : 'info';
      // The booking-time move worth real money: on US⇄EU, EU metal covers BOTH directions.
      const euNudge = ['eu', 'ch'].includes(inp.toRegion) && carrier !== 'eu' && inp.fromRegion === 'us';
      if (euNudge) {
        warns.push('The move: on this route, a U.S. airline leaves your outbound unprotected — the same trip on an EU airline (Air France, KLM, Lufthansa…) is covered up to €600 in BOTH directions, often at the same price. Check who OPERATES the plane, not the code on the ticket.');
        level = 'warn';
      }
      sections.push({ kind: 'coverage', title: 'If it goes wrong, are you covered?', level, lines, warns, euNudge });
    }

    // ---------- 3. the leverage you keep after buying ----------
    if (coc && coc.airlines && f) {
      const iata = (f.iata || '').split(/\s*\/\s*/)[0];
      const a = coc.airlines.find((x) => (x.iata || '').split(/\s*\/\s*/).includes(iata) || x.airline.toLowerCase().startsWith((f.airline || '').toLowerCase().slice(0, 6)));
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
          cocUrl: a.cocUrl,
          airline: a.airline,
        });
      }
    }


    // ---------- 3b. the airline's record (DOT Air Travel Consumer Report) ----------
    // Only when we hold verified figures for THIS airline; every number is DOT's, same period for all.
    const sc = deps.scorecard || window.SCORECARD;
    if (sc && Array.isArray(sc.airlines) && f) {
      const iata = (f.iata || '').split(/\s*\/\s*/)[0];
      const rec = sc.airlines.find((x) => x.iata === iata && !x.defunct);
      const ind = (sc.report && sc.report.industry) || {};
      if (rec && (rec.onTimePct != null || rec.cancelledPct != null || rec.complaintsPer100k != null)) {
        const lines = [], warns = [];
        const vs = (v, avg, lowerBetter, fmt) => (v == null ? null : avg == null ? fmt(v) : `${fmt(v)} (industry ${fmt(avg)}${(lowerBetter ? v <= avg : v >= avg) ? ' — better' : ' — worse'})`);
        const pct = (n) => `${Number(n).toFixed(1)}%`;
        const two = (n) => Number(n).toFixed(2);
        const ot = vs(rec.onTimePct, ind.onTimePct, false, pct); if (ot) lines.push('On time: ' + ot + (rec.onTimeRank ? `, ranked ${rec.onTimeRank}` : ''));
        const cx = vs(rec.cancelledPct, ind.cancelledPct, true, pct); if (cx) lines.push('Cancelled: ' + cx);
        const cp = vs(rec.complaintsPer100k, ind.complaintsPer100k, true, two); if (cp) lines.push('Complaints per 100,000 passengers: ' + cp);
        const bg = vs(rec.mishandledBagsRate, ind.mishandledBagsRate, true, two); if (bg) lines.push('Bags mishandled per 100: ' + bg);
        const db = vs(rec.involuntaryDBPer10k, ind.involuntaryDBPer10k, true, two); if (db) lines.push('Bumped per 10,000: ' + db);
        let level = 'info';
        const worseCount = [
          rec.cancelledPct != null && ind.cancelledPct != null && rec.cancelledPct > ind.cancelledPct,
          rec.complaintsPer100k != null && ind.complaintsPer100k != null && rec.complaintsPer100k > ind.complaintsPer100k,
          rec.onTimePct != null && ind.onTimePct != null && rec.onTimePct < ind.onTimePct,
        ].filter(Boolean).length;
        if (worseCount >= 2) { level = 'warn'; warns.push('Worse than the industry on most of the government’s measures for this period. Price it in — and know the levers above.'); }
        else if (worseCount === 0 && lines.length >= 3) level = 'good';
        sections.push({ kind: 'record', title: 'Their record, by the government’s numbers', level, lines, warns, period: rec.period || (sc.report && sc.report.period) || null, reportUrl: sc.report && sc.report.url || null });
      }
    }

    // ---------- 4. certificate check (Delta + class letter) ----------
    if (FareClass && inp.bookingClass && f && /^DL$/i.test(f.iata || '')) {
      const d = FareClass.decode(inp.bookingClass, inp.tier || 'platinum');
      if (d) {
        sections.push({
          kind: 'cert',
          title: 'Companion certificate on this fare',
          level: d.cert && d.cert.ok ? 'good' : 'warn',
          lines: d.cert && d.cert.ok
            ? [`Class ${d.code} books into ${d.cert.cabin} — the certificate can ticket it. The companion should price at taxes only.`]
            : [`Class ${d.code}: ${d.cert ? d.cert.why : 'not eligible.'}`],
          warns: [],
        });
      }
    }

    // ---------- 5. before you click buy ----------
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
    const cov = sections.find((s) => s.kind === 'coverage');
    return {
      sections,
      summary: {
        trueTotal: price ? price.total : null,
        addons: price ? price.addons : 0,
        euNudge: !!(cov && cov.euNudge),
      },
    };
  }

  return { run };
})();
