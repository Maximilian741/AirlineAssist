/**
 * Viral caption + hashtag generator (TS port of the caption logic in public/viral.js).
 * The card image itself is rendered as a native View and captured with react-native-view-shot
 * (see app/owed.tsx) — only the text-generation logic lives here.
 */
import type { Answers, ClaimResult, Details } from '@/lib/claim-engine';

export function pickAmount(res: ClaimResult): string | null {
  const cash = (e?: { amountText?: string }) => !!e && /\$|€|£|CAD/.test(e.amountText || '');
  const e = res.entitlements.find((x) => x.strength === 'strong' && cash(x)) || res.entitlements.find((x) => x.strength === 'conditional' && cash(x));
  if (!e) return null;
  const m = (e.amountText || '').match(/(\$[\d,]+|€\s?\d[\d,]*|£\s?\d[\d,]*|CAD\s?[\d,]+)/);
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

export function topRule(res: ClaimResult): string {
  const e = res.entitlements.find((x) => x.rule && x.rule !== '—');
  return e ? e.rule : 'federal law';
}

function airlineName(d: Details): string {
  const n = (d && d.airline ? String(d.airline) : '').trim();
  return n || 'The airline';
}

const HOOKS: Record<string, ((al: string, amt: string) => string)[]> = {
  bumped: [
    (al, amt) => `Got bumped from an oversold ${al} flight? They offered me a voucher — but federal law says I'm owed ${amt} in cash. Most people take the voucher and never find out. ✈️`,
    (al, amt) => `If you're bumped from an oversold flight, the airline owes you cash — not a meal voucher. ${al} owed me ${amt} under federal bumping rules. Worth knowing before you fly. ✈️`,
    (al, amt) => `Offered a small voucher after a bump, when the legal amount was ${amt}. The federal rule sets the cash you're owed — here's how I checked mine. 👇`,
  ],
  cancelled: [
    (al) => `If your flight is canceled, you can take a cash refund instead of a travel credit — even if they only offer the credit. ${al} canceled mine; I got my money back. Most people don't know they can. 💸`,
    (al) => `When a flight is canceled, federal rule 14 CFR Part 260 lets you request a cash refund to your original card instead of a credit. That's how I got mine back from ${al}. 💸`,
    (al) => `After a cancellation you're entitled to a full cash refund, not just a voucher. ${al} canceled on me and I got the refund. Here's the rule and how to claim it. 👇`,
  ],
  delayed: [
    (al) => `Delayed for hours? Depending on the cause, the airline may owe you meals, a hotel, and rebooking. Here's what the rules actually require — most people never ask. ✈️`,
    (al) => `Delayed by ${al} for hours? Meals, a hotel, and rebooking may be on the airline. Here's the rule that says so, and how to ask. 👇`,
  ],
  bag_late: [
    (al) => `If your checked bag shows up late, federal rules let you get your bag fee refunded. ${al} owed me mine. Most people never request it. 🧳`,
    (al) => `If your checked bag arrives late, federal law says the bag fee gets refunded. ${al} owed me mine — here's how to claim it. 🧳`,
  ],
  bag_lost: [(al, amt) => `If an airline loses your bag, compensation is capped at ${amt} by law — and you can claim up to that for what was inside. ${al} lost mine. Here's how the limit works. 🧳`],
  downgrade: [(al) => `Downgraded to a cheaper seat than you paid for? You're owed the fare difference back, by law. ${al} downgraded me — most people never claim the refund. ✈️`],
  extra: [(al) => `Paid ${al} for Wi-Fi or a seat you never got to use? That's a refund under federal law. Most people never ask — here's how. 💸`],
};

export function caption(res: ClaimResult, a: Answers, d: Details, variant = 0): string {
  const al = airlineName(d);
  const amt = pickAmount(res) || 'real money';
  const list = HOOKS[a.type as string] || [(x: string, m: string) => `Turns out ${x} owes ${m} here under the rules — something most travelers never check. Found out in a couple of minutes. 👇`];
  const hook = list[variant % list.length](al, amt);
  const slug = al !== 'The airline' ? '#' + al.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + 'tok' : null;
  const tags = ['#airlinetok', '#traveltok', '#consumerrights', '#knowyourrights', '#passengerrights', '#travelhack', '#fyp', '#foryou', slug].filter(Boolean).join(' ');
  return `${hook}\n\nMost people never check what they're owed — took me about 2 minutes.\n\n${tags}`;
}

export function bigAmount(res: ClaimResult, a: Answers): string {
  const amt = pickAmount(res);
  if (amt) return amt;
  return ['cancelled', 'extra', 'downgrade'].includes(a.type as string) ? 'A FULL REFUND' : 'CASH';
}
