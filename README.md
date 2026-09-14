# Fairfare

**Cheap companion fares out of Helena — and the receipts to claim what you're owed when a flight goes wrong.**

Fairfare started as a local dashboard for finding where a **Delta SkyMiles Companion Certificate**
(Amex Platinum/Reserve) saves the most out of **Helena, MT (HLN)**. It has grown into a
consumer-side air-travel toolkit: verified passenger rights, exact refund and compensation math,
one-tap pre-filled claims, a claim tracker that knows the airline's legal clocks, a server-side
watchdog that re-checks your booked trips for fare drops and schedule changes you can cash in on,
and the government's own airline scorecard. Web app (zero-dependency Node) plus an Expo iOS/Android
app in `mobile/`.

Built to help travelers, not to milk them: no ads, no data selling, no airline kickbacks.

---

## Quick start

```bash
node server.js
```

Open <http://localhost:5173>. No `npm install` — zero dependencies. **Requires Node 18+**
(Node 22.18+ to run the test suite, which loads the mobile TypeScript directly).

```bash
node --test
```

137 deterministic tests: the tax math, the claim engine, coverage, fare classes, the buy check,
the claim tracker, the watchdog diff engine, the trend engine, the notification event engine — and
**web ⇄ mobile parity sweeps** that fail if the two apps ever disagree on a legal or money answer.

Mobile: `cd mobile && npm install && npx expo start` (Expo SDK 56). Set `EXPO_PUBLIC_API_BASE`
to your server URL for live prices, the watchdog and trends; the rights guide, claim calculator,
crisis mode and money moves work fully offline.

---

## What it does

### Find the deal
- **Everywhere** — give it dates and it scans Delta's reachable network from HLN, ranks every
  destination by cheapest fare or best certificate value; flexible-dates mode finds the cheapest week.
- **Single-trip search** with full routing, exact companion taxes (statutory: AY/XF/ZP computed,
  not guessed — corroborated against Delta's own "from $22"), and a **price verdict**: Buy / Wait /
  Watch, with the exact evidence (lowest we've seen, slope over the last checks, days to departure,
  route-wide history). Verdicts only appear once there's enough recorded data — never invented.
- **Buy Check** — before you click buy: the true price with that airline's fee ceilings, whether
  the trip is covered by EU261/UK261/APPR in each direction (and the nudge when EU metal would be),
  the leverage you keep after buying from that airline's contract of carriage, the certificate
  verdict for the fare class, and the airline's record from the DOT report.

### Know what you're owed
- **Your Rights** — 21 verified rights cards (DOT/eCFR/EU/UK/Canada, source-linked), the
  escalation ladder, international cash compensation, honest legislation status, an "am I covered?"
  checker, a decoder of nine airlines' contracts of carriage, and **the airline scorecard**:
  on-time %, cancellations, mishandled bags, bumping and complaints per 100k, straight from the
  U.S. DOT Air Travel Consumer Report, same period for every airline.
- **What am I owed?** — a plain-language wizard → exact entitlements with the rule behind each,
  including the **schedule-change refund** (a 3h/6h change you decline is a full cash refund on any
  fare) → a demand letter, DOT complaint text, chargeback letter, small-claims notice and evidence
  pack, all pre-filled with your trip details. You hit send.
- **Claim tracker** — every filing starts the airline's legal clocks (30-day acknowledge, 60-day
  answer, 7-business-day refund…). It tells you the day they miss one and what to do next; the
  ladder never skips DOT.
- **Crisis mode** — at the airport right now: six scenarios with numbered steps, the word-for-word
  script, the evidence checklist, and a jump into the claim with the type pre-answered.

### Let the machine watch
- **My Trips** — save a trip and every claim deadline counts down (the 60-day chargeback wall, the
  7/21-day Montreal notices…). One tap opens the fully pre-filled claim. Export deadlines to your
  calendar with 7-day and 1-day reminders.
- **Watchdog** — the server re-checks watched trips on a schedule and turns changes into money
  levers: a fare drop → rebook and keep the difference (with that airline's exact repricing policy);
  a significant schedule change → **"Write the refund request"** drafts the letter with the old and
  new times. On the phone these arrive as notifications; on the web the My Trips tab carries a badge.
- **Money moves** — 27 verified tactics, hidden-fee table, true-price calculator, card-protection
  checker, fare-class decoder, schedule-change lever.
- **Share cards** — 9:16 receipt/deadline/scorecard cards with fact-led captions.

---

## Where the price data comes from

There is no public Delta API. Providers are picked automatically:

1. **Google Flights — keyless, default.** Real fares from Google Flights' public `?tfs=` deep-link.
   Doesn't expose booking class, so certificate eligibility shows as "confirm on Delta". Rate-limits
   bulk use from one IP; the app paces requests and says so honestly when throttled.
2. **Amadeus — optional, precise.** Add keys to `.env` (`AMADEUS_ENV=production`) for exact fare
   classes and reliable bulk scans.
3. **Sample data** — deterministic offline fallback.

---

## Project layout

```
server.js                     zero-dep server + JSON API + static hosting + provider routing + watchdog sweeps
src/companion.js              certificate eligibility, value math, ranking
src/taxes.js                  exact statutory companion taxes (AY/XF/ZP/US)
src/history.js                price-history store (data/history.json)
src/trends.js                 trend engine: low seen, slope, direction, Buy/Wait/Watch verdict
src/watchdog.js               registry + sweep + diff → money levers (14 CFR 260.2 + per-carrier CoC lines)
src/providers/*.js            googleflights (keyless), amadeus (optional), mock
public/                       web app: app.js + data/engine modules (claim-engine, trips, claimtrack,
                              coverage, fareclass, buycheck, crisis, viral, rights/money/coc/scorecard/faredrop data)
mobile/                       Expo app (TS ports of the engines; generated data files kept in sync by tests)
test/                         node --test suite (incl. web⇄mobile parity)
```

### API
- `GET  /api/health` · `GET /api/meta`
- `POST /api/search` · `POST /api/explore` · `POST /api/scan` · `POST /api/calendar`
- `GET  /api/history?…` → recorded series · `GET /api/trend?origin&destination&departDate&returnDate` → verdict + series + route stats
- `POST /api/watch` · `GET /api/watch` · `GET|DELETE /api/watch/:id` · `POST /api/watch/:id/ack` · `POST /api/watch/sweep`

### Honesty rules baked in
- Every legal figure links to its primary source and was adversarially re-verified; conditional
  claims carry their condition into the letter; ceilings are never summed as "owed".
- Nothing auto-submits to an airline or DOT — the app prepares and pre-addresses; the user sends.
- Numbers are exact or absent. No "est." where a figure can be computed.
