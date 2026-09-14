// fareclass.js — decode the single letter on your ticket that airlines never explain.
//
// Every ticket carries a "booking class" (fare basis) — one letter that quietly decides whether
// your companion certificate can be used, whether you can upgrade, whether you can change or
// refund, and how many miles you earn. It's printed on your confirmation and explained nowhere.
// Two people in adjacent seats on the same flight can hold completely different rights.
//
// SCOPE + HONESTY: the companion-certificate mapping below is the VERIFIED map from companion.js
// (Delta's own certificate terms). The wider Delta fare hierarchy is the published structure, but
// airlines shuffle inventory codes, so anything beyond the certificate mapping is labelled as the
// typical structure to confirm on your own ticket — never asserted as a guarantee.

window.FareClass = (function () {
  'use strict';

  // Verified against Delta's Companion Certificate terms (same source as companion.js TIERS).
  const CERT = {
    MAIN: ['L', 'U', 'T', 'X', 'V'],
    COMFORT: ['W', 'S'],
    PREMIUM_SELECT: ['A', 'G'],
    FIRST: ['I', 'Z'],
  };
  const CABIN_LABEL = {
    MAIN: 'Main Cabin',
    COMFORT: 'Comfort+',
    PREMIUM_SELECT: 'Premium Select',
    FIRST: 'First Class',
  };

  // Typical Delta structure. `certain` marks what we state as fact vs. the general hierarchy.
  const CLASSES = {
    // Basic Economy — the trap.
    E: { cabin: 'MAIN', tier: 'Basic Economy', certain: true,
         note: 'The stripped fare. No seat selection, no changes, no refunds, last boarding group, no upgrades — and your companion certificate can never be used on it.' },
    // Discount Main — the companion-eligible band.
    L: { cabin: 'MAIN', tier: 'Discount Main Cabin', certain: true },
    U: { cabin: 'MAIN', tier: 'Discount Main Cabin', certain: true },
    T: { cabin: 'MAIN', tier: 'Discount Main Cabin', certain: true },
    X: { cabin: 'MAIN', tier: 'Discount Main Cabin', certain: true },
    V: { cabin: 'MAIN', tier: 'Discount Main Cabin', certain: true },
    // Higher Main Cabin buckets — more flexible, more expensive, but NOT certificate-eligible.
    K: { cabin: 'MAIN', tier: 'Mid Main Cabin' },
    Q: { cabin: 'MAIN', tier: 'Mid Main Cabin' },
    H: { cabin: 'MAIN', tier: 'Mid Main Cabin' },
    M: { cabin: 'MAIN', tier: 'Flexible Main Cabin' },
    B: { cabin: 'MAIN', tier: 'Flexible Main Cabin' },
    Y: { cabin: 'MAIN', tier: 'Full-fare Main Cabin', note: 'The most expensive and most flexible economy fare. Usually changeable and refundable.' },
    // Comfort+
    W: { cabin: 'COMFORT', tier: 'Comfort+', certain: true },
    S: { cabin: 'COMFORT', tier: 'Comfort+', certain: true },
    // Premium Select
    A: { cabin: 'PREMIUM_SELECT', tier: 'Premium Select', certain: true },
    G: { cabin: 'PREMIUM_SELECT', tier: 'Premium Select', certain: true },
    P: { cabin: 'PREMIUM_SELECT', tier: 'Premium Select' },
    // First / Delta One
    I: { cabin: 'FIRST', tier: 'First Class', certain: true },
    Z: { cabin: 'FIRST', tier: 'First Class', certain: true },
    J: { cabin: 'FIRST', tier: 'Delta One / Business', note: 'Delta One is expressly excluded from the companion certificate.' },
    C: { cabin: 'FIRST', tier: 'Delta One / Business', note: 'Delta One is expressly excluded from the companion certificate.' },
    D: { cabin: 'FIRST', tier: 'Delta One / Business', note: 'Delta One is expressly excluded from the companion certificate.' },
    F: { cabin: 'FIRST', tier: 'First Class (full fare)' },
  };

  function certEligibility(code, tierId) {
    const tier = tierId === 'reserve' ? 'reserve' : 'platinum';
    const allowed = tier === 'reserve'
      ? [...CERT.MAIN, ...CERT.COMFORT, ...CERT.PREMIUM_SELECT, ...CERT.FIRST]
      : [...CERT.MAIN];
    if (allowed.includes(code)) {
      const cabin = Object.keys(CERT).find((k) => CERT[k].includes(code));
      return { ok: true, cabin: CABIN_LABEL[cabin] };
    }
    // Explain WHY not — that's the useful part.
    if (code === 'E') return { ok: false, why: 'Basic Economy is never eligible, on any card.' };
    const isReserveOnly = [...CERT.COMFORT, ...CERT.PREMIUM_SELECT, ...CERT.FIRST].includes(code);
    if (isReserveOnly && tier === 'platinum') {
      const cabin = Object.keys(CERT).find((k) => CERT[k].includes(code));
      return { ok: false, why: `${CABIN_LABEL[cabin]} is covered by the Reserve card, not Platinum. Your Platinum certificate only tickets Main Cabin (L/U/T/X/V).`, upgradeHint: true };
    }
    const info = CLASSES[code];
    if (info && info.cabin === 'MAIN') {
      return { ok: false, why: 'This is a higher-priced Main Cabin bucket. The certificate only tickets the discount band — L, U, T, X or V — and only when those seats are open for sale.' };
    }
    if (info && info.tier && /Delta One/.test(info.tier)) {
      return { ok: false, why: 'Delta One is expressly excluded from the companion certificate.' };
    }
    return { ok: false, why: 'This class isn’t in the certificate’s eligible buckets.' };
  }

  /** Decode a booking class. Returns null for unknown letters rather than guessing. */
  function decode(raw, tierId) {
    const code = String(raw || '').trim().toUpperCase().slice(0, 1);
    if (!/^[A-Z]$/.test(code)) return null;
    const info = CLASSES[code];
    if (!info) {
      return {
        code, known: false,
        summary: `“${code}” isn’t one of Delta’s common published classes. Airlines do rotate inventory codes — check your confirmation or ask the airline what cabin it books into.`,
        cert: certEligibility(code, tierId),
      };
    }
    return {
      code,
      known: true,
      cabin: CABIN_LABEL[info.cabin],
      tier: info.tier,
      certain: !!info.certain,
      note: info.note || null,
      cert: certEligibility(code, tierId),
      flexibility: flexibilityOf(code, info),
    };
  }

  function flexibilityOf(code, info) {
    if (code === 'E') return 'No changes, no refunds, no seat selection, boards last.';
    if (/Full-fare|Flexible/.test(info.tier)) return 'Generally the most flexible fares — often changeable, sometimes refundable. You paid for that.';
    if (/Discount|Mid/.test(info.tier)) return 'Changeable without a change fee on most Delta fares (you pay any fare difference), but not refundable for cash.';
    return 'Premium-cabin fares vary widely — check the fare rules on your confirmation.';
  }

  /** Every class the certificate CAN ticket, for the "what to look for" list. */
  function eligibleList(tierId) {
    const tier = tierId === 'reserve' ? 'reserve' : 'platinum';
    const out = [{ cabin: CABIN_LABEL.MAIN, codes: CERT.MAIN }];
    if (tier === 'reserve') {
      out.push({ cabin: CABIN_LABEL.COMFORT, codes: CERT.COMFORT });
      out.push({ cabin: CABIN_LABEL.PREMIUM_SELECT, codes: CERT.PREMIUM_SELECT });
      out.push({ cabin: CABIN_LABEL.FIRST, codes: CERT.FIRST });
    }
    return out;
  }

  return { decode, eligibleList, CERT, CLASSES };
})();
