#!/usr/bin/env node
// ─── candidate scaffold ──────────────────────────────────────────────────────
// Turns an arXiv id or URL into a blank candidate record under
// context/ai/candidates/, with the metadata filled in and every scoring field
// left empty. Deliberately does not score anything — locating and scoring are
// the analyst's job, and a script that pre-fills them would be pre-judging.
//
//   npm run candidate 2501.12948
//   npm run candidate https://arxiv.org/abs/2501.12948

import fs from 'node:fs';
import path from 'node:path';

const OUT_DIR = path.join(process.cwd(), 'context', 'ai', 'candidates');
const FRAME = path.join(process.cwd(), 'context', 'ai', 'frame.md');

const raw = process.argv[2];
if (!raw) {
    console.error('usage: npm run candidate <arxiv-id | arxiv-url>');
    process.exit(1);
}

/** Accepts 2501.12948, arXiv:2501.12948, or any arxiv.org/abs|pdf URL. */
function arxivId(input) {
    const m = input.match(/(\d{4}\.\d{4,5})(v\d+)?/);
    if (!m) {
        console.error(`Could not find an arXiv id in "${input}".`);
        console.error('For a non-arXiv source, copy Method · Candidate Template by hand.');
        process.exit(1);
    }
    return m[1];
}

/** The Atom feed is small and regular; a parser dependency is not worth it. */
function field(xml, tag) {
    const m = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
    return m ? m[1].replace(/\s+/g, ' ').trim() : '';
}

function slugify(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .split('-')
        .slice(0, 8)
        .join('-');
}

/** The frame's own `Last reviewed:` date — the §2 version a score is made against. */
function frameReviewed() {
    try {
        return fs.readFileSync(FRAME, 'utf-8').match(/Last reviewed:\s*([\d-]+)/)?.[1] ?? 'UNKNOWN';
    } catch {
        return 'UNKNOWN';
    }
}

const id = arxivId(raw);
const res = await fetch(`http://export.arxiv.org/api/query?id_list=${id}`);
if (!res.ok) {
    console.error(`arXiv API returned ${res.status}. Try again, or fill the template by hand.`);
    process.exit(1);
}
const xml = await res.text();

// The feed wraps one <entry>; strip the outer feed metadata before reading it.
const entry = xml.slice(xml.indexOf('<entry>'));
if (!entry.startsWith('<entry>')) {
    console.error(`No entry for arXiv:${id}. Check the id.`);
    process.exit(1);
}

const title = field(entry, 'title');
const published = field(entry, 'published').slice(0, 10);
const authorNames = [...entry.matchAll(/<name>([\s\S]*?)<\/name>/g)].map((m) => m[1].trim());
const authors =
    authorNames.length > 3 ? `${authorNames[0]} et al. (${authorNames.length} authors)` : authorNames.join(', ');

const today = new Date().toISOString().slice(0, 10);
const slug = slugify(title);
const outPath = path.join(OUT_DIR, `${slug}.md`);

if (fs.existsSync(outPath)) {
    console.error(`${path.relative(process.cwd(), outPath)} already exists — refusing to overwrite a scored record.`);
    process.exit(1);
}

const doc = `# ${title}

Source:     arXiv:${id} — https://arxiv.org/abs/${id}
Authors:    ${authors}
Published:  ${published}
Ingested:   ${today}
Scored:     <YYYY-MM-DD>  — frozen
Frame:      ${frameReviewed()}  — §2 version scored against

## 1 · Summary — what is it?

<Three to five sentences. Mechanism, not marketing. No significance claim.>

Primary artefact:  paper | weights | code | reproducible result | none
Open:              weights / code / neither
Reproduced by:     not yet

## 2 · Inversion — what does it invert?

Inverts:     <held necessary>  →  <shown optional>
Level:       Representation | Model architecture | Training | Inference | AI systems
Magnitude:   local | subsystem | stack | paradigm
Assumption:  <which §2 prevailing-paradigm item it contradicts — or "none on the list">

<Rationale.>

I¹: /10

## 3 · Incentive — is there incentive for this inversion?

Bottleneck:  <which Bottlenecks/ entry, and its status> — or "none"
Capability:  <which Desired Capabilities item, 1–8> — or "none"
Cost falls:  <for whom, by what factor>

<Rationale.>

I²: /10

## 4 · Outlier — is this inversion unprecedented?

Standard approach:  <what the pack does on this problem>
Distance:           <how far off it this is>
Outlier in:         objective | product | domain | strategy | none
Changes the game:   <name the game — or "no">

<Rationale.>

I³: /10

## 5 · Reading

I³ score:    ? × ? × ? = ???  (<band>)
Verdict:     inflection | latent | noise
Confidence:  low | moderate | high
Resolves by: <third-party checkable observable>
Due:         <YYYY-MM>

## 6 · Confirmation log

Append only. Never edit sections 2–5 after \`Scored:\`.
`;

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(outPath, doc, 'utf-8');

console.log(`\n  ${title}`);
console.log(`  ${published} · ${authors}\n`);
console.log(`  → ${path.relative(process.cwd(), outPath)}`);
console.log(`\n  Next: fill sections 1–2 before writing any score.\n`);
