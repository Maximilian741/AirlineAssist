// trips.js — the trip vault + claim-deadline engine.
//
// WHY THIS EXISTS: airlines' biggest structural edge is that claims EXPIRE. Most people never
// file because they don't know a chargeback dies at ~60 days, a damaged-bag claim dies at 7 days,
// or an EU261 claim is worth €600 for years. This tracks every deadline per trip and counts down,
// so nothing quietly lapses.
//
// Deadlines below come from the SAME verified sources as rights-data.js (14 CFR Part 260/250/254,
// FCBA 15 U.S.C. 1666, Montreal Convention Art. 31, EU261, UK261, Canada APPR).
// Storage is localStorage on this device, with no account. Watching a trip sends only its route and dates
// to the server (see watch()); names and confirmation numbers never leave the device.

window.Trips = (function () {
  'use strict';

  const KEY = 'ff-trips';

  // ---------- storage ----------
  function all() {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(v) ? v : [];
    } catch {
      return [];
    }
  }
  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
  }
  function add(trip) {
    const list = all();
    const t = { id: 'tr' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), created: today(), ...trip };
    list.push(t);
    save(list);
    return t;
  }
  function update(id, patch) {
    const list = all();
    const i = list.findIndex((t) => t.id === id);
    if (i >= 0) {
      list[i] = { ...list[i], ...patch };
      save(list);
    }
    return list[i];
  }
  function remove(id) {
    save(all().filter((t) => t.id !== id));
  }

  // ---------- date helpers ----------
  // The traveler's calendar day, not UTC's — in U.S. evenings UTC is already tomorrow, which would expire a
  // deadline that is still due today.
  function today() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  function parse(d) {
    if (!d) return null;
    const x = new Date(d + 'T12:00:00');
    return isNaN(x.getTime()) ? null : x;
  }
  function addDays(d, n) {
    const x = parse(d);
    if (!x) return null;
    x.setDate(x.getDate() + n);
    return x.toISOString().slice(0, 10);
  }
  function daysBetween(from, to) {
    const a = parse(from), b = parse(to);
    if (!a || !b) return null;
    return Math.round((b - a) / 86400000);
  }
  function fmt(d) {
    const x = parse(d);
    if (!x) return '';
    return x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  // ---------- the deadline engine ----------
  // Each deadline: { key, label, due, daysLeft, status, why, rule, action }
  // status: 'open' (plenty of time) | 'soon' (<=7 days) | 'urgent' (<=2 days) | 'expired'
  function deadlines(trip) {
    const out = [];
    const now = today();
    const flight = trip.departDate;
    const booked = trip.bookedDate || null;
    const paidCard = trip.payment !== 'other';
    const intl = trip.region && trip.region !== 'us';

    const push = (key, label, due, why, rule, action) => {
      if (!due) return;
      const left = daysBetween(now, due);
      let status = 'open';
      if (left < 0) status = 'expired';
      else if (left <= 2) status = 'urgent';
      else if (left <= 7) status = 'soon';
      out.push({ key, label, due, daysLeft: left, status, why, rule, action });
    };

    // 1) 24-hour free cancellation (only meaningful right after booking, 7+ days pre-flight)
    if (booked && flight && daysBetween(booked, flight) >= 7) {
      push(
        'cancel24',
        'Free cancellation window',
        addDays(booked, 1),
        'You can cancel this booking for a full refund, no penalty — if you booked directly with the airline.',
        '14 CFR 259.5(b)(4)',
        'cancel'
      );
    }

    // The rest only matter once something went wrong.
    if (!trip.issue || trip.issue === 'none') return sortDeadlines(out);

    const issueDate = trip.issueDate || flight;

    // 2) Baggage — Montreal Convention written-notice deadlines (international) are brutally short.
    if (trip.issue === 'bag_lost' || trip.issue === 'bag_late') {
      if (intl) {
        push(
          'mc_damage',
          'International bag damage notice',
          addDays(issueDate, 7),
          'On international trips you must notify the airline IN WRITING within 7 days for damage. Miss it and the claim is generally barred.',
          'Montreal Convention, Art. 31',
          'claim'
        );
        push(
          'mc_delay',
          'International bag delay notice',
          addDays(issueDate, 21),
          'Written notice for a DELAYED bag on an international trip is due within 21 days.',
          'Montreal Convention, Art. 31',
          'claim'
        );
      }
      push(
        'bagfee',
        'Checked-bag fee refund',
        addDays(issueDate, 45),
        'A significantly delayed bag means your bag FEE is refundable — but only if you filed a mishandled-baggage report. Ask now, in writing.',
        '14 CFR Part 260',
        'claim'
      );
    }

    // 3) Bumping — claim the cash promptly (paid same day at the airport; chase it fast after).
    if (trip.issue === 'bumped' && ['us', 'intl_from_us'].includes(trip.region || 'us')) {
      push(
        'db',
        'Denied-boarding cash claim',
        addDays(issueDate, 30),
        'Involuntary bumping pays cash (up to $1,075 / $2,150) — it should have been paid at the airport. Chase it now while records are fresh.',
        '14 CFR 250.5 & 250.8',
        'claim'
      );
    }

    // 4) Refund owed → the airline's own payment clock
    if (trip.issue === 'cancelled' || trip.issue === 'schedule' || trip.issue === 'extra') {
      push(
        'refund',
        'Airline must pay your refund by',
        addDays(issueDate, paidCard ? 10 : 20),
        paidCard
          ? 'Credit-card refunds are due within 7 BUSINESS days of your request. Past this, it is its own violation — report it.'
          : 'Non-card refunds are due within 20 calendar days of your request.',
        '14 CFR 260.10',
        'complain'
      );
    }

    // 5) Chargeback — the hard 60-day FCBA wall (the one people miss most)
    if (paidCard) {
      push(
        'chargeback',
        'Credit-card dispute deadline',
        addDays(issueDate, 60),
        'If the airline took your money and did not deliver, you can dispute the charge — but the FCBA window is ~60 days from the statement. This one does not come back.',
        'FCBA, 15 U.S.C. 1666',
        'chargeback'
      );
    }

    // 6) International compensation regimes (the big, under-claimed money)
    if (trip.region === 'canada') {
      push(
        'appr',
        'Canada APPR claim window',
        addDays(issueDate, 365),
        'Canada gives you a full year to claim cash compensation (up to CAD 1,000; CAD 2,400 for bumping).',
        'Canada APPR',
        'claim'
      );
    }
    if (trip.region === 'from_eu') {
      push(
        'eu261',
        'EU261 claim window (safe-in-every-country date)',
        addDays(issueDate, 365),
        'EU261 pays €250–€600 cash. The real limit depends on which country’s courts you’d use (roughly 1–10 years; Belgium and Poland run about 1 year) — file within a year and you’re safe everywhere.',
        'EC Regulation 261/2004 (Cuadrench Moré C-139/11: national limits apply)',
        'claim'
      );
    }
    if (trip.region === 'from_uk') {
      push(
        'uk261',
        'UK261 claim window',
        addDays(issueDate, 2190),
        'UK claims run up to 6 years (England & Wales). Long window, real money — £220–£520.',
        'UK261',
        'claim'
      );
    }

    // 7) DOT complaint — no hard cutoff, but file while it is fresh
    push(
      'dot',
      'File a DOT complaint (recommended by)',
      addDays(issueDate, 180),
      'No hard federal cutoff, but file while records are fresh. Airlines must respond within 60 days, and DOT tracks every complaint.',
      'DOT Office of Aviation Consumer Protection',
      'complain'
    );

    return sortDeadlines(out);
  }

  function sortDeadlines(list) {
    const rank = { urgent: 0, soon: 1, open: 2, expired: 3 };
    return list.sort((a, b) => (rank[a.status] - rank[b.status]) || (a.daysLeft - b.daysLeft));
  }

  /** Everything still actionable across all trips, most urgent first. */
  function upcoming() {
    const out = [];
    for (const t of all()) {
      for (const d of deadlines(t)) {
        if (d.status !== 'expired') out.push({ trip: t, deadline: d });
      }
    }
    return out.sort((a, b) => a.deadline.daysLeft - b.deadline.daysLeft);
  }

  /** Rough money still on the table (uses the claim engine when an issue is set). */
  function atStake(trip) {
    if (!trip.issue || trip.issue === 'none' || !window.ClaimEngine) return null;
    try {
      const answers = claimAnswers(trip);
      // No figure from a partial picture: an unanswered money question would otherwise read as "$0 owed".
      if (window.ClaimEngine.nextQuestion(answers)) return null;
      const res = window.ClaimEngine.assess(answers);
      const cash = res.entitlements.find((e) => (e.strength === 'strong' || e.strength === 'conditional') && /\$|€|£|CAD/.test(e.amountText || ''));
      return cash ? cash.amountText : (res.hasClaim ? 'a refund' : null);
    } catch {
      return null;
    }
  }

  /** Map a saved trip onto the claim engine's answer shape, so a claim opens pre-filled. */
  function claimAnswers(trip) {
    // Map only what the trip actually records. Answers that decide the money but that the user never
    // gave (how late, whether a report was filed, the size of a schedule change) are left for the
    // wizard to ask — an entitlement must never be computed from an assumed answer.
    const a = { type: trip.issue };
    if (trip.region) a.region = trip.region;
    if (trip.payment) a.payment = trip.payment;
    const date = trip.issueDate || trip.departDate;
    if (date) a.incidentDate = date;
    if (trip.issue === 'cancelled' && trip.traveled) a.traveled = trip.traveled;
    if (trip.issue === 'schedule') {
      if (trip.schedDelta) a.schedDelta = trip.schedDelta;
      if (trip.schedAccepted) a.schedAccepted = trip.schedAccepted;
      if (trip.schedDirection) a.schedDirection = trip.schedDirection;
      if (trip.departDate) a.flightDate = trip.departDate;
    }
    if (trip.issue === 'bumped') {
      if (trip.voluntary) a.voluntary = trip.voluntary;
      // "What you paid" is usually a round-trip total; it is the one-way fare only on a one-way booking.
      if (Number(trip.fare) > 0 && !trip.returnDate) a.fareOneWay = Number(trip.fare);
    }
    if ((trip.issue === 'bumped' || trip.issue === 'delayed') && trip.arrDelay) a.arrDelay = trip.arrDelay;
    if (trip.issue === 'bag_late') {
      if (trip.bagHours) a.bagHours = trip.bagHours;
      if (trip.reportFiled) a.reportFiled = trip.reportFiled;
    }
    if ((trip.region === 'from_eu' || trip.region === 'from_uk') && trip.distanceBand) a.distanceBand = trip.distanceBand;
    return a;
  }

  /** Prefill for the "File it" details block. */
  function claimDetails(trip) {
    return {
      airline: trip.airline || '',
      flightNo: trip.flightNo || '',
      origin: trip.origin || '',
      dest: trip.dest || '',
      confirmation: trip.confirmation || '',
      name: trip.name || '',
      email: trip.email || '',
    };
  }

  /**
   * Money still claimable across every saved trip.
   * Deliberately split: `confirmed` counts only entitlements we can actually quantify AND that
   * aren't conditional; `potential` holds conditional cash (EU261 etc., which depends on the cause)
   * and liability CEILINGS (lost-bag caps are "up to", not "owed"). Never inflate the headline.
   */
  function moneyOnTable() {
    let confirmed = 0, potential = 0, tripsWithClaims = 0, unquantified = 0, incomplete = 0;
    const foreign = []; // €/£/CAD amounts — never summed into a USD total, but never dropped either
    for (const t of all()) {
      if (!t.issue || t.issue === 'none' || !window.ClaimEngine) continue;
      const open = deadlines(t).some((d) => d.status !== 'expired');
      if (!open) continue;
      let counted = false;
      const answers = claimAnswers(t);
      // Unanswered money questions mean no figure yet: counted separately, never priced as $0.
      if (window.ClaimEngine.nextQuestion(answers)) { incomplete++; continue; }
      try {
        const res = window.ClaimEngine.assess(answers);
        for (const e of res.entitlements) {
          if (e.strength !== 'strong' && e.strength !== 'conditional') continue;
          const ceiling = /^(Up to|Your provable loss)/i.test(e.amountText || '');
          const n = firstUsd(e.amountText);
          if (n != null && !ceiling) {
            if (e.strength === 'strong') confirmed += n; else potential += n;
            counted = true;
          } else if (!ceiling && foreignAmount(e.amountText)) {
            foreign.push(foreignAmount(e.amountText));
            counted = true;
          } else if (e.strength === 'strong') {
            // e.g. "100% of what you paid" — use the fare if we know it, else flag as unquantified.
            const fare = Number(t.fare) || 0;
            if (/100% of what you paid/i.test(e.amountText || '') && fare > 0) { confirmed += fare; counted = true; }
            else unquantified++;
          }
        }
      } catch { /* a malformed trip shouldn't break the dashboard */ }
      if (counted) tripsWithClaims++;
    }
    const next = upcoming()[0] || null;
    return { confirmed: Math.round(confirmed), potential: Math.round(potential), tripsWithClaims, unquantified, incomplete, foreign, next };
  }

  // Only USD figures are summable; €/£/CAD are surfaced separately rather than silently dropped.
  function firstUsd(text) {
    const m = String(text || '').match(/\$([\d,]+)/);
    return m ? Number(m[1].replace(/,/g, '')) : null;
  }
  function foreignAmount(text) {
    const m = String(text || '').match(/(€\s?[\d,]+|£\s?[\d,]+|CAD\s?[\d,]+(?:\s*\/\s*[\d,]+)*)/);
    return m ? m[1].trim() : null;
  }

  // ---------- flight-number intelligence ----------
  // "DL1234" -> Delta. Saves typing and makes the filing route (email vs web form) automatic.
  const IATA_TO_NAME = {
    DL: 'Delta Air Lines', UA: 'United Airlines', AA: 'American Airlines', WN: 'Southwest Airlines',
    AS: 'Alaska Airlines', B6: 'JetBlue Airways', F9: 'Frontier Airlines', NK: 'Spirit Airlines',
    HA: 'Hawaiian Airlines', G4: 'Allegiant Air',
  };
  function airlineFromFlightNo(fn) {
    const m = String(fn || '').trim().toUpperCase().match(/^([A-Z][A-Z0-9])\s*\d{1,4}$/);
    if (!m) return null;
    return IATA_TO_NAME[m[1]] || null;
  }

  /**
   * Fare-drop check for a saved trip. Most carriers dropped change fees, so if the same trip is
   * cheaper now you can often rebook and keep the difference (usually as travel credit).
   * Returns { current, paid, drop, canRebook } or { error } / { unavailable }.
   */
  async function checkFare(trip) {
    if (!trip.origin || !trip.dest || !trip.departDate) return { unavailable: 'Add the route and flight date first.' };
    const paid = Number(trip.fare) || null;
    try {
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: trip.origin, destination: trip.dest, departDate: trip.departDate, returnDate: trip.returnDate || '', tier: 'platinum' }),
      });
      if (!res.ok) return { error: `Price check failed (${res.status}).` };
      const data = await res.json();
      if (data.error) return { error: String(data.error) };
      const offers = Array.isArray(data.offers) ? data.offers : [];
      if (!offers.length) return { error: data.blocked ? 'Couldn’t check right now — the free price source is rate-limited. Try again in a minute.' : 'No fares found for that route/date.' };
      const current = Math.min(...offers.map((o) => (o.price && o.price.total) || Infinity).filter((n) => isFinite(n)));
      if (!isFinite(current)) return { error: 'No usable price returned.' };
      const drop = paid ? Math.round(paid - current) : null;
      return { current: Math.round(current), paid, drop, checked: today() };
    } catch (e) {
      return { error: 'Couldn’t reach the price service.' };
    }
  }

  // ---------- the watchdog: server-side automatic re-checks ----------
  // Register a trip so the SERVER re-checks it on a schedule and turns changes into money levers
  // (fare drops -> rebook; schedule shifts -> free change or cash refund). Fire-and-forget: if the
  // server isn't reachable the trip is still saved locally and manual checks still work.
  async function watch(trip) {
    if (!trip.origin || !trip.dest || !trip.departDate) return null;
    try {
      const res = await fetch('/api/watch', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        // What identifies THE booking: the flight number typed, what was paid, and — for a trip saved from a
        // search result — that result's exact itinerary. Without them the watchdog can only name the route.
        body: JSON.stringify({ id: trip.id, origin: trip.origin, destination: trip.dest, departDate: trip.departDate, returnDate: trip.returnDate || '', tier: 'platinum', airline: trip.airline || '', flightNo: trip.flightNo || '', fare: trip.fare || '', itinerary: trip.itinerary || null }),
      });
      if (!res.ok) return null;
      const w = await res.json();
      update(trip.id, { watched: true, watchId: w.id });
      return w;
    } catch { return null; }
  }
  async function unwatch(trip) {
    try { await fetch('/api/watch/' + encodeURIComponent(trip.watchId || trip.id), { method: 'DELETE' }); } catch {}
    update(trip.id, { watched: false });
  }
  /** Fetch alerts for every watched trip in one round-trip. Returns { byTripId, summary }. */
  async function pullAlerts() {
    const ids = all().filter((t) => t.watched).map((t) => t.watchId || t.id);
    if (!ids.length) return { byTripId: {}, summary: { watches: 0, unseen: 0, moneyFound: 0 } };
    try {
      // Only this device's own watches.
      const res = await fetch('/api/watch?ids=' + encodeURIComponent(ids.join(',')));
      if (!res.ok) return { byTripId: {}, summary: null };
      const data = await res.json();
      const byTripId = {};
      for (const w of data.watches || []) byTripId[w.id] = w;
      return { byTripId, summary: data.summary || null };
    } catch { return { byTripId: {}, summary: null }; }
  }
  /** Re-register upcoming watched trips the server no longer has (a free host wipes its disk when it sleeps or
   *  redeploys) or that were registered before it knew which flight was booked. Safe to repeat: a registration
   *  is keyed on the trip id. Returns how many were re-sent. */
  async function resync(byTripId) {
    const lost = all().filter((t) => {
      if (!t.watched || !t.origin || !t.dest || !t.departDate || t.departDate < today()) return false;
      const w = byTripId[t.watchId || t.id];
      return !w || !w.booking;
    });
    for (const t of lost) await watch(t);
    return lost.length;
  }
  async function ackAlerts(trip) {
    try { await fetch('/api/watch/' + encodeURIComponent(trip.watchId || trip.id) + '/ack', { method: 'POST' }); } catch {}
  }

  return { all, add, update, remove, deadlines, upcoming, atStake, claimAnswers, claimDetails, fmt, today, daysBetween, airlineFromFlightNo, checkFare, moneyOnTable, watch, unwatch, pullAlerts, resync, ackAlerts };
})();
