#!/usr/bin/env node
// ─── pull ────────────────────────────────────────────────────────────────────
// Works through the digests in order without being told which week. A week is
// "held" when every arXiv paper in it has text in the archive, so progress is
// derived from the filesystem — there is no state file to fall out of sync.
//
//   npm run pull              the oldest week not yet held
//   npm run pull 4            the next four
//   npm run pull all          the entire backlog (prints the estimate first)
//   npm run pull latest       the most recent week, held or not
//   npm run pull status       what is held, what is not — fetches nothing
//   npm run pull 4 pdf        also store the PDFs of record
//   npm run pull repos        rebuild the repository index over the whole
//                             archive — reads stored text only, fetches nothing
//
// Every pull also records the github.com links each paper names, into
// papers/archive/repos.json. That is a regex over text already in hand: free,
// offline, and no judgement about which repository is the paper's own — the
// external seat decides that later, one paper at a time.

import fs from 'node:fs';
import path from 'node:path';
import { weeksIn, digestYears } from './lib/digest.mjs';
import { fetchText, fetchPdf, parseId, yearDir, sleep, POLITE_MS } from './lib/arxiv.mjs';
import { readIndex, writeIndex, record, indexPath } from './lib/repoIndex.mjs';

const argv = process.argv.slice(2);
const has = (n) => argv.includes(n) || argv.includes(`--${n}`);
const wantPdf = has('pdf');
const count = Number(argv.find((a) => /^\d+$/.test(a)) ?? 1);

/** Text present in the archive for this id. */
function held(id) {
    const p = parseId(id);
    if (!p) return false;
    const dir = yearDir(p.bare);
    if (!fs.existsSync(dir)) return false;
    // The digest links a bare id; the archive may hold a versioned filename.
    return fs.readdirSync(dir).some((f) => f.endsWith('.md') && f.startsWith(p.bare));
}

/** The stored text for a paper, or '' when nothing is held. */
function textOf(id) {
    const p = parseId(id);
    if (!p) return '';
    const dir = yearDir(p.bare);
    if (!fs.existsSync(dir)) return '';
    const file = fs.readdirSync(dir).find((f) => f.endsWith('.md') && f.startsWith(p.bare));
    return file ? fs.readFileSync(path.join(dir, file), 'utf-8') : '';
}

const years = digestYears();
if (years.length === 0) {
    console.error('No digests in papers/digests/. Add a <year>.md first.');
    process.exit(1);
}

const all = years.flatMap((y) => weeksIn(y));
for (const w of all) {
    w.ids = w.rows.filter((r) => r.id).map((r) => r.id);
    w.missing = w.ids.filter((id) => !held(id));
    w.complete = w.ids.length > 0 && w.missing.length === 0;
}

// ── repository index ─────────────────────────────────────────────────────────
// A pure re-read of what is already on disk. Safe to run at any time; the file
// it writes is derived and can always be rebuilt from the archive.
if (has('repos')) {
    const index = { generated: null, papers: {} };
    let held = 0;
    let links = 0;
    let none = 0;

    for (const w of all) {
        for (const r of w.rows) {
            if (!r.id) continue;
            const text = textOf(r.id);
            if (!text) continue;
            held++;
            const n = record(index, r.id, { title: r.title, text, body: r.body });
            links += n;
            if (n === 0) none++;
        }
    }

    writeIndex(index);
    console.log(`\n  ${links} links across ${held} papers · ${none} name none`);
    console.log(`  → ${path.relative(process.cwd(), indexPath())}\n`);
    process.exit(0);
}

// ── status ───────────────────────────────────────────────────────────────────
if (has('status')) {
    const done = all.filter((w) => w.complete).length;
    const papers = all.reduce((n, w) => n + w.ids.length, 0);
    const haveP = all.reduce((n, w) => n + (w.ids.length - w.missing.length), 0);
    console.log(`\n  ${done}/${all.length} weeks held · ${haveP}/${papers} arXiv papers\n`);
    for (const w of all) {
        const mark = w.complete ? '●' : w.missing.length === w.ids.length ? '○' : '◐';
        console.log(`  ${mark} ${w.heading.replace('Top AI Papers of the Week ', '')}  ${w.ids.length - w.missing.length}/${w.ids.length}`);
    }
    const next = all.find((w) => !w.complete);
    console.log(next ? `\n  Next: npm run pull\n` : '\n  Backlog complete.\n');
    process.exit(0);
}

// ── choose the weeks ─────────────────────────────────────────────────────────
let queue;
if (has('latest')) queue = all.slice(-1);
else if (has('all')) queue = all.filter((w) => !w.complete);
else queue = all.filter((w) => !w.complete).slice(0, count);

if (queue.length === 0) {
    console.log('\n  Nothing outstanding — every week in the digests is held.\n');
    process.exit(0);
}

const total = queue.reduce((n, w) => n + (has('latest') ? w.ids.length : w.missing.length), 0);
console.log(`\n  ${queue.length} week${queue.length > 1 ? 's' : ''} · ${total} papers · ~${Math.ceil((total * 3) / 60)} min at arXiv's request rate`);
if (wantPdf) console.log('  storing PDFs of record as well');
console.log('');

// ── fetch ────────────────────────────────────────────────────────────────────
// Read once, written once at the end — a run that dies part way leaves the
// index as it was rather than half rewritten.
const index = readIndex();
let indexDirty = false;
const manual = [];
let n = 0;
for (const w of queue) {
    console.log(`  ${w.heading.replace('Top AI Papers of the Week ', '')}`);
    const ids = has('latest') ? w.ids : w.missing;

    // Index every paper in the week, not just the ones being fetched — a week
    // added to the digest after an earlier pull run would otherwise never enter
    // repos.json because its papers are already held and skipped by the fetch loop.
    for (const id of w.ids) {
        if (!ids.includes(id)) {
            const row = w.rows.find((r) => r.id === id);
            record(index, id, { title: row?.title, text: textOf(id), body: row?.body });
            indexDirty = true;
        }
    }

    for (const id of ids) {
        if (n++ > 0) await sleep(POLITE_MS);
        const t = await fetchText(id);
        let line = `    ${id.padEnd(13)} ${(t.mode ?? '').padEnd(14)}`;
        if (!t.skipped) line += `~${String(t.tokens).padStart(6)} tokens`;

        // Free, and only possible while the text is in hand: what the paper
        // says its repositories are. Which one is its own is not decided here.
        const row = w.rows.find((r) => r.id === id);
        const found = record(index, id, { title: row?.title, text: textOf(id), body: row?.body });
        indexDirty = true;
        line += found > 0 ? `  · ${found} repo${found > 1 ? 's' : ''}` : '  · no repo';
        if (wantPdf) {
            const p = await fetchPdf(id);
            line += p.error ? `  · pdf failed (${p.error})` : p.skipped ? '  · pdf held' : `  · pdf ${Math.round(p.bytes / 1024)}KB`;
        }
        console.log(line);
    }
    for (const r of w.rows.filter((r) => !r.id)) {
        manual.push(`- **${r.title}** — ${r.host ?? 'unknown host'} · ${w.heading}`);
    }
    console.log('');
}

if (indexDirty) {
    writeIndex(index);
    console.log(`  repository links → ${path.relative(process.cwd(), indexPath())}\n`);
}

// Papers hosted off arXiv would otherwise vanish between weeks; they land in the
// inbox as a to-do rather than being silently dropped.
if (manual.length) {
    const file = path.join(process.cwd(), 'papers', 'inbox', 'manual.md');
    const existing = fs.existsSync(file) ? fs.readFileSync(file, 'utf-8') : '# Not on arXiv — file by hand\n\n';
    const fresh = manual.filter((m) => !existing.includes(m.split(' — ')[0]));
    if (fresh.length) fs.writeFileSync(file, existing.trimEnd() + '\n' + fresh.join('\n') + '\n', 'utf-8');
    console.log(`  ${manual.length} not on arXiv → papers/inbox/manual.md (${fresh.length} new)\n`);
}

const left = all.filter((w) => !w.complete).length - queue.length;
if (left > 0) console.log(`  ${left} weeks still outstanding · npm run pull\n`);
