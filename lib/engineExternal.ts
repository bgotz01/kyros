// ─── external evidence ───────────────────────────────────────────────────────
// Repositories named by a paper, and what GitHub currently says about them.
//
// Deliberately not an LLM task. The repository is either written in the paper or
// it is not, and a regex reads that more reliably — and for nothing — than a
// model asked to go and look.
//
// What comes back is CONFIRMATION evidence. `Signals and Base Rates` lists star
// counts among the signals that preceded false positives: AutoGPT was the
// fastest-starred repository in GitHub's history and produced almost no durable
// deployment. None of this may reach a score.

import { readPaper } from './engineData';
// The pattern itself lives in plain JS so scripts/ can use it too — the archive
// sweep and this lookup must agree on what counts as a repository.
import { findRepos } from './repos.mjs';

export { findRepos };

export type RepoRole = 'artefact' | 'baseline' | 'dataset' | 'tooling' | 'unrelated' | 'unknown';

export interface RepoFacts {
    owner: string;
    name: string;
    url: string;
    /** What this repository is to the paper. 'unknown' when the seat did not run. */
    role: RepoRole;
    why: string;
    stars: number | null;
    forks: number | null;
    openIssues: number | null;
    pushedAt: string | null;
    archived: boolean;
    description: string | null;
    /** Set when GitHub answered with something other than the repository. */
    error?: string;
}

/** GitHub allows 60 unauthenticated calls an hour; a token raises it to 5,000.
 *  Optional — the engine works without one, just less often. */
function headers(): Record<string, string> {
    const h: Record<string, string> = {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'kyros-engine',
    };
    const token = process.env.GITHUB_TOKEN?.trim();
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
}

export async function fetchRepo(owner: string, name: string): Promise<RepoFacts> {
    const url = `https://github.com/${owner}/${name}`;
    const base: RepoFacts = {
        owner,
        name,
        url,
        role: 'unknown',
        why: '',
        stars: null,
        forks: null,
        openIssues: null,
        pushedAt: null,
        archived: false,
        description: null,
    };

    try {
        const res = await fetch(`https://api.github.com/repos/${owner}/${name}`, {
            headers: headers(),
        });
        if (res.status === 404) return { ...base, error: 'not found' };
        if (res.status === 403 || res.status === 429) return { ...base, error: 'rate limited' };
        if (!res.ok) return { ...base, error: `HTTP ${res.status}` };

        const d = (await res.json()) as Record<string, unknown>;
        return {
            ...base,
            url: typeof d.html_url === 'string' ? d.html_url : url,
            stars: Number(d.stargazers_count ?? 0),
            forks: Number(d.forks_count ?? 0),
            openIssues: Number(d.open_issues_count ?? 0),
            pushedAt: typeof d.pushed_at === 'string' ? d.pushed_at : null,
            archived: Boolean(d.archived),
            description: typeof d.description === 'string' ? d.description : null,
        };
    } catch {
        return { ...base, error: 'unreachable' };
    }
}

/** The sentence each link sits in. What the seat reads to tell an artefact from
 *  a baseline — the repository name alone rarely says. */
export function linkContext(text: string, repos: { owner: string; name: string }[]): string {
    const out: string[] = [];
    for (const r of repos) {
        const needle = `github.com/${r.owner}/${r.name}`;
        const at = text.toLowerCase().indexOf(needle.toLowerCase());
        if (at === -1) {
            out.push(`${r.owner}/${r.name}: [link not found in the paper text]`);
            continue;
        }
        const window = text.slice(Math.max(0, at - 320), at + 160).replace(/\s+/g, ' ').trim();
        out.push(`${r.owner}/${r.name}: …${window}…`);
    }
    return out.join('\n\n');
}

/** Candidates named by a paper, before anything has judged them. */
export function candidatesFor(paperId: string, extra: string[] = []) {
    const paper = readPaper(paperId);
    const haystack = [paper?.text ?? '', ...extra].join('\n');
    // A paper can cite a dozen baselines; the seat decides which is its own.
    const repos = findRepos(haystack).slice(0, 6);
    return { repos, haystack };
}

/** GitHub's current answer for each repository, in the order given. */
export async function factsFor(repos: { owner: string; name: string }[]): Promise<RepoFacts[]> {
    const out: RepoFacts[] = [];
    for (const r of repos) out.push(await fetchRepo(r.owner, r.name));
    return out;
}
