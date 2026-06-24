// airlines.js — verified filing directory for the major U.S. carriers.
//
// Researched + adversarially fact-checked against each airline's OFFICIAL site (mid-2026).
// KEY FINDING: only JetBlue publishes a real customer-relations email (dearjetblue@jetblue.com,
// confirmed via JetBlue's own verified account). Every other carrier is web-form-only — the
// emails that float around third-party "contact" sites for United/American/Allegiant were checked
// and are unverified/bouncing, so we deliberately do NOT use them (a wrong address = a lost claim).
// Spirit ceased operations May 2, 2026 (now a bankruptcy claims process), flagged `defunct`.
//
// Per airline: email (null = web form only), refundUrl, complaintUrl, phone, short note.
window.AIRLINES = [
  {
    name: 'Delta Air Lines', iata: 'DL', email: null,
    refundUrl: 'https://www.delta.com/refund-form',
    complaintUrl: 'https://www.delta.com/us/en/need-help/overview?commentComplaintsForm',
    phone: '800-221-1212',
    note: 'Web form only (no public email). Refund: delta.com/refund-form; status: delta.com/refund-status. Must respond in writing within 60 days.',
  },
  {
    name: 'United Airlines', iata: 'UA', email: null,
    refundUrl: 'https://www.united.com/en/us/refunds',
    complaintUrl: 'https://www.united.com/en/us/customercare/',
    phone: '800-864-8331',
    note: 'Web form only. (The "customercare@united.com" seen on other sites is NOT confirmed — don’t rely on it.) Sign in to MileagePlus to prefill the refund form.',
  },
  {
    name: 'American Airlines', iata: 'AA', email: null,
    refundUrl: 'https://prefunds.aa.com/refunds/',
    complaintUrl: 'https://www.aa.com/contact/forms?topic=CR',
    phone: '800-433-7300',
    note: 'Web form only; AA’s old customer-relations emails are bouncing/unmonitored. Refunds via prefunds.aa.com. Targets 7 business days (card) / 20 (cash).',
  },
  {
    name: 'Southwest Airlines', iata: 'WN', email: null,
    refundUrl: 'https://support.southwest.com/helpcenter/s/request-ticket-refund',
    complaintUrl: 'https://support.southwest.com/email-us/s/',
    phone: '800-435-9792',
    note: 'Web form only. Refund/complaint line: 1-855-234-4654.',
  },
  {
    name: 'Alaska Airlines', iata: 'AS', email: null,
    refundUrl: 'https://www.alaskaair.com/booking/ssl/refunds/cancelreservation.aspx',
    complaintUrl: 'https://www.alaskaair.com/feedback/general-comments',
    phone: '800-252-7522',
    note: 'Web form only. Feedback via the Customer Care general-comments form. 7 business days (card) / 20 (cash) for refundable tickets.',
  },
  {
    name: 'JetBlue Airways', iata: 'B6', email: 'dearjetblue@jetblue.com', emailConfirmed: true,
    refundUrl: 'https://www.jetblue.com/help/refunds',
    complaintUrl: 'https://www.jetblue.com/contact-us/share-a-concern',
    phone: '800-538-2583',
    note: 'Has a real customer-relations email: dearjetblue@jetblue.com (typical reply 1–5 business days). Preferred form: jetblue.com/contact-us/share-a-concern.',
  },
  {
    name: 'Frontier Airlines', iata: 'F9', email: null,
    refundUrl: 'https://www.flyfrontier.com/refund-options/',
    complaintUrl: 'https://frontiercswprod.powerappsportals.com/contact-us/request-complaint-form/',
    phone: '801-401-9000',
    note: 'Web form only (media@flyfrontier.com is PRESS ONLY — not for claims). Refunds processed within 7 business days.',
  },
  {
    name: 'Hawaiian Airlines', iata: 'HA', email: null,
    refundUrl: 'https://www.hawaiianairlines.com/refunds',
    complaintUrl: 'https://www.hawaiianairlines.com/contact-us/email/request',
    phone: '800-367-5320',
    note: 'Web form only. Consumer Affairs Office responds within 30 days. Now part of Alaska Air Group; some pages redirect to Alaska.',
  },
  {
    name: 'Allegiant Air', iata: 'G4', email: null,
    refundUrl: 'https://www.allegiantair.com/customer-service-plan',
    complaintUrl: 'https://www.allegiantair.com/contactus',
    phone: '702-505-8888',
    note: 'Web form only (the customer.relations@/exec emails on third-party sites are unverified — don’t rely on them). Refund policy on the Customer Service Plan page.',
  },
  {
    name: 'Spirit Airlines (ceased operations 2026)', iata: 'NK', email: null, defunct: true,
    refundUrl: 'https://www.spirit.com/mytrips',
    complaintUrl: 'https://www.spiritrestructuring.com/guests',
    phone: '855-952-6606',
    note: 'CEASED OPERATIONS May 2, 2026 (liquidation). Card purchases auto-refund to original payment — check spirit.com/MyTrips. Vouchers/points go through the bankruptcy court (claims agent Epiq: SpiritAirlinesInfo@epiqglobal.com).',
  },
];
