/**
 * Share card + caption text (TS port of public/viral.js; parity-tested).
 * The card image is a native View captured with react-native-view-shot (app/owed.tsx); this module
 * decides what it may say. Only a strong entitlement can be shared, and every word on the card comes
 * from that one entitlement — never a fallback like "CASH", never an outcome narrated as already paid.
 */
import type { Answers, ClaimResult, Details, Entitlement } from '@/lib/claim-engine';

export type ShareCopy = { headline: string; sub: string; panelLabel: string; big: string; rule: string };

// A figure the entitlement LEADS with is exact ("$800 (400% of your fare…)"); a ceiling never leads.
const EXACT = /^\s*(\$[\d,]+|€\s?[\d,]+|£\s?[\d,]+|CAD\s?[\d,]+)(?![\d,]|\s*\/)/;
const ANY_FIGURE = /(\$[\d,]+|€\s?[\d,]+|£\s?[\d,]+|[\d,]+ SDR)/;

// The one entitlement a share card may feature: a strong (firm) claim. Conditional money depends on
// facts we don't know (the cause, the carrier's size), so it never becomes "owes me" in a public post.
function featured(res: ClaimResult): Entitlement | null {
  return (res.entitlements || []).find((e) => e.strength === 'strong') || null;
}

export function pickAmount(res: ClaimResult): string | null {
  const e = featured(res);
  const m = e ? String(e.amountText || '').match(EXACT) : null;
  return m ? m[1].replace(/\s+/g, ' ').trim() : null;
}

export function shareable(res: ClaimResult): boolean {
  return !!featured(res);
}

function airlineName(d: Details): string {
  const n = (d && d.airline ? String(d.airline) : '').trim();
  return n || 'The airline';
}

/** Everything the card says, taken from the featured entitlement. null when there is nothing firm to share. */
export function cardCopy(res: ClaimResult, a: Answers, d: Details): ShareCopy | null {
  const e = featured(res);
  if (!e) return null;
  const al = airlineName(d);
  const rule = e.rule && e.rule !== '—' ? e.rule : 'the rule behind it';
  const title = String(e.title || '');
  if (/lost|damaged/i.test(title)) {
    const cap = (String(e.amountText || '').match(ANY_FIGURE) || [])[1] || '';
    return {
      headline: `${al} has to cover my lost bag.`,
      sub: cap ? `For what I can prove was inside, up to ${cap}.` : 'For what I can prove was inside.',
      panelLabel: 'COVERED UP TO',
      big: cap || 'MY PROVEN LOSS',
      rule,
    };
  }
  const amount = pickAmount(res);
  const pct = String(e.amountText || '').match(/^(\d+)% of /);
  const phrase = amount || (pct ? `${pct[1]}% of my fare` : /full cash refund/i.test(title) ? 'a full refund' : /bag fee/i.test(title) ? 'my bag fee back' : /refund/i.test(title) ? 'a refund' : '');
  return {
    headline: phrase ? `${al} owes me ${phrase}.` : `${al} owes me — here’s the rule.`,
    sub: e.condition ? `Conditions apply: ${e.condition}.` : 'Most people never ask for it.',
    panelLabel: 'THEY OWE ME',
    big: (phrase || 'see the rule').toUpperCase(),
    rule,
  };
}

// Captions state what the rule entitles you to. Nothing is narrated as already paid.
// n.start begins a sentence ("Delta" / "The airline"), n.mid sits inside one ("Delta" / "the airline"),
// n.adj qualifies a noun ("Delta " / "") so "an oversold flight" never reads "an oversold The airline flight".
type Name = { start: string; mid: string; adj: string };
const HOOKS: Record<string, ((n: Name, amt: string | null, cap: string) => string)[]> = {
  bumped: [
    (n, amt) => `Bumped from an oversold ${n.adj}flight? The federal bumping rule says that's ${amt ? amt + ' in cash' : 'cash'} — a voucher only if you choose one. Most people take the voucher and never check. ✈️`,
    (n, amt) => `If you're forced off an oversold flight leaving a U.S. airport, the airline owes you cash under 14 CFR 250.5${amt ? ` — for this ${n.adj}flight, ${amt}` : ''}. Worth knowing before you fly. ✈️`,
  ],
  cancelled: [
    (n) => `If your flight is canceled and you don't take the rebooking, you're owed a cash refund to your card — not a travel credit, even if that's all they offer. ${n.start} canceled mine; here's the rule. 💸`,
    (n) => `Canceled flight, and you chose not to fly? Federal rule 14 CFR Part 260 requires a refund to your original payment, not a voucher. Checking what ${n.mid} owes me. 💸`,
  ],
  schedule: [
    (n) => `${n.start} changed my flight by hours. Under 14 CFR 260, a change that big means a full refund if you decline it — even on a nonrefundable fare. Most people just accept the new time. ✈️`,
  ],
  bag_late: [
    (n) => `If your checked bag shows up late and you filed a report, the bag fee is refundable under federal rules. Asking ${n.mid} for mine — most people never do. 🧳`,
  ],
  bag_lost: [
    (n, _amt, cap) => `If an airline loses your bag, it has to cover what you can prove was inside${cap ? ` — up to ${cap}` : ''}. ${n.start} lost mine. Here's how the limit works. 🧳`,
  ],
  downgrade: [
    (n) => `Downgraded to a lower cabin and refused to fly it? Under 14 CFR 260 that's a full refund of the fare. Asking ${n.mid} for mine. ✈️`,
  ],
  extra: [
    (n) => `Paid ${n.mid} for Wi-Fi or a seat you never got? That's refundable under federal rules. Most people never ask — here's how. 💸`,
  ],
};

// The hook follows the featured entitlement, not just the incident type (a missing bag can surface as a lost-bag claim).
function hookKey(e: Entitlement, a: Answers): string {
  const t = String(e.title || '');
  if (/lost|damaged/i.test(t)) return 'bag_lost';
  if (/bag fee/i.test(t)) return 'bag_late';
  if (/forced off/i.test(t)) return 'bumped';
  if (/unused service/i.test(t)) return 'extra';
  return String(a && a.type);
}

export function caption(res: ClaimResult, a: Answers, d: Details, variant = 0): string {
  const e = featured(res);
  if (!e) return '';
  const al = airlineName(d);
  const named = al !== 'The airline';
  const n: Name = { start: al, mid: named ? al : 'the airline', adj: named ? al + ' ' : '' };
  const amt = pickAmount(res);
  const cap = (String(e.amountText || '').match(ANY_FIGURE) || [])[1] || '';
  const list = HOOKS[hookKey(e, a)] || [(x: Name) => `Turns out there's a rule for this. Checking what ${x.mid} owes me — took about 2 minutes. 👇`];
  const hook = list[variant % list.length](n, amt, cap);
  const slug = named ? '#' + al.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + 'tok' : null;
  const tags = ['#airlinetok', '#traveltok', '#consumerrights', '#knowyourrights', '#passengerrights', '#travelhack', '#fyp', '#foryou', slug].filter(Boolean).join(' ');
  return `${hook}\n\nMost people never check what they're owed — took me about 2 minutes.\n\n${tags}`;
}
