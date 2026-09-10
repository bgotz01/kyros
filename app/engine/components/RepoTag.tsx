// ─── repository tag ───────────────────────────────────────────────────────────
// GitHub's current answer about the paper's artefact, held in a fixed column of
// the card's meta line so a month can be scanned down it: the label is drawn on
// every card at the same x, and the eye only has to read what follows it.
// Confirmation evidence, never a score input — attention is not adoption, and
// the fastest-starred repository in GitHub's history produced almost no durable
// deployment. Role, forks and last push are on the tooltip; stars are the only
// number shown.

import type { External } from '@/app/api/engine/external/route';
import { artefactRepo, sinceLabel, starLabel } from './format';

/** Its own line, so the label sits at a fixed x on every card and the name has
 *  room to be read in full before truncation is reached. */
const SLOT = 'flex max-w-[26rem] items-baseline gap-2 overflow-hidden';
const LABEL = 'shrink-0 text-platinum-dim';

export default function RepoTag({ external }: { external?: External }) {
    // Never looked up. A dash would claim GitHub was asked and said no; the
    // rule is that absence of evidence keeps its own mark.
    if (!external) {
        return (
            <span className={SLOT} title="Not looked up on GitHub yet">
                <span className={LABEL}>GITHUB</span>
                <span className="text-stone-line">·</span>
            </span>
        );
    }

    // Two ways to have nothing, and the column reads the same for both: a paper
    // that names no repository at all, and one that names only other people's.
    // Which of the two it is stays on the tooltip — an open artefact converts a
    // paper into an ecosystem within months, a closed one into a product and a
    // moat, but neither distinction is what the eye is scanning this column for.
    const repo = artefactRepo(external);
    if (external.noRepo || !repo) {
        const why = external.noRepo
            ? 'No repository linked by this paper'
            : `No artefact of its own. ${external.repos.length} linked:\n${external.repos
                  .map((r) => `${r.owner}/${r.name} · ${r.role}`)
                  .join('\n')}`;
        return (
            <span className={SLOT} title={why}>
                <span className={LABEL}>GITHUB</span>
                <span className="text-platinum-dim">none</span>
            </span>
        );
    }

    if (repo.error) {
        return (
            <span className={SLOT} title={`${repo.owner}/${repo.name}`}>
                <span className={LABEL}>GITHUB</span>
                <span className="truncate text-platinum-dim">{repo.error.toUpperCase()}</span>
            </span>
        );
    }

    const detail = [
        `${repo.owner}/${repo.name}`,
        repo.role !== 'unknown' ? repo.role : null,
        repo.forks === null ? null : `${repo.forks} forks`,
        `pushed ${sinceLabel(repo.pushedAt)}`,
        repo.archived ? 'archived' : null,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <span className={SLOT}>
            <span className={LABEL}>GITHUB</span>
            {/* The name gives way before the star count does: a truncated owner
                is still recognisable, and the number is what is being scanned
                for. */}
            <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={detail}
                className="flex min-w-0 items-baseline gap-1.5 transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
            >
                <span className="min-w-0 truncate">
                    {repo.owner}/{repo.name}
                </span>
                {repo.archived && <span className="shrink-0 text-halt-bright">ARCH</span>}
                {repo.stars !== null && (
                    <span className="shrink-0 text-marble">{starLabel(repo.stars)}</span>
                )}
            </a>
        </span>
    );
}
