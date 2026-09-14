/**
 * Coverage rules — which flights EU261/UK261/Canada APPR actually cover.
 * Faithful TS port of web public/coverage.js (which is locked by test/coverage.test.js);
 * keep the two in sync. Rules verified against Reg. (EC) 261/2004 Art. 3 + the Commission's
 * 2016 guidelines, UK261 (SI 2019/278), and Canada's APPR (SOR/2019-150).
 */

export type Region = 'eu' | 'uk' | 'ch' | 'ca' | 'us' | 'other';
export type CarrierRegion = 'us' | 'eu' | 'uk' | 'ca' | 'other';
export type Band = 'short' | 'medium' | 'long';

export type CoveredEntry = {
  regime: string;
  why: string;
  amount?: string;
  pays: string;
  rule: string;
  url: string;
  strength: 'strong';
  deadline?: string;
};
export type NotCoveredEntry = { regime: string; why: string; tip?: string };
export type AlsoKnow = { title: string; detail: string };
export type CoverageResult = {
  covered: CoveredEntry[];
  notCovered: NotCoveredEntry[];
  alsoKnow: AlsoKnow[];
  best: CoveredEntry | null;
  headline: string;
};

export const REGIONS: { id: Region; label: string; hint?: string }[] = [
  { id: 'eu', label: 'European Union / EEA', hint: 'incl. Iceland, Norway, Liechtenstein' },
  { id: 'uk', label: 'United Kingdom' },
  { id: 'ch', label: 'Switzerland' },
  { id: 'ca', label: 'Canada' },
  { id: 'us', label: 'United States' },
  { id: 'other', label: 'Somewhere else' },
];

const EU_AMOUNTS: Record<Band, string> = { short: '€250', medium: '€400', long: '€600' };
const UK_AMOUNTS: Record<Band, string> = { short: '£220', medium: '£350', long: '£520' };

export function check(t: { from: Region; to: Region; carrier: CarrierRegion; band?: Band }): CoverageResult {
  const { from, to, carrier } = t;
  const band: Band = t.band || 'long';
  const covered: CoveredEntry[] = [];
  const notCovered: NotCoveredEntry[] = [];

  // ---- EU261 — Reg. (EC) 261/2004, Art. 3(1); Switzerland via the 1999 EU–Swiss agreement ----
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

  // ---- Canada APPR — to/from/within Canada, any carrier, both directions ----
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
  const alsoKnow: AlsoKnow[] = [];
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
  let headline: string;
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
