// providers/amadeus.js
// Live flight data via the Amadeus Self-Service "Flight Offers Search" API.
//
//   * Test env:  https://test.api.amadeus.com  (free, but LIMITED/cached dataset — HLN may be sparse)
//   * Prod env:  https://api.amadeus.com       (2,000 free calls/month, then small per-call fee)
//
// Docs: https://developers.amadeus.com/self-service/category/flights/api-doc/flight-offers-search
//
// Uses OAuth2 client-credentials. We cache the bearer token until it expires.
// Output is normalized to the SAME shape as the sample provider so the app is provider-agnostic.

const HOSTS = {
  test: 'https://test.api.amadeus.com',
  production: 'https://api.amadeus.com',
};

let tokenCache = { token: null, expiresAt: 0 };

function getConfig() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;
  const env = (process.env.AMADEUS_ENV || 'test').toLowerCase();
  const host = HOSTS[env] || HOSTS.test;
  return { clientId, clientSecret, env, host };
}

export function isConfigured() {
  const { clientId, clientSecret } = getConfig();
  return Boolean(clientId && clientSecret);
}

export function status() {
  const { env, clientId } = getConfig();
  return { configured: isConfigured(), env, clientIdPreview: clientId ? clientId.slice(0, 4) + '…' : null };
}

async function getToken() {
  const now = Date.now();
  if (tokenCache.token && now < tokenCache.expiresAt - 30_000) return tokenCache.token;

  const { clientId, clientSecret, host } = getConfig();
  if (!clientId || !clientSecret) throw new Error('Amadeus credentials not set.');

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${host}/v1/security/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Amadeus auth failed (${res.status}): ${text.slice(0, 300)}`);
  }
  const json = await res.json();
  tokenCache = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in || 1799) * 1000,
  };
  return tokenCache.token;
}

/**
 * Search round-trip Delta offers. Returns { offers, source, notes }.
 */
export async function searchOffers({ origin = 'HLN', destination, departDate, returnDate, adults = 1, max = 12 }) {
  const { host, env } = getConfig();
  const token = await getToken();

  const params = new URLSearchParams({
    originLocationCode: origin,
    destinationLocationCode: destination,
    departureDate: departDate,
    adults: String(adults),
    includedAirlineCodes: 'DL', // Delta only — companion certs are Delta-marketed flights.
    currencyCode: 'USD',
    max: String(max),
  });
  if (returnDate) params.set('returnDate', returnDate);

  const res = await fetch(`${host}/v2/shopping/flight-offers?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Amadeus search failed (${res.status}): ${text.slice(0, 400)}`);
  }

  const json = await res.json();
  const offers = (json.data || []).map((o) => normalizeOffer(o)).filter(Boolean);
  return {
    offers,
    source: `amadeus:${env}`,
    notes: env === 'test'
      ? 'Live via Amadeus TEST env (limited/cached dataset — switch to production for full HLN inventory).'
      : 'Live via Amadeus production.',
  };
}

function normalizeOffer(o) {
  try {
    const price = {
      total: parseFloat(o.price.grandTotal ?? o.price.total),
      base: parseFloat(o.price.base ?? o.price.total),
      currency: o.price.currency || 'USD',
    };
    price.taxes = Math.round((price.total - price.base) * 100) / 100;

    // Map segmentId -> { cabin, class } from the (first) traveler's fare details.
    const fareBySeg = {};
    const tp = (o.travelerPricings || [])[0];
    for (const fd of tp?.fareDetailsBySegment || []) {
      fareBySeg[fd.segmentId] = { cabin: fd.cabin, bookingClass: fd.class };
    }

    const legs = (o.itineraries || []).map((it) => ({
      segments: (it.segments || []).map((s) => {
        const fare = fareBySeg[s.id] || {};
        return {
          from: s.departure.iataCode,
          to: s.arrival.iataCode,
          dep: s.departure.at,
          arr: s.arrival.at,
          carrier: s.carrierCode,
          operatedBy: s.operating?.carrierCode || s.carrierCode,
          flightNumber: `${s.carrierCode}${s.number}`,
          bookingClass: fare.bookingClass || null,
          cabin: fare.cabin || null,
        };
      }),
    }));

    return {
      id: o.id,
      provider: 'amadeus',
      carrier: 'DL',
      price,
      outbound: legs[0] || { segments: [] },
      inbound: legs[1] || null,
    };
  } catch {
    return null;
  }
}

export const meta = { id: 'amadeus', label: 'Amadeus (live)', live: true };
