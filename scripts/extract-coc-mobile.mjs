// Generate mobile/src/data/coc-full.ts from the verified web decode (public/coc-data.js).
// Usage: node scripts/extract-coc-mobile.mjs
// The web file is the source of truth; test/parity.test.js fails if the two ever differ.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const here = path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'));
const root = path.join(here, '..');

const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(readFileSync(path.join(root, 'public/coc-data.js'), 'utf8'), sandbox);
const airlines = JSON.parse(JSON.stringify(sandbox.window.COC_DATA.airlines));

const ts = `// GENERATED from public/coc-data.js by scripts/extract-coc-mobile.mjs — do not hand-edit.
// Each airline's Contract of Carriage, read and adversarially verified: rule numbers, verbatim
// quotes, what to say at the counter, and the catch. Kept identical to the web by test/parity.test.js.
export type CocProvision = {
  topic: string;
  ruleNumber: string;
  ruleNote?: string | null;
  plainEnglish: string;
  exactQuote?: string | null;
  howToUse?: string | null;
  catch?: string | null;
};
export type CocAirline = {
  airline: string;
  iata: string;
  cocUrl: string;
  lastUpdated?: string | null;
  confidence?: string | null;
  scheduleChangeThreshold: string;
  rebooksOnOtherAirlines: string;
  buriedGem?: string | null;
  provisions: CocProvision[];
};

export const COC_FULL: CocAirline[] = ${JSON.stringify(airlines, null, 2)};
`;
writeFileSync(path.join(root, 'mobile/src/data/coc-full.ts'), ts);
console.log(`coc-full.ts: ${airlines.length} airlines, ${airlines.reduce((n, a) => n + (a.provisions || []).length, 0)} provisions`);
