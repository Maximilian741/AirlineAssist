// companion.js
// The "engine": Delta Companion Certificate eligibility rules + value math.
//
// Rules verified against delta.com's official Companion Certificate terms + Amex card benefit
// pages + cross-checks (TPG / Thrifty Traveler / Upgraded Points / Frequent Miler), 2025/2026:
//   https://www.delta.com/us/en/booking-information/companion-certificates
//
// CORE FACTS (these drove the design — note where intuition is commonly wrong):
//   * Only the Delta SkyMiles PLATINUM and RESERVE Amex cards include a companion certificate.
//     The GOLD card does NOT (it has a separate statement credit).
//   * GEOGRAPHY IS THE SAME FOR BOTH CARDS: the U.S. (including Alaska & Hawaii), Mexico, the
//     Caribbean, and Central America. The "Platinum = contiguous-48 only" claim is a myth.
//     The cards differ ONLY in which CABINS/fare-classes you can book.
//   * The companion flies for taxes & fees only (you buy your own ticket at the normal fare).
//     Cap: no more than $80 round-trip DOMESTIC, no more than $250 round-trip INTERNATIONAL
//     (to eligible destinations), for itineraries up to four segments. The cap is a ceiling, not
//     a flat fee — real taxes can be ~$20.
//   * Delta One is excluded. Basic Economy (E class) is never eligible.

// Tax/fee caps the companion pays, by zone + trip type (USD).
export const COMPANION_TAX_CAPS = {
  domestic:      { roundTrip: 80,  oneWay: 40 },
  intl_eligible: { roundTrip: 250, oneWay: 125 },
};
function capFor(zone, roundTrip) {
  const c = COMPANION_TAX_CAPS[zone] || COMPANION_TAX_CAPS.domestic;
  return roundTrip ? c.roundTrip : c.oneWay;
}

// Booking-class buckets the certificate can be ticketed into, per card tier + cabin.
export const TIERS = {
  platinum: {
    id: 'platinum',
    label: 'Delta SkyMiles® Platinum Amex (personal or business)',
    annualFee: 350,
    cabins: { MAIN: ['L', 'U', 'T', 'X', 'V'] },
    zones: 'Your companion flies in Main Cabin to the U.S. (including Alaska & Hawaii), Mexico, the Caribbean, and Central America.',
  },
  reserve: {
    id: 'reserve',
    label: 'Delta SkyMiles® Reserve Amex (personal or business)',
    annualFee: 650,
    cabins: {
      MAIN: ['L', 'U', 'T', 'X', 'V'],
      COMFORT: ['W', 'S'],          // Comfort+ tickets only when Main L/U/T/X/V is also available.
      PREMIUM_SELECT: ['A', 'G'],
      FIRST: ['I', 'Z'],
    },
    zones: 'Same places as Platinum — and your companion can also ride in Comfort+, Premium Select, or First Class.',
  },
};

export const CABIN_LABELS = {
  MAIN: 'Main Cabin',
  COMFORT: 'Comfort+',
  PREMIUM_SELECT: 'Premium Select',
  FIRST: 'First Class',
};

const STATUS_WEIGHT = { eligible: 2, unknown: 1, ineligible: 0 };

/** class letter -> cabin bucket, for a given tier (only that tier's eligible classes). */
export function classToCabinMap(tierId) {
  const tier = TIERS[tierId] || TIERS.platinum;
  const map = {};
  for (const [cabin, classes] of Object.entries(tier.cabins)) {
    for (const c of classes) map[c] = cabin;
  }
  return map;
}

/** Collect booking-class letters across all segments. One missing class no longer nukes the eval. */
function collectBookingClasses(offer) {
  const classes = [];
  let missingAny = false;
  for (const leg of [offer.outbound, offer.inbound]) {
    if (!leg) continue;
    for (const s of leg.segments || []) {
      if (s.bookingClass) classes.push(String(s.bookingClass).toUpperCase());
      else missingAny = true;
    }
  }
  return { classes, missingAny };
}

/**
 * Evaluate one normalized round-trip offer against a card tier.
 *
 * Tri-state `status`:
 *   'eligible'   — booking-class data present and EVERY segment's class is an eligible companion
 *                  class for this card (across any cabin — mixed Main+First connections are OK).
 *   'ineligible' — a hard no: destination outside the cert's regions, Basic Economy, or a class
 *                  that isn't a companion bucket.
 *   'unknown'    — source (e.g. Google Flights) doesn't expose booking class; we show best-case
 *                  value and tell you to confirm on delta.com.
 *
 * opts: { zone: 'domestic'|'intl_eligible'|'ineligible', roundTrip: bool }
 */
export function evaluateOffer(offer, tierId, opts = {}) {
  const tier = TIERS[tierId] || TIERS.platinum;
  const zone = opts.zone || 'domestic';

  const result = {
    tier: tier.id,
    status: 'unknown',
    eligible: false,
    eligibleCabin: null,
    eligibleCabinLabel: null,
    bookingClasses: [],
    reason: '',
  };

  // 0) Destination outside the certificate's eligible regions (applies to BOTH cards).
  if (zone === 'ineligible') {
    result.status = 'ineligible';
    result.reason = 'Not an eligible companion destination. The certificate covers the U.S. (incl. Alaska & Hawaii), Mexico, the Caribbean, and Central America only.';
    return finalize(offer, result, opts);
  }

  // 1) Basic Economy is never eligible (E class).
  if (offer.basicEconomy) {
    result.status = 'ineligible';
    result.reason = 'Basic Economy books in E class and is never companion-eligible.';
    return finalize(offer, result, opts);
  }

  // 2) Source can't see booking class (Google Flights) -> needs confirmation, best-case value.
  if (offer.fareDataAvailable === false) {
    result.status = 'unknown';
    const cabins = tier.id === 'platinum' ? 'Main Cabin' : 'Main Cabin / Comfort+ / First';
    result.reason = `Booking class isn’t shown by this source. Most Delta ${cabins} fares on this route qualify — confirm the class (e.g. ${tier.cabins.MAIN.join('/')}) when booking on delta.com.`;
    return finalize(offer, result, opts);
  }

  // 3) Precise check against the tier's eligible classes.
  const { classes, missingAny } = collectBookingClasses(offer);
  if (!classes.length) {
    result.status = 'unknown';
    result.reason = 'No fare-class data available for this offer.';
    return finalize(offer, result, opts);
  }
  result.bookingClasses = classes;

  const map = classToCabinMap(tier.id); // class -> cabin (only eligible classes are keys)
  const allEligible = classes.every((c) => map[c]); // union membership: every class is eligible somewhere
  const cabinsHit = [...new Set(classes.map((c) => map[c]).filter(Boolean))];

  if (allEligible) {
    result.status = 'eligible';
    result.eligible = true;
    if (cabinsHit.length === 1) {
      result.eligibleCabin = cabinsHit[0];
      result.eligibleCabinLabel = CABIN_LABELS[cabinsHit[0]];
    } else {
      result.eligibleCabin = 'MIXED';
      result.eligibleCabinLabel = 'Mixed (' + cabinsHit.map((c) => CABIN_LABELS[c]).join(' + ') + ')';
    }
    result.reason =
      `Every segment prices in an eligible companion class (${classes.join('/')}).` +
      (cabinsHit.includes('COMFORT') ? ' Note: Comfort+ (W/S) only tickets when Main L/U/T/X/V is also open on the same flight.' : '') +
      (missingAny ? ' One segment had no class data and was skipped.' : '');
  } else {
    result.status = 'ineligible';
    const eligibleEverything = Object.values(tier.cabins).flat();
    const offending = [...new Set(classes.filter((c) => !eligibleEverything.includes(c)))];
    result.reason =
      `Fare prices in ${[...new Set(classes)].join('/')}; class ${offending.join('/')} isn't a companion bucket for ` +
      `${tier.id === 'platinum' ? 'Platinum (Main Cabin only)' : 'Reserve'}. A higher fare may open an eligible class.`;
  }

  return finalize(offer, result, opts);
}

function finalize(offer, result, opts) {
  return { ...offer, companion: result, value: computeValue(offer, result, opts) };
}

/**
 * Companion value on THIS trip.
 *   Without the cert: two people pay 2 * fare.
 *   With it: you pay 1 * fare + companion's taxes/fees only.
 *   => savings from applying the cert = second-ticket fare - companion taxes.
 *
 * Companion taxes: use the offer's real tax component capped at the zone/trip cap; when taxes
 * are unknown (e.g. Google Flights), fall back to the cap as a CONSERVATIVE estimate — never $0
 * (treating unknown as $0 would falsely show "companion flies completely free").
 */
export function computeValue(offer, companionResult, opts = {}) {
  const total = offer?.price?.total ?? null;
  const currency = offer?.price?.currency || 'USD';
  const roundTrip = opts.roundTrip ?? Boolean(offer?.inbound);
  const zone = opts.zone || 'domestic';
  const cap = capFor(zone, roundTrip);

  const rawTaxes = offer?.price?.taxes;
  let companionTaxes = null;
  let estimated = false;

  if (currency !== 'USD') {
    // The $80/$250 caps are USD figures; don't apply them to a foreign-currency tax number.
    companionTaxes = rawTaxes != null && rawTaxes > 0 ? rawTaxes : null;
    estimated = companionTaxes == null;
  } else if (rawTaxes != null && rawTaxes > 0) {
    companionTaxes = Math.min(rawTaxes, cap);
    estimated = false;
  } else {
    companionTaxes = cap; // unknown/zero taxes -> conservative cap, never 0
    estimated = true;
  }

  const counts = companionResult.status === 'eligible' || companionResult.status === 'unknown';
  const netSavings =
    counts && total != null && companionTaxes != null ? Math.max(0, round2(total - companionTaxes)) : null;

  return {
    secondTicketPrice: round2(total),
    companionTaxes: round2(companionTaxes),
    netSavings,
    currency,
    estimate: estimated || companionResult.status === 'unknown',
    taxCap: cap,
  };
}

/**
 * Within ONE route's offer list: show eligible/confirmable flights first, then CHEAPEST first
 * (you'd just book the cheapest flight the cert works on). Savings is a final tiebreak.
 */
export function compareOffers(a, b) {
  const wa = STATUS_WEIGHT[a.companion?.status] ?? 0;
  const wb = STATUS_WEIGHT[b.companion?.status] ?? 0;
  if (wa !== wb) return wb - wa;
  const pa = a.price?.total ?? Infinity;
  const pb = b.price?.total ?? Infinity;
  if (pa !== pb) return pa - pb;
  const sa = a.value?.netSavings == null ? -Infinity : a.value.netSavings;
  const sb = b.value?.netSavings == null ? -Infinity : b.value.netSavings;
  return sb - sa;
}

/**
 * Across DESTINATIONS (the value scan): rank by where the certificate is worth the most —
 * eligible/confirmable first, then biggest net savings on that route's best bookable flight.
 */
export function compareByValue(a, b) {
  const wa = STATUS_WEIGHT[a.companion?.status] ?? 0;
  const wb = STATUS_WEIGHT[b.companion?.status] ?? 0;
  if (wa !== wb) return wb - wa;
  const sa = a.value?.netSavings == null ? -Infinity : a.value.netSavings;
  const sb = b.value?.netSavings == null ? -Infinity : b.value.netSavings;
  return sb - sa;
}

function round2(n) {
  if (n == null || Number.isNaN(n)) return null;
  return Math.round(n * 100) / 100;
}

export function listTiers() {
  return Object.values(TIERS).map((t) => ({
    id: t.id,
    label: t.label,
    annualFee: t.annualFee,
    zones: t.zones,
    cabins: Object.fromEntries(
      Object.entries(t.cabins).map(([cab, cls]) => [CABIN_LABELS[cab] || cab, cls])
    ),
  }));
}
