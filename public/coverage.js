// coverage.js — "Does EU (or UK / Canada) law cover my flight?"
//
// WHY THIS EXISTS: EU261 is the strongest passenger-rights law in the world, and it protects
// millions of Americans who have no idea. It follows the FLIGHT, not the passenger's nationality
// or the airline's. Any flight DEPARTING an EU airport is covered — including Delta, United and
// American. Every American flying home from Europe on a delayed flight may be owed €250–€600 cash
// for a disruption that would pay $0 under U.S. law.
//
// The rules are counterintuitive in a way that costs people money:
//   * Departing the EU  -> ANY airline is covered (yes, including U.S. carriers)
//   * Arriving in the EU -> ONLY EU-licensed airlines are covered
// So JFK→CDG on Delta is NOT covered, but CDG→JFK on the very same Delta aircraft IS.
// That single asymmetry is why most Americans never claim.
//
// Coverage rules verified against Reg. (EC) 261/2004 Art. 3, UK CAA (retained UK261), and the
// Canadian Transportation Agency APPR. Amounts come from the same verified data as rights-data.js.

window.Coverage = (function () {
  'use strict';

  // Regions the user picks from. Kept coarse on purpose — no airport database needed, and it's
  // simple enough for someone who just wants to know "am I owed something?"
  const REGIONS = [
    { id: 'eu', label: 'European Union / EEA', hint: 'incl. Iceland, Norway, Liechtenstein' },
    { id: 'uk', label: 'United Kingdom' },
    { id: 'ch', label: 'Switzerland' },
    { id: 'ca', label: 'Canada' },
    { id: 'us', label: 'United States' },
    { id: 'other', label: 'Somewhere else' },
  ];

  // Where the AIRLINE is licensed — this is what decides arriving-flight coverage.
  const CARRIERS = [
    { id: 'us', label: 'A U.S. airline', hint: 'Delta, United, American, JetBlue…' },
    { id: 'eu', label: 'An EU/EEA airline', hint: 'Air France, KLM, Lufthansa, Aer Lingus…' },
    { id: 'uk', label: 'A UK airline', hint: 'British Airways, Virgin Atlantic, easyJet…' },
    { id: 'ca', label: 'A Canadian airline', hint: 'Air Canada, WestJet' },
    { id: 'other', label: 'Another country’s airline', hint: 'Emirates, Qatar, ANA…' },
  ];

  const EU_AMOUNTS = { short: '€250', medium: '€400', long: '€600' };
  const UK_AMOUNTS = { short: '£220', medium: '£350', long: '£520' };

  /**
   * Which regimes cover this flight.
   * @param {{from:string, to:string, carrier:string, band?:string}} t
   * @returns {{covered:Array, notCovered:Array, best:object|null, headline:string}}
   */
  function check(t) {
    const from = t.from, to = t.to, carrier = t.carrier;
    const band = t.band || 'long';
    const covered = [];
    const notCovered = [];

    // ---- EU261 — Reg. (EC) 261/2004, Art. 3(1) ----
    // Switzerland applies EU261 through the 1999 EU–Swiss Air Transport Agreement (Joint
    // Committee Decision 1/2006): departures from Swiss airports are covered on any airline.
    if (from === 'eu' || from === 'ch') {
      covered.push({
        regime: 'EU261',
        why: from === 'ch'
          ? 'Your flight departs Switzerland — which applies EU261 through the EU–Swiss air transport agreement. Departures are covered on ANY airline, including U.S. carriers.'
          : 'Your flight departs the EU/EEA — and EU261 covers departures on ANY airline, including U.S. carriers.',
        amount: EU_AMOUNTS[band],
        pays: 'cash compensation for cancellations and 3h+ arrival delays, plus meals and a hotel while you wait — and the care (meals/hotel) is owed even when weather kills the cash claim',
        rule: from === 'ch' ? 'Reg. 261/2004 via the EU–Switzerland Air Transport Agreement' : 'Regulation (EC) 261/2004, Art. 3(1)(a)',
        url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32004R0261',
        strength: 'strong',
      });
    } else if ((to === 'eu' || to === 'ch') && carrier === 'eu') {
      covered.push({
        regime: 'EU261',
        why: 'Your flight arrives in the EU/EEA on an EU airline — arrivals are covered only when the OPERATING carrier is EU-licensed. (It’s who flies the plane that counts, not the code on your ticket.)',
        amount: EU_AMOUNTS[band],
        pays: 'cash compensation for cancellations and 3h+ arrival delays, plus meals and a hotel while you wait',
        rule: 'Regulation (EC) 261/2004, Art. 3(1)(b)',
        url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32004R0261',
        strength: 'strong',
      });
    } else if ((to === 'eu' || to === 'ch') && carrier !== 'eu') {
      notCovered.push({
        regime: 'EU261',
        why: 'Flights INTO the EU are only covered when the operating airline is EU-licensed. On a non-EU carrier, an arrival into the EU falls outside EU261 — even though the identical route in the other direction would be covered.',
        tip: 'Flying home from the EU on this same airline WOULD be covered. Worth knowing for the return leg.',
      });
    }

    // ---- UK261 — retained EU261 in UK law ----
    if (from === 'uk') {
      covered.push({
        regime: 'UK261',
        why: 'Your flight departs the UK — covered on ANY airline.',
        amount: UK_AMOUNTS[band],
        pays: 'cash compensation for cancellations and 3h+ delays, plus meals and a hotel',
        rule: 'UK261 (retained Reg. 261/2004)',
        url: 'https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/delays/',
        strength: 'strong',
      });
    } else if (to === 'uk' && (carrier === 'uk' || carrier === 'eu')) {
      covered.push({
        regime: 'UK261',
        why: 'Your flight arrives in the UK on a UK or EU airline — which UK261 covers.',
        amount: UK_AMOUNTS[band],
        pays: 'cash compensation for cancellations and 3h+ delays, plus meals and a hotel',
        rule: 'UK261 (retained Reg. 261/2004)',
        url: 'https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/delays/',
        strength: 'strong',
      });
    } else if (to === 'uk') {
      notCovered.push({
        regime: 'UK261',
        why: 'Arrivals into the UK are covered only on a UK or EU airline.',
        tip: 'The return leg departing the UK would be covered on any airline.',
      });
    }

    // ---- Canada APPR — applies to/from/within Canada on any carrier, both directions ----
    if (from === 'ca' || to === 'ca') {
      covered.push({
        regime: 'Canada APPR',
        why: 'Your flight touches Canada — the APPR covers flights to, from, and within Canada on ANY airline, in both directions (unlike EU261, arrivals count too).',
        amount: 'CAD 400–1,000',
        pays: 'cash for 3h+ delays within the airline’s control and not safety-required (CAD 900–2,400 for denied boarding; small regional carriers pay a lower CAD 125–500 scale)',
        rule: 'Air Passenger Protection Regulations, SOR/2019-150',
        url: 'https://otc-cta.gc.ca/eng/air-passenger-protection-regulations-highlights',
        strength: 'strong',
        deadline: 'File with the airline within 1 YEAR — the strictest clock of the three regimes.',
      });
    }

    // ---- Things worth knowing that change the answer ----
    const alsoKnow = [];
    if (from === 'eu' || from === 'ch' || from === 'uk') {
      alsoKnow.push({
        title: 'Connections on ONE booking are covered end-to-end',
        detail: 'If your journey left on a single reservation, the delay is measured at your FINAL destination — even when the late leg happens outside Europe on a partner airline. Courts have confirmed it (Wegener; České aerolinie; United Airlines C-561/20). Two catches: separate tickets don’t connect, and a round trip is judged one direction at a time — the return is its own journey.',
      });
      alsoKnow.push({
        title: '“Technical problems” still pay',
        detail: 'Airlines love citing mechanics as if it voids the claim. It doesn’t — routine technical faults are NOT “extraordinary circumstances” under EU law (Wallentin-Hermann; van der Lans). Genuine weather kills the cash, but even then meals and a hotel are still owed, uncapped (McDonagh v Ryanair).',
      });
    }
    if ((to === 'eu' || to === 'ch' || to === 'uk') && carrier !== 'eu' && carrier !== 'uk') {
      alsoKnow.push({
        title: 'Codeshares: the OPERATING airline decides coverage',
        detail: 'An Air France flight number on a Delta-operated plane counts as Delta — not covered into the EU. The reverse also works in your favor: a Delta number on an Air France-operated plane IS covered. Check who actually flies the metal before you book.',
      });
    }

    // ---- Purely domestic U.S. — the honest bad news ----
    if (!covered.length && from === 'us' && to === 'us') {
      notCovered.push({
        regime: 'U.S. law',
        why: 'There is no U.S. law requiring cash compensation for a delay. You still have refund rights if the flight is cancelled or significantly changed, bumping compensation if you’re denied boarding, and baggage protections — but no delay payout.',
        tip: 'This is the gap: the same delay would pay €600 leaving Europe.',
      });
    }

    const best = covered[0] || null;
    let headline;
    if (covered.length) {
      const amounts = covered.map((c) => c.amount).filter(Boolean).join(' / ');
      headline = `Yes — ${covered.map((c) => c.regime).join(' and ')} cover${covered.length === 1 ? 's' : ''} this flight. Worth up to ${amounts} per person, in cash.`;
    } else if (from === 'us' && to === 'us') {
      headline = 'No cash-compensation law covers a U.S. domestic delay — but you still have refund, bumping and baggage rights.';
    } else {
      headline = 'No EU/UK/Canada compensation law covers this flight — but your U.S. refund, bumping and baggage rights still apply.';
    }

    return { covered, notCovered, alsoKnow, best, headline };
  }

  /**
   * The gap, side by side. This is the argument in one table: identical disruption, wildly
   * different outcome depending on which side of the Atlantic you took off from.
   */
  const GAPS = [
    {
      scenario: '3-hour delay (airline’s fault), long-haul',
      us: 'Nothing. No U.S. law requires cash for a delay.',
      eu: '€600 cash, per person.',
      note: 'The single biggest gap. A U.S. delay-compensation rule was proposed and then withdrawn in November 2025.',
    },
    {
      scenario: 'Flight cancelled, you fly the next day',
      us: 'A refund if you decline to travel — but if you take the rebooking, no payment.',
      eu: '€250–€600 cash on top of the rebooking, unless they warned you 14+ days ahead.',
      note: 'In the EU you get flown AND paid. In the U.S. you get flown.',
    },
    {
      scenario: 'Stuck overnight during a controllable disruption',
      us: 'Hotel and meals only if that airline voluntarily promised it on the DOT dashboard.',
      eu: 'Hotel, transfers and meals are mandatory — “right to care,” regardless of the cause.',
      note: 'EU care duties apply even for weather. U.S. commitments mostly don’t.',
    },
    {
      scenario: 'The airline has no seat for days',
      us: 'Rebooking on that airline; no legal right to be put on a competitor.',
      eu: 'Re-routing “at the earliest opportunity” — which can mean buying you onto another airline.',
      note: 'This is why EU passengers get home faster.',
    },
    {
      scenario: 'Seeing the true price before you buy',
      us: 'No upfront bag/change fee disclosure — that rule was struck down in February 2026.',
      eu: 'All-inclusive final price, including taxes and unavoidable charges, from the first display.',
      note: 'Airlines sued to stop U.S. price transparency, and won.',
    },
    {
      scenario: 'Denied boarding on an oversold flight',
      us: 'Real protection: 200%/400% of your fare, capped at $1,075 / $2,150, in cash.',
      eu: '€250–€600 plus re-routing and care.',
      note: 'The one area where U.S. law is genuinely strong — use it.',
    },
  ];

  return { REGIONS, CARRIERS, check, GAPS };
})();
