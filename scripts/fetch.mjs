#!/usr/bin/env node
// ─── fetch papers by id ──────────────────────────────────────────────────────
//   npm run fetch 2501.04519                 text only
//   npm run fetch 2501.04519 2501.04682      several, politely spaced
//   npm run fetch 2501.04519 pdf             text + the PDF of record

import { fetchText, fetchPdf, sleep, POLITE_MS } from './lib/arxiv.mjs';

// npm strips leading `--` flags, so `pdf` and `force` are accepted bare too.
const args = process.argv.slice(2);
const has = (name) => args.includes(name) || args.includes(`--${name}`);
const wantPdf = has('pdf');
const force = has('force');
const ids = args.filter((a) => !a.startsWith('--') && !['pdf', 'force'].includes(a));

if (ids.length === 0) {
    console.error('usage: npm run fetch [pdf] [force] <arxiv-id> [more ids...]');
    process.exit(1);
}

console.log('');
for (const [i, raw] of ids.entries()) {
    if (i > 0) await sleep(POLITE_MS);
    const t = await fetchText(raw, { force });
    if (t.skipped) {
        console.log(`  ${t.id.padEnd(16)} ${t.mode}`);
        continue;
    }
    let line = `  ${t.id.padEnd(16)} ${t.mode.padEnd(14)} ~${String(t.tokens).padStart(6)} tokens`;
    if (wantPdf) {
        const p = await fetchPdf(raw, { force });
        line += p.error ? `  · pdf failed (${p.error})` : p.skipped ? '  · pdf already held' : `  · pdf ${Math.round(p.bytes / 1024)}KB`;
    }
    console.log(line);
}
console.log('');
