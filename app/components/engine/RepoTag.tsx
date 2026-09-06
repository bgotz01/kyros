// ─── repository tag ───────────────────────────────────────────────────────────
// GitHub's current answer about the paper's artefact, set beside the paper's
// own link. Confirmation evidence, never a score input — attention is not
// adoption, and the fastest-starred repository in GitHub's history produced
// almost no durable deployment. Read pushed and forks before stars; both are
// on the tooltip.

import type { External } from '@/app/api/engine/external/route';
import { artefactRepo, sinceLabel, starLabel } from './format';

export default function RepoTag({ external }: { external: External }) {
    // A paper that names no repository is a finding in itself — an open
    // artefact converts a paper into an ecosystem within months; a closed one
    // converts into a product and a moat.
    if (external.noRepo) return <> · NO REPO</>;

    // Repositories, but none of them this paper's. The count is the honest
    // thing to show; a baseline's stars would read as the paper's own.
    const repo = artefactRepo(external);
    if (!repo) {
        return (
            <>
                {' · NO ARTEFACT'}
                {external.repos.length > 0 && ` · ${external.repos.length} LINKED`}
            </>
        );
    }
    if (repo.error) return <> · {repo.error.toUpperCase()}</>;

    const detail = [
        repo.role !== 'unknown' ? repo.role : null,
        repo.forks === null ? null : `${repo.forks} forks`,
        `pushed ${sinceLabel(repo.pushedAt)}`,
    ]
        .filter(Boolean)
        .join(' · ');

    return (
        <>
            {' · '}
            <a
                href={repo.url}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                title={detail}
                className="transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
            >
                {repo.owner}/{repo.name}
                {repo.stars !== null && (
                    <span className="ml-1.5 text-marble">{starLabel(repo.stars)}</span>
                )}
                {' ↗'}
            </a>
            {repo.archived && <span className="text-halt-bright"> · ARCHIVED</span>}
        </>
    );
}
