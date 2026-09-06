#!/usr/bin/env node
// ─── external ────────────────────────────────────────────────────────────────
// Works through papers/archive/repos.json and asks the engine to look up each
// paper's repositories, so the whole archive is confirmed in one pass instead
// of one ★ click at a time.
//
//   npm run external              every paper not yet looked up
//   npm run external all          every paper, replacing what is stored
//   npm run external 2501.19393   one paper
//   npm run external status       what is stored and what is not — asks nothing
//
// It calls the running dev server rather than reimplementing the lookup: the
// candidate regex, the classifier, the GitHub calls and the database write all
// already live behind POST /api/engine/external, and a second copy of them
// would be a second thing to keep true. So `npm run dev` must be up — and the
// keys the work needs (GITHUB_TOKEN, OPENROUTER_API_KEY) are read by the
// server, not by this script.
//
// Nothing here reaches a score. Repository evidence is stored against the
// paper, for the confirmation pass to read.

import { weeksIn, digestYears } from './lib/digest.mjs';
import { readIndex } from './lib/repoIndex.mjs';

const argv = process.argv.slice(2);
const has = (n) => argv.includes(n) || argv.includes(`--${n}`);
const only = argv.find((a) => /^\d{4}\.\d{4,5}$/.test(a));

const BASE = process.env.ENGINE_URL ?? 'http://localhost:3000';

// The engine's own default seat for this job: short input, short output, one
// classification. Matches DEFAULT_EXTERNAL in the interface.
const MODEL = argv.find((a) => a.includes('/')) ?? 'deepseek/deepseek-v4-flash';

// ── the worklist ─────────────────────────────────────────────────────────────
const index = readIndex();
const papers = Object.entries(index.papers);
if (papers.length === 0) {
    console.error('\n  No repository index. Run `npm run pull repos` first.\n');
    process.exit(1);
}

// A paper's digest row carries links the text sometimes omits — an abstract-only
// paper may name its repository nowhere else.
const linksById = new Map();
for (const y of digestYears()) {
    for (const w of weeksIn(y)) {
        for (const r of w.rows) {
            if (!r.id) continue;
            const urls = [...(r.body ?? '').matchAll(/\((https?:\/\/[^)\s]+)\)/g)].map((m) => m[1]);
            linksById.set(r.id, urls);
        }
    }
}

/** What the engine has already stored, so a re-run costs nothing for those. */
async function stored(ids) {
    try {
        const res = await fetch(`${BASE}/api/engine/external?ids=${ids.join(',')}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const rows = await res.json();
        return new Map(rows.map((r) => [r.paperId, r]));
    } catch (err) {
        console.error(`\n  Could not reach ${BASE} — is \`npm run dev\` running?`);
        console.error(`  ${err.message}\n`);
        process.exit(1);
    }
}

const held = await stored(papers.map(([id]) => id));

// ── status ───────────────────────────────────────────────────────────────────
if (has('status')) {
    const done = papers.filter(([id]) => held.has(id)).length;
    const links = papers.reduce((n, [, p]) => n + p.repos.length, 0);
    console.log(`\n  ${done}/${papers.length} papers looked up · ${links} links in the index\n`);
    for (const [id, p] of papers) {
        const row = held.get(id);
        const mark = !row ? '○' : row.noRepo ? '·' : '●';
        const note = !row
            ? `${p.repos.length} to check`
            : row.noRepo
              ? 'no repository'
              : `${row.repos.length} checked${row.repos.some((r) => r.role === 'artefact') ? ' · artefact' : ' · no artefact'}`;
        console.log(`  ${mark} ${id.padEnd(12)} ${String(p.title ?? '').slice(0, 40).padEnd(42)} ${note}`);
    }
    console.log('');
    process.exit(0);
}

let queue = papers;
if (only) queue = papers.filter(([id]) => id === only);
else if (!has('all')) queue = papers.filter(([id]) => !held.has(id));

if (queue.length === 0) {
    console.log('\n  Nothing outstanding — every paper in the index has been looked up.\n');
    process.exit(0);
}

const calls = queue.reduce((n, [, p]) => n + p.repos.length, 0);
console.log(`\n  ${queue.length} paper${queue.length > 1 ? 's' : ''} · ${calls} repository lookups · seat ${MODEL}`);
console.log(`  via ${BASE}\n`);

// ── the pass ─────────────────────────────────────────────────────────────────
// One paper at a time. GitHub is generous with a token, but the seat is a paid
// call per paper and a sequence keeps the spend legible as it accrues.
let spend = 0;
let artefacts = 0;
let none = 0;
let failed = 0;

for (const [id, paper] of queue) {
    process.stdout.write(`  ${id.padEnd(12)} ${String(paper.title ?? '').slice(0, 34).padEnd(36)}`);
    try {
        const res = await fetch(`${BASE}/api/engine/external`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id,
                title: paper.title ?? id,
                links: linksById.get(id) ?? [],
                model: MODEL,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            console.log(`✗ ${data.error ?? `HTTP ${res.status}`}`);
            failed++;
            continue;
        }

        spend += data.cost ?? 0;
        const artefact = data.repos.find((r) => r.role === 'artefact');
        if (data.noRepo || data.repos.length === 0) {
            none++;
            console.log('· no repository');
        } else if (artefact) {
            artefacts++;
            const stars = artefact.stars === null ? '—' : artefact.stars;
            console.log(`● ${artefact.owner}/${artefact.name} ${stars}★`);
        } else {
            console.log(`○ ${data.repos.length} linked · no artefact`);
        }
    } catch (err) {
        console.log(`✗ ${err.message}`);
        failed++;
    }
}

console.log(`\n  ${artefacts} artefacts · ${none} with no repository · ${failed} failed`);
console.log(`  $${spend.toFixed(4)}\n`);
