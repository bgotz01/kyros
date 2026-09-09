// ─── repository links ────────────────────────────────────────────────────────
// Every github.com/<owner>/<name> a paper names, read straight out of its text.
//
// Plain JavaScript on purpose: this is the one piece of the external pipeline
// the pull script needs, and scripts/ is .mjs with no TypeScript step. Keeping
// the pattern here means the archive sweep and the ★ lookup can never disagree
// about what counts as a repository.
//
// Finding a link is free. Deciding which one is the paper's own artefact is not
// — that is the external seat's job, and nothing here attempts it.

/** Paths that look like repositories but are not. */
const NOT_A_REPO = new Set([
    'about', 'apps', 'blog', 'collections', 'contact', 'customer-stories',
    'enterprise', 'events', 'explore', 'features', 'issues', 'login', 'marketplace',
    'new', 'notifications', 'orgs', 'pricing', 'pulls', 'search', 'security',
    'settings', 'sponsors', 'topics', 'trending', 'users',
]);

const RESERVED_SECOND = new Set(['issues', 'pulls', 'wiki', 'releases', 'blob', 'tree', 'commit']);

/**
 * Every distinct owner/name pair mentioned in a block of text, in the order
 * they first appear.
 *
 * @param {string} text
 * @returns {{ owner: string, name: string }[]}
 */
export function findRepos(text) {
    /** @type {Map<string, { owner: string, name: string }>} */
    const out = new Map();
    const re = /github\.com\/([A-Za-z0-9][\w.-]{0,38})\/([\w.-]{1,100})/g;

    for (const m of text.matchAll(re)) {
        const owner = m[1];
        // Trailing punctuation is common where a URL ends a sentence.
        let name = m[2].replace(/\.git$/, '').replace(/[.,;:)\]}]+$/, '');
        // A handful of bibliographies write the note with no space after the
        // URL — `…/TinyZeroAccessed: 2025-01-24`, `…/slimeGitHub repository`.
        // The weld is in the source itself, with no tag to key off, so it
        // survives extraction and has to come off here. Two words only, and
        // only where something is left of the name: the general case of prose
        // welded to a URL is not solvable by a word list, and pretending
        // otherwise would quietly truncate real repositories.
        const trimmed = name.replace(/(?:Accessed|GitHub)$/, '');
        if (trimmed.length >= 2) name = trimmed;
        if (!name || NOT_A_REPO.has(owner.toLowerCase()) || RESERVED_SECOND.has(name.toLowerCase())) {
            continue;
        }
        out.set(`${owner.toLowerCase()}/${name.toLowerCase()}`, { owner, name });
    }
    return [...out.values()];
}

/** `owner/name`, the form the index and the archive header both store. */
export const slug = (/** @type {{owner: string, name: string}} */ r) => `${r.owner}/${r.name}`;
