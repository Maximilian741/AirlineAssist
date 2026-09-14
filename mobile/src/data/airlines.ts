/**
 * Verified U.S. airline filing directory (TS port of public/airlines.js).
 * Fact-checked against official sites mid-2026. Only JetBlue has a confirmed public email;
 * every other carrier is web-form-only (unverified third-party emails deliberately omitted).
 * Spirit ceased operations May 2026 (defunct). Keep in sync with the web copy.
 */
export type Airline = {
  name: string;
  iata: string;
  email: string | null;
  refundUrl: string;
  complaintUrl: string;
  phone?: string;
  note?: string;
  defunct?: boolean;
};

export const AIRLINES: Airline[] = [
  { name: 'Delta Air Lines', iata: 'DL', email: null, refundUrl: 'https://www.delta.com/refund-form', complaintUrl: 'https://www.delta.com/us/en/need-help/overview?commentComplaintsForm', phone: '800-221-1212', note: 'Web form only (no public email). Must respond in writing within 60 days.' },
  { name: 'United Airlines', iata: 'UA', email: null, refundUrl: 'https://www.united.com/en/us/refunds', complaintUrl: 'https://www.united.com/en/us/customercare/', phone: '800-864-8331', note: 'Web form only. The “customercare@united.com” seen elsewhere is NOT confirmed.' },
  { name: 'American Airlines', iata: 'AA', email: null, refundUrl: 'https://prefunds.aa.com/refunds/', complaintUrl: 'https://www.aa.com/contact/forms?topic=CR', phone: '800-433-7300', note: 'Web form only; old emails bounce. Targets 7 business days (card) / 20 (cash).' },
  { name: 'Southwest Airlines', iata: 'WN', email: null, refundUrl: 'https://support.southwest.com/helpcenter/s/request-ticket-refund', complaintUrl: 'https://support.southwest.com/email-us/s/', phone: '800-435-9792', note: 'Web form only. Refund/complaint line: 1-855-234-4654.' },
  { name: 'Alaska Airlines', iata: 'AS', email: null, refundUrl: 'https://www.alaskaair.com/booking/ssl/refunds/cancelreservation.aspx', complaintUrl: 'https://www.alaskaair.com/feedback/general-comments', phone: '800-252-7522', note: 'Web form only. 7 business days (card) / 20 (cash) for refundable tickets.' },
  { name: 'JetBlue Airways', iata: 'B6', email: 'dearjetblue@jetblue.com', refundUrl: 'https://www.jetblue.com/help/refunds', complaintUrl: 'https://www.jetblue.com/contact-us/share-a-concern', phone: '800-538-2583', note: 'Has a real customer-relations email: dearjetblue@jetblue.com (reply ~1–5 business days).' },
  { name: 'Frontier Airlines', iata: 'F9', email: null, refundUrl: 'https://www.flyfrontier.com/refund-options/', complaintUrl: 'https://frontiercswprod.powerappsportals.com/contact-us/request-complaint-form/', phone: '801-401-9000', note: 'Web form only (media@flyfrontier.com is PRESS ONLY). Refunds within 7 business days.' },
  { name: 'Hawaiian Airlines', iata: 'HA', email: null, refundUrl: 'https://www.hawaiianairlines.com/refunds', complaintUrl: 'https://www.hawaiianairlines.com/contact-us/email/request', phone: '800-367-5320', note: 'Web form only. Consumer Affairs responds within 30 days. Now part of Alaska Air Group.' },
  { name: 'Allegiant Air', iata: 'G4', email: null, refundUrl: 'https://www.allegiantair.com/customer-service-plan', complaintUrl: 'https://www.allegiantair.com/contactus', phone: '702-505-8888', note: 'Web form only (third-party exec emails are unverified).' },
  { name: 'Spirit Airlines (ceased operations 2026)', iata: 'NK', email: null, defunct: true, refundUrl: 'https://www.spirit.com/mytrips', complaintUrl: 'https://www.spiritrestructuring.com/guests', phone: '855-952-6606', note: 'CEASED OPERATIONS May 2026. Card purchases auto-refund — check spirit.com/MyTrips. Vouchers/points via bankruptcy (Epiq: SpiritAirlinesInfo@epiqglobal.com).' },
];
