#!/usr/bin/env node
// ─── external-update ─────────────────────────────────────────────────────────
// Refreshes GitHub star counts (and forks, openIssues, pushedAt, archived,
// description) for every paper in a digest year that already has an external
// record. The LLM classifier is not re-run — roles are preserved as-is.
//
//   npm run external:update           current calendar year
//   npm run external:update 2026      specific year
//   npm run external:update 2026 status   show what would be refreshed, fetch nothing
//
// Requires the dev server to be running (`npm run dev`) — the PATCH call goes
// through /api/engine/external so the GitHub token and DB write stay in one place.

import { weeksIn, digestYears } from './lib/digest.mjs';

const argv = process.argv.slice(2);
const has = (n) => argv.includes(n) || argv.includes(`--${n}`);

const yearArg = argv.find((a) => /^\d{4}$/.test(a));
const year = yearArg ?? String(new Date().getFullYear());

const BASE = process.env.ENGINE_URL ?? 'http://localhost:3000';

// ── collect paper IDs for the year ───────────────────────────────────────────
const allYears = digestYears();
if (!allYears.includes(year)) {
    console.error(`\n  No digest for ${year}. Have: ${allYears.join(', ') || 'none'}\n`);
    process.exit(1);
}

const ids = weeksIn(year)
    .flatMap((w) => w.rows)
    .map((r) => r.id)
    .filter(Boolean);

const unique = [...new Set(ids)];

if (unique.length === 0) {
    console.log(`\n  No arXiv papers found in the ${year} digest.\n`);
    process.exit(0);
}

// ── check which ones have an existing external record ────────────────────────
async function fetchStored(ids) {
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

const stored = await fetchStored(unique);

// Only papers that already have a record and at least one repo are worth updating.
// Papers marked noRepo have nothing to refresh.
const queue = unique.filter((id) => {
    const row = stored.get(id);
    return row && !row.noRepo && row.repos.length > 0;
});

const skippedNoRecord = unique.length - stored.size;
const skippedNoRepo = stored.size - queue.length;

// ── status ────────────────────────────────────────────────────────────────────
if (has('status')) {
    console.log(`\n  ${year} — ${unique.length} papers in digest`);
    console.log(`  ${queue.length} to refresh · ${skippedNoRepo} with no repo · ${skippedNoRecord} not yet looked up\n`);
    for (const id of unique) {
        const row = stored.get(id);
        if (!row)             { console.log(`  ○ ${id}  not looked up`); continue; }
        if (row.noRepo)       { console.log(`  · ${id}  no repository`); continue; }
        const artefact = row.repos.find((r) => r.role === 'artefact');
        const label = artefact ? `${artefact.owner}/${artefact.name}  ${artefact.stars ?? '—'}★` : `${row.repos.length} repos`;
        console.log(`  ● ${id}  ${label}`);
    }
    console.log('');
    process.exit(0);
}

if (queue.length === 0) {
    console.log(`\n  Nothing to refresh for ${year} — no papers with repos have been looked up yet.\n`);
    process.exit(0);
}

const repoCount = queue.reduce((n, id) => n + (stored.get(id)?.repos.length ?? 0), 0);
console.log(`\n  ${year} · ${queue.length} papers · ${repoCount} repository lookups`);
console.log(`  via ${BASE}\n`);

// ── refresh ───────────────────────────────────────────────────────────────────
let refreshed = 0;
let failed = 0;

for (const id of queue) {
    const prev = stored.get(id);
    const artefact = prev?.repos.find((r) => r.role === 'artefact');
    const label = artefact
        ? `${artefact.owner}/${artefact.name}`.slice(0, 34).padEnd(36)
        : `${prev?.repos.length} repo${prev?.repos.length !== 1 ? 's' : ''}`.padEnd(36);

    process.stdout.write(`  ${id.padEnd(13)} ${label}`);

    try {
        const res = await fetch(`${BASE}/api/engine/external`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
        });
        const data = await res.json();
        if (!res.ok) {
            console.log(`✗ ${data.error ?? `HTTP ${res.status}`}`);
            failed++;
            continue;
        }

        // Show the refreshed artefact star count if available.
        // We need to re-fetch the updated row to get the new stars.
        const updated = await fetch(`${BASE}/api/engine/external?ids=${id}`);
        const rows = await updated.json();
        const row = rows[0];
        const newArtefact = row?.repos.find((r) => r.role === 'artefact');
        const stars = newArtefact?.stars ?? null;
        const prev_stars = artefact?.stars ?? null;
        const delta =
            stars !== null && prev_stars !== null
                ? stars - prev_stars === 0
                    ? '='
                    : `${stars - prev_stars > 0 ? '+' : ''}${stars - prev_stars}`
                : '';

        const starStr = stars !== null ? `${stars}★` : '—';
        console.log(`✓ ${starStr}${delta ? `  (${delta})` : ''}`);
        refreshed++;
    } catch (err) {
        console.log(`✗ ${err.message}`);
        failed++;
    }
}

console.log(`\n  ${refreshed} refreshed · ${failed} failed\n`);
