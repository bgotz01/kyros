// ─── the repository index ────────────────────────────────────────────────────
// papers/archive/repos.json — every repository link the archive names, keyed by
// paper.
//
// Derived, never authored. It is a pure function of the stored text and the
// digests, so it can be thrown away and rebuilt at any time; nothing downstream
// should treat it as a source. It exists so a later pass can work through the
// links without re-reading 400 papers, and so "which papers ship code" is a
// question the archive can answer offline.
//
// No stars here, and no judgement about which repository is the paper's own.
// Both cost network calls the sweep does not make.

import fs from 'node:fs';
import path from 'node:path';
import { findRepos, slug } from '../../lib/repos.mjs';

const FILE = path.join(process.cwd(), 'papers', 'archive', 'repos.json');

export function indexPath() {
    return FILE;
}

/** What is on disk, or an empty index. */
export function readIndex() {
    try {
        const raw = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
        return raw && typeof raw === 'object' && raw.papers ? raw : { generated: null, papers: {} };
    } catch {
        return { generated: null, papers: {} };
    }
}

export function writeIndex(index) {
    index.generated = new Date().toISOString().slice(0, 10);
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(index, null, 2) + '\n', 'utf-8');
}

/**
 * The links one paper names, from its stored text and its digest row together.
 * Uncapped — the six-candidate limit belongs to the classifier, not to the
 * record of what the paper actually said.
 */
export function reposFor({ text = '', body = '' }) {
    return findRepos([text, body].join('\n')).map(slug);
}

/** Records one paper's links. Returns the count for the caller's log line. */
export function record(index, id, { title, text, body }) {
    const repos = reposFor({ text, body });
    index.papers[id] = { title: title ?? null, repos };
    return repos.length;
}
