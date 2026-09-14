// Turn research JSON (scripts/research/) into the shipped data files: web window globals + mobile TS.
// Usage: node scripts/extract-scorecard.mjs [inputDir]
//   scripts/research/scorecard.json -> public/scorecard-data.js + mobile/src/data/scorecard.ts
//   scripts/research/faredrop.json  -> public/faredrop-data.js  + mobile/src/data/faredrop.ts
// Regenerate these files here — never hand-edit the generated outputs.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const root = path.join(here, '..');
const inDir = process.argv[2] || path.join(here, 'research');

const num = (v) => (v == null || v === '' ? null : (typeof v === 'number' ? v : Number(String(v).replace(/[^0-9.\-]/g, ''))));
const clean = (v) => (v == null ? null : String(v).replace(/\s+/g, ' ').trim());
const nn = (v) => (v == null || Number.isNaN(v) ? null : v);

// ---------------- scorecard (DOT Air Travel Consumer Report) ----------------
const scPath = path.join(inDir, 'scorecard.json');
if (existsSync(scPath)) {
  const raw = JSON.parse(readFileSync(scPath, 'utf8'));
  // Prefer YEAR-TO-DATE: one consistent period across every column; monthly is a fallback.
  const ri = raw.report?.industry || {};
  const report = raw.report ? {
    title: clean(raw.report.title), url: clean(raw.report.url), publishedDate: clean(raw.report.publishedDate),
    period: 'January–June 2026 (year to date; bumping Jan–Jun 2026)',
    industry: {
      onTimePct: nn(num(ri.onTimePctYTD ?? ri.onTimePct)),
      cancelledPct: nn(num(ri.cancelledPctYTD ?? ri.cancelledPct)),
      mishandledBagsRate: nn(num(ri.mishandledBagsRateYTD ?? ri.mishandledBagsRate)),
      mishandledMetricName: clean(ri.mishandledMetricName),
      complaintsPer100k: nn(num(ri.complaintsPer100k)),
      involuntaryDBPer10k: nn(num(ri.involuntaryDBPer10kYTD ?? ri.involuntaryDBPer10k)),
      involuntaryDBPeriod: ri.involuntaryDBPer10kYTD != null ? 'Jan–Jun 2026' : clean(ri.involuntaryDBPeriod),
    },
  } : null;
  const airlines = (raw.airlines || []).map((a) => {
    const y = a.ytd || {};
    const pick = (k) => nn(num(y[k] ?? a[k]));
    return {
      iata: clean(a.iata), name: clean(a.name), defunct: !!a.defunct || /ceased operations/i.test(a.notes || ''),
      onTimePct: pick('onTimePct'), onTimeRank: clean(y.onTimeRank ?? a.onTimeRank),
      cancelledPct: pick('cancelledPct'),
      mishandledBagsRate: pick('mishandledBagsRate'),
      involuntaryDBPer10k: pick('involuntaryDBPer10k'),
      complaintsPer100k: nn(num(y.complaintsPer100kComputed ?? a.complaintsPer100k)),
      period: y.period ? clean(y.period) : clean(a.period),
      notes: clean(a.notes),
    };
  }).filter((a) => a.iata);
  const banner = '// GENERATED from the U.S. DOT Air Travel Consumer Report by scripts/extract-scorecard.mjs — do not hand-edit.\n' +
    `// Report: ${report?.title || '?'} (${report?.url || '?'}), period ${report?.period || '?'}.\n`;
  writeFileSync(path.join(root, 'public/scorecard-data.js'), banner + 'window.SCORECARD = ' + JSON.stringify({ report, airlines }, null, 2) + ';\n');
  const ts = banner +
    "export type ScorecardAirline = { iata: string | null; name: string | null; defunct: boolean; onTimePct: number | null; onTimeRank: string | null; cancelledPct: number | null; mishandledBagsRate: number | null; involuntaryDBPer10k: number | null; complaintsPer100k: number | null; period: string | null; notes: string | null };\n" +
    "export type ScorecardIndustry = { onTimePct: number | null; cancelledPct: number | null; mishandledBagsRate: number | null; mishandledMetricName: string | null; complaintsPer100k: number | null; involuntaryDBPer10k: number | null; involuntaryDBPeriod: string | null };\n" +
    "export type ScorecardReport = { title: string | null; url: string | null; publishedDate: string | null; period: string | null; industry: ScorecardIndustry } | null;\n" +
    'export const SCORECARD_REPORT: ScorecardReport = ' + JSON.stringify(report, null, 2) + ';\n' +
    'export const SCORECARD: ScorecardAirline[] = ' + JSON.stringify(airlines, null, 2) + ';\n';
  writeFileSync(path.join(root, 'mobile/src/data/scorecard.ts'), ts);
  console.log(`scorecard: ${airlines.length} airlines, report ${report?.period}`);
} else console.log('scorecard.json not present — skipped (existing generated files kept)');

// ---------------- fare-drop policies (per-airline, verified) ----------------
const fdPath = path.join(inDir, 'faredrop.json');
if (existsSync(fdPath)) {
  const raw = JSON.parse(readFileSync(fdPath, 'utf8'));
  const airlines = (raw.airlines || []).map((a) => ({
    iata: clean(a.iata), name: clean(a.name), defunct: !!a.defunct,
    canReprice: a.canReprice === 'partial' ? 'partial' : !!a.canReprice,
    refundForm: clean(a.refundForm) || 'none',
    changeFee: clean(a.changeFee), changeFeeNum: nn(num(a.changeFeeNum)),
    basicEconomy: clean(a.basicEconomy), creditExpiry: clean(a.creditExpiry),
    howTo: Array.isArray(a.howTo) ? a.howTo.map(clean).filter(Boolean) : [],
    sameDayNote: clean(a.sameDayNote),
    sourceUrls: Array.isArray(a.sourceUrls) ? a.sourceUrls.map(clean).filter(Boolean) : [],
    notes: clean(a.notes),
  }));
  const banner = '// GENERATED from each airline\'s published change/cancel policy (researched + adversarially verified) by scripts/extract-scorecard.mjs — do not hand-edit.\n';
  writeFileSync(path.join(root, 'public/faredrop-data.js'), banner + 'window.FAREDROP = ' + JSON.stringify({ verifiedDate: clean(raw.verifiedDate), airlines }, null, 2) + ';\n');
  const ts = banner +
    "export type FareDropPolicy = { iata: string | null; name: string | null; defunct: boolean; canReprice: boolean | 'partial'; refundForm: string; changeFee: string | null; changeFeeNum: number | null; basicEconomy: string | null; creditExpiry: string | null; howTo: string[]; sameDayNote: string | null; sourceUrls: string[]; notes: string | null };\n" +
    'export const FAREDROP_VERIFIED: string | null = ' + JSON.stringify(clean(raw.verifiedDate)) + ';\n' +
    'export const FAREDROP: FareDropPolicy[] = ' + JSON.stringify(airlines, null, 2) + ';\n';
  writeFileSync(path.join(root, 'mobile/src/data/faredrop.ts'), ts);
  console.log(`faredrop: ${airlines.length} airlines, verified ${clean(raw.verifiedDate)}`);
} else console.log('faredrop.json not present — skipped');
