# Helena → Anywhere · Delta Companion Value Finder

A local web dashboard that finds where your **Delta SkyMiles Companion Certificate** (Amex
Platinum/Reserve) gives you the most value on flights out of **Helena, MT (HLN)**.

It pulls **real Delta fares with no API key**, ranks trips by how much the certificate actually
saves you, flags companion eligibility, and charts the **price trend over time** so you can catch
deals as cheaper weeks open up.

---

## Quick start

```bash
node server.js
```

Open <http://localhost:5173>. No `npm install` — zero dependencies. **Requires Node 18+** (uses
built-in `fetch` and `http`).

It works immediately with **live data and no signup**.

---

## Where the data comes from

There is no public Delta API. The dashboard uses a tiered provider system (it picks the best
available automatically):

1. **Google Flights — keyless, default.** Delta fares are scraped from Google Flights' public
   `?tfs=` deep-link (a base64 protobuf the app builds itself). **Real prices, no key, no signup.**
   Honest limit: Google Flights doesn't expose the **booking class** (the `L/U/T/X/V` bucket), so
   companion eligibility shows as **"Confirm on Delta"** rather than a hard yes/no. It's unofficial
   and best-effort — if Google changes their page it can break, and the app falls back to sample
   data rather than erroring.

2. **Amadeus — optional, precise.** Add free Amadeus keys (below) to get the actual fare class per
   segment, turning "Confirm on Delta" into a firm **eligible / not-eligible** call.

3. **Sample data** — deterministic offline fallback if both live sources fail.

### Optional: Amadeus precise-fare-class mode
1. Free account at <https://developers.amadeus.com> → create an app → copy **API Key** + **Secret**.
2. Copy `.env.example` → `.env`, paste them, set `AMADEUS_ENV=production` (the *test* dataset is
   too thin for small airports like HLN).
3. Restart. The badge flips to **LIVE · Amadeus**. (2,000 free production calls/month.)

---

## What it does

- **🌎 Everywhere (no destination needed)** — the default view. Give it dates and it scans Delta's
  whole reachable network from HLN at once and ranks every destination, sorted by **Cheapest** or
  **Best cert value**. Click any deal to jump to its flights + trend. ("Popular" ≈ 22 cities, ~5s;
  "Everywhere" ≈ 50 cities, ~10s, via a small concurrency pool.)
  - **Flexible dates** — tick "I'm flexible," give a window + trip length, and it finds the
    *cheapest week* to each destination.
- **Friendly, readable UI** — warm light theme by default (🌙 toggle for dark), plain-language
  labels ("One ticket / Companion pays / You save"), built to be easy for anyone to use.
- **Single-trip search** — every Delta option for a route/date, cheapest eligible first, with the
  full HLN→SLC→destination routing, times, operator, and companion savings.
- **Pick & compare** — choose specific destinations to compare side by side.
- **Price calendar & trend** — sample the next ~8 departure weeks for a route to see how price
  moves and which week is the deal; plus a sparkline of the price history you accumulate over time.
- **Watchlist** — star trips (saved in your browser) and *Refresh all* to re-check them.

### The value math
- Without the cert, two people pay `2 × fare`.
- With it, you pay your fare and the companion flies for taxes/fees only — capped at **~$80
  round-trip domestic** or **~$250 round-trip international** (Mexico/Caribbean/Central America),
  up to 4 segments.
- **Net savings = your fare − companion taxes.** When the source can't show taxes (Google Flights),
  the companion cost is conservatively estimated at the cap (never $0), and the figure is marked
  *est.*

### Companion eligibility (verified against delta.com + Amex, 2025/2026)
| Card | Geography | Main | Comfort+ | Premium Select | First |
|------|-----------|------|----------|----------------|-------|
| **Platinum** | U.S. (incl. AK/HI), Mexico, Caribbean, Central America | L U T X V | — | — | — |
| **Reserve**  | *same as Platinum* | L U T X V | W S | A G | I Z |

Both cards reach the **same destinations** — they differ only by cabin. Delta One and Basic
Economy are never eligible. The **Gold** card has no companion certificate. A search only shows the
cheapest published fare's class, so even in precise mode treat a match as "looks eligible — confirm
the open seat when booking."

---

## Project layout

```
server.js                    zero-dep server + JSON API + static hosting + provider routing
src/companion.js             eligibility rules, value math, ranking (the engine)
src/data/routes.js           HLN route map (via SLC), destinations + zones
src/history.js               local price-history store (data/history.json) for trends
src/providers/googleflights.js  keyless live data (builds tfs protobuf, parses aria-labels)
src/providers/amadeus.js     optional precise data (OAuth + Flight Offers Search)
src/providers/mock.js        deterministic sample fallback
public/                      dashboard UI (index.html / styles.css / app.js)
```

### API
- `GET  /api/health` · `GET /api/meta`
- `POST /api/search`   `{origin,destination,departDate,returnDate,tier}`
- `POST /api/explore`  `{departDate,returnDate,tier,scope:'popular'|'all'}` → every destination ranked
- `POST /api/scan`     `{tier, trips:[...]}`
- `POST /api/calendar` `{origin,destination,tier,weeks,tripLengthDays}` → price-by-week
- `GET  /api/history?origin=&destination=&departDate=&returnDate=` → time series

Add another source (SerpApi, Duffel, Kiwi) by creating `src/providers/<name>.js` that exports
`searchOffers()` returning the normalized offer shape, then wire it into `chooseProvider()`.
