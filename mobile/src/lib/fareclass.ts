/**
 * Fare-class decoder — the one letter on a ticket that decides certificate eligibility,
 * upgrades, and change/refund rights. Faithful TS port of web public/fareclass.js (locked by
 * test/fareclass.test.js); keep in sync. Certificate mapping is the verified companion.js map;
 * the wider hierarchy is the typical published structure, marked `certain: false`.
 */

export type TierId = 'platinum' | 'reserve';
type CabinKey = 'MAIN' | 'COMFORT' | 'PREMIUM_SELECT' | 'FIRST';

const CERT: Record<CabinKey, string[]> = {
  MAIN: ['L', 'U', 'T', 'X', 'V'],
  COMFORT: ['W', 'S'],
  PREMIUM_SELECT: ['A', 'G'],
  FIRST: ['I', 'Z'],
};
const CABIN_LABEL: Record<CabinKey, string> = {
  MAIN: 'Main Cabin',
  COMFORT: 'Comfort+',
  PREMIUM_SELECT: 'Premium Select',
  FIRST: 'First Class',
};

type ClassInfo = { cabin: CabinKey; tier: string; certain?: boolean; note?: string };
const CLASSES: Record<string, ClassInfo> = {
  E: { cabin: 'MAIN', tier: 'Basic Economy', certain: true, note: 'The stripped fare. No seat selection, no changes, no refunds, last boarding group, no upgrades — and your companion certificate can never be used on it.' },
  L: { cabin: 'MAIN', tier: 'Discount Main Cabin', certain: true },
  U: { cabin: 'MAIN', tier: 'Discount Main Cabin', certain: true },
  T: { cabin: 'MAIN', tier: 'Discount Main Cabin', certain: true },
  X: { cabin: 'MAIN', tier: 'Discount Main Cabin', certain: true },
  V: { cabin: 'MAIN', tier: 'Discount Main Cabin', certain: true },
  K: { cabin: 'MAIN', tier: 'Mid Main Cabin' },
  Q: { cabin: 'MAIN', tier: 'Mid Main Cabin' },
  H: { cabin: 'MAIN', tier: 'Mid Main Cabin' },
  M: { cabin: 'MAIN', tier: 'Flexible Main Cabin' },
  B: { cabin: 'MAIN', tier: 'Flexible Main Cabin' },
  Y: { cabin: 'MAIN', tier: 'Full-fare Main Cabin', note: 'The most expensive and most flexible economy fare. Usually changeable and refundable.' },
  W: { cabin: 'COMFORT', tier: 'Comfort+', certain: true },
  S: { cabin: 'COMFORT', tier: 'Comfort+', certain: true },
  A: { cabin: 'PREMIUM_SELECT', tier: 'Premium Select', certain: true },
  G: { cabin: 'PREMIUM_SELECT', tier: 'Premium Select', certain: true },
  P: { cabin: 'PREMIUM_SELECT', tier: 'Premium Select' },
  I: { cabin: 'FIRST', tier: 'First Class', certain: true },
  Z: { cabin: 'FIRST', tier: 'First Class', certain: true },
  J: { cabin: 'FIRST', tier: 'Delta One / Business', note: 'Delta One is expressly excluded from the companion certificate.' },
  C: { cabin: 'FIRST', tier: 'Delta One / Business', note: 'Delta One is expressly excluded from the companion certificate.' },
  D: { cabin: 'FIRST', tier: 'Delta One / Business', note: 'Delta One is expressly excluded from the companion certificate.' },
  F: { cabin: 'FIRST', tier: 'First Class (full fare)' },
};

export type CertVerdict = { ok: boolean; cabin?: string; why?: string; upgradeHint?: boolean };

function certEligibility(code: string, tierId?: string): CertVerdict {
  const tier: TierId = tierId === 'reserve' ? 'reserve' : 'platinum';
  const allowed = tier === 'reserve'
    ? [...CERT.MAIN, ...CERT.COMFORT, ...CERT.PREMIUM_SELECT, ...CERT.FIRST]
    : [...CERT.MAIN];
  if (allowed.includes(code)) {
    const cabin = (Object.keys(CERT) as CabinKey[]).find((k) => CERT[k].includes(code))!;
    return { ok: true, cabin: CABIN_LABEL[cabin] };
  }
  if (code === 'E') return { ok: false, why: 'Basic Economy is never eligible, on any card.' };
  const isReserveOnly = [...CERT.COMFORT, ...CERT.PREMIUM_SELECT, ...CERT.FIRST].includes(code);
  if (isReserveOnly && tier === 'platinum') {
    const cabin = (Object.keys(CERT) as CabinKey[]).find((k) => CERT[k].includes(code))!;
    return { ok: false, why: `${CABIN_LABEL[cabin]} is covered by the Reserve card, not Platinum. Your Platinum certificate only tickets Main Cabin (L/U/T/X/V).`, upgradeHint: true };
  }
  const info = CLASSES[code];
  if (info && info.cabin === 'MAIN') {
    return { ok: false, why: 'This is a higher-priced Main Cabin bucket. The certificate only tickets the discount band — L, U, T, X or V — and only when those seats are open for sale.' };
  }
  if (info && /Delta One/.test(info.tier)) {
    return { ok: false, why: 'Delta One is expressly excluded from the companion certificate.' };
  }
  return { ok: false, why: 'This class isn’t in the certificate’s eligible buckets.' };
}

export type Decoded = {
  code: string;
  known: boolean;
  summary?: string;
  cabin?: string;
  tier?: string;
  certain?: boolean;
  note?: string | null;
  cert: CertVerdict;
  flexibility?: string;
};

export function decode(raw: unknown, tierId?: string): Decoded | null {
  const code = String(raw || '').trim().toUpperCase().slice(0, 1);
  if (!/^[A-Z]$/.test(code)) return null;
  const info = CLASSES[code];
  if (!info) {
    return {
      code, known: false,
      summary: `“${code}” isn’t one of Delta’s common published classes. Airlines do rotate inventory codes — check your confirmation or ask the airline what cabin it books into.`,
      cert: certEligibility(code, tierId),
    };
  }
  return {
    code,
    known: true,
    cabin: CABIN_LABEL[info.cabin],
    tier: info.tier,
    certain: !!info.certain,
    note: info.note || null,
    cert: certEligibility(code, tierId),
    flexibility: flexibilityOf(code, info),
  };
}

function flexibilityOf(code: string, info: ClassInfo): string {
  if (code === 'E') return 'No changes, no refunds, no seat selection, boards last.';
  if (/Full-fare|Flexible/.test(info.tier)) return 'Generally the most flexible fares — often changeable, sometimes refundable. You paid for that.';
  if (/Discount|Mid/.test(info.tier)) return 'Changeable without a change fee on most Delta fares (you pay any fare difference), but not refundable for cash.';
  return 'Premium-cabin fares vary widely — check the fare rules on your confirmation.';
}

export function eligibleList(tierId?: string): { cabin: string; codes: string[] }[] {
  const tier: TierId = tierId === 'reserve' ? 'reserve' : 'platinum';
  const out = [{ cabin: CABIN_LABEL.MAIN, codes: CERT.MAIN }];
  if (tier === 'reserve') {
    out.push({ cabin: CABIN_LABEL.COMFORT, codes: CERT.COMFORT });
    out.push({ cabin: CABIN_LABEL.PREMIUM_SELECT, codes: CERT.PREMIUM_SELECT });
    out.push({ cabin: CABIN_LABEL.FIRST, codes: CERT.FIRST });
  }
  return out;
}
