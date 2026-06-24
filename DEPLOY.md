# Get it online so your mom can use it (no App Store needed)

The app is a tiny Node server with no dependencies, so it deploys almost anywhere for free.
Once it's online you get a public link (e.g. `https://fairfare.onrender.com`) — text that to your
mom, she opens it in her phone's browser, and she can **Add to Home Screen** so it looks and opens
like a real app. No install, no Apple account.

## Easiest free option: Render

**One-time setup (~15 minutes):**

1. **Put the code on GitHub** (free):
   - Make a free account at github.com if you don't have one.
   - In this project folder, run:
     ```
     git init
     git add .
     git commit -m "Fairfare"
     ```
   - Create a new empty repo on GitHub, then follow its "push an existing repository" lines
     (`git remote add origin …` + `git push -u origin main`).
   - Note: `.gitignore` already keeps your private `.env` and the `mobile/` build files out.

2. **Deploy on Render** (free):
   - Make a free account at render.com.
   - **New → Web Service → Build and deploy from a Git repository** → connect your GitHub repo.
   - Settings:
     - **Build Command:** *(leave blank — there's nothing to build)*
     - **Start Command:** `node server.js`
     - **Instance type:** Free
   - Click **Create Web Service**. In ~1 minute you get a URL like `https://fairfare.onrender.com`.

3. **Send your mom the link.** On her phone:
   - **iPhone (Safari):** open the link → Share button → **Add to Home Screen**.
   - **Android (Chrome):** open the link → ⋮ menu → **Add to Home screen / Install app**.
   - It now sits on her home screen with the ✈ icon and opens full-screen like an app.

## Heads-up about the two halves of the app

- **🛡️ Your Rights** and **💸 What am I owed?** (the calculator, the filing letters, the share card)
  work **perfectly with zero setup** — no key, even offline.
- **Find Flights / deals** uses the free keyless flight data. For one occasional user (your mom)
  it'll usually work, but it can hit Google's free limit and show a "couldn't check right now" note.
  To make the deal-finder reliable, add a free **Amadeus** key later: in the Render dashboard →
  your service → **Environment**, add `AMADEUS_CLIENT_ID`, `AMADEUS_CLIENT_SECRET`, and
  `AMADEUS_ENV=production` (see `.env.example`). No code change needed.

## Notes

- Render's free plan "sleeps" after inactivity, so the **first** open after a quiet spell takes
  ~30–50 seconds to wake up. After that it's instant. (Fine for occasional use; a paid plan or a
  different host removes the wait if it ever matters.)
- Your `.env` (any Amadeus keys) is **not** uploaded to GitHub — set those in the Render dashboard.
- Any host that runs Node works (Railway, Fly.io, etc.); Render's free tier is the simplest.
