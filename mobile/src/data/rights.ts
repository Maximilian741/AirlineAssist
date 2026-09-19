/**
 * Verified air-passenger-rights content — the offline heart of the app.
 *
 * Every fact was researched AND independently fact-checked against PRIMARY government sources
 * (U.S. DOT, eCFR / Cornell LII, Federal Register, Congress.gov, EU EUR-Lex, UK CAA, Canada CTA).
 * Dollar amounts, deadlines, and legal citations were each confirmed and link out to the source.
 *
 * Last verified: mid-2026. Laws and figures change — the linked sources are the source of truth.
 *
 * NOTE: this currently mirrors the web app's public/rights-data.js. When the monorepo `core`
 * package is extracted, both should import ONE shared module instead of duplicating. Until then,
 * keep the two in sync when facts change.
 */

export type Source = { label: string; url: string };

export type RightCategory = 'refunds' | 'bumping' | 'delays' | 'baggage' | 'fees' | 'disability';

export type RightCard = {
  category: RightCategory;
  headline: string;
  plain: string;
  amounts?: string;
  triggers?: string;
  howToClaim?: string;
  legalBasis?: string;
  sources: Source[];
};

export type IntlComp = {
  regime: string;
  region: string;
  amount: string;
  eligibility: string;
  howToClaim: string;
  sources: Source[];
};

export type LadderStep = { step: number; action: string; detail: string; url?: string };

export type Law = {
  name: string;
  year?: string;
  status: string;
  summary: string;
  whyItMatters?: string;
  sources: Source[];
};

export type ResourceLink = { title: string; blurb: string; url?: string };

export type StatusKind = 'in-force' | 'pending' | 'dead';

export function statusKind(status: string): StatusKind {
  const s = (status || '').toLowerCase();
  if (/vacated|struck down|did not pass|not in force/.test(s)) return 'dead';
  if (/in force|signed into law/.test(s)) return 'in-force';
  return 'pending';
}

export const CATEGORIES: { key: RightCategory; label: string; emoji: string }[] = [
  { key: 'refunds', label: 'Refunds & cancellations', emoji: '💵' },
  { key: 'bumping', label: 'Bumped from an oversold flight', emoji: '🎟️' },
  { key: 'delays', label: 'Delays & tarmac', emoji: '⏱️' },
  { key: 'baggage', label: 'Baggage', emoji: '🧳' },
  { key: 'fees', label: 'Fees & fine print', emoji: '🧾' },
  { key: 'disability', label: 'Disability', emoji: '♿' },
];

export const RIGHTS_CARDS: RightCard[] = [
  {
    category: 'refunds',
    headline: 'Flight cancelled or seriously changed? You get your money back in CASH — not a voucher',
    plain:
      "If the airline cancels your flight, or changes it so much it counts as a 'significant change,' and you decide not to take the replacement flight or credit they offer, they must give you your money back automatically — real money, back to the card or account you paid with. Not a travel voucher. Not a credit. You can choose a voucher or a rebooking if YOU want to, but that's your call, never theirs. And you shouldn't have to fight for it.",
    amounts:
      "Full refund of the airfare plus any taxes and add-on fees you paid for things you didn't get. Refund rule in force since October 28, 2024.",
    triggers:
      "The airline cancels, OR makes a 'significant change' (see the next card), AND you choose not to accept the rebooking or credit they offer.",
    howToClaim:
      "Tell the airline (app, 'manage trip,' or phone): 'I am declining alternative transportation and requesting a refund to my original form of payment under 14 CFR Part 260.' Put it in writing and keep a copy. If they stall or push a voucher, file a complaint at transportation.gov/airconsumer.",
    legalBasis: '14 CFR Part 260 (DOT refund rule), esp. 260.6 and 260.10; authorized by the FAA Reauthorization Act of 2024.',
    sources: [
      { label: 'Cornell LII — 14 CFR 260.6', url: 'https://www.law.cornell.edu/cfr/text/14/260.6' },
      { label: 'Cornell LII — 14 CFR 260.10', url: 'https://www.law.cornell.edu/cfr/text/14/260.10' },
      { label: 'DOT automatic refund rule', url: 'https://www.transportation.gov/briefing-room/biden-harris-administration-announces-final-rule-requiring-automatic-refunds-airline' },
    ],
  },
  {
    category: 'refunds',
    headline: "What counts as a 'significant change': 3 hours domestic, 6 hours international",
    plain:
      "The airline doesn't get to decide what 'big change' means anymore — the government does. Any ONE of these unlocks your refund right: your flight now leaves 3+ hours EARLIER, or gets you there 3+ hours LATER (6+ hours either way on an international trip); they switch you to a different airport; they add a stop or connection you didn't have; or they downgrade you to a lower class (say, first class down to coach). If you have a disability, two more count: they move your connection to different airports, or they swap in an aircraft that lacks an accessibility feature you need. Just one of these is enough. Note the direction: a LATER departure or an EARLIER arrival is not on the list by itself — what matters is leaving earlier or landing later.",
    amounts:
      'Departure moved 3+ hours EARLIER / arrival moved 3+ hours LATER (domestic), 6+ hours (international); OR a different airport; OR an added connection; OR a downgrade to a lower class of service; OR, for a passenger with a disability, different connecting airports or a substitute aircraft missing a needed accessibility feature. In force since October 28, 2024.',
    triggers: "Any single one of these changes — you don't need more than one.",
    howToClaim:
      "Compare your new itinerary to the one you bought. If it crosses any line above, tell the airline you're exercising your refund right under 14 CFR 260.2/260.6 to your original form of payment, and decline the rebooking if you don't want it.",
    legalBasis: "14 CFR 260.2, definition of 'Significantly delayed or changed flight.'",
    sources: [{ label: 'Cornell LII — 14 CFR 260.2', url: 'https://www.law.cornell.edu/cfr/text/14/260.2' }],
  },
  {
    category: 'refunds',
    headline: "They can't drag their feet: 7 business days (credit card) or 20 days (everything else)",
    plain:
      "Once a refund is owed, the clock is ticking. Paid by credit card? The money must be back within 7 business days. Paid by cash, check, or debit? Within 20 calendar days. If they blow past these deadlines, that's its own violation you can report.",
    amounts:
      '7 business days for credit/charge card; 20 calendar days for cash, check, debit, or other — counted from the earliest date you asked for the refund.',
    triggers: 'Any refund owed under the rule — cancellation, significant change, undelivered paid extras, or significantly delayed checked bags.',
    howToClaim: 'Mark the deadline on your calendar. If the airline misses it, file a DOT complaint at transportation.gov/airconsumer and cite 14 CFR 260.10.',
    legalBasis: "14 CFR 260.2 ('Prompt refund') and 14 CFR 260.10 ('Providing prompt refunds').",
    sources: [
      { label: 'Cornell LII — 14 CFR 260.10', url: 'https://www.law.cornell.edu/cfr/text/14/260.10' },
      { label: 'Cornell LII — 14 CFR 260.2', url: 'https://www.law.cornell.edu/cfr/text/14/260.2' },
    ],
  },
  {
    category: 'refunds',
    headline: 'The 24-hour rule: change your mind within a day and get every penny back',
    plain:
      'Just booked and spotted a typo, found a cheaper fare, or simply changed your mind? If you booked at least 7 days before departure, the airline must either let you hold the fare for 24 hours without paying, OR let you cancel within 24 hours for a full, penalty-free refund. The airline picks which of the two — but in practice nearly all give you the free 24-hour cancel. The clock starts the moment you buy.',
    amounts: 'At least 24 hours to hold the fare or cancel for a 100% refund, with no penalty. Only applies when you book 7+ days before departure.',
    triggers: 'You booked 7+ days before departure on a U.S. carrier (or a foreign carrier to/from the U.S.) and you act within 24 hours of buying.',
    howToClaim:
      "Cancel through the same place you booked (airline site/app 'manage trip' or phone) within 24 hours and choose 'refund to original form of payment.' Clearest when you book directly with the airline; third-party sites may handle it differently.",
    legalBasis: "14 CFR 259.5(b)(4); confirmed by DOT's official 24-hour reservation guidance.",
    sources: [
      { label: 'Cornell LII — 14 CFR 259.5', url: 'https://www.law.cornell.edu/cfr/text/14/259.5' },
      { label: 'DOT — 24-hour reservation notice', url: 'https://www.transportation.gov/airconsumer/notice-24hour-reservation' },
    ],
  },
  {
    category: 'refunds',
    headline: 'One narrow exception — and it does NOT shrink your refund rights',
    plain:
      "Since December 5, 2025, DOT has paused enforcement of the refund rule in just ONE narrow case: when an airline simply gives your flight a new flight number but everything else stays the same — same times, same airports, no real change — and you're rebooked on it. A pure paperwork renumber with no impact on your trip won't trigger an automatic refund during this pause (extended in July 2026 to run through July 7, 2027). Everything else is untouched: real cancellations, the 3hr/6hr thresholds, the cash-refund rules, and the 24-hour rule all still apply in full.",
    amounts: 'Enforcement pause since Dec 5, 2025, extended through July 7, 2027 — limited to renumbered flights with no significant change or delay.',
    triggers: 'ONLY a renumbered flight you’re rebooked on with no significant change or delay. If the new flight crosses a significant-change line or is truly cancelled, your full refund rights remain.',
    howToClaim: 'If your trip actually changed in a real way (time, airport, connections, cabin) despite the new number, you still qualify — assert your refund right under 14 CFR 260.6/260.10.',
    legalBasis: 'DOT enforcement notice, Federal Register doc 2025-22140 (Dec 5, 2025); docket DOT-OST-2025-2285.',
    sources: [
      { label: 'Federal Register — enforcement notice', url: 'https://www.federalregister.gov/documents/2025/12/05/2025-22140/airline-refunds-and-other-consumer-protections' },
      { label: 'GovInfo — full text', url: 'https://www.govinfo.gov/content/pkg/FR-2025-12-05/html/2025-22140.htm' },
    ],
  },
  {
    category: 'bumping',
    headline: "Forced off an oversold flight? You're owed up to $1,075 or $2,150 — and you can demand a check",
    plain:
      'If the airline sells more seats than the plane holds and bumps you against your will (you did NOT volunteer), federal law makes them pay you. How much depends on how late their replacement gets you there. They may wave a travel voucher at you — but you have the right to say no and take a check or cash instead.',
    amounts:
      'Lower tier: 200% of your one-way fare, capped at $1,075. Higher tier: 400% of your one-way fare, capped at $2,150. You get the LOWER of the percentage or the cap. These amounts took effect Jan 22, 2025 and are current for 2026.',
    triggers: "You were bumped INVOLUNTARILY from an oversold flight (from a U.S. airport, 30+ seat aircraft) and you met the airline's check-in and boarding deadlines.",
    howToClaim:
      'At the gate, ask for involuntary denied-boarding compensation and say you want a check, not a voucher. They must hand you a written statement of your rights. Keep your boarding pass, fare receipt, and the replacement flight’s scheduled arrival. If refused, file at transportation.gov/airconsumer/file-consumer-complaint.',
    legalBasis: '14 CFR 250.5 (amounts) and 250.8 (cash/check). Amounts set by DOT final rule (doc 2024-23588), effective Jan 22, 2025.',
    sources: [
      { label: 'Cornell LII — 14 CFR 250.5', url: 'https://www.law.cornell.edu/cfr/text/14/250.5' },
      { label: 'Cornell LII — 14 CFR 250.8', url: 'https://www.law.cornell.edu/cfr/text/14/250.8' },
      { label: 'DOT — Bumping & Oversales', url: 'https://www.transportation.gov/individuals/aviation-consumer-protection/bumping-oversales' },
    ],
  },
  {
    category: 'bumping',
    headline: 'Domestic bumping: the 1-hour and 2-hour clock decides what you get',
    plain:
      "For a flight within the U.S., it all comes down to how late the airline's substitute flight gets you to your destination. Under about an hour late, you may get nothing. Between one and two hours, you get the lower amount. Two or more hours late (or no decent substitute at all), you get the higher amount.",
    amounts: 'No more than 1 hour late: $0. More than 1 but less than 2 hours: 200% of one-way fare, max $1,075. 2+ hours late or no adequate substitute: 400% of one-way fare, max $2,150.',
    triggers: 'Involuntary bumping on a domestic U.S. flight; delay measured against your original scheduled arrival.',
    howToClaim: "Note your original scheduled arrival and the replacement's scheduled arrival. The gap sets your tier. Claim the check at the gate the same day.",
    legalBasis: '14 CFR 250.5(a).',
    sources: [{ label: 'Cornell LII — 14 CFR 250.5', url: 'https://www.law.cornell.edu/cfr/text/14/250.5' }],
  },
  {
    category: 'bumping',
    headline: 'International bumping: the high tier starts at 4 hours, not 2',
    plain:
      "For flights leaving the U.S. for another country, the dollar caps are the same but the time windows are wider. Still nothing if they get you there within about an hour. The lower amount covers delays from one up to four hours. The higher amount kicks in only at four hours late (or if there's no decent substitute).",
    amounts: 'No more than 1 hour late: $0. More than 1 but less than 4 hours: 200% of one-way fare, max $1,075. 4+ hours late or no adequate substitute: 400% of one-way fare, max $2,150.',
    triggers: 'Involuntary bumping on a flight departing a U.S. airport for a foreign destination.',
    howToClaim: 'Compare original vs. replacement scheduled arrival to find your tier, and request the check at the airport.',
    legalBasis: '14 CFR 250.5(b).',
    sources: [{ label: 'Cornell LII — 14 CFR 250.5', url: 'https://www.law.cornell.edu/cfr/text/14/250.5' }],
  },
  {
    category: 'bumping',
    headline: 'Volunteering is a NEGOTIATION with no minimum — being forced off triggers the mandatory cash',
    plain:
      "Two very different situations. If the airline ASKS for volunteers and you say yes, whatever they offer (usually a voucher) is just a private deal with no legal minimum — so haggle! Ask for more, ask for cash, ask for meals and a hotel. But if not enough people volunteer and they FORCE you off, that's involuntary, and the mandatory cash amounts apply. The law requires them to ask for volunteers before bumping anyone by force.",
    amounts: 'Voluntary: no set amount — fully negotiable. Involuntary: the mandatory 200%/400% amounts capped at $1,075 / $2,150, paid in cash or check.',
    triggers: 'Voluntary = you accept their offer. Involuntary = they deny you boarding without your agreement after not getting enough volunteers.',
    howToClaim: 'If volunteering, treat it like a deal: ask the cash value, whether the voucher expires, and add hotel/meals for overnight delays. Want to keep your seat? Decline — if they then bump you by force, the mandatory cash kicks in.',
    legalBasis: '14 CFR 250.2b (must request volunteers first); 14 CFR 250.5 and 250.8 (mandatory amounts, cash/check).',
    sources: [
      { label: 'Cornell LII — 14 CFR 250.2b', url: 'https://www.law.cornell.edu/cfr/text/14/250.2b' },
      { label: 'DOT — Bumping & Oversales', url: 'https://www.transportation.gov/individuals/aviation-consumer-protection/bumping-oversales' },
    ],
  },
  {
    category: 'bumping',
    headline: "A cheap ticket may pay less than the cap — it's a percentage of your ONE-WAY fare",
    plain:
      "Don't assume you automatically pocket $1,075 or $2,150. You get the LOWER of (a) the percentage of your one-way fare and (b) the dollar cap. So if your fare was cheap, the percentage may land below the cap, and that smaller number is what you get. The caps are ceilings, not guarantees.",
    amounts: '200% tier = 2x one-way fare, never more than $1,075. 400% tier = 4x one-way fare, never more than $2,150. Example: a $150 one-way fare in the 400% tier pays $600 (4 x $150), not $2,150.',
    triggers: 'Every involuntary denied-boarding calculation.',
    howToClaim: "Know your one-way fare (check your receipt). Multiply by 2 or 4 for your tier, then take the lower of that and the cap. Use it to check the airline's math.",
    legalBasis: "14 CFR 250.5(a) and (b) ('whichever is lower').",
    sources: [{ label: 'Cornell LII — 14 CFR 250.5', url: 'https://www.law.cornell.edu/cfr/text/14/250.5' }],
  },
  {
    category: 'delays',
    headline: 'Stuck on the tarmac? You must be let off after 3 hours (4 international) — with food and water by 2 hours',
    plain:
      "If your plane leaves the gate but then just sits on the tarmac (or lands but doesn't reach a gate), the airline must give you the chance to get off before the delay hits 3 hours domestic / 4 hours international. By the 2-hour mark, they must hand out food and drinkable water. Bathrooms must keep working, medical help must be available, and they must update you at least every 30 minutes. There are narrow safety and air-traffic exceptions, but they can't leave you sitting forever.",
    amounts: 'Deplaning: 3 hours domestic, 4 hours international. Food + water: by the 2-hour mark. Working lavatories and medical attention throughout. Updates every 30 minutes.',
    triggers: 'Aircraft on the tarmac at a U.S. airport reaching these time limits.',
    howToClaim: 'This is an operational duty, not a payout. If they failed to deplane you in time or skimped on food/water/lavatories, document the times and file at transportation.gov/airconsumer. DOT can fine the airline, and a documented violation strengthens any separate claim.',
    legalBasis: '14 CFR 259.4 (Contingency Plan for Lengthy Tarmac Delays).',
    sources: [
      { label: 'eCFR — 14 CFR 259.4', url: 'https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-259/section-259.4' },
      { label: 'GovInfo — 14 CFR 259.4', url: 'https://www.govinfo.gov/app/details/CFR-2025-title14-vol4/CFR-2025-title14-vol4-sec259-4' },
    ],
  },
  {
    category: 'delays',
    headline: 'The DOT Dashboard shows what each airline promised for delays they caused',
    plain:
      "DOT's free Airline Customer Service Dashboard is a chart of what each big U.S. airline has officially promised when a delay or cancellation is the airline's OWN fault (staffing, maintenance, fueling — NOT weather or air-traffic control). The usual promises: rebook you on the same airline at no extra cost; a meal or meal voucher once you've waited 3+ hours; and, if you're stuck overnight, a hotel plus a ride to and from it. Use it to know what to demand at the gate — and to prove a broken promise later. All 10 big carriers promise same-airline rebooking and the 3-hour meal; Frontier is the only one that hasn’t committed to overnight hotel and ground transport.",
    amounts: 'Meal/voucher: after a 3+ hour wait for the new flight. Rebooking: no extra cost on the same airline. Hotel + ground transport: for overnight controllable disruptions (all 10 big carriers except Frontier).',
    triggers: "A 'controllable' cancellation or delay — within the airline's control (crew, maintenance, fueling, cleaning). Weather and air-traffic control don't count.",
    howToClaim: 'Check the dashboard for your airline’s promises, then ask directly for rebooking, the meal voucher (after 3 hours), and hotel/ground transport. If they refuse a promise marked with a green check, file a DOT complaint and cite the dashboard.',
    legalBasis: 'Customer-service-plan commitments enforced under 14 CFR Part 259 and 49 U.S.C. 41712.',
    sources: [{ label: 'DOT — Airline Customer Service Dashboard', url: 'https://www.transportation.gov/airconsumer/airline-customer-service-dashboard' }],
  },
  {
    category: 'baggage',
    headline: 'Bag arrives late? Get your checked-bag fee back — 12 hours domestic, 15 or 30 hours international',
    plain:
      "If you paid to check a bag and it shows up late, the airline must refund that bag fee. Domestic: the bag counts as significantly delayed if it isn't delivered within 12 hours of your flight landing. International: 15 hours if your nonstop U.S.-to-foreign leg was 12 hours or less, or 30 hours if that leg was longer. One important catch: you only get the refund if you FILE A MISHANDLED BAGGAGE REPORT — so report the missing bag before you leave the airport.",
    amounts: 'Refund of the checked-bag fee. Thresholds: 12 hours (domestic); 15 hours (international leg up to 12 hrs); 30 hours (international leg over 12 hrs), measured from arrival at the gate. In force since Oct 28, 2024.',
    triggers: 'You paid a checked-bag fee, the bag is delivered after the threshold (or lost), AND you filed a Mishandled Baggage Report with the airline.',
    howToClaim: "File the report at the baggage desk before leaving the airport (keep the reference number). If the bag misses the threshold, the airline owes the fee back to your original payment. If they don't pay, request it in writing citing 14 CFR Part 260 and complain to DOT. This is separate from any claim for the bag's contents.",
    legalBasis: '14 CFR Part 260; DOT Refund Final Rule (2024).',
    sources: [
      { label: 'eCFR — 14 CFR Part 260', url: 'https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-260' },
      { label: 'DOT — automatic refunds final rule', url: 'https://www.transportation.gov/briefing-room/biden-harris-administration-announces-final-rule-requiring-automatic-refunds-airline' },
    ],
  },
  {
    category: 'baggage',
    headline: 'Bag lost or damaged on a U.S. domestic flight? The airline owes up to $4,700 (NOT $3,800)',
    plain:
      'On domestic U.S. flights, the airline must cover the actual, provable value of your lost, damaged, or delayed bag and its contents — up to a cap. That cap rose to $4,700 per passenger for travel on or after January 22, 2025. (The old $3,800 figure you may still see quoted is out of date.) This is about the value of your belongings — separate from getting your bag FEE back for a late bag. You have to prove the value, so keep receipts.',
    amounts: '$4,700 per passenger liability cap (up from $3,800), effective for travel on or after Jan 22, 2025. Reviewed for inflation every two years.',
    triggers: 'Baggage lost, damaged, or delayed on a large-aircraft flight segment. You must show provable losses — this is a ceiling, not an automatic payout.',
    howToClaim: "File a claim with the airline listing your items with proof of value (receipts, photos, replacement costs). They can't cap liability below $4,700 per passenger. If they offer less than your provable loss, cite 14 CFR 254.4 and escalate to DOT. Note: airlines may exclude high-value items (jewelry, electronics, cash) — check the contract of carriage.",
    legalBasis: '14 CFR 254.4 (cap raised effective Jan 22, 2025); periodic adjustment under 14 CFR 254.6.',
    sources: [
      { label: 'eCFR — 14 CFR 254.4', url: 'https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-254/section-254.4' },
      { label: 'Federal Register — 2024 limits revision', url: 'https://www.federalregister.gov/documents/2024/10/24/2024-23588/periodic-revisions-to-denied-boarding-compensation-and-domestic-baggage-liability-limits' },
    ],
  },
  {
    category: 'baggage',
    headline: 'International bag lost or damaged? Treaty caps it at 1,519 SDR (~US$2,000) — up from 1,288',
    plain:
      "On international flights under the Montreal Convention, the airline's liability for lost, damaged, or delayed baggage is capped at 1,519 SDR per passenger. (SDR is an international currency unit; 1,519 SDR is roughly US$2,000, but the exact dollar value floats with exchange rates.) This rose from 1,288 SDR on December 28, 2024, so any 1,288 figure is now stale. Move fast: written notice deadlines are short — typically 7 days for damage, 21 days for delay.",
    amounts: 'Baggage: 1,519 SDR per passenger (~US$2,000), effective Dec 28, 2024 (up from 1,288 SDR). The same treaty caps passenger delay at 6,303 SDR. SDR-to-USD floats daily.',
    triggers: 'International itinerary under the Montreal Convention; baggage lost, damaged, or delayed. Written notice required within treaty deadlines (commonly 7 days for damage, 21 days for delay).',
    howToClaim: "Report the problem to the airline in writing within the deadlines — don't wait. Submit proof of value up to 1,519 SDR. If denied or underpaid, cite Montreal Convention Article 22. Confirm the current USD value at claim time since SDR floats.",
    legalBasis: "Montreal Convention 1999, Article 22(2), as revised by ICAO's inflation review effective Dec 28, 2024.",
    sources: [{ label: 'ICAO — revised liability limits', url: 'https://www.icao.int/news/international-air-travel-liability-limits-set-increase-enhancing-customer-compensation-0' }],
  },
  {
    category: 'fees',
    headline: "Paid for Wi-Fi or a seat you never got? You're owed that money back",
    plain:
      'The 2024 refund rule also covers extras you paid for but didn’t receive — in-flight Wi-Fi that never worked, a seat selection you couldn’t use, or other prepaid extras lost because your flight was cancelled, significantly changed, or you were bumped. If you don’t get the service through no fault of your own, the airline must refund what you paid for it.',
    amounts: 'Refund of the amount paid for the unprovided extra. In force since Oct 28, 2024.',
    triggers: "You prepaid for an extra (Wi-Fi, seat, etc.) and didn't receive it through no fault of your own.",
    howToClaim: 'Ask the airline in writing for a refund of the specific fee, noting it wasn’t provided (keep screenshots/receipts). Cite 14 CFR Part 260. If denied, file at transportation.gov/airconsumer. Refunds go to your original payment.',
    legalBasis: '14 CFR Part 260; DOT Refund Final Rule (2024).',
    sources: [
      { label: 'eCFR — 14 CFR Part 260', url: 'https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-260' },
      { label: 'DOT — automatic refunds final rule', url: 'https://www.transportation.gov/briefing-room/biden-harris-administration-announces-final-rule-requiring-automatic-refunds-airline' },
    ],
  },
  {
    category: 'fees',
    headline: 'Bag fees still have to be disclosed — just not inside search results',
    plain:
      "In 2024 DOT made a rule that would have forced airlines and booking sites to show you the actual dollar amounts for bags, changes, and cancellations right in the search results. On February 3, 2026 the full Fifth Circuit appeals court threw that rule out. But striking it down put the OLDER rules back: DOT re-codified them effective July 2, 2026, and 14 CFR 399.85 is in force today. It requires four things: the first screen that quotes you a fare must say bag fees may apply and where to find them; your e-ticket confirmation (both the purchase page and the email) must list your free bag allowance and the exact fees for a carry-on and the 1st and 2nd checked bag; the airline's homepage must flag any bag-fee increase or allowance cut for 3 months; and the homepage must link to all of its optional-service fees. What you do NOT get is the all-in price in search results, and change and cancellation fees aren't covered at all — so still look those up yourself. Be skeptical of any site claiming a 'new law' makes airlines bundle every fee into the headline price.",
    amounts:
      'No fee is capped or banned — this is a disclosure right, not money. The exact carry-on and 1st/2nd checked-bag fees plus your free allowance must appear on your e-ticket confirmation, and a bag-fee notice must appear on the first screen that quotes your fare.',
    triggers:
      "The first screen showing your fare carried no baggage-fee notice; OR your e-ticket confirmation left out your free bag allowance or the carry-on / 1st / 2nd checked-bag fees; OR the airline's homepage has no link to its optional-service fees; OR it raised bag fees without flagging it on the homepage.",
    howToClaim:
      "Screenshot the screen or confirmation that left the fees out, then file at transportation.gov/airconsumer/file-consumer-complaint citing 14 CFR 399.85 — failing to disclose is an unfair and deceptive practice under 49 U.S.C. 41712. Practically, before booking: look up the airline's own baggage, change, and cancellation fees, and check your fare class (Basic Economy usually adds restrictions).",
    legalBasis:
      '14 CFR 399.85 (the 2011 fee-disclosure rules). The 2024 ancillary-fee rule, 89 Fed. Reg. 34620, was vacated by the Fifth Circuit en banc in Airlines for America v. DOT, Feb 3, 2026, which reinstated the earlier rules; DOT re-codified them at 91 Fed. Reg. 40368, effective July 2, 2026.',
    sources: [
      { label: 'Cornell LII — 14 CFR 399.85', url: 'https://www.law.cornell.edu/cfr/text/14/399.85' },
      { label: 'Federal Register — DOT restores the 2011 fee-disclosure rules', url: 'https://www.federalregister.gov/d/2026-13450' },
      { label: 'Federal Register — vacated ancillary-fee rule', url: 'https://www.federalregister.gov/documents/2024/04/30/2024-08609/enhancing-transparency-of-airline-ancillary-service-fees' },
      { label: 'Fifth Circuit opinion (PDF)', url: 'https://www.ca5.uscourts.gov/opinions/pub/24/24-60231-CV1.pdf' },
    ],
  },
  {
    category: 'fees',
    headline: 'Flying with kids: free family seating is NOT guaranteed by law — check the airline',
    plain:
      "Despite the headlines, there's no federal law forcing an airline to seat your young child next to you for free. DOT proposed such a rule, but it was never finalized and isn't in effect as of mid-2026. Some airlines promise it voluntarily; some don't. As of late 2025, airlines that guarantee free adjacent family seating include Alaska, American, Frontier, Hawaiian, and JetBlue; those that do NOT guarantee it include Delta, United, Southwest, and Allegiant. Commitments can change, so check before you book.",
    amounts: 'No federal fee ban is in force. The proposed (not final) rule would cover a child age 13 and under seated next to an adult at no extra cost, when adjacent seats are available.',
    triggers: "Each airline's own voluntary policy — there's no federal mandate yet.",
    howToClaim: 'Before booking, check the DOT Family Seating Dashboard and pick an airline that promises free adjacent seating. Book early and select seats together at purchase. If an airline that made a public promise then charges you, report it at transportation.gov/airconsumer/file-consumer-complaint.',
    legalBasis: "FAA Reauthorization Act of 2024, Sec. 516; DOT NPRM 'Family Seating in Air Transportation' — proposed, not final.",
    sources: [{ label: 'DOT — Family Seating Dashboard', url: 'https://www.transportation.gov/airconsumer/airline-family-seating-dashboard' }],
  },
  {
    category: 'fees',
    headline: "The FTC 'junk fee' rule is real — but only for hotels and event tickets, NOT flights",
    plain:
      "There IS a junk-fee rule in force right now, but it's from the FTC, not the airline regulator. Since May 12, 2025 it bans 'drip pricing' — luring you with a low price, then piling on mandatory fees at checkout — for two things only: live-event tickets (concerts, sports, theater) and short-term lodging (hotels, motels, vacation rentals). It does NOT cover airline tickets or car rentals. So this rule helps you with hotels and concert tickets, not flights.",
    amounts: 'No dollar caps. Sellers must show the all-in total price clearly and upfront. Government taxes, shipping, and truly optional add-ons may be left out of the headline total.',
    triggers: 'Any business offering live-event tickets or short-term lodging. Does NOT apply to airfare or car rentals.',
    howToClaim: "When booking a hotel or event ticket, the all-in price (including mandatory 'resort fees,' service fees, etc.) must be shown upfront. If a seller hides mandatory fees until checkout, that's now illegal — report it at reportfraud.ftc.gov.",
    legalBasis: 'FTC Rule on Unfair or Deceptive Fees, 16 CFR Part 464; effective May 12, 2025.',
    sources: [
      { label: 'eCFR — 16 CFR Part 464', url: 'https://www.ecfr.gov/current/title-16/chapter-I/subchapter-D/part-464' },
      { label: 'FTC — fees rule FAQ', url: 'https://www.ftc.gov/business-guidance/resources/rule-unfair-or-deceptive-fees-frequently-asked-questions' },
    ],
  },
  {
    category: 'disability',
    headline: 'Bulkhead, extra legroom, a movable armrest, or a seat next to your helper — free, on request',
    plain:
      'If you have a disability, the airline must give you specific seats at no charge, on request: a row with a movable aisle armrest if you board by aisle chair; a bulkhead or other extra-legroom seat if you have a fused or immobilized leg; a bulkhead seat (or not, your choice) if you fly with a service animal; and an adjoining seat for a personal care attendant, reader, interpreter, or a safety assistant the airline itself requires. These are the seats airlines otherwise sell as “preferred” or “extra legroom” — the rule bars them from charging you for a required accommodation. What it does not do: hand you a seat in a higher class than you bought, or override FAA exit-row rules.',
    amounts: 'No charge for the required seat (14 CFR 382.31). The airline may still charge for extras the rule doesn’t require.',
    triggers: 'You self-identify as having one of the listed disabilities and ask. Ask when you book (24+ hours ahead is safest); the airline can ask you to check in an hour before the standard time.',
    howToClaim: 'Request the specific accommodation when booking or by calling the airline’s accessibility line, and say which paragraph applies (“382.81(d), fused leg, bulkhead or extra legroom”). Get it noted on the reservation. If they charge you or refuse, file the disability complaint — they owe a written answer in 30 days — and then DOT.',
    legalBasis: '14 CFR 382.81 (required seating accommodations); 382.85 (advance request / priority seating); 382.87 (no exclusion from seats except FAA safety rules; not required to give a higher class); 382.31 (no charge for required accommodations).',
    sources: [
      { label: 'Cornell LII — 14 CFR 382.81', url: 'https://www.law.cornell.edu/cfr/text/14/382.81' },
      { label: 'Cornell LII — 14 CFR 382.31', url: 'https://www.law.cornell.edu/cfr/text/14/382.31' },
      { label: 'Cornell LII — 14 CFR 382.87', url: 'https://www.law.cornell.edu/cfr/text/14/382.87' },
    ],
  },
  {
    category: 'disability',
    headline: 'Disability complaints get a faster response — and a refund if a new routing is less accessible',
    plain:
      'If you have a disability and something goes wrong, the airline must give you a written, dispositive response to a disability complaint within 30 days — faster than the usual deadline. And under the refund rule’s significant-change protections, if the airline reroutes you onto a flight or aircraft that is LESS accessible for you, that itself can trigger your refund right, on top of the standard 3hr/6hr thresholds.',
    amounts: '30-day written response to disability complaints. Refund rights attach when a new routing/aircraft is less accessible.',
    triggers: 'A disability-related service failure, OR a flight change that leaves you with a less accessible routing or aircraft.',
    howToClaim: 'File the complaint with the airline and, if unresolved, with DOT at transportation.gov/airconsumer. For a less-accessible rerouting, assert your refund right under 14 CFR 260.2/260.6.',
    legalBasis: '14 CFR 382.155 (30-day disability-complaint response); 14 CFR 260.2 (significant change includes less accessible routing/aircraft).',
    sources: [
      { label: 'Cornell LII — 14 CFR 382.155', url: 'https://www.law.cornell.edu/cfr/text/14/382.155' },
      { label: 'Cornell LII — 14 CFR 260.2', url: 'https://www.law.cornell.edu/cfr/text/14/260.2' },
    ],
  },
];

// RE-VERIFY (EU261): the 2026 reform was adopted 7 July (Parliament) / 13 July (Council) 2026 but
// has no application date until it is published in the Official Journal: it enters into force 20
// days after publication and applies 12 months after that. When the OJ date is known, re-check —
// in BOTH apps — the "claim deadline often 2–3 years" line below (new Art. 7(9) cuts it to 9
// months from departure), the EU261 clock in trips.ts / web trips.js, and the EU note in
// claimtrack. The €250/€400/€600 amounts and the 3-hour threshold survive the reform unchanged.
export const INTERNATIONAL: IntlComp[] = [
  {
    regime: 'EU261',
    region: 'Flights departing any EU airport (any airline), or arriving in the EU on an EU airline',
    amount: '€250 / €400 / €600 per person, in cash',
    eligibility:
      "Your flight was cancelled (with less than 14 days' notice) or you arrived 3+ hours late, AND the cause was within the airline's control (mechanical, staffing, overbooking) — NOT 'extraordinary circumstances' like severe weather, ATC strikes, or security threats. €250 for flights up to 1,500 km; €400 for intra-EU over 1,500 km and other flights 1,500–3,500 km; €600 for flights over 3,500 km. The big surprise for Americans: ANY flight leaving Europe counts — so your Delta or United flight home from Paris or Rome qualifies. (A reform was formally adopted in July 2026 — Parliament on 7 July, Council on 13 July — but it does NOT apply yet: it enters into force 20 days after publication in the EU Official Journal and only applies 12 months after that, expected around late 2027. Until then the current 3-hour / €250–€600 rules stand, and the reform keeps those amounts. One thing to watch: once it does apply, you will have only 9 months from the departure date to claim.)",
    howToClaim:
      "1) Write to the airline first, citing 'EU Regulation 261/2004,' your flight number, date, and how late you arrived; demand cash, not a voucher. 2) If refused or ignored, escalate to the National Enforcement Body in the EU country where the disruption happened. 3) Or use a no-win-no-fee service (AirHelp, Flightright) that takes a cut. Keep boarding passes and delay notices. Claim deadline varies by country (often 2–3 years).",
    sources: [{ label: 'EUR-Lex — Regulation (EC) 261/2004', url: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32004R0261' }],
  },
  {
    regime: 'UK261',
    region: 'Flights departing any UK airport (any airline), or arriving in the UK on a UK or EU airline',
    amount: '£220 / £350 / up to £520 per person, in cash',
    eligibility:
      "Same idea as EU261, in pounds. Cancellation or arrival 3+ hours late, caused by something within the airline's control (not severe weather or ATC strikes). £220 for flights under 1,500 km; £350 for 1,500–3,500 km; for flights over 3,500 km, £260 if you arrive 3–4 hours late and £520 if more than 4 hours late. Covers your U.S. carrier home from London. Per person.",
    howToClaim:
      "1) Complain to the airline citing 'UK261,' your flight details, and how late you arrived; ask for cash. 2) If refused or unresolved after 8 weeks, escalate to the airline's ADR provider, or to the UK CAA's Passenger Advice and Complaints Team (PACT). The CAA/ADR route is free. Court time limit is generally up to 6 years in England/Wales (5 in Scotland).",
    sources: [{ label: 'UK CAA — delays and cancellations', url: 'https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/delays/' }],
  },
  {
    regime: 'Canada APPR',
    region: 'Flights to, from, or within Canada',
    amount: 'Up to CAD 1,000 for long delays (up to CAD 2,400 for bumping), in cash',
    eligibility:
      "A delay or cancellation within the airline's control (and not safety-required), where you arrive 3+ hours late and were notified 14 days or less before departure. Large airlines (Air Canada, WestJet): CAD 400 (3–6 hrs late), CAD 700 (6–9 hrs), CAD 1,000 (9+ hrs). Small airlines: CAD 125 / 250 / 500. Denied boarding (bumping): CAD 900 / 1,800 / 2,400. Does NOT apply to delays for safety reasons or causes outside the airline's control.",
    howToClaim:
      "File a WRITTEN claim with the airline within 1 YEAR of the disruption, stating the flight, the delay length, and that you're claiming APPR compensation. The airline has 30 days to pay or explain. If they refuse, complain to the Canadian Transportation Agency (CTA), which can investigate and order payment.",
    sources: [{ label: 'CTA — APPR highlights', url: 'https://otc-cta.gc.ca/eng/air-passenger-protection-regulations-highlights' }],
  },
];

export const LADDER: LadderStep[] = [
  { step: 1, action: 'Ask the airline directly — in writing', detail: "Start with the airline. Decline any voucher and clearly request a refund or the compensation you're owed 'to my original form of payment,' citing the rule (14 CFR Part 260 for refunds, 14 CFR 250.5 for bumping). Use the app, 'manage trip,' or email so you have a paper trail. Keep your booking confirmation, cancellation/change emails, boarding pass, and receipts." },
  { step: 2, action: 'Check the DOT Dashboard and claim what they promised', detail: 'For a delay or cancellation the airline caused, look up its commitments on the DOT Airline Customer Service Dashboard, then ask for rebooking at no cost, a meal voucher (after a 3+ hour wait), and a hotel plus ground transport if you’re stuck overnight.', url: 'https://www.transportation.gov/airconsumer/airline-customer-service-dashboard' },
  { step: 3, action: 'File a free DOT complaint', detail: "If the airline ignores or refuses you, file at the DOT Office of Aviation Consumer Protection. The response clocks apply if your airline is a U.S. one (any flight it operates) or a foreign airline on a flight to or from the U.S.: it must acknowledge within 30 days and send a substantive written response within 60 days (30 days for a disability complaint). On a foreign airline's flight that never touches the U.S. — say Paris to Nice on Air France — DOT has no jurisdiction; go to that country's enforcement body instead. DOT tracks complaints and uses them to open investigations and levy penalties, which often unsticks an individual case. You can file even after the airline already said no.", url: 'https://www.transportation.gov/airconsumer/file-consumer-complaint' },
  { step: 4, action: 'Dispute the charge with your credit card (within 60 days)', detail: "If you paid by credit card and the airline took your money but didn't deliver, dispute it under the Fair Credit Billing Act — 'a service not delivered as agreed' is a billing error. Send a WRITTEN dispute to your issuer's 'billing inquiries' address so it ARRIVES within 60 days of the first statement showing the charge. You don't pay the disputed amount while it's open; the issuer must resolve it within two billing cycles (no later than 90 days). Visa/Mastercard chargeback rules often allow up to 120 days — useful if you're past the FCBA window.", url: 'https://www.consumerfinance.gov/rules-policy/regulations/1026/13/' },
  { step: 5, action: "Go over the front desk's head to an executive", detail: "If the front line won't budge, use elliott.org/company-contacts to find airline customer-service executives. Email the lowest-level contact, wait about a week, and if you get no help, move up the chain one executive at a time. A polite, factual email to a senior executive often unsticks a case agents won't fix.", url: 'https://www.elliott.org/company-contacts/' },
  { step: 6, action: 'Sue in small claims court (last resort)', detail: "You can sue the airline for a modest amount (limits vary by state — commonly roughly $2,500 to $10,000) without a lawyer. Key: the Airline Deregulation Act blocks most state 'consumer protection' suits, BUT the Supreme Court (American Airlines v. Wolens) held you CAN sue for ordinary breach of contract when the airline broke its OWN written promises. Frame it as 'the airline didn't do what it promised,' attach the contract of carriage and the relevant DOT dashboard commitment, and ask for the exact amount owed.", url: 'https://supreme.justia.com/cases/federal/us/513/219/' },
];

export const LEGISLATION: Law[] = [
  {
    name: 'FAA Reauthorization Act of 2024 + DOT Refund Rule (14 CFR Part 260)',
    year: '2024',
    status: 'Signed into law and in force',
    summary: 'Made the automatic cash-refund right permanent federal law: when an airline cancels or significantly changes your flight (3+ hrs domestic / 6+ hrs intl, airport change, added connection, or downgrade) and you decline the alternative, you get an automatic refund to your original form of payment — within 7 business days (credit card) or 20 calendar days (other). Also covers late checked-bag fees and undelivered paid extras.',
    whyItMatters: "This is the backbone of your refund rights. It turns 'maybe a voucher' into 'real money, automatically,' and it's enforceable today.",
    sources: [
      { label: 'DOT — automatic refunds final rule', url: 'https://www.transportation.gov/briefing-room/biden-harris-administration-announces-final-rule-requiring-automatic-refunds-airline' },
      { label: 'Congress — H.R.3935 text', url: 'https://www.congress.gov/bill/118th-congress/house-bill/3935/text' },
    ],
  },
  {
    name: 'Denied-Boarding & Baggage Limit Revisions (DOT doc 2024-23588)',
    year: '2024',
    status: 'DOT final rule, in force (effective Jan 22, 2025)',
    summary: 'Roughly doubled involuntary-bumping compensation caps to $1,075 / $2,150 (from $775 / $1,550) and raised the domestic lost/damaged baggage liability cap to $4,700 (from $3,800). DOT reviews both every two years against the July CPI of the review year — the next review year is 2026. A review only changes the numbers when DOT actually publishes a rule (in 2024 it published in October, effective the following Jan 22), and DOT skipped the 2022 review entirely.',
    whyItMatters: 'These are the current, correct 2026 numbers — they stay binding until an amended rule takes effect. Airlines sometimes quote the old figures; now you can correct them.',
    sources: [{ label: 'Federal Register — 2024 revisions', url: 'https://www.federalregister.gov/documents/2024/10/24/2024-23588/periodic-revisions-to-denied-boarding-compensation-and-domestic-baggage-liability-limits' }],
  },
  {
    name: 'FTC Rule on Unfair or Deceptive Fees (16 CFR Part 464)',
    year: '2025',
    status: 'Signed into law and in force (effective May 12, 2025)',
    summary: 'Bans drip pricing for live-event tickets and short-term lodging — sellers must show the all-in price upfront. Notably does NOT cover airline tickets or car rentals, which the FTC dropped from the final rule.',
    whyItMatters: 'Real protection for hotels and concert/sports tickets, but it gives you nothing on airfare — a common point of confusion.',
    sources: [{ label: 'FTC — fees rule takes effect', url: 'https://www.ftc.gov/news-events/news/press-releases/2025/05/ftc-rule-unfair-or-deceptive-fees-take-effect-may-12-2025' }],
  },
  {
    name: 'Airline Ancillary-Fee Transparency Rule',
    year: '2024',
    status: 'Vacated — struck down by the courts; NOT in force',
    summary: 'This rule would have forced airlines and booking sites to show bag, carry-on, change, and cancellation fees while you shop. It was stayed before its effective date, the industry sued, and on February 3, 2026 the full Fifth Circuit (en banc) vacated it for skipping proper notice-and-comment.',
    whyItMatters: "There is currently NO federal upfront-fee-disclosure rule for flights. Don't trust claims that one exists — research bag and change fees yourself before booking.",
    sources: [
      { label: 'Federal Register — the (vacated) rule', url: 'https://www.federalregister.gov/documents/2024/04/30/2024-08609/enhancing-transparency-of-airline-ancillary-service-fees' },
      { label: 'Fifth Circuit opinion (PDF)', url: 'http://www.ca5.uscourts.gov/opinions/pub/24/24-60231-CV0.pdf' },
    ],
  },
  {
    name: 'Free Family Seating',
    year: '2024',
    status: 'Proposed but NOT finalized — not yet enforceable',
    summary: "Congress directed DOT to ban fees for seating a young child (age 13 and under) next to a parent when adjacent seats are available. DOT proposed the rule in 2024 but never finalized it. For now, free family seating is only a voluntary airline-by-airline promise — DOT's dashboard tracks who offers it.",
    whyItMatters: "There's no nationwide guarantee yet. Whether you sit next to your child for free depends entirely on which airline you pick.",
    sources: [{ label: 'DOT — Family Seating Dashboard', url: 'https://www.transportation.gov/airconsumer/airline-family-seating-dashboard' }],
  },
  {
    name: 'Flight Delay & Cancellation Compensation Act (S.3347)',
    year: '2025',
    status: 'Introduced, in committee — NOT law',
    summary: 'Introduced Dec 4, 2025 (lead sponsor Sen. Kelly). Would require a flat $750 cash payment per passenger for an airline-caused cancellation or significant delay, plus rebooking, meals, and lodging for overnights. As introduced only, it gives you no right to claim money today.',
    whyItMatters: 'The U.S. still does NOT make airlines pay a cash penalty just for delaying you (unlike Europe). This bill would change that — but it isn’t law yet. Worth a call to your senators.',
    sources: [{ label: 'Congress — S.3347', url: 'https://www.congress.gov/bill/119th-congress/senate-bill/3347' }],
  },
  {
    name: 'Minimum airline seat sizes — the long saga',
    year: '2018 / 2024',
    status: 'Mandated by Congress but NOT enforced — no rule issued',
    summary: 'Honest version: Congress ordered the FAA to set minimum seat width and legroom for evacuation safety back in the 2018 FAA law, took public comments in 2022, and pressed again in the 2024 FAA law. But as of mid-2026 the FAA has still NOT issued any minimum-seat-size rule. So there is no federal minimum seat width or legroom you can invoke today.',
    whyItMatters: "Despite years of promises, nothing is enforceable. If legroom matters, choose your seat and aircraft at booking — don't count on a federal standard that doesn't exist yet. This is a live thing to pressure your representatives about.",
    sources: [{ label: 'FAA — seat-size comments', url: 'https://www.faa.gov/seat-size-comments' }],
  },
];

export const ALLIES: ResourceLink[] = [
  { title: 'DOT Office of Aviation Consumer Protection', blurb: 'The federal watchdog for air travelers. Takes complaints, enforces the refund/bumping/tarmac rules, and runs the customer-service and family-seating dashboards. Your most powerful free lever.', url: 'https://www.transportation.gov/airconsumer' },
  { title: 'Elliott Advocacy', blurb: 'Nonprofit that helps travelers resolve disputes for free and publishes airline executive contact lists (elliott.org/company-contacts) for escalating stuck cases.', url: 'https://www.elliott.org/' },
  { title: 'AirHelp', blurb: 'No-win-no-fee claims service that handles EU261 / UK261 / Canada APPR cash-compensation claims for you (takes a cut if it wins). Useful when an airline stonewalls a foreign-route claim.', url: 'https://www.airhelp.com/' },
  { title: 'Flightright', blurb: 'Another no-win-no-fee service specializing in EU261 / UK261 air-passenger compensation claims, doing the paperwork and legal pursuit for a percentage of the payout.', url: 'https://www.flightright.com/' },
  { title: 'Contact your members of Congress', blurb: 'To push pending bills (cash delay compensation, family seating, seat minimums), look up your members by ZIP and call the Capitol switchboard at 202-224-3121. Free and quick.', url: 'https://www.congress.gov/members/find-your-member' },
];

export const STATS_LINKS: ResourceLink[] = [
  { title: 'DOT Air Travel Consumer Reports', blurb: 'Monthly complaint rates, mishandled bags, and cancellations by airline.', url: 'https://www.transportation.gov/airconsumer/air-travel-consumer-reports' },
  { title: 'BTS On-Time Performance', blurb: 'Bureau of Transportation Statistics — which airlines and routes are late, and how late. Raw data.', url: 'https://www.transtats.bts.gov/' },
  { title: 'Skytrax Airline Reviews', blurb: 'Independent passenger ratings, the most-cited airline review site.', url: 'https://www.airlinequality.com/' },
  { title: 'J.D. Power Airline Satisfaction', blurb: 'Annual survey ranking every major U.S. airline on service and value.', url: 'https://www.jdpower.com/business/travel/us-airline-satisfaction-study' },
];

export const REVIEW_LINKS: ResourceLink[] = [
  { title: 'Skytrax', blurb: "Verified traveler reviews; your review counts toward the airline's global rating.", url: 'https://www.airlinequality.com/' },
  { title: 'ConsumerAffairs', blurb: 'Good for documenting a pattern — late refunds, bad service, misleading fees.', url: 'https://www.consumeraffairs.com/travel/' },
  { title: 'Google Maps', blurb: "Search the airline's name on Google Maps to leave a highly-visible review.", url: 'https://www.google.com/maps' },
];
