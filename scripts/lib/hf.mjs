// ─── Hugging Face papers ─────────────────────────────────────────────────────
// One field, from one endpoint: the repository Hugging Face records as a
// paper's own.
//
// huggingface.co/papers/<id> is the same arXiv paper under a different roof. HF
// hosts no text, so nothing here replaces the arXiv fetch — the archive is
// still built from arxiv.org/html. What HF has that the archive cannot derive
// is a single named repository per paper, attributed by a person rather than
// inferred from the prose. Roughly three papers in five carry one, and some of
// those name a repository the paper's own text never mentions.
//
// That last part is the whole reason this exists, and also the reason it is
// kept at arm's length: an HF repository is an assertion by a third party, not
// something the paper says. It is stored apart from repos.json and reaches the
// external seat as a candidate to be judged, never as a settled answer.

import { findRepos, slug } from '../../lib/repos.mjs';

const API = 'https://huggingface.co/api/papers';

/** The same courtesy arXiv is given, at HF's rather faster tolerance. */
export const POLITE_MS = 400;

/**
 * What Hugging Face says about one paper.
 *
 * `absent` and a null `repo` are different findings: HF has never seen the
 * paper, versus HF has the paper and nobody has named a repository for it.
 * Both currently mean "no repository", but only the second is stable — the
 * first can change the moment somebody submits it.
 *
 * @param {string} id bare arXiv id, e.g. `2501.19393`
 * @returns {Promise<{ id: string, absent: boolean, repo: string|null, error?: string }>}
 */
export async function fetchHfPaper(id) {
    const base = { id, absent: false, repo: null };
    try {
        const res = await fetch(`${API}/${id}`, {
            headers: { Accept: 'application/json', 'User-Agent': 'kyros-engine' },
        });
        if (res.status === 404) return { ...base, absent: true };
        if (!res.ok) return { ...base, error: `HTTP ${res.status}` };

        const d = await res.json();
        // The field is a URL. Run it through the archive's own pattern so the
        // owner/name it yields cannot disagree with what the sweep records.
        const found = typeof d.githubRepo === 'string' ? findRepos(d.githubRepo) : [];
        return { ...base, repo: found.length ? slug(found[0]) : null };
    } catch {
        return { ...base, error: 'unreachable' };
    }
}

// ─── the store ───────────────────────────────────────────────────────────────
// papers/archive/hf.json — deliberately not papers/archive/repos.json.
//
// repos.json is a pure function of the stored text and the digests: throw it
// away and `npm run pull repos` rebuilds it exactly, offline. This file cannot
// be rebuilt that way and does not carry the same kind of claim, so mixing the
// two would cost the first file its contract and hide the second one's
// provenance. Two files, two meanings.

import fs from 'node:fs';
import path from 'node:path';

const FILE = path.join(process.cwd(), 'papers', 'archive', 'hf.json');

export function hfPath() {
    return FILE;
}

/** What is on disk, or an empty store. */
export function readHf() {
    try {
        const raw = JSON.parse(fs.readFileSync(FILE, 'utf-8'));
        return raw && typeof raw === 'object' && raw.papers ? raw : { checked: null, papers: {} };
    } catch {
        return { checked: null, papers: {} };
    }
}

export function writeHf(store) {
    store.checked = new Date().toISOString().slice(0, 10);
    fs.mkdirSync(path.dirname(FILE), { recursive: true });
    fs.writeFileSync(FILE, JSON.stringify(store, null, 2) + '\n', 'utf-8');
}
