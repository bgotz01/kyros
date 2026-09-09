#!/usr/bin/env node
// ─── hf ──────────────────────────────────────────────────────────────────────
// Asks Hugging Face which repository each archived paper released, and stores
// the answers in papers/archive/hf.json.
//
//   npm run hf                 every archived paper not asked about yet
//   npm run hf all             ask again for all of them — HF gains repos over
//                              time, so a paper that had none may now have one
//   npm run hf 2501.19393      one paper
//   npm run hf status          what is stored — asks nothing
//
// Free, and no key. HF names one repository per paper where the archive sweep
// can only offer every github.com link the prose happens to contain, so this is
// the cheapest lift available on the question the external seat is paid to
// answer: which of these repositories is the paper's own?
//
// It settles nothing on its own. The repository lands in the candidate list for
// POST /api/engine/external to judge alongside the ones the paper names itself,
// and nothing here reaches a score.

import fs from 'node:fs';
import path from 'node:path';
import { fetchHfPaper, readHf, writeHf, hfPath, POLITE_MS } from './lib/hf.mjs';
import { sleep } from './lib/arxiv.mjs';

const argv = process.argv.slice(2);
const has = (n) => argv.includes(n) || argv.includes(`--${n}`);
const only = argv.find((a) => /^\d{4}\.\d{4,5}$/.test(a));

/** Every paper the archive holds text for, oldest first. */
function archived() {
    const root = path.join(process.cwd(), 'papers', 'archive');
    if (!fs.existsSync(root)) return [];
    const out = [];
    for (const year of fs.readdirSync(root).filter((d) => /^\d{4}$/.test(d)).sort()) {
        for (const f of fs.readdirSync(path.join(root, year)).sort()) {
            const m = f.match(/^(\d{4}\.\d{4,5})(?:v\d+)?\.md$/);
            if (m) out.push(m[1]);
        }
    }
    return [...new Set(out)];
}

const store = readHf();
const ids = archived();

if (ids.length === 0) {
    console.error('\n  Nothing in papers/archive/. Run `npm run pull` first.\n');
    process.exit(1);
}

// ── status ───────────────────────────────────────────────────────────────────
if (has('status')) {
    const rows = ids.map((id) => store.papers[id]).filter(Boolean);
    const withRepo = rows.filter((r) => r.repo).length;
    const known = rows.filter((r) => !r.repo && !r.absent).length;
    const absent = rows.filter((r) => r.absent).length;
    console.log(`\n  ${rows.length}/${ids.length} papers asked about${store.checked ? ` · last ${store.checked}` : ''}`);
    console.log(`\n  ${String(withRepo).padStart(4)} name a repository on HF`);
    console.log(`  ${String(known).padStart(4)} on HF, no repository named`);
    console.log(`  ${String(absent).padStart(4)} not on HF at all`);
    console.log(`  ${String(ids.length - rows.length).padStart(4)} not asked yet\n`);
    process.exit(0);
}

// ── the worklist ─────────────────────────────────────────────────────────────
// A paper already asked about is skipped unless `all` is given: the answer only
// changes when someone edits the HF page, which is not worth a request a night.
let queue;
if (only) queue = [only];
else if (has('all')) queue = ids;
else queue = ids.filter((id) => !store.papers[id]);

if (queue.length === 0) {
    console.log('\n  Every archived paper has been asked about · npm run hf all to ask again\n');
    process.exit(0);
}

console.log(`\n  ${queue.length} paper${queue.length > 1 ? 's' : ''} · ~${Math.ceil((queue.length * POLITE_MS) / 60000)} min\n`);

// ── ask ──────────────────────────────────────────────────────────────────────
// Written once at the end, so a run that dies part way leaves the file as it
// was rather than half rewritten.
let found = 0;
let gained = 0;
let failed = 0;
for (const [i, id] of queue.entries()) {
    if (i > 0) await sleep(POLITE_MS);
    const r = await fetchHfPaper(id);

    if (r.error) {
        failed++;
        console.log(`  ${id.padEnd(13)} ${r.error}`);
        continue;
    }

    // Worth calling out on a re-run: a paper that had no repository last time
    // and has one now is exactly what `all` is for. On a first pass there is no
    // last time, so nothing is "new" — every answer is simply the first answer.
    const asked = Object.hasOwn(store.papers, id);
    const before = store.papers[id]?.repo ?? null;
    store.papers[id] = r.absent ? { repo: null, absent: true } : { repo: r.repo };
    if (r.repo) found++;
    if (r.repo && asked && r.repo !== before) gained++;

    const note = r.absent ? 'not on HF' : (r.repo ?? 'no repository named');
    console.log(`  ${id.padEnd(13)} ${note}${r.repo && asked && before === null ? '  · new' : ''}`);
}

writeHf(store);
console.log(`\n  ${found} with a repository${gained ? ` · ${gained} newly named` : ''}${failed ? ` · ${failed} failed` : ''}`);
console.log(`  → ${path.relative(process.cwd(), hfPath())}\n`);
