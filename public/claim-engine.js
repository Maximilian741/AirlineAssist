// claim-engine.js — "What am I owed?" calculator + demand-letter / DOT-complaint generator.
//
// Pure, offline logic over the SAME verified federal/international rules as rights-data.js.
// No network, no API key. Given a few plain-language answers it returns the exact entitlements
// (amounts + legal citation + deadline) and generates a ready-to-send demand letter and DOT
// complaint text. Numbers verified mid-2026 (see rights-data.js sources). Not legal advice.

window.ClaimEngine = (function () {
  'use strict';

  const DB_CAP_200 = 1075; // 14 CFR 250.5 — 200% tier cap (eff. Jan 22 2025)
  const DB_CAP_400 = 2150; // 14 CFR 250.5 — 400% tier cap
  const BAG_DOMESTIC = 4700; // 14 CFR 254.4 (eff. Jan 22 2025)

  const URL = {
    refund: 'https://www.law.cornell.edu/cfr/text/14/260.10',
    bump: 'https://www.law.cornell.edu/cfr/text/14/250.5',
    tarmac: 'https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-259/section-259.4',
    bag254: 'https://www.law.cornell.edu/cfr/text/14/254.4',
    bag260: 'https://www.ecfr.gov/current/title-14/chapter-II/subchapter-A/part-260',
    eu261: 'https://eur-lex.europa.eu/legal-content/EN/TXT/HTML/?uri=CELEX:32004R0261',
    uk261: 'https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/delays/',
    appr: 'https://otc-cta.gc.ca/eng/air-passenger-protection-regulations-highlights',
    dashboard: 'https://www.transportation.gov/airconsumer/airline-customer-service-dashboard',
    dot: 'https://www.transportation.gov/airconsumer/file-consumer-complaint',
  };

  const usd = (n) => (n == null ? null : '$' + Math.round(n).toLocaleString('en-US'));

  // ---- the question flow (engine-owned so the UI stays thin and stays in sync) ----
  const REGION_OPTS = [
    { value: 'us', label: 'Within the United States' },
    { value: 'intl_from_us', label: 'International, leaving the U.S.' },
    { value: 'from_eu', label: 'Leaving the European Union' },
    { value: 'from_uk', label: 'Leaving the United Kingdom' },
    { value: 'canada', label: 'To or from Canada' },
  ];
  const DELAY_OPTS = [
    { value: '<1', label: 'Under 1 hour' },
    { value: '1-2', label: '1 to 2 hours' },
    { value: '2-3', label: '2 to 3 hours' },
    { value: '3-4', label: '3 to 4 hours' },
    { value: '4-6', label: '4 to 6 hours' },
    { value: '6-9', label: '6 to 9 hours' },
    { value: '9+', label: '9 hours or more' },
  ];

  const FLOW = [
    {
      id: 'type',
      when: () => true,
      q: {
        title: 'What went wrong?',
        kind: 'choice',
        options: [
          { value: 'cancelled', label: 'My flight was canceled' },
          { value: 'schedule', label: 'The airline changed my flight time or route before the trip' },
          { value: 'delayed', label: 'My flight was very late (I still flew)' },
          { value: 'bumped', label: 'I was bumped from an oversold flight' },
          { value: 'bag_late', label: 'My checked bag arrived late' },
          { value: 'bag_lost', label: 'My checked bag was lost or damaged' },
          { value: 'downgrade', label: 'I was downgraded to a lower class' },
          { value: 'extra', label: 'I paid for something I didn’t get (Wi-Fi, seat…)' },
        ],
      },
    },
    {
      id: 'traveled',
      when: (a) => a.type === 'cancelled',
      q: {
        title: 'Did you still take the trip?',
        kind: 'choice',
        options: [
          { value: 'no', label: 'No — I gave up and didn’t fly' },
          { value: 'yes', label: 'Yes — they rebooked me and I flew' },
        ],
      },
    },
    {
      id: 'schedDelta',
      when: (a) => a.type === 'schedule',
      q: {
        title: 'How big was the change?',
        help: 'How much later you now arrive (or earlier you now leave). If they added a stop or moved you to a different airport, pick that.',
        kind: 'choice',
        options: [
          { value: '<1', label: 'Under 1 hour' },
          { value: '1-2', label: '1 to under 2 hours' },
          { value: '2-3', label: '2 to under 3 hours' },
          { value: '3-4', label: '3 to under 4 hours' },
          { value: '4-6', label: '4 to under 6 hours' },
          { value: '6+', label: '6 hours or more' },
          { value: 'route', label: 'They added a connection or changed my departure/arrival airport' },
        ],
      },
    },
    {
      id: 'schedAccepted',
      when: (a) => a.type === 'schedule',
      q: {
        title: 'Do you want to keep the new flight?',
        help: 'The cash refund exists only if you decline the change. Say no here and the letter declines it for you.',
        kind: 'choice',
        options: [
          { value: 'no', label: 'No — I want my money back' },
          { value: 'yes', label: 'Yes — I’ll fly it (or already flew it)' },
        ],
      },
    },
    {
      id: 'region',
      when: (a) => a.type && a.type !== 'extra',
      q: { title: 'Where was the flight?', kind: 'choice', options: REGION_OPTS },
    },
    {
      id: 'schedDirection',
      when: (a) => a.type === 'schedule' && (a.region === 'from_eu' || a.region === 'from_uk') && a.schedDelta !== 'route',
      q: {
        title: 'Which way did it move?',
        help: 'In Europe and the UK the two are treated differently: a later arrival is a “delay,” an earlier departure counts as a cancellation.',
        kind: 'choice',
        options: [
          { value: 'later', label: 'I now arrive later' },
          { value: 'earlier', label: 'I now leave earlier' },
        ],
      },
    },
    {
      id: 'schedNotice',
      when: (a) => a.type === 'schedule' && (a.region === 'from_eu' || a.region === 'from_uk') && (a.schedDelta === 'route' || a.schedDirection === 'earlier'),
      q: {
        title: 'How far ahead did they tell you?',
        help: 'An earlier departure counts as a cancellation in Europe and the UK — and short notice is what makes it compensable.',
        kind: 'choice',
        options: [
          { value: '14+', label: '14 days or more before departure' },
          { value: '7-13', label: '7 to 13 days before' },
          { value: '<7', label: 'Less than 7 days before' },
        ],
      },
    },
    {
      id: 'voluntary',
      when: (a) => a.type === 'bumped',
      q: {
        title: 'Did you volunteer to give up your seat?',
        kind: 'choice',
        options: [
          { value: 'no', label: 'No — they forced me off' },
          { value: 'yes', label: 'Yes — I volunteered' },
        ],
      },
    },
    {
      id: 'fareOneWay',
      when: (a) => a.type === 'bumped' && a.voluntary === 'no',
      q: { title: 'What did your one-way ticket cost?', help: 'Just your fare, one direction. A rough number is fine.', kind: 'money' },
    },
    {
      id: 'arrDelay',
      when: (a) => a.type === 'delayed' || (a.type === 'bumped' && a.voluntary === 'no'),
      q: { title: 'How late did you reach your destination?', kind: 'choice', options: DELAY_OPTS },
    },
    {
      id: 'distanceBand',
      when: (a) => (a.region === 'from_eu' || a.region === 'from_uk') && ['cancelled', 'delayed', 'bumped', 'downgrade', 'schedule'].includes(a.type),
      q: {
        title: 'How long was the flight?',
        help: 'A flight between Europe and the U.S. is “long.”',
        kind: 'choice',
        options: [
          { value: 'short', label: 'Short (under ~930 miles / 1,500 km)' },
          { value: 'medium', label: 'Medium (~930–2,175 miles)' },
          { value: 'long', label: 'Long (over ~2,175 miles — e.g. Europe ⇄ U.S.)' },
        ],
      },
    },
    {
      id: 'bagHours',
      when: (a) => a.type === 'bag_late',
      q: {
        title: 'How long after landing did the bag show up?',
        kind: 'choice',
        options: [
          { value: 'lt12', label: 'Less than 12 hours' },
          { value: '12-15', label: '12 to 15 hours' },
          { value: '15-30', label: '15 to 30 hours' },
          { value: '30+', label: 'More than 30 hours' },
          { value: 'missing', label: 'It’s still missing' },
        ],
      },
    },
    {
      id: 'reportFiled',
      when: (a) => a.type === 'bag_late',
      q: {
        title: 'Did you file a delayed/lost-bag report at the airport?',
        help: 'This is required to get the bag fee refunded.',
        kind: 'choice',
        options: [
          { value: 'yes', label: 'Yes' },
          { value: 'no', label: 'No / not sure' },
        ],
      },
    },
    {
      id: 'payment',
      when: (a) => a.type === 'extra' || a.type === 'downgrade' || a.type === 'bag_late' || (a.type === 'cancelled' && a.traveled === 'no') || (a.type === 'schedule' && a.schedAccepted === 'no'),
      q: {
        title: 'How did you pay?',
        help: 'This sets how fast they must refund you.',
        kind: 'choice',
        options: [
          { value: 'credit', label: 'Credit card' },
          { value: 'other', label: 'Debit, cash, or check' },
        ],
      },
    },
    {
      id: 'incidentDate',
      when: (a) => !!a.type,
      q: { title: 'When did this happen?', help: 'Used to work out your filing deadlines.', kind: 'date' },
    },
  ];

  function nextQuestion(answers) {
    for (const step of FLOW) {
      if (step.when(answers) && answers[step.id] === undefined) return { id: step.id, ...step.q };
    }
    return null;
  }

  // ---- amount helpers ----
  const euAmount = (band) => (band === 'long' ? 600 : band === 'medium' ? 400 : 250);
  const ukAmount = (band, delay) => (band === 'long' ? (delay === '3-4' ? 260 : 520) : band === 'medium' ? 350 : 220);
  const apprAmount = (delay) => (delay === '9+' ? 1000 : delay === '6-9' ? 700 : 400); // large airline delay, 3–6/6–9/9+
  const apprDeniedBoarding = (d) => (d === '9+' ? 2400 : d === '6-9' ? 1800 : d ? 900 : null); // 900/1,800/2,400 by delay
  const delayAtLeast3 = (d) => ['3-4', '4-6', '6-9', '9+'].includes(d);

  function bumpResult(region, band, fare) {
    const intl = region !== 'us';
    const tier400 = intl ? ['4-6', '6-9', '9+'] : ['2-3', '3-4', '4-6', '6-9', '9+'];
    const tier200 = intl ? ['1-2', '2-3', '3-4'] : ['1-2'];
    if (band === '<1') return { pct: 0, amt: 0, cap: 0 };
    if (tier200.includes(band)) return { pct: 200, amt: fare ? Math.min(2 * fare, DB_CAP_200) : null, cap: DB_CAP_200 };
    if (tier400.includes(band)) return { pct: 400, amt: fare ? Math.min(4 * fare, DB_CAP_400) : null, cap: DB_CAP_400 };
    return { pct: 0, amt: 0, cap: 0 };
  }

  function addDays(dateStr, n) {
    if (!dateStr) return null;
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d)) return null;
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  }

  // ---- the core assessment ----
  function assess(a) {
    const E = [];
    const region = a.region;
    const intl = region && region !== 'us';

    const refundDeadline = a.payment === 'other' ? 'within 20 calendar days of your request' : 'within 7 business days of your request';

    if (a.type === 'cancelled') {
      if (a.traveled === 'no') {
        E.push({
          strength: 'strong',
          title: 'A full cash refund of your fare',
          amountText: '100% of what you paid — fare, taxes, and any add-on fees',
          detail: 'Because the airline canceled and you chose not to fly, they must refund you automatically — to your original form of payment, NOT a voucher.',
          rule: '14 CFR Part 260 (DOT refund rule)',
          ruleUrl: URL.refund,
          deadline: 'They must pay ' + refundDeadline + '.',
        });
      } else {
        E.push({
          strength: 'info',
          title: 'Rebooking at no extra cost',
          amountText: 'No additional charge',
          detail: 'You flew, so a fare refund generally doesn’t apply — but the airline cannot charge you more for the replacement flight.',
          rule: '14 CFR Part 260',
          ruleUrl: URL.refund,
          deadline: '',
        });
      }
      addIntlComp(E, a, 'cancellation');
      addAmenities(E, a);
    }

    if (a.type === 'schedule') {
      const sig = scheduleIsSignificant(a);
      const declined = a.schedAccepted === 'no';
      if (sig && declined) {
        const usTouching = a.region === 'us' || a.region === 'intl_from_us';
        E.push({
          strength: usTouching ? 'strong' : 'conditional',
          title: 'A full cash refund of your fare',
          amountText: '100% of what you paid — fare, taxes, and any add-on fees — even on a nonrefundable or basic economy ticket',
          detail: 'A change this large is a “significant change” under the federal refund rule. If you decline the new itinerary, the airline must refund you to your original form of payment — not a voucher, not a credit. The size of the change is the whole test; the fare type does not matter.' + (usTouching ? '' : ' The U.S. rule covers flights to, from or within the United States; a trip that never touches the U.S. gets its refund under EU261 Art. 8 / UK261 / Canada APPR instead — same idea, different citation.'),
          ...(usTouching ? {} : { condition: 'under U.S. law only if the trip starts or ends in the United States (14 CFR 260.2 “covered flight”)' }),
          rule: '14 CFR 260.2 & 260.6',
          ruleUrl: URL.refund,
          deadline: 'They must pay ' + refundDeadline + '.',
        });
      } else if (sig && !declined) {
        E.push({
          strength: 'info',
          title: 'You kept the new flight — so the refund right does not apply',
          amountText: 'No cash owed for the change itself',
          detail: 'The federal refund exists only when you DECLINE a significant change. Keeping the flight is fine — but you gave up the refund. What you still have: the change is your leverage to be moved, free, to any flight you would rather take (ask by flight number), and any prepaid extra that no longer applies (a seat you lost, for instance) is refundable.',
          rule: '14 CFR 260.2 & 260.6',
          ruleUrl: URL.refund,
          deadline: '',
        });
      } else {
        E.push({
          strength: 'action',
          title: 'Below the federal line — but probably above the airline’s own',
          amountText: 'Free rebooking to a flight you prefer',
          detail: (a.region === 'us' ? 'The federal refund right needs a 3-hour change (or a new airport / added stop). ' : 'The federal refund right needs a 6-hour change on international trips (or a new airport / added stop). ') +
            'Below that, most carriers’ contracts of carriage still unlock a free change once a schedule moves past their own trigger — United 30 min, Alaska/Southwest 60, Delta 120, American 240. Look yours up in the contract decoder, then ask by flight number for the flight you actually want.',
          rule: 'Airline contract of carriage',
          ruleUrl: '',
          deadline: '',
        });
      }
      addScheduleIntl(E, a);
    }

    if (a.type === 'delayed') {
      E.push({
        strength: 'info',
        title: 'Heads up: U.S. law gives no cash for a delay by itself',
        amountText: '—',
        detail: 'Unlike Europe, there is no U.S. federal cash payment just for a late flight. But you may still be owed the items below — and if any prepaid extra (seat, Wi-Fi) went unused, that’s refundable.',
        rule: '—',
        ruleUrl: '',
        deadline: '',
      });
      addAmenities(E, a);
      addIntlComp(E, a, 'delay');
    }

    if (a.type === 'bumped') {
      if (a.voluntary === 'yes') {
        E.push({
          strength: 'info',
          title: 'You volunteered — it’s a negotiation, no legal minimum',
          amountText: 'Whatever you agreed to',
          detail: 'Voluntary bumps have no set amount. Next time, haggle: ask the cash value, an expiry-free voucher, plus meals and a hotel for overnight delays.',
          rule: '14 CFR 250.2b',
          ruleUrl: URL.bump,
          deadline: '',
        });
      } else {
        const r = bumpResult(region, a.arrDelay, Number(a.fareOneWay) || 0);
        if (r.pct === 0) {
          E.push({
            strength: 'info',
            title: 'Likely no bumping payment',
            amountText: '$0',
            detail: 'If the airline got you to your destination within about an hour of the original arrival, no compensation is required.',
            rule: '14 CFR 250.5',
            ruleUrl: URL.bump,
            deadline: '',
          });
        } else {
          E.push({
            strength: 'strong',
            title: 'Cash for being forced off an oversold flight',
            amountText: r.amt != null
              ? usd(r.amt) + ` (${r.pct}% of your one-way fare, capped at ${usd(r.cap)})`
              : `${r.pct}% of your one-way fare, up to ${usd(r.cap)}`,
            detail: 'This is the ' + r.pct + '% tier. They must pay in CASH or a check — you do not have to accept a voucher. Insist on the check at the gate.',
            rule: '14 CFR 250.5 & 250.8',
            ruleUrl: URL.bump,
            deadline: 'Paid the same day at the airport (or mailed within 24 hours).',
          });
        }
      }
      addIntlComp(E, a, 'denied_boarding');
    }

    if (a.type === 'bag_late') {
      const thr = region === 'us' ? 'lt12' : null;
      const pastThreshold =
        region === 'us'
          ? ['12-15', '15-30', '30+', 'missing'].includes(a.bagHours)
          : ['15-30', '30+', 'missing'].includes(a.bagHours); // intl ~15h (shorter legs) / 30h (long)
      if (pastThreshold) {
        E.push({
          strength: a.reportFiled === 'yes' ? 'strong' : 'conditional',
          title: 'Refund of your checked-bag fee',
          amountText: 'The full bag fee you paid',
          condition: a.reportFiled === 'yes' ? undefined : 'only if you filed a Mishandled Baggage Report at the airport',
          detail:
            (region === 'us' ? 'Domestic bags delivered more than 12 hours after landing count as significantly delayed. ' : 'International bags past the 15- or 30-hour mark count as significantly delayed. ') +
            (a.reportFiled === 'yes'
              ? 'You filed a report, so you qualify.'
              : 'IMPORTANT: this refund only applies if you filed a Mishandled Baggage Report at the airport. If you didn’t, you may have lost this one.'),
          rule: '14 CFR Part 260',
          ruleUrl: URL.bag260,
          deadline: 'They must pay ' + refundDeadline + '.',
        });
      }
      if (a.bagHours === 'missing') {
        addLostBag(E, region);
      }
    }

    if (a.type === 'bag_lost') addLostBag(E, region);

    if (a.type === 'extra') {
      E.push({
        strength: 'strong',
        title: 'Refund of what you paid for the unused service',
        amountText: 'The full amount you paid for it',
        detail: 'A prepaid extra you didn’t receive (Wi-Fi that didn’t work, a seat you couldn’t use) is refundable to your original payment.',
        rule: '14 CFR Part 260',
        ruleUrl: URL.bag260,
        deadline: 'They must pay ' + refundDeadline + '.',
      });
    }

    if (a.type === 'downgrade') {
      E.push({
        strength: 'strong',
        title: 'Refund of the fare difference',
        amountText: 'The difference between what you paid and the lower cabin',
        detail: 'A downgrade to a lower class is a “significant change.” You’re owed the difference back (and can refuse the whole trip for a full refund).',
        rule: '14 CFR Part 260 / 260.2',
        ruleUrl: URL.refund,
        deadline: 'They must pay ' + refundDeadline + '.',
      });
      if (region === 'from_eu') {
        E.push({
          strength: 'conditional',
          title: 'EU261 downgrade reimbursement',
          amountText: '30%, 50%, or 75% of your ticket price (by flight distance)',
          condition: 'on a flight departing the EU',
          detail: 'On a flight from the EU, a downgrade entitles you to reimburse part of the ticket: 30% short-haul, 50% medium, 75% long-haul.',
          rule: 'EU Regulation 261/2004, Art. 10',
          ruleUrl: URL.eu261,
          deadline: '',
        });
      }
    }

    // Deadlines / next-step entitlements common to refunds
    addEscalation(E, a);

    const strongCount = E.filter((e) => e.strength === 'strong').length;
    const headline = buildHeadline(E, a);
    return {
      entitlements: E,
      headline,
      letterBody: buildLetter(E, a),
      dotText: buildDot(E, a),
      hasClaim: strongCount > 0 || E.some((e) => e.strength === 'conditional'),
      disclaimer:
        'Estimates based on U.S. DOT rules and EU/UK/Canada regulations as of mid-2026. Confirm specifics for your trip — this is information, not legal advice.',
    };
  }

  // 14 CFR 260.2 "significant change": arrival 3h+ later (domestic) / 6h+ (international),
  // departure that much earlier, a different origin/destination airport, or an added connection.
  const SCHED_SIG_DOM = ['3-4', '4-6', '6+'];
  const SCHED_SIG_INTL = ['6+'];
  function scheduleIsSignificant(a) {
    if (a.schedDelta === 'route') return true;
    const bands = a.region === 'us' ? SCHED_SIG_DOM : SCHED_SIG_INTL;
    return bands.includes(a.schedDelta);
  }

  // Europe/UK: a schedule change told to you late is treated as a cancellation (EC 261 Art. 5(1)(c)):
  // <14 days notice — unless 7–13 days AND the new times are within 2h earlier / 4h later,
  // or <7 days AND within 1h earlier / 2h later. Compensation keeps the extraordinary-circumstances defence.
  function addScheduleIntl(E, a) {
    const band = a.distanceBand || 'long';
    const later3h = ['3-4', '4-6', '6+'].includes(a.schedDelta);
    // Canada APPR (SOR/2019-150 s.12, s.19): compensation keys to being told 14 days or less before departure
    // AND the cause being within the airline's control. If you take the refund instead, s.19(2) fixes it at
    // CAD 400 (large carrier); if you fly and arrive 3h+ late it is CAD 400 / 700 / 1,000 by arrival delay.
    if (a.region === 'canada') {
      if (a.schedDelta === 'route' || later3h) {
        const declined = a.schedAccepted === 'no';
        E.push({
          strength: 'conditional',
          title: 'Canada APPR compensation for a late-notice change',
          amountText: declined ? 'CAD 400 (large airline; CAD 125 small) — the fixed amount when you take the refund' : 'CAD 400 / 700 / 1,000 (large airlines), by how late you finally arrive (3–6h / 6–9h / 9h+)',
          detail: 'APPR treats a delay or cancellation you were told about 14 days or less before departure, caused by something within the airline’s control, as compensable' + (declined ? '. Because you are taking the refund rather than flying, the amount is the fixed CAD 400 (s.19(2)).' : ' — by how late you arrive at your final destination (s.19(1)).') + (a.schedDelta === 'route' ? ' Depends on the new arrival time: you must arrive 3+ hours later than originally scheduled.' : ''),
          condition: 'owed only if you were told 14 days or less before departure AND the cause was within the airline’s control' + (a.schedDelta === 'route' ? ' AND you arrive 3+ hours later than originally scheduled' : ''),
          rule: 'Canada APPR s.12 & s.19',
          ruleUrl: URL.appr,
          deadline: 'File within 1 year.',
        });
      }
      return;
    }
    if (a.region !== 'from_eu' && a.region !== 'from_uk') return;
  
    // Europe/UK. Two different animals (CJEU):
    //  * a LATER arrival on the same flight is a DELAY (Sturgeon C-402/07): compensation only if you fly it and
    //    arrive 3h+ late; notice is irrelevant; declining gets you the refund (Art. 8, from 5h) but no cash;
    //  * an EARLIER departure of more than 1 hour is a CANCELLATION (Azurair C-146/20): compensation unless you
    //    were told 14+ days ahead, or 7–13 days ahead with the move under 2h (Art. 5(1)(c)); no halving.
    //  * an added connection / airport change depends on the new times — shown as conditional on them.
    const eu = a.region === 'from_eu';
    const amt = eu ? '€' + euAmount(band) : '£' + ukAmount(band, '9+');
    const rule = eu ? 'EU Regulation 261/2004' : 'UK261 (retained EC 261/2004)';
    const ruleUrl = eu ? URL.eu261 : URL.uk261;
    const deadline = eu ? 'Claim window varies by country (often 2–3 years).' : 'Generally up to 6 years to claim (England/Wales).';
    const extra = 'the airline cannot show extraordinary circumstances — a commercial schedule change normally is not one';
    const push = (title, detail, condition) => E.push({ strength: 'conditional', title, amountText: amt + ' per person, in cash', detail, condition, rule, ruleUrl, deadline });
  
    if (a.schedDelta === 'route') {
      push((eu ? 'EU261' : 'UK261') + ' cash compensation — depends on the new times',
        'A new connection or airport by itself is not the test here; the times are. If you fly it and arrive 3+ hours later than originally scheduled, that is a compensable delay. If instead the change means leaving more than an hour earlier and you were told less than 14 days ahead, it counts as a cancellation and compensation is due even if you decline it.',
        'owed only if you arrive 3+ hours later than originally scheduled (and fly it), OR the departure moved more than 1 hour earlier with under 14 days’ notice — and ' + extra);
      return;
    }
    if (a.schedDirection === 'later') {
      if (!later3h) return;
      if (a.schedAccepted === 'no') {
        E.push({
          strength: 'info',
          title: (eu ? 'EU261' : 'UK261') + ': the refund is yours, but delay compensation needs you to fly',
          amountText: 'No cash on top of the refund',
          detail: 'A later arrival on the same flight is treated as a delay, not a cancellation. Declining a delay of 5+ hours gets your fare back (Art. 8), but the €/£ compensation is only paid to passengers who travel and reach their destination 3+ hours late. If you would rather have the cash, fly it and claim.',
          rule, ruleUrl, deadline: '',
        });
        return;
      }
      push((eu ? 'EU261' : 'UK261') + ' cash compensation — you arrive 3+ hours late',
        'A schedule change that lands you 3+ hours later than originally scheduled is a compensable delay when you fly it (Sturgeon, C-402/07). Notice does not matter for delays, and the amount is not halved.' + (eu ? ' Any flight leaving Europe counts, on any airline.' : ''),
        'owed only if you fly it and actually arrive 3+ hours later than the original schedule, and ' + extra);
      return;
    }
    if (a.schedDirection === 'earlier') {
      const n = a.schedNotice;
      if (!n || n === '14+') return;
      const moreThan1h = ['1-2', '2-3', '3-4', '4-6', '6+'].includes(a.schedDelta);
      const moreThan2h = ['2-3', '3-4', '4-6', '6+'].includes(a.schedDelta);
      if (!(n === '<7' ? moreThan1h : moreThan2h)) return;
      push((eu ? 'EU261' : 'UK261') + ' cash compensation — an earlier departure counts as a cancellation',
        'Bringing your flight forward by more than an hour is a cancellation in law (CJEU Azurair, C-146/20). With ' + (n === '<7' ? 'under 7 days’ notice' : '7–13 days’ notice and a move of 2+ hours') + ', compensation is due on top of the refund or rebooking — whether or not you take the earlier flight, and it is not halved.' + (eu ? ' Any flight leaving Europe counts, on any airline.' : ''),
        'owed only if ' + extra);
    }
  }

  function addIntlComp(E, a, kind) {
    const region = a.region;
    const band = a.distanceBand;
    const delay = a.arrDelay;
    const qualifiesDelay = kind === 'cancellation' || kind === 'denied_boarding' || delayAtLeast3(delay);
    if (!qualifiesDelay) return;
    const cond =
      'You qualify only if the cause was within the airline’s control (mechanical, staffing, overbooking) — NOT extraordinary weather, ATC strikes, or security.';
    const noticeNote = kind === 'cancellation' ? '; it may also be reduced if the airline gave 14+ days’ notice or rebooked you close to your original arrival time' : '';
    const controlCondition = 'owed only if the cause was within the airline’s control — not extraordinary weather, ATC strikes, or security' + noticeNote;
    if (region === 'from_eu') {
      E.push({
        strength: 'conditional',
        title: 'EU261 cash compensation',
        amountText: '€' + euAmount(band || 'long') + ' per person, in cash',
        detail: cond + ' Any flight leaving Europe counts — even on a U.S. airline.' + (kind === 'cancellation' ? ' (Reduced/waived if they gave 14+ days’ notice or rebooked you close to your original time.)' : ''),
        condition: controlCondition,
        rule: 'EU Regulation 261/2004',
        ruleUrl: URL.eu261,
        deadline: 'Claim window varies by country (often 2–3 years).',
      });
    } else if (region === 'from_uk') {
      E.push({
        strength: 'conditional',
        title: 'UK261 cash compensation',
        amountText: '£' + ukAmount(band || 'long', delay) + ' per person, in cash',
        detail: cond + (kind === 'cancellation' ? ' (Reduced/waived if they gave 14+ days’ notice or rebooked you close to your original time.)' : ''),
        condition: controlCondition,
        rule: 'UK261 (retained EC 261/2004)',
        ruleUrl: URL.uk261,
        deadline: 'Generally up to 6 years to claim (England/Wales).',
      });
    } else if (region === 'canada') {
      let amtText, dtl;
      if (kind === 'denied_boarding') {
        const t = apprDeniedBoarding(delay);
        amtText = t != null ? 'CAD ' + t.toLocaleString('en-US') : 'CAD 900 / 1,800 / 2,400 (by how late you arrived)';
        dtl = 'Denied boarding pays CAD 900 (under 6h late), 1,800 (6–9h), or 2,400 (9h+).';
      } else if (kind === 'cancellation') {
        amtText = 'CAD 400 / 700 / 1,000 (large airlines), by how late you ultimately arrived';
        dtl = 'Cancellation pays CAD 400 (3–6h late), 700 (6–9h), or 1,000 (9h+) — the top tier if you didn’t travel.';
      } else {
        amtText = 'CAD ' + apprAmount(delay).toLocaleString('en-US');
        dtl = 'Large airlines pay CAD 400 (3–6h), 700 (6–9h), 1,000 (9h+).';
      }
      E.push({
        strength: 'conditional',
        title: 'Canada APPR cash compensation',
        amountText: amtText + ', in cash',
        detail: cond + ' ' + dtl,
        condition: 'owed only if the cause was within the airline’s control — not safety-required or outside its control',
        rule: 'Canada Air Passenger Protection Regulations',
        ruleUrl: URL.appr,
        deadline: 'File within 1 year of the disruption.',
      });
    }
  }

  function addAmenities(E, a) {
    E.push({
      strength: 'conditional',
      title: 'Meals, hotel & rebooking — if the airline caused it',
      amountText: 'Meal after a 3+ hour wait; hotel + ride if stuck overnight',
      condition: 'if the delay or cancellation was within the airline’s control (not weather/ATC)',
      detail:
        'If the delay/cancellation was within the airline’s control (crew, maintenance, fueling — not weather), most big U.S. airlines have promised these on the DOT dashboard. Ask for them at the gate and hold them to the promise.',
      rule: 'DOT Airline Customer Service Dashboard',
      ruleUrl: URL.dashboard,
      deadline: '',
    });
  }

  function addLostBag(E, region) {
    if (region === 'us') {
      E.push({
        strength: 'strong',
        title: 'Up to $4,700 for the lost/damaged bag and contents',
        amountText: 'Your provable loss, up to $4,700 per passenger',
        detail: 'On U.S. domestic flights the airline must cover the actual, provable value of your bag and its contents. Keep receipts/photos.',
        rule: '14 CFR 254.4',
        ruleUrl: URL.bag254,
        deadline: 'File the claim with the airline promptly.',
      });
    } else {
      E.push({
        strength: 'strong',
        title: 'Up to ~$2,000 (1,519 SDR) for the bag, by treaty',
        amountText: 'Your provable loss, up to 1,519 SDR (~$2,000) per passenger',
        detail: 'International bags are covered under the Montreal Convention. Move fast: written notice is due ~7 days for damage, 21 days for delay.',
        rule: 'Montreal Convention, Art. 22',
        ruleUrl: URL.bag260,
        deadline: 'Notice deadlines are short (7 / 21 days) — file in writing now.',
      });
    }
  }

  function addEscalation(E, a) {
    const d = a.incidentDate;
    const chargeback = a.payment === 'credit';
    const bits = [];
    if (chargeback) {
      const by = d ? addDays(d, 60) : null;
      bits.push('Paid by credit card? You can dispute the charge under the Fair Credit Billing Act' + (by ? ' (send it so it arrives by about ' + by + ')' : ' (within ~60 days of the statement)') + '.');
    }
    bits.push('If the airline refuses, file a free DOT complaint — airlines must respond, and DOT can fine them.');
    E.push({
      strength: 'action',
      title: 'If they stall: escalate',
      amountText: '',
      detail: bits.join(' '),
      rule: 'FCBA 15 U.S.C. 1666 · DOT complaint',
      ruleUrl: URL.dot,
      deadline: '',
    });
  }

  function buildHeadline(E, a) {
    const strong = E.filter((e) => e.strength === 'strong');
    const cond = E.filter((e) => e.strength === 'conditional' && /compensation|€|£|CAD|\$/.test(e.amountText));
    if (!strong.length && !cond.length) return 'Based on your answers, there may be no cash owed — but check the details below.';
    if (strong.length) return 'You appear to be owed: ' + strong.map((e) => e.title.replace(/^A\s+/i, '').replace(/\s+of your fare$/i, '')).slice(0, 2).join(' + ') + '.';
    return 'You may be owed cash compensation — see the conditions below.';
  }

  function buildLetter(E, a) {
    const claimLines = E.filter((e) => e.strength === 'strong' || e.strength === 'conditional').map((e) => {
      const cnd = e.condition ? ` (${e.condition})` : '';
      return `• ${e.title}: ${e.amountText}, under ${e.rule}${cnd}.`;
    });
    // For a pre-trip schedule change the date is when the airline changed it, not the flight date.
    const sched = a.type === 'schedule';
    const dateLine = a.incidentDate && !sched ? ` on ${a.incidentDate}` : '';
    const opening = sched
      ? `Regarding the above booking: ${a.incidentDate ? 'on ' + a.incidentDate + ', ' : ''}${incidentSentence(a)}`
      : `On the above flight${dateLine}, ${incidentSentence(a)}`;
    return [
      'To: [AIRLINE] Customer Relations',
      'Re: Flight [FLIGHT #]' + dateLine + ', [ORIGIN]→[DESTINATION], confirmation [CONFIRMATION #]',
      '',
      'To whom it may concern,',
      '',
      `${opening} Under the applicable rules, I am entitled to the following, and I am formally requesting it now:`,
      '',
      ...(claimLines.length ? claimLines : ['• A refund/compensation as required by the applicable rules.']),
      '',
      'I decline any travel voucher and request payment to my original form of payment. Please confirm and remit promptly (for refunds, within 7 business days for credit-card payments or 20 days otherwise).',
      '',
      'If I do not receive a satisfactory response, I will file a complaint with the U.S. Department of Transportation Office of Aviation Consumer Protection' +
        (a.payment === 'credit' ? ' and dispute the charge with my credit-card issuer under the Fair Credit Billing Act' : '') +
        '.',
      '',
      'Sincerely,',
      '[YOUR NAME]',
      '[PHONE / EMAIL]',
    ].join('\n');
  }

  function dotCategory(a) {
    switch (a.type) {
      case 'cancelled':
      case 'delayed':
        return 'Flight delays / cancellations';
      case 'schedule':
        return 'Refunds';
      case 'bumped':
        return 'Oversales / denied boarding (bumping)';
      case 'bag_late':
      case 'bag_lost':
        return 'Baggage';
      default:
        return 'Refunds';
    }
  }
  // Field-labeled to match the actual DOT complaint form fields (the form can't be URL-prefilled).
  function buildDot(E, a) {
    const rules = Array.from(new Set(E.filter((e) => e.rule && e.rule !== '—').map((e) => e.rule))).join(', ');
    return [
      'DOT complaint — paste each line into the matching field at transportation.gov/airconsumer/file-consumer-complaint:',
      '',
      'Complaint category: ' + dotCategory(a),
      'Airline: [AIRLINE]',
      'Flight date: [DATE]',
      'Flight number: [FLIGHT #]',
      'From: [ORIGIN]     To: [DESTINATION]',
      'Confirmation/ticket #: [CONFIRMATION #]',
      'Did you contact the airline first? Yes — I requested resolution and it was not resolved.',
      '',
      'Description of the problem:',
      `On [DATE], on [AIRLINE] flight [FLIGHT #] from [ORIGIN] to [DESTINATION], ${incidentSentence(a)} The airline has not provided what I am owed under ${rules}. I am asking the U.S. Department of Transportation to require the airline to comply.`,
    ].join('\n');
  }

  function incidentSentence(a) {
    switch (a.type) {
      case 'cancelled':
        return a.traveled === 'no' ? 'the airline canceled my flight and I chose not to travel.' : 'the airline canceled my original flight.';
      case 'schedule': {
        const SIZE = { '<1': 'under an hour', '1-2': '1–2 hours', '2-3': '2–3 hours', '3-4': '3–4 hours', '4-6': '4–6 hours', '6+': 'more than 6 hours' };
        const size = a.schedDelta === 'route' ? 'by adding a connection or changing my airport' : SIZE[a.schedDelta] ? 'by ' + SIZE[a.schedDelta] : 'significantly';
        const times = a.schedFrom && a.schedTo ? ' (originally ' + a.schedFrom + ', now ' + a.schedTo + ')' : '';
        return 'the airline changed my itinerary after purchase ' + size + times + (a.schedAccepted === 'no' ? '. I do not accept the new itinerary and am declining it in writing here.' : '.');
      }
      case 'delayed':
        return 'my flight arrived significantly late.';
      case 'bumped':
        return a.voluntary === 'no' ? 'I was involuntarily denied boarding from an oversold flight.' : 'I gave up my seat on an oversold flight.';
      case 'bag_late':
        return 'my checked bag was significantly delayed.';
      case 'bag_lost':
        return 'my checked bag was lost or damaged.';
      case 'downgrade':
        return 'I was downgraded to a lower class of service.';
      case 'extra':
        return 'I paid for a service I did not receive.';
      default:
        return 'a service failure occurred.';
    }
  }

  // Replace [BRACKET] placeholders in a generated doc with the user's real trip details.
  function fill(text, d, a) {
    d = d || {};
    a = a || {};
    const map = {
      '[AIRLINE]': d.airline,
      '[FLIGHT #]': d.flightNo,
      '[ORIGIN]': d.origin,
      '[DESTINATION]': d.dest,
      '[CONFIRMATION #]': d.confirmation,
      '[YOUR NAME]': d.name,
      '[PHONE / EMAIL]': d.email,
      '[DATE]': a.type === 'schedule' ? a.flightDate : a.incidentDate,
    };
    let out = text;
    for (const k in map) {
      const v = map[k];
      if (v) out = out.split(k).join(v);
    }
    return out;
  }

  // A Fair Credit Billing Act dispute letter to the card issuer (services not delivered as agreed).
  function chargebackLetter(a, d) {
    d = d || {};
    return [
      'To: [CARD ISSUER] — Billing Inquiries Department',
      'Re: Billing-error dispute under the Fair Credit Billing Act (15 U.S.C. § 1666)',
      '',
      'Cardholder: ' + (d.name || '[YOUR NAME]'),
      'Account: [LAST 4 DIGITS]    Disputed amount: [AMOUNT]',
      'Merchant: ' + (d.airline || '[AIRLINE]'),
      '',
      'To whom it may concern,',
      '',
      `I am disputing a charge for airline services not provided as agreed. On ${a.incidentDate || '[DATE]'}, on ${d.airline || '[AIRLINE]'} flight ${d.flightNo || '[FLIGHT #]'} (${d.origin || '[ORIGIN]'}→${d.dest || '[DESTINATION]'}, confirmation ${d.confirmation || '[CONFIRMATION #]'}), ${incidentSentence(a)} The airline owes me a refund under U.S. DOT rules (14 CFR Part 260) and has not paid it.`,
      '',
      'This is a billing error for services not delivered as agreed. Under the Fair Credit Billing Act I am exercising my right to dispute it. Please withhold payment on the disputed amount pending investigation and credit my account. I am sending this within 60 days of the statement showing the charge.',
      '',
      'Sincerely,',
      d.name || '[YOUR NAME]',
    ].join('\n');
  }

  /**
   * Final notice before small claims — the escalation airlines least want you to reach.
   *
   * WHY IT WORKS: the Airline Deregulation Act preempts most state consumer-protection suits, but
   * American Airlines v. Wolens (513 U.S. 219) holds that a plain BREACH OF CONTRACT claim — the
   * airline failing to do what its own Contract of Carriage promises — is NOT preempted. Small
   * claims needs no lawyer, and defending one costs an airline more than the claim is usually
   * worth, so a credible, specific pre-suit notice is often the letter that actually gets paid.
   *
   * @param {object} a  claim answers
   * @param {object} d  trip details
   * @param {object} [opt] { amount, deadlineDays, cocRule }
   */
  function smallClaimsNotice(a, d, opt) {
    d = d || {};
    opt = opt || {};
    const days = opt.deadlineDays || 14;
    const by = addDays(new Date().toISOString().slice(0, 10), days);
    const amount = opt.amount ? String(opt.amount) : '[AMOUNT]';
    const airline = d.airline || '[AIRLINE]';
    const rule = opt.cocRule
      ? `, and specifically ${opt.cocRule} of your Contract of Carriage`
      : ', including the obligations set out in your Contract of Carriage';
    return [
      'FINAL NOTICE BEFORE LEGAL ACTION',
      '',
      `To: ${airline} — Customer Relations / Legal Department`,
      `Re: Flight ${d.flightNo || '[FLIGHT #]'}${a.incidentDate ? ' on ' + a.incidentDate : ''}, ${d.origin || '[ORIGIN]'}→${d.dest || '[DESTINATION]'}, confirmation ${d.confirmation || '[CONFIRMATION #]'}`,
      `Amount in dispute: ${amount}`,
      '',
      'To whom it may concern,',
      '',
      `I have previously requested resolution of this matter and have not received satisfactory redress. On the flight identified above, ${incidentSentence(a)}`,
      '',
      `This is a breach of the transportation contract between us${rule}. I am giving written notice that if payment of ${amount} is not received within ${days} days of the date of this letter${by ? ` (on or before ${by})` : ''}, I intend to file a claim in small claims court in my county of residence, and to seek my filing costs in addition to the amount above.`,
      '',
      'For the avoidance of doubt: I am asserting a state-law breach-of-contract claim, which the Supreme Court held in American Airlines, Inc. v. Wolens, 513 U.S. 219 (1995), is NOT preempted by the Airline Deregulation Act. I am not asserting a state consumer-protection claim.',
      '',
      'I would prefer to resolve this without a filing. Payment to my original form of payment, or a check to the address below, will close the matter.',
      '',
      'Sincerely,',
      d.name || '[YOUR NAME]',
      d.email || '[PHONE / EMAIL]',
      '[MAILING ADDRESS]',
    ].join('\n');
  }

  /** Evidence checklist tailored to the incident — what a court (or a claims adjuster) expects. */
  function evidencePack(a) {
    const base = [
      'Your booking confirmation and receipt showing what you paid',
      'Boarding pass(es), or the check-in record if you never boarded',
      'Every written exchange with the airline (screenshots with timestamps)',
      'A short timeline: what was scheduled, what happened, when',
    ];
    const extra = {
      bumped: ['The written statement of denied-boarding rights they are required to hand you', 'Your original vs. replacement scheduled arrival times', 'Your one-way fare, to compute the 200%/400% tier'],
      cancelled: ['The cancellation notice with its timestamp', 'The stated cause (controllable vs. weather/ATC)', 'Receipts for any costs you had to cover'],
      schedule: ['Your original itinerary (the confirmation email) and the schedule-change notice, both with timestamps', 'A screenshot of the new times next to the old — the size of the change is the whole case', 'Your written decline of the new itinerary, and the date you sent it'],
      delayed: ['The stated cause of the delay', 'Actual vs. scheduled arrival time at your final destination', 'Meal/hotel receipts if you paid out of pocket'],
      bag_late: ['Your Mishandled Baggage Report reference number', 'Bag tag stubs', 'Receipts for essentials you bought while it was missing'],
      bag_lost: ['Your Mishandled Baggage Report reference number', 'An itemised list of contents with proof of value (receipts/photos)'],
      downgrade: ['What you paid vs. the cabin you actually flew', 'The seat map or boarding pass showing the downgrade'],
      extra: ['Proof you paid for the service', 'Evidence it wasn’t delivered (e.g. a Wi-Fi error screenshot)'],
    };
    return base.concat(extra[a.type] || []);
  }

  return { firstQuestion: () => nextQuestion({}), nextQuestion, assess, fill, chargebackLetter, smallClaimsNotice, evidencePack, FLOW };
})();
