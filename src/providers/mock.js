// providers/mock.js
// Deterministic SAMPLE data so the dashboard fully works the instant you run it — before you
// finish signing up for an Amadeus key. Clearly flagged as "sample" in the UI. NOT live prices.
//
// Output matches the normalized offer shape that the Amadeus provider also emits, so the rest
// of the app doesn't care which provider produced the data.

import { DESTINATION_BY_CODE } from '../data/routes.js';

const CURRENCY = 'USD';

// Rough one-way base-fare anchors by destination (HLN->X via SLC), in USD. Pure illustration.
const BASE_ANCHOR = {
  SLC: 95, SEA: 140, DEN: 150, LAS: 160, PHX: 175, LAX: 185, SFO: 190, SAN: 195,
  MSP: 200, ORD: 215, DFW: 210, AUS: 220, ATL: 230, DCA: 245, LGA: 255, JFK: 255,
  BOS: 260, MCO: 250, MIA: 265, DTW: 220, MSY: 235, HNL: 320, OGG: 330, ANC: 300, SJU: 360,
};

// Booking-class pools. Mixing eligible (L/U/T/X/V, W/S, I/Z) with non-eligible (E/K/H/Q/Y) so
// a date scan realistically shows some flights where the companion cert works and some where it doesn't.
const MAIN_POOL = ['E', 'L', 'U', 'T', 'X', 'V', 'K', 'Q', 'H', 'M'];
const FIRST_POOL = ['I', 'Z', 'F', 'P'];

function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Deterministic 0..1 from a seed string.
function rng(seed) {
  let x = hashStr(seed);
  return () => {
    x ^= x << 13; x >>>= 0;
    x ^= x >> 17;
    x ^= x << 5; x >>>= 0;
    return x / 4294967296;
  };
}

function pick(arr, r) {
  return arr[Math.floor(r() * arr.length)];
}

function pad(n) { return String(n).padStart(2, '0'); }

function addHours(dateStr, hour, min) {
  return `${dateStr}T${pad(hour)}:${pad(min)}:00`;
}

function buildSegments(from, to, dateStr, classLetter, cabin, r, viaHub = true) {
  // HLN connects through SLC. SLC<->dest may be nonstop.
  if (from === 'HLN' && to !== 'SLC' && viaHub) {
    const depH = 6 + Math.floor(r() * 3);
    return [
      seg(from, 'SLC', addHours(dateStr, depH, 15), addHours(dateStr, depH + 1, 55), classLetter, cabin, r),
      seg('SLC', to, addHours(dateStr, depH + 3, 5), addHours(dateStr, depH + 6, 0), classLetter, cabin, r),
    ];
  }
  if (to === 'HLN' && from !== 'SLC' && viaHub) {
    const depH = 9 + Math.floor(r() * 4);
    return [
      seg(from, 'SLC', addHours(dateStr, depH, 0), addHours(dateStr, depH + 3, 0), classLetter, cabin, r),
      seg('SLC', to, addHours(dateStr, depH + 4, 10), addHours(dateStr, depH + 5, 50), classLetter, cabin, r),
    ];
  }
  const depH = 7 + Math.floor(r() * 8);
  return [seg(from, to, addHours(dateStr, depH, 0), addHours(dateStr, depH + 1, 40), classLetter, cabin, r)];
}

function seg(from, to, dep, arr, classLetter, cabin, r) {
  return {
    from,
    to,
    dep,
    arr,
    carrier: 'DL',
    operatedBy: from === 'HLN' || to === 'HLN' ? 'SkyWest dba Delta Connection' : 'Delta',
    flightNumber: `DL${1000 + Math.floor(r() * 8000)}`,
    bookingClass: classLetter,
    cabin,
  };
}

/**
 * Produce a small set of normalized sample offers for one round trip.
 */
export function searchOffers({ origin = 'HLN', destination, departDate, returnDate, max = 12 }) {
  const dest = (destination || '').toUpperCase();
  const anchor = BASE_ANCHOR[dest] ?? 230;
  const offers = [];
  const n = Math.min(max, 6);

  for (let i = 0; i < n; i++) {
    const r = rng(`${origin}|${dest}|${departDate}|${returnDate}|${i}`);
    // Decide cabin/class for this offer.
    const isFirst = r() < 0.18;
    const cabin = isFirst ? 'FIRST' : 'ECONOMY';
    const classLetter = isFirst ? pick(FIRST_POOL, r) : pick(MAIN_POOL, r);

    // Price: anchor +/- date and offer variance, doubled-ish for round trip, premium for First.
    const dateSeed = rng(`${dest}|${departDate}`)();
    const variance = 0.8 + dateSeed * 0.9 + r() * 0.3;
    const cabinMult = isFirst ? 2.6 : 1;
    const oneWay = anchor * variance * cabinMult;
    const total = Math.round(oneWay * 2 * 100) / 100;
    const taxes = Math.round((28 + r() * 45) * 100) / 100;
    const base = Math.round((total - taxes) * 100) / 100;

    offers.push({
      id: `sample-${dest}-${i}`,
      provider: 'sample',
      carrier: 'DL',
      price: { total, base, taxes, currency: CURRENCY },
      outbound: {
        segments: buildSegments(origin, dest, departDate, classLetter, cabin, r),
      },
      inbound: returnDate
        ? { segments: buildSegments(dest, origin, returnDate, classLetter, cabin, r) }
        : null,
    });
  }

  // Cheapest first.
  offers.sort((a, b) => a.price.total - b.price.total);
  return { offers, source: 'sample', notes: 'Sample data — connect Amadeus for live fares.' };
}

export const meta = { id: 'sample', label: 'Sample data', live: false };
