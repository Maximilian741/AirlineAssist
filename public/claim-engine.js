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
      id: 'region',
      when: (a) => a.type && a.type !== 'extra',
      q: { title: 'Where was the flight?', kind: 'choice', options: REGION_OPTS },
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
      when: (a) => (a.region === 'from_eu' || a.region === 'from_uk') && ['cancelled', 'delayed', 'bumped', 'downgrade'].includes(a.type),
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
      when: (a) => a.type === 'extra' || a.type === 'downgrade' || a.type === 'bag_late' || (a.type === 'cancelled' && a.traveled === 'no'),
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
    const dateLine = a.incidentDate ? ` on ${a.incidentDate}` : '';
    return [
      'To: [AIRLINE] Customer Relations',
      'Re: Flight [FLIGHT #]' + dateLine + ', [ORIGIN]→[DESTINATION], confirmation [CONFIRMATION #]',
      '',
      'To whom it may concern,',
      '',
      `On the above flight${dateLine}, ${incidentSentence(a)} Under the applicable rules, I am entitled to the following, and I am formally requesting it now:`,
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
      '[DATE]': a.incidentDate,
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

  return { firstQuestion: () => nextQuestion({}), nextQuestion, assess, fill, chargebackLetter, FLOW };
})();
