// taxes.js — EXACT computation of what a Delta Companion Certificate passenger pays.
//
// WHY: the companion's "taxes and fees" are not a mystery number — they are fixed, published,
// statutory amounts. Previously the app fell back to Delta's $80 CAP whenever a provider didn't
// expose a tax breakdown, which badly UNDERSTATED savings (real domestic totals are ~$22–$50) and
// forced an "est." label onto every result. This computes them instead.
//
// A companion-certificate ticket is a REVENUE ticket issued at a $0 fare (NOT a mileage award), so:
//   * 7.5% federal excise (US)  -> 7.5% × $0 = $0.00   <- the reason it's cheap
//   * Segment tax (ZP)          -> CHARGED, per domestic segment
//   * Passenger Facility Chg (XF)-> CHARGED, per boarding (max 2 per direction)
//   * Sept 11 Security Fee (AY) -> CHARGED, per ONE-WAY TRIP (not per segment), $11.20 RT cap
// (A pure SkyMiles award is different — it's exempt from ZP and XF, paying only $11.20. Not this.)
//
// ALL RATES VERIFIED (2026) against primary sources — see RATE_SOURCES below.
// Domestic totals are EXACT. International is computed exactly for the U.S. portion but the
// foreign-country component genuinely varies, so those results stay honestly marked as estimates.

/** 2026 statutory rates. Segment/international taxes are CPI-indexed each January (IRS Rev. Proc.). */
export const RATES = {
  year: 2026,
  securityFeePerOneWayTrip: 5.6,   // AY — 49 CFR 1510.5
  securityFeeRoundTripCap: 11.2,   // AY — statutory RT cap (Pub. L. 113-294)
  pfcMaxPerBoarding: 4.5,          // XF — 49 U.S.C. 40117(b)(1)
  pfcMaxBoardingsPerDirection: 2,  // XF — 49 U.S.C. 40117(e)(2); 14 CFR 158.9(a)(1)
  domesticSegmentTax: 5.3,         // ZP — IRC 4261(b), IRS Pub. 510 (2026)
  akHiSegmentTax: 11.7,            // ZP — Alaska/Hawaii rate, IRS Pub. 510 (2026)
  intlDepartureTax: 23.4,          // IRC 4261(c) — IRS Pub. 510 (2026)
  intlArrivalTax: 23.4,            // IRC 4261(c) — IRS Pub. 510 (2026)
  customsUserFee: 7.39,            // YC — CBP Dec. 25-10 (FY2026; re-check after Sep 30, 2026)
  immigrationUserFee: 7.0,         // XY — statutory
  aphisPassengerFee: 3.84,         // XA — USDA APHIS (FY2026; re-check after Sep 30, 2026)
  domesticExcisePct: 0.075,        // US — IRC 4261(a); applies to amount paid ($0 for companion)
  // Typical foreign departure/tourism taxes on Delta's eligible international destinations.
  // Genuinely variable by country — this is the ONLY estimated input, and it's flagged as such.
  foreignTaxDefault: 75,
};

export const RATE_SOURCES = [
  { label: 'IRS Publication 510 — 2026 segment & international rates', url: 'https://www.irs.gov/publications/p510' },
  { label: '49 CFR 1510.5 — September 11th Security Fee', url: 'https://www.law.cornell.edu/cfr/text/49/1510.5' },
  { label: '49 U.S.C. 40117 — Passenger Facility Charge', url: 'https://www.law.cornell.edu/uscode/text/49/40117' },
  { label: '14 CFR 158.9 — PFC limits & exemptions', url: 'https://www.law.cornell.edu/cfr/text/14/158.9' },
  { label: '26 U.S.C. 4261 — air transportation excise taxes', url: 'https://www.law.cornell.edu/uscode/text/26/4261' },
  { label: 'Airlines for America — 2026 tax table', url: 'https://www.airlines.org/dataset/government-imposed-taxes-on-air-transportation/' },
  { label: 'Delta — Companion Certificates terms ($22–$250; $80/$250 caps)', url: 'https://www.delta.com/us/en/booking-information/companion-certificates' },
];

/** Delta's contractual ceilings on companion taxes/fees (itineraries up to 4 segments). */
export const DELTA_CAPS = { domestic: 80, intl_eligible: 250 };

const r2 = (n) => Math.round(n * 100) / 100;

/**
 * Compute the companion's taxes & fees.
 *
 * @param {object} o
 * @param {number} o.outboundSegments  flight segments outbound (nonstop = 1, one connection = 2)
 * @param {number} [o.inboundSegments] segments inbound; 0/undefined for a one-way
 * @param {'domestic'|'intl_eligible'} [o.zone='domestic']
 * @param {number} [o.pfcPerBoarding]  override when an airport levies less than the $4.50 max
 * @param {boolean} [o.akHi=false]     segments beginning/ending in Alaska or Hawaii
 * @param {number} [o.foreignTax]      known foreign-country taxes (international only)
 * @returns {{total:number, exact:boolean, breakdown:Array, cap:number, capped:boolean, note:string|null}}
 */
export function computeCompanionTaxes(o = {}) {
  const outSeg = Math.max(0, Number(o.outboundSegments) || 0);
  const inSeg = Math.max(0, Number(o.inboundSegments) || 0);
  const roundTrip = inSeg > 0;
  const zone = o.zone === 'intl_eligible' ? 'intl_eligible' : 'domestic';
  const pfcRate = o.pfcPerBoarding != null ? Number(o.pfcPerBoarding) : RATES.pfcMaxPerBoarding;
  const breakdown = [];

  if (outSeg === 0) {
    return { total: null, exact: false, breakdown, cap: DELTA_CAPS[zone], capped: false, note: 'No itinerary detail available.' };
  }

  // ---- AY: September 11th Security Fee — per ONE-WAY TRIP, not per segment ----
  // International: only a one-way trip that ORIGINATES at a U.S. airport is charged, so the
  // foreign-origin return leg adds nothing.
  const chargeableOneWays = zone === 'intl_eligible' ? 1 : roundTrip ? 2 : 1;
  const ay = Math.min(chargeableOneWays * RATES.securityFeePerOneWayTrip, RATES.securityFeeRoundTripCap);
  breakdown.push({ code: 'AY', label: 'September 11th Security Fee', amount: r2(ay), rule: '49 CFR 1510.5' });

  // ---- XF: Passenger Facility Charge — per boarding, max 2 per direction ----
  // International: only U.S. boardings count. Outbound is all-U.S. up to the border; the return's
  // only U.S. boarding is the domestic connection (if any).
  const capBoardings = (n) => Math.min(n, RATES.pfcMaxBoardingsPerDirection);
  let pfcBoardings;
  if (zone === 'intl_eligible') {
    pfcBoardings = capBoardings(outSeg) + Math.max(0, capBoardings(inSeg) - 1);
  } else {
    pfcBoardings = capBoardings(outSeg) + capBoardings(inSeg);
  }
  const xf = pfcBoardings * pfcRate;
  breakdown.push({ code: 'XF', label: `Passenger Facility Charge (${pfcBoardings} boarding${pfcBoardings === 1 ? '' : 's'})`, amount: r2(xf), rule: '49 U.S.C. 40117' });

  let total = ay + xf;
  let exact = true;
  let note = null;

  if (zone === 'domestic') {
    // ---- ZP: domestic flight segment tax ----
    const rate = o.akHi ? RATES.akHiSegmentTax : RATES.domesticSegmentTax;
    const segs = outSeg + inSeg;
    const zp = segs * rate;
    breakdown.push({ code: 'ZP', label: `Flight Segment Tax (${segs} segment${segs === 1 ? '' : 's'} × $${rate.toFixed(2)})`, amount: r2(zp), rule: 'IRC 4261(b)' });
    total += zp;

    // ---- US: 7.5% excise on the amount paid — $0 fare means $0 tax ----
    breakdown.push({ code: 'US', label: '7.5% excise (on the $0 companion fare)', amount: 0, rule: 'IRC 4261(a)' });
  } else {
    // International: the 4261(c) head taxes REPLACE the 7.5% excise and the ZP segment tax
    // (those legs aren't "taxable transportation" under IRC 4262).
    const heads = RATES.intlDepartureTax + (roundTrip ? RATES.intlArrivalTax : 0);
    breakdown.push({ code: 'US', label: `International departure${roundTrip ? ' + arrival' : ''} tax`, amount: r2(heads), rule: 'IRC 4261(c)' });
    total += heads;

    if (roundTrip) {
      const arrival = RATES.customsUserFee + RATES.immigrationUserFee + RATES.aphisPassengerFee;
      breakdown.push({ code: 'YC/XY/XA', label: 'U.S. Customs, Immigration & APHIS arrival fees', amount: r2(arrival), rule: 'CBP / APHIS' });
      total += arrival;
    }

    const foreign = o.foreignTax != null ? Number(o.foreignTax) : RATES.foreignTaxDefault;
    const foreignKnown = o.foreignTax != null;
    breakdown.push({
      code: 'Foreign',
      label: `Destination country taxes${foreignKnown ? '' : ' (typical — varies by country)'}`,
      amount: r2(foreign),
      rule: 'Foreign government',
      estimated: !foreignKnown,
    });
    total += foreign;

    if (!foreignKnown) {
      exact = false;
      note = 'U.S. taxes are exact; the destination country’s departure tax varies, so the total is approximate.';
    }
  }

  // ---- Delta's contractual cap ----
  const cap = DELTA_CAPS[zone];
  const capped = total > cap;
  if (capped) {
    breakdown.push({ code: 'CAP', label: `Delta caps companion taxes at $${cap}`, amount: r2(cap - total), rule: 'Delta Companion Certificate terms' });
    total = cap;
  }

  return { total: r2(total), exact, breakdown, cap, capped, note };
}

/** Count segments in a normalized leg (falls back to the `stops` count when segments are absent). */
export function segmentsOf(leg, stops) {
  const n = leg && Array.isArray(leg.segments) ? leg.segments.length : 0;
  if (n > 0) return n;
  if (stops != null && Number.isFinite(stops)) return Math.max(1, Number(stops) + 1);
  return 0;
}
