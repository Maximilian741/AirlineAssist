/**
 * Crisis mode data — "it's happening RIGHT NOW at the airport."
 * TS port of web public/crisis.js; keep the two in sync. Every factual claim is recomposed from
 * the same verified rules as the rights data (14 CFR 250/259/260, DOT dashboard, EU261/UK261,
 * contract-of-carriage extracts) — no new law is asserted here.
 */
import type { ClaimType } from '@/lib/claim-engine';

export type CrisisScenario = {
  id: string;
  title: string;
  claimType: ClaimType | null;
  now: string[];
  say: string;
  collect: string[];
  money: string;
  dontAccept: string;
};

export const SCENARIOS: CrisisScenario[] = [
  {
    id: 'delay',
    title: 'They just announced a long delay',
    claimType: 'delayed',
    now: [
      'Ask the gate agent, politely and specifically: “Is this delay within the airline’s control, or weather/ATC?” Write down the answer, the time, and the agent’s first name.',
      'At the 3-hour mark, ask for meal vouchers — every big U.S. airline has promised meals after a 3+ hour controllable delay on the DOT dashboard. You have to ask.',
      'If it’s heading overnight: ask for a hotel plus transport before the desk gets swamped. All the majors except Frontier have committed to it for controllable disruptions.',
      'Don’t rebook yourself on another airline or book your own hotel without asking the airline first — you may eat the cost.',
    ],
    say: '“I understand it’s not your fault. Since this is a controllable delay, I’d like the meal voucher the airline has committed to on the DOT dashboard — and if we go overnight, a hotel and transport.”',
    collect: ['The stated CAUSE of the delay (this decides everything later)', 'Screenshot of the departure board + your airline app', 'Every receipt if you have to buy food or essentials'],
    money: 'Departing the EU or UK? A 3+ hour ARRIVAL delay within the airline’s control = €250–€600 / £220–£520 cash per person — on any airline, including U.S. ones. The cause you document right now is the evidence.',
    dontAccept: 'Don’t accept “there’s nothing we can do” before you’ve asked for the dashboard commitments by name.',
  },
  {
    id: 'cancel',
    title: 'They just canceled my flight',
    claimType: 'cancelled',
    now: [
      'Get in line AND get on your phone/app at the same time — rebooking is first-come. Ask about flights on partner airlines, not just their own.',
      'Decide: still want to go? Take the free rebooking. Done with this trip? You are owed a full CASH refund — not a voucher — because they canceled.',
      'Ask the same cause question: “Was this cancellation within the airline’s control?” Write it down.',
      'Overnight before the new flight? Hotel + transport, same as a delay — ask.',
    ],
    say: '“Since the airline canceled my flight, if I choose not to travel I’m entitled to a refund to my original payment under 14 CFR Part 260 — I’m not required to accept a travel credit. For now, please show me my rebooking options including partner airlines.”',
    collect: ['The cancellation notice (screenshot it with the timestamp)', 'The stated cause', 'Names/times of who told you what'],
    money: 'Departing the EU/UK: a cancellation with less than 14 days’ notice adds €250–€600 / £220–£520 cash on top of the rebooking or refund — unless it was genuinely out of the airline’s control.',
    dontAccept: 'A voucher “instead of” your refund. Vouchers are only ever an option you choose — the cash refund is the default the law requires.',
  },
  {
    id: 'bump',
    title: 'Oversold — they want my seat',
    claimType: 'bumped',
    now: [
      'If they’re asking for VOLUNTEERS: it’s an auction with no legal minimum — negotiate. Ask for cash (not a voucher), or a voucher with no expiry + a confirmed seat on a flight you name + hotel and meals if overnight.',
      'If you’re bumped INVOLUNTARILY: federal law sets the price. More than 1 hour late to your destination = 200% of your one-way fare (up to $1,075). Two hours (four international) = 400% (up to $2,150).',
      'Ask for the compensation in a CHECK, at the gate, today — that’s your right. And ask for the written statement of your rights; they’re required to provide it.',
      'Make them rebook you before you leave the podium — compensation is separate from getting you home.',
    ],
    say: '“If you’re denying me boarding involuntarily, I’m requesting the denied-boarding compensation under 14 CFR 250.5, paid by check today, plus the written statement of my rights — and my rebooking.”',
    collect: ['Your original scheduled arrival time and the new one (the gap sets your tier)', 'Your boarding pass and fare receipt', 'The written statement they hand you'],
    money: 'The check-vs-voucher choice is the whole game: the voucher they lead with is usually worth less than the cash the law already owes you.',
    dontAccept: 'Handing over your boarding pass or leaving the gate area before the compensation and rebooking are settled in writing.',
  },
  {
    id: 'bagdrop',
    title: 'About to check a bag',
    claimType: 'bag_late',
    now: [
      'Photograph the bag — open (contents visible) and closed. Thirty seconds now is the whole ballgame if it vanishes: claims are paid on PROVABLE contents and condition.',
      'Pull valuables, medication, electronics, jewelry, and cash into your carry-on. Every airline’s contract disclaims or caps liability for exactly those items in a checked bag.',
      'Watch the tag get printed and check the three-letter airport code on it before the bag slides away. Mis-tags happen at the counter, not in the air.',
      'Keep the tag stub and your bag-fee receipt with your boarding pass — the stub is your claim, the receipt is your refund if the bag runs late.',
    ],
    say: '“Can you confirm this is tagged through to my final airport? And I’d like the tag receipt, please.”',
    collect: ['Photos of the bag, open and closed', 'The tag stub', 'The bag-fee receipt'],
    money: 'If the bag arrives late, your bag FEE comes back (12h domestic / 15–30h international — but only if you file the report before leaving the airport). Lost or damaged: up to $4,700 domestic, ~$2,000 international by treaty. Paid with a credit card? Many cards add ~$100/day baggage-delay coverage on top.',
    dontAccept: 'Checking a bag with the valuables still inside. The contract of carriage is written so that exactly those losses are on you.',
  },
  {
    id: 'bag',
    title: 'My bag didn’t show up',
    claimType: 'bag_late',
    now: [
      'File the Mishandled Baggage Report at the airline’s baggage desk BEFORE you leave the airport. Without that report number, your bag-fee refund and most claims evaporate.',
      'Get the reference number and a phone number, and confirm how delivery works.',
      'Buying essentials? Keep every receipt — for the airline claim and for your credit card’s baggage-delay coverage (many cards pay ~$100/day after a short delay if you paid with the card).',
      'International trip? The written-notice clocks are short and unforgiving: 7 days for damage, 21 days for a delayed bag.',
    ],
    say: '“I need to file a mishandled baggage report and get the reference number. If it’s delivered more than 12 hours late, I’ll be requesting my checked-bag fee back under the DOT rule.”',
    collect: ['The report reference number (photo it)', 'Bag tag stubs', 'Receipts for everything you buy'],
    money: 'Domestic: bag 12+ hours late = your bag FEE back; lost = up to $4,700 in provable contents. International: up to ~1,519 SDR (~$2,000) under the Montreal Convention.',
    dontAccept: '“Just wait, it’ll probably show up” without a filed report. No report, no claim.',
  },
  {
    id: 'weather',
    title: 'They say “weather” — but is it?',
    claimType: 'cancelled',
    now: [
      'The cause label decides your money: “weather/ATC” kills most compensation; “crew, maintenance, fueling” unlocks it. Airlines apply the label themselves — so verify.',
      'Check whether the SAME airline’s other flights on your route are departing, and whether other airlines are flying the same route right now. Screenshot what you see.',
      'Ask the agent to state the cause and note it in your booking record.',
      'You can’t win this argument at the counter — you win it later, with evidence, in the DOT complaint or EU claim. Just collect.',
    ],
    say: '“Can you confirm the recorded cause of this cancellation for my booking? I’d like it noted, whatever it is.”',
    collect: ['Screenshots: departure boards, flight-tracker pages for your route, weather at both airports', 'The stated cause, time-stamped', 'Names'],
    money: 'A mislabeled “weather” cancellation is the single most common way a €600 EU claim or a dashboard hotel gets denied. Your screenshots are what overturn it. And even in genuine weather chaos, an EU-departing flight still owes you meals and a hotel — the care duty has no weather exception.',
    dontAccept: 'The label at face value when planes are visibly flying the same route.',
  },
];

export const EVIDENCE = [
  'Screenshot everything with timestamps — boards, app notices, texts.',
  'Names and times for every conversation.',
  'Keep every receipt. Cash claims die without receipts.',
  'Never surrender originals — photograph documents before handing anything over.',
];
