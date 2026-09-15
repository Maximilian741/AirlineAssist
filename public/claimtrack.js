// claimtrack.js — the claim tracker: what happens AFTER you hit send.
//
// THE PROBLEM THIS SOLVES: filing is the easy part. Airlines win by attrition — you file, they go
// quiet, weeks pass, you forget or give up. "Auto-submit" that just fires and forgets is worthless.
// What actually gets results is never losing the thread: every filing on the record, every response
// deadline tracked, and the NEXT escalation ready to fire the day the airline misses its clock.
//
// The clocks are the airline's legal obligations, not our guesses:
//   * Written complaint -> airline must ACKNOWLEDGE within 30 days and give a SUBSTANTIVE written
//     response within 60 days (14 CFR 259.7(c)); disability complaints 30 days (14 CFR 382.155).
//   * Refund owed -> 7 business days (card) / 20 calendar days (other) (14 CFR 260.10).
//   * Involuntary bumping cash -> same day at the airport, or mailed within 24h (14 CFR 250.8).
//   * EU261: no statutory reply clock, but National Enforcement Bodies expect ~6-8 weeks before
//     escalation; UK261: 8 weeks then ADR/CAA (UK CAA guidance); Canada APPR: 30 days (s.19(4)).
//   * Card chargeback: dispute must ARRIVE within 60 days of the statement (FCBA 15 USC 1666).
// Each stage records what was filed, when, and what the airline is now legally on the hook to do.
// Storage is localStorage on this device only.

window.ClaimTrack = (function () {
  'use strict';

  const KEY = 'ff-claims';

  function all() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(v) ? v : []; } catch { return []; }
  }
  function save(list) { localStorage.setItem(KEY, JSON.stringify(list)); }
  function today() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; }
  function addDays(d, n) {
    const x = new Date(d + 'T12:00:00'); if (isNaN(x.getTime())) return null;
    x.setDate(x.getDate() + n); return x.toISOString().slice(0, 10);
  }
  // Business days: skip Sat/Sun (federal holidays ignored — conservative, we err slightly early).
  function addBusinessDays(d, n) {
    const x = new Date(d + 'T12:00:00'); if (isNaN(x.getTime())) return null;
    let left = n;
    while (left > 0) { x.setDate(x.getDate() + 1); const dow = x.getDay(); if (dow !== 0 && dow !== 6) left--; }
    return x.toISOString().slice(0, 10);
  }
  function daysBetween(a, b) {
    const x = new Date(a + 'T12:00:00'), y = new Date(b + 'T12:00:00');
    if (isNaN(x) || isNaN(y)) return null;
    return Math.round((y - x) / 86400000);
  }
  function fmt(d) { const x = new Date(d + 'T12:00:00'); return isNaN(x) ? '' : x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }

  /**
   * The escalation ladder as data. Each stage knows the legal clock it starts and which stage
   * unlocks when that clock runs out. `channel` values map to the filing buttons in the app.
   */
  const STAGES = {
    airline: {
      label: 'Filed with the airline',
      channel: 'file-email',
      clocks: (a, d) => {
        const c = [];
        // Response clock (14 CFR 259.7(c)); disability complaints get the shorter 30-day clock.
        c.push({ key: 'ack', label: 'Airline must acknowledge in writing', due: (f) => addDays(f, 30), rule: '14 CFR 259.7(c)' });
        c.push({ key: 'answer', label: 'Airline must give a substantive written answer', due: (f) => addDays(f, 60), rule: '14 CFR 259.7(c)' });
        // Refund clock when money is owed back.
        if (['cancelled', 'schedule', 'extra', 'bag_late'].includes(a.type) || (a.type === 'downgrade' && a.downgradeFlew === 'no')) {
          const card = a.payment !== 'other';
          c.push({ key: 'refund', label: card ? 'Refund due (7 business days, credit card)' : 'Refund due (20 calendar days)', due: (f) => (card ? addBusinessDays(f, 7) : addDays(f, 20)), rule: '14 CFR 260.10' });
        }
        if (a.type === 'bumped') {
          c.push({ key: 'bump', label: 'Bumping compensation was due at the airport (or mailed within 24h)', due: (f) => addDays(f, 1), rule: '14 CFR 250.8' });
        }
        // International regimes have their own escalation windows.
        if (a.region === 'canada') c.push({ key: 'appr', label: 'Airline must pay or explain (Canada APPR)', due: (f) => addDays(f, 30), rule: 'APPR s.19(4)' });
        if (a.region === 'from_uk') c.push({ key: 'uk8w', label: 'After 8 weeks: escalate to ADR / the CAA', due: (f) => addDays(f, 56), rule: 'UK CAA guidance' });
        if (a.region === 'from_eu') c.push({ key: 'eu6w', label: 'After ~6 weeks with no result: escalate to the national enforcement body', due: (f) => addDays(f, 42), rule: 'EC guidance' });
        return c;
      },
      next: ['dot', 'chargeback'],
    },
    dot: {
      label: 'DOT complaint filed',
      channel: 'file-dot',
      clocks: () => [
        { key: 'dotack', label: 'Airline must acknowledge the DOT-forwarded complaint', due: (f) => addDays(f, 30), rule: '14 CFR 259.7(c)' },
        { key: 'dotanswer', label: 'Airline must respond in writing (DOT tracks this)', due: (f) => addDays(f, 60), rule: '14 CFR 259.7(c)' },
      ],
      next: ['smallclaims'],
    },
    chargeback: {
      label: 'Credit-card dispute filed',
      channel: 'file-charge',
      clocks: () => [
        { key: 'cbAck', label: 'Card issuer must acknowledge your dispute', due: (f) => addDays(f, 30), rule: 'FCBA / Reg Z 1026.13' },
        { key: 'cbResolve', label: 'Issuer must resolve (2 billing cycles, max 90 days)', due: (f) => addDays(f, 90), rule: 'FCBA / Reg Z 1026.13' },
      ],
      next: [],
    },
    smallclaims: {
      label: 'Final notice sent',
      channel: 'esc-notice',
      clocks: () => [
        { key: 'notice', label: 'Your stated deadline before you file in small claims', due: (f) => addDays(f, 14), rule: 'Your notice letter' },
      ],
      next: [],
    },
  };

  /** Create a tracked claim from a finished wizard result. */
  function start(answers, details, result) {
    const list = all();
    // Only a figure the entitlement leads with is a demandable amount; "up to $4,700" is a ceiling, not a debt.
    const lead = (t) => { const m = String(t || '').match(/^\s*(\$[\d,]+|€\s?[\d,]+|£\s?[\d,]+|CAD\s?[\d,]+)(?![\d,]|\s*\/)/); return m ? m[1].replace(/\s+/g, ' ').trim() : ''; };
    const cash = (result.entitlements || []).find((e) => e.strength === 'strong' && lead(e.amountText));
    const c = {
      id: 'cl' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
      created: today(),
      answers, details,
      headline: result.headline || '',
      amount: cash ? lead(cash.amountText) : '',
      filings: [], // { stage, date, note }
      status: 'open', // open | paid | denied | dropped
      outcome: null,
    };
    list.push(c);
    save(list);
    return c;
  }
  function get(id) { return all().find((c) => c.id === id) || null; }
  function update(id, patch) {
    const list = all(); const i = list.findIndex((c) => c.id === id);
    if (i < 0) return null;
    list[i] = { ...list[i], ...patch }; save(list); return list[i];
  }
  function remove(id) { save(all().filter((c) => c.id !== id)); }

  /** Record that a filing happened through a channel. Idempotent per stage per day. */
  function recordFiling(id, stage, note) {
    const c = get(id); if (!c || !STAGES[stage]) return null;
    const d = today();
    if (c.filings.some((f) => f.stage === stage && f.date === d)) return c;
    c.filings.push({ stage, date: d, note: note || '' });
    return update(id, { filings: c.filings });
  }
  function markOutcome(id, status, note) {
    return update(id, { status, outcome: { date: today(), note: note || '' } });
  }

  /**
   * The live picture: for each filing, the clocks it started and their status; plus what to do next.
   * status: waiting | due-soon | overdue
   */
  function timeline(c) {
    const now = today();
    const items = [];
    for (const f of c.filings) {
      const stage = STAGES[f.stage]; if (!stage) continue;
      for (const clock of stage.clocks(c.answers || {}, c.details || {})) {
        const due = clock.due(f.date);
        if (!due) continue;
        const left = daysBetween(now, due);
        items.push({
          stage: f.stage, stageLabel: stage.label, filedOn: f.date,
          key: clock.key, label: clock.label, rule: clock.rule, due, daysLeft: left,
          status: left < 0 ? 'overdue' : left <= 5 ? 'due-soon' : 'waiting',
        });
      }
    }
    items.sort((x, y) => x.daysLeft - y.daysLeft);
    return items;
  }

  /** What the user should do right now, in plain language, with the channel to fire. */
  function nextAction(c) {
    if (c.status !== 'open') return { kind: 'closed', text: c.status === 'paid' ? 'Paid. Nice.' : c.status === 'denied' ? 'Denied — you can still escalate.' : 'Closed.' };
    const filed = new Set(c.filings.map((f) => f.stage));
    const tl = timeline(c);
    if (!filed.has('airline')) {
      return { kind: 'file', channel: 'file-email', text: 'Step 1: send the demand letter to the airline. That starts their legal clock.' };
    }
    const overdue = tl.filter((t) => t.status === 'overdue');
    const answerOverdue = overdue.find((t) => t.key === 'answer' || t.key === 'refund' || t.key === 'bump' || t.key === 'appr' || t.key === 'uk8w' || t.key === 'eu6w');
    if (answerOverdue && !filed.has('dot')) {
      return {
        kind: 'escalate', channel: 'file-dot',
        text: `The airline blew its deadline (${answerOverdue.label.toLowerCase()} — due ${fmt(answerOverdue.due)}). File the DOT complaint now: it goes on their record and DOT tracks their response.`,
        reason: answerOverdue,
      };
    }
    // Small claims outranks the chargeback once DOT has also been ignored — and the FCBA
    // chargeback window (~60 days from the statement) is realistically closed by then anyway.
    if (filed.has('dot') && !filed.has('smallclaims') && overdue.some((t) => t.key === 'dotanswer')) {
      return { kind: 'escalate', channel: 'esc-notice', text: 'They ignored the DOT complaint too. Send the final notice before small claims — this is the letter that usually gets paid.' };
    }
    // The chargeback is a parallel lever with its own hard clock: only offer it while it can still land.
    const cb = tl.find((t) => t.key === 'refund' && t.status === 'overdue');
    const firstFiling = c.filings.map((f) => f.date).sort()[0];
    const cbWindowOpen = firstFiling ? daysBetween(firstFiling, today()) <= 60 : true;
    if (cb && !filed.has('chargeback') && (c.answers || {}).payment !== 'other' && cbWindowOpen) {
      return { kind: 'escalate', channel: 'file-charge', text: 'Refund past due and you paid by card — dispute the charge with your bank now (the FCBA 60-day window is running).' };
    }
    const soon = tl.find((t) => t.status !== 'overdue');
    if (soon) return { kind: 'wait', text: `Waiting on the airline. Next clock: ${soon.label.toLowerCase()} by ${fmt(soon.due)} (${soon.daysLeft} day${soon.daysLeft === 1 ? '' : 's'}).`, until: soon };
    return { kind: 'wait', text: 'All clocks have run. If you have not been paid, escalate.' };
  }

  /** Cross-claim summary for the vault / home. */
  function summary() {
    const list = all();
    const open = list.filter((c) => c.status === 'open');
    let overdue = 0, actionable = 0;
    for (const c of open) {
      const na = nextAction(c);
      if (na.kind === 'escalate' || na.kind === 'file') actionable++;
      if (timeline(c).some((t) => t.status === 'overdue')) overdue++;
    }
    return { total: list.length, open: open.length, paid: list.filter((c) => c.status === 'paid').length, overdue, actionable };
  }

  return { all, get, start, update, remove, recordFiling, markOutcome, timeline, nextAction, summary, STAGES, fmt, today };
})();
