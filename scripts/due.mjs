#!/usr/bin/env node
// ─── confirmation sweep ──────────────────────────────────────────────────────
// Lists candidates whose pre-registered resolver has come due and whose
// confirmation log is still open. This is step 1 of the weekly pass, and it runs
// first so that a long scoring queue can never crowd it out.

import fs from 'node:fs';
import path from 'node:path';

const DIR = path.join(process.cwd(), 'context', 'ai', 'candidates');
const now = new Date().toISOString().slice(0, 7); // YYYY-MM

let files;
try {
    files = fs.readdirSync(DIR).filter((f) => f.endsWith('.md'));
} catch {
    console.log('\n  No ledger yet — context/ai/candidates/ is empty.\n');
    process.exit(0);
}

const rows = [];
for (const file of files) {
    const text = fs.readFileSync(path.join(DIR, file), 'utf-8');
    const due = text.match(/^Due:\s*(\d{4}-\d{2})/m)?.[1];
    if (!due) continue; // unscored, or not yet frozen

    // A resolved candidate has confirmed or failed in its log; anything else is open.
    const resolved = /^-\s.*\b(confirmed|failed)\b/mi.test(text);
    if (resolved || due > now) continue;

    rows.push({
        file,
        due,
        title: text.match(/^#\s+(.+)$/m)?.[1] ?? file,
        verdict: text.match(/^Verdict:\s*(\S+)/m)?.[1] ?? '?',
        score: text.match(/^I³ score:.*=\s*(\d+)/m)?.[1] ?? '?',
    });
}

if (rows.length === 0) {
    console.log(`\n  Nothing due as of ${now}. ${files.length} in the ledger.\n`);
    process.exit(0);
}

rows.sort((a, b) => a.due.localeCompare(b.due));
console.log(`\n  ${rows.length} due as of ${now}\n`);
for (const r of rows) {
    console.log(`  ${r.due}  I³ ${String(r.score).padStart(4)}  ${r.verdict.padEnd(10)} ${r.title}`);
    console.log(`            context/ai/candidates/${r.file}\n`);
}
console.log('  Append to section 7. Do not touch sections 3–6.\n');
