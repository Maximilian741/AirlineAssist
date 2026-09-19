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

## The watchdog needs two more minutes of setup

The watchdog is the part that re-checks your saved trips and turns a fare drop or a schedule
change into money. On a free instance it does **not** run by itself: the host puts the service to
sleep after ~15 idle minutes, so the app's own 6-hour timer never gets there. Two things fix it:

1. **Set a sweep token.** Render dashboard → your service → **Environment** → add
   `SWEEP_TOKEN` with any long random string. Without it, the sweep endpoint is open to anyone on
   the internet and each call fires a live search for every watched trip.
2. **Let GitHub call it.** This repo ships `.github/workflows/watchdog-sweep.yml`, which wakes the
   service and sweeps every six hours for free. In GitHub → **Settings → Secrets and variables →
   Actions**, add a secret named `SWEEP_TOKEN` with the same value. (If your URL isn't
   `airlineassist.onrender.com`, also add a variable `FAIRFARE_BASE_URL`.)

**What the free tier still can't do.** Anything written to disk is wiped whenever the service
sleeps or redeploys, so the registry of watched trips and the price history reset. The apps
re-register their own trips the next time you open them, and a fare drop is measured against what
you paid — so nothing is silently wrong — but a trip nobody has opened since the last wipe isn't
being watched, and "lowest we've seen" starts over. A paid instance with a disk (or a small
external store) is what makes it continuous; the code needs no change for it.

## Notes

- Render's free plan "sleeps" after inactivity, so the **first** open after a quiet spell takes
  ~30–50 seconds to wake up. After that it's instant. (Fine for occasional use; a paid plan or a
  different host removes the wait if it ever matters.) See the watchdog section above for what
  sleeping costs the automatic re-checks.
- Your `.env` (any Amadeus keys) is **not** uploaded to GitHub — set those in the Render dashboard.
- Any host that runs Node works (Railway, Fly.io, etc.); Render's free tier is the simplest.
