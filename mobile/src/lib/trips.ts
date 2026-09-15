/**
 * Trip vault + claim-deadline engine (TS port of web public/trips.js).
 *
 * Airlines' biggest structural edge is that claims EXPIRE. This tracks every deadline per trip so
 * nothing lapses. Deadlines come from the same verified sources as the rights data
 * (14 CFR Part 260/250/254, FCBA 15 U.S.C. 1666, Montreal Convention Art. 31, EU261, UK261, APPR).
 *
 * Storage: AsyncStorage-free — uses expo-secure-store-free plain AsyncStorage via the caller.
 * To keep this module pure/testable, persistence is injected (see useTrips in app/trips.tsx).
 */
import type { Answers, Details } from '@/lib/claim-engine';

export type TripIssue = 'none' | 'cancelled' | 'schedule' | 'delayed' | 'bumped' | 'bag_late' | 'bag_lost' | 'downgrade' | 'extra';

export type Trip = {
  id: string;
  created?: string;
  airline?: string;
  flightNo?: string;
  confirmation?: string;
  origin?: string;
  dest?: string;
  departDate?: string;
  returnDate?: string;
  bookedDate?: string;
  region?: 'us' | 'intl_from_us' | 'from_eu' | 'from_uk' | 'canada';
  payment?: 'credit' | 'other';
  issue?: TripIssue;
  issueDate?: string;
  fare?: string;
  arrDelay?: string;
  bagHours?: string;
  reportFiled?: 'yes' | 'no';
  distanceBand?: 'short' | 'medium' | 'long';
  traveled?: 'yes' | 'no';
  voluntary?: 'yes' | 'no';
  name?: string;
  email?: string;
};

export type DeadlineStatus = 'open' | 'soon' | 'urgent' | 'expired';
export type Deadline = {
  key: string;
  label: string;
  due: string;
  daysLeft: number;
  status: DeadlineStatus;
  why: string;
  rule: string;
};

export const ISSUE_LABELS: Record<TripIssue, string> = {
  none: 'Nothing went wrong (just tracking it)',
  cancelled: 'It got canceled',
  schedule: 'They changed the flight time or route before the trip',
  delayed: 'It was very late',
  bumped: 'I got bumped from an oversold flight',
  bag_late: 'My bag showed up late',
  bag_lost: 'My bag was lost or damaged',
  downgrade: 'I got downgraded',
  extra: 'I paid for something I didn’t get',
};

// The traveler's calendar day, not UTC's — in U.S. evenings UTC is already tomorrow, which would expire a
// deadline that is still due today.
export function today(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function parse(d?: string): Date | null {
  if (!d) return null;
  const x = new Date(d + 'T12:00:00');
  return isNaN(x.getTime()) ? null : x;
}
export function addDays(d: string | undefined, n: number): string | null {
  const x = parse(d);
  if (!x) return null;
  x.setDate(x.getDate() + n);
  return x.toISOString().slice(0, 10);
}
export function daysBetween(from?: string, to?: string): number | null {
  const a = parse(from), b = parse(to);
  if (!a || !b) return null;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
export function fmt(d?: string): string {
  const x = parse(d);
  return x ? x.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
}

export function newId(): string {
  return 'tr' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function deadlines(trip: Trip): Deadline[] {
  const out: Deadline[] = [];
  const now = today();
  const paidCard = trip.payment !== 'other';
  const intl = !!trip.region && trip.region !== 'us';

  const push = (key: string, label: string, due: string | null, why: string, rule: string) => {
    if (!due) return;
    const left = daysBetween(now, due);
    if (left == null) return;
    let status: DeadlineStatus = 'open';
    if (left < 0) status = 'expired';
    else if (left <= 2) status = 'urgent';
    else if (left <= 7) status = 'soon';
    out.push({ key, label, due, daysLeft: left, status, why, rule });
  };

  if (trip.bookedDate && trip.departDate && (daysBetween(trip.bookedDate, trip.departDate) ?? 0) >= 7) {
    push('cancel24', 'Free cancellation window', addDays(trip.bookedDate, 1),
      'You can cancel this booking for a full refund, no penalty — if you booked directly with the airline.',
      '14 CFR 259.5(b)(4)');
  }

  if (!trip.issue || trip.issue === 'none') return sortDeadlines(out);
  const issueDate = trip.issueDate || trip.departDate;

  if (trip.issue === 'bag_lost' || trip.issue === 'bag_late') {
    if (intl) {
      push('mc_damage', 'International bag damage notice', addDays(issueDate, 7),
        'On international trips you must notify the airline IN WRITING within 7 days for damage. Miss it and the claim is generally barred.',
        'Montreal Convention, Art. 31');
      push('mc_delay', 'International bag delay notice', addDays(issueDate, 21),
        'Written notice for a DELAYED bag on an international trip is due within 21 days.',
        'Montreal Convention, Art. 31');
    }
    push('bagfee', 'Checked-bag fee refund', addDays(issueDate, 45),
      'A significantly delayed bag means your bag FEE is refundable — but only if you filed a mishandled-baggage report. Ask now, in writing.',
      '14 CFR Part 260');
  }

  if (trip.issue === 'bumped' && ['us', 'intl_from_us'].includes(trip.region || 'us')) {
    push('db', 'Denied-boarding cash claim', addDays(issueDate, 30),
      'Involuntary bumping pays cash (up to $1,075 / $2,150) — it should have been paid at the airport. Chase it now while records are fresh.',
      '14 CFR 250.5 & 250.8');
  }

  if (trip.issue === 'cancelled' || trip.issue === 'schedule' || trip.issue === 'extra') {
    push('refund', 'Airline must pay your refund by', addDays(issueDate, paidCard ? 10 : 20),
      paidCard
        ? 'Credit-card refunds are due within 7 BUSINESS days of your request. Past this, it is its own violation — report it.'
        : 'Non-card refunds are due within 20 calendar days of your request.',
      '14 CFR 260.10');
  }

  if (paidCard) {
    push('chargeback', 'Credit-card dispute deadline', addDays(issueDate, 60),
      'If the airline took your money and did not deliver, you can dispute the charge — but the FCBA window is ~60 days from the statement. This one does not come back.',
      'FCBA, 15 U.S.C. 1666');
  }

  if (trip.region === 'canada') {
    push('appr', 'Canada APPR claim window', addDays(issueDate, 365),
      'Canada gives you a full year to claim cash compensation (up to CAD 1,000; CAD 2,400 for bumping).', 'Canada APPR');
  }
  if (trip.region === 'from_eu') {
    push('eu261', 'EU261 claim window (safe-in-every-country date)', addDays(issueDate, 365),
      'EU261 pays €250–€600 cash. The real limit depends on which country’s courts you’d use (roughly 1–10 years; Belgium and Poland run about 1 year) — file within a year and you’re safe everywhere.',
      'EC Regulation 261/2004 (Cuadrench Moré C-139/11: national limits apply)');
  }
  if (trip.region === 'from_uk') {
    push('uk261', 'UK261 claim window', addDays(issueDate, 2190),
      'UK claims run up to 6 years (England & Wales). Long window, real money — £220–£520.', 'UK261');
  }

  push('dot', 'File a DOT complaint (recommended by)', addDays(issueDate, 180),
    'No hard federal cutoff, but file while records are fresh. Airlines must respond within 60 days, and DOT tracks every complaint.',
    'DOT Office of Aviation Consumer Protection');

  return sortDeadlines(out);
}

function sortDeadlines(list: Deadline[]): Deadline[] {
  const rank: Record<DeadlineStatus, number> = { urgent: 0, soon: 1, open: 2, expired: 3 };
  return list.sort((a, b) => rank[a.status] - rank[b.status] || a.daysLeft - b.daysLeft);
}

/** Map a saved trip onto the claim engine's answers, so a claim opens fully answered. */
export function claimAnswers(trip: Trip): Answers {
  // Map only what the trip actually records. Answers that decide the money but that the user never
  // gave (how late, whether a report was filed, the size of a schedule change) are left for the
  // wizard to ask — an entitlement must never be computed from an assumed answer.
  const a: Answers = { type: trip.issue === 'none' ? undefined : trip.issue };
  if (trip.region) a.region = trip.region;
  if (trip.payment) a.payment = trip.payment;
  const date = trip.issueDate || trip.departDate;
  if (date) a.incidentDate = date;
  if (trip.issue === 'cancelled' && trip.traveled) a.traveled = trip.traveled;
  if (trip.issue === 'schedule' && trip.departDate) a.flightDate = trip.departDate;
  if (trip.issue === 'bumped') {
    if (trip.voluntary) a.voluntary = trip.voluntary;
    // "What you paid" can be a round-trip total; it is the one-way fare only on a one-way booking.
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

// "DL1234" -> Delta. Saves typing and picks the right filing channel automatically.
const IATA_TO_NAME: Record<string, string> = {
  DL: 'Delta Air Lines', UA: 'United Airlines', AA: 'American Airlines', WN: 'Southwest Airlines',
  AS: 'Alaska Airlines', B6: 'JetBlue Airways', F9: 'Frontier Airlines', NK: 'Spirit Airlines',
  HA: 'Hawaiian Airlines', G4: 'Allegiant Air',
};
export function airlineFromFlightNo(fn?: string): string | null {
  const m = String(fn || '').trim().toUpperCase().match(/^([A-Z][A-Z0-9])\s*\d{1,4}$/);
  return m ? IATA_TO_NAME[m[1]] || null : null;
}

export function claimDetails(trip: Trip): Details {
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
