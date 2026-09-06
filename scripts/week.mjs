#!/usr/bin/env node
// ─── digest week ─────────────────────────────────────────────────────────────
// Prints one week of a digest as a gate worksheet, or downloads it whole.
//
//   npm run week                        the most recent week of this year
//   npm run week 2025 "January 6"       a named week
//   npm run week 2025 3                 three weeks back
//   npm run week 2025 "January 6" fetch      text for every paper in the week
//   npm run week 2025 "January 6" fetch pdf  text and the PDFs of record

import { pickWeek } from './lib/digest.mjs';
import { fetchText, fetchPdf, sleep, POLITE_MS } from './lib/arxiv.mjs';

// npm strips leading `--` flags before argv reaches us, so the words are
// accepted bare as well: `npm run week 2025 "January 6" fetch pdf`.
const argv = process.argv.slice(2);
const has = (name) => argv.includes(name) || argv.includes(`--${name}`);
const isFlag = (a) => a.startsWith('--') || ['fetch', 'pdf', 'force'].includes(a);

const doFetch = has('fetch');
const wantPdf = has('pdf');
const force = has('force');

let week;
try {
    week = pickWeek(argv.filter((a) => !isFlag(a)));
} catch (err) {
    console.error(err.message);
    process.exit(1);
}

const withId = week.rows.filter((r) => r.id);

console.log(`\n  ${week.heading}`);
console.log(`  ${week.rows.length} papers · ${withId.length} on arXiv · ${week.year}.md\n`);

for (const r of week.rows) {
    console.log(`  ${String(r.n).padStart(2)}. ${r.title}`);
    console.log(`      ${r.id ? `arXiv:${r.id}` : `no arXiv id · ${r.host ?? 'unknown host'}`}`);
}

if (!doFetch) {
    console.log(`\n  Read the digest entries to gate. To pull the week:\n`);
    console.log(`    npm run week ${week.year} "${week.heading.match(/\((.*?)\s*-/)?.[1] ?? ''}" fetch pdf\n`);
    process.exit(0);
}

console.log(`\n  Fetching ${withId.length}${wantPdf ? ' with PDFs' : ''} — ~${Math.ceil((withId.length * 3) / 60)} min at arXiv's request rate\n`);

let text = 0;
let pdfs = 0;
for (const [i, r] of withId.entries()) {
    if (i > 0) await sleep(POLITE_MS);
    const t = await fetchText(r.id, { force });
    let line = `  ${r.id.padEnd(13)} ${(t.mode ?? '').padEnd(14)}`;
    if (!t.skipped) {
        text += 1;
        line += `~${String(t.tokens).padStart(6)} tokens`;
    }
    if (wantPdf) {
        const p = await fetchPdf(r.id, { force });
        if (p.error) line += `  · pdf failed (${p.error})`;
        else if (p.skipped) line += '  · pdf already held';
        else {
            pdfs += 1;
            line += `  · pdf ${Math.round(p.bytes / 1024)}KB`;
        }
    }
    console.log(line);
}

const missing = week.rows.length - withId.length;
console.log(`\n  ${text} text${wantPdf ? `, ${pdfs} PDFs` : ''} → papers/archive/`);
if (missing > 0) console.log(`  ${missing} not on arXiv — file those by hand from their own host.`);
console.log('');
