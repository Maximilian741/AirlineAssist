# Fairfare — mobile app (Expo)

Cross-platform (iOS + Android + web) companion to the Delta companion-cert dashboard, built with
**Expo SDK 56** + **expo-router**. The flagship **🛡️ Your Rights** feature is fully **offline** —
verified, source-linked air-passenger-rights content bundled into the app, no server or API key needed.

## Tabs

- **Home** — entry points + the non-predatory mission.
- **Find Flights** — Delta companion-cert value search out of Helena (HLN). Needs the data server
  (see below); degrades gracefully with a clear message when it isn't configured.
- **Your Rights** — the offline arsenal: what airlines owe you (refunds, bumping cash, delays,
  baggage), how to actually get paid, EU/UK/Canada cash compensation, an honest legislation tracker
  (in-force vs proposed vs struck-down), and links to check an airline's record. Every fact links to
  a primary government source.

## Run it (development)

```bash
cd mobile
npm install              # first time only
npx expo start           # then press i (iOS sim), a (Android), or w (web)
```

Or scan the QR code with the **Expo Go** app on your phone — no Mac required for iOS dev.

### Connecting live flight search

The "Your Rights" tab works with no server. "Find Flights" calls the companion API (the repo's
root `server.js`, or a deployed copy). Point the app at it with an env var using your computer's
**LAN IP** (not `localhost`, so a phone can reach it):

```bash
# terminal 1 — run the data server (repo root)
node server.js

# terminal 2 — run the app pointed at it
EXPO_PUBLIC_API_BASE=http://192.168.1.50:5173 npx expo start
```

## Ship to the App Store / Play Store (EAS)

Requires an **Apple Developer account** ($99/yr) for iOS and a Google Play account ($25 one-time).

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform ios        # → TestFlight
eas build --platform android    # → Play Store
```

Bundle IDs are pre-set in `app.json`: `com.fairfare.app` (change before publishing if you want a
different identifier). Replace the placeholder icons in `assets/images/` and `assets/expo.icon/`
with real branding before submitting.

## Notes / roadmap

- **Name** "Fairfare" is a working title — change `name`/`slug`/`scheme`/bundle IDs in `app.json`.
- **Shared data**: `src/data/rights.ts` currently mirrors the web app's `public/rights-data.js`.
  The next refactor is a monorepo `core` package so web + mobile import ONE source of truth.
- **Any airline / any origin** is the roadmap; today it's Helena + Delta. Switching the data layer
  to a production flight API (Amadeus) de-hardcodes the airline.
- Verified rights content was last checked mid-2026 — re-verify against the linked sources over time.
