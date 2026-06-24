// routes.js
// Helena (HLN) Delta route reality + curated destinations.
//
// Delta's ONLY nonstop from Helena is HLN <-> Salt Lake City (SLC), Delta's western hub
// (SkyWest as Delta Connection). So every Delta itinerary out of Helena is:
//     HLN -> SLC -> <destination>   (and the mirror home)
//
// ZONE drives the companion certificate's TAX CAP and whether the destination is eligible AT ALL.
// (It does NOT vary by card — Platinum and Reserve share the same destination list; they differ
//  only by cabin.)
//   domestic       -> U.S. incl. Alaska, Hawaii, Puerto Rico. Companion tax cap ~$80 RT.
//   intl_eligible  -> Mexico, the Caribbean, Central America. Companion tax cap ~$250 RT.
//   ineligible     -> anywhere else (Europe, Asia, S. America, Canada, etc.) — cert can't be used.

export const ORIGIN = {
  code: 'HLN',
  name: 'Helena Regional Airport',
  city: 'Helena, MT',
  hub: 'SLC',
  note: 'Delta serves HLN only via Salt Lake City (SLC). All Delta trips connect through SLC.',
};

export const DESTINATIONS = [
  // ---- Domestic (≈$80 companion tax cap; eligible for BOTH cards) ----
  { code: 'SLC', city: 'Salt Lake City, UT', zone: 'domestic', popular: true, nonstop: true },
  { code: 'ATL', city: 'Atlanta, GA', zone: 'domestic', popular: true },
  { code: 'JFK', city: 'New York – JFK, NY', zone: 'domestic', popular: true },
  { code: 'LGA', city: 'New York – LaGuardia, NY', zone: 'domestic', popular: true },
  { code: 'BOS', city: 'Boston, MA', zone: 'domestic', popular: true },
  { code: 'LAX', city: 'Los Angeles, CA', zone: 'domestic', popular: true },
  { code: 'SFO', city: 'San Francisco, CA', zone: 'domestic', popular: true },
  { code: 'SAN', city: 'San Diego, CA', zone: 'domestic', popular: true },
  { code: 'SEA', city: 'Seattle, WA', zone: 'domestic', popular: true },
  { code: 'MSP', city: 'Minneapolis–St. Paul, MN', zone: 'domestic', popular: true },
  { code: 'ORD', city: 'Chicago – O’Hare, IL', zone: 'domestic', popular: true },
  { code: 'DEN', city: 'Denver, CO', zone: 'domestic', popular: true },
  { code: 'DFW', city: 'Dallas–Fort Worth, TX', zone: 'domestic', popular: true },
  { code: 'AUS', city: 'Austin, TX', zone: 'domestic', popular: false },
  { code: 'PHX', city: 'Phoenix, AZ', zone: 'domestic', popular: true },
  { code: 'LAS', city: 'Las Vegas, NV', zone: 'domestic', popular: true },
  { code: 'MCO', city: 'Orlando, FL', zone: 'domestic', popular: true },
  { code: 'MIA', city: 'Miami, FL', zone: 'domestic', popular: true },
  { code: 'DCA', city: 'Washington – Reagan, DC', zone: 'domestic', popular: true },
  { code: 'DTW', city: 'Detroit, MI', zone: 'domestic', popular: false },
  { code: 'MSY', city: 'New Orleans, LA', zone: 'domestic', popular: false },
  { code: 'HNL', city: 'Honolulu, HI', zone: 'domestic', popular: true },     // Hawaii = domestic
  { code: 'OGG', city: 'Maui – Kahului, HI', zone: 'domestic', popular: true },
  { code: 'ANC', city: 'Anchorage, AK', zone: 'domestic', popular: false },   // Alaska = domestic
  { code: 'SJU', city: 'San Juan, Puerto Rico', zone: 'domestic', popular: false }, // PR = domestic
  // ---- More of the Delta-via-SLC network (scanned by "Everywhere"; not all shown as chips) ----
  { code: 'PDX', city: 'Portland, OR', zone: 'domestic', popular: false },
  { code: 'SMF', city: 'Sacramento, CA', zone: 'domestic', popular: false },
  { code: 'RNO', city: 'Reno, NV', zone: 'domestic', popular: false },
  { code: 'BOI', city: 'Boise, ID', zone: 'domestic', popular: false },
  { code: 'GEG', city: 'Spokane, WA', zone: 'domestic', popular: false },
  { code: 'ABQ', city: 'Albuquerque, NM', zone: 'domestic', popular: false },
  { code: 'TUS', city: 'Tucson, AZ', zone: 'domestic', popular: false },
  { code: 'SAT', city: 'San Antonio, TX', zone: 'domestic', popular: false },
  { code: 'BNA', city: 'Nashville, TN', zone: 'domestic', popular: false },
  { code: 'RDU', city: 'Raleigh–Durham, NC', zone: 'domestic', popular: false },
  { code: 'BWI', city: 'Baltimore, MD', zone: 'domestic', popular: false },
  { code: 'PHL', city: 'Philadelphia, PA', zone: 'domestic', popular: false },
  { code: 'TPA', city: 'Tampa, FL', zone: 'domestic', popular: false },
  { code: 'FLL', city: 'Fort Lauderdale, FL', zone: 'domestic', popular: false },
  { code: 'PIT', city: 'Pittsburgh, PA', zone: 'domestic', popular: false },
  { code: 'MKE', city: 'Milwaukee, WI', zone: 'domestic', popular: false },
  { code: 'MCI', city: 'Kansas City, MO', zone: 'domestic', popular: false },
  { code: 'STL', city: 'St. Louis, MO', zone: 'domestic', popular: false },
  { code: 'CVG', city: 'Cincinnati, OH', zone: 'domestic', popular: false },
  { code: 'CLT', city: 'Charlotte, NC', zone: 'domestic', popular: false },

  // ---- International but cert-eligible (≈$250 companion tax cap; both cards) ----
  { code: 'CUN', city: 'Cancún, Mexico', zone: 'intl_eligible', popular: true },
  { code: 'SJD', city: 'Los Cabos, Mexico', zone: 'intl_eligible', popular: true },
  { code: 'PVR', city: 'Puerto Vallarta, Mexico', zone: 'intl_eligible', popular: false },
  { code: 'NAS', city: 'Nassau, Bahamas', zone: 'intl_eligible', popular: false },
  { code: 'MBJ', city: 'Montego Bay, Jamaica', zone: 'intl_eligible', popular: false },
  { code: 'LIR', city: 'Liberia, Costa Rica', zone: 'intl_eligible', popular: false },
];

export const DESTINATION_BY_CODE = Object.fromEntries(DESTINATIONS.map((d) => [d.code, d]));

// A few well-known non-eligible international hubs so typed codes get judged correctly.
const KNOWN_INELIGIBLE = new Set([
  'LHR', 'LGW', 'CDG', 'AMS', 'FRA', 'MUC', 'MAD', 'BCN', 'FCO', 'NRT', 'HND', 'ICN', 'PEK',
  'PVG', 'HKG', 'SIN', 'SYD', 'YYZ', 'YVR', 'YUL', 'GRU', 'GIG', 'EZE', 'LIM', 'BOG', 'DXB',
]);

/**
 * Zone for a destination code. Curated codes are authoritative; otherwise we guess:
 * known non-eligible hubs -> 'ineligible', everything else -> 'domestic' (the common HLN case).
 */
export function zoneOf(code) {
  const c = (code || '').toUpperCase();
  if (DESTINATION_BY_CODE[c]) return DESTINATION_BY_CODE[c].zone;
  if (KNOWN_INELIGIBLE.has(c)) return 'ineligible';
  return 'domestic';
}

export function isExtendedZone(code) {
  return zoneOf(code) === 'intl_eligible';
}
