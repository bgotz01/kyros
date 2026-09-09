'use client';

// ─── one paper ────────────────────────────────────────────────────────────────
// A week is read one card at a time. The card shows the claim, the three ranks
// in reading order, and the panels that carry no score.

import type { PaperRow } from '@/lib/engineData';
import type { CriticSection } from '@/app/api/engine/critique/route';
import type { External } from '@/app/api/engine/external/route';
import { effectiveScore } from '@/lib/engineStore';
import Bullets from './Bullets';
import IncentivesDetail from './IncentivesDetail';
import InversionDetail from './InversionDetail';
import PaperControls from './PaperControls';
import InflectionDetail from './InflectionDetail';
import RepoTag from './RepoTag';
import { Panel, Rank } from './Disclosure';
import {
    band,
    contributionLabel,
    outcomeNote,
    paradigmLocation,
    publicationLabel,
    rankHeadline,
    sourceUrl,
} from './format';
import { DETAIL_FOR, RANKS, heldScore, type FlagState, type RowKey, type RowState } from './types';

export default function PaperCard({
    paper,
    anchored,
    onAnchor,
    state,
    openRows,
    onToggleRow,
    onOpenNote,
    onRun,
    onCritic,
    onBreakdown,
    onClear,
    onAside,
    external,
    standingAssumption,
    busy,
}: {
    paper: PaperRow;
    /** This card is the one the path names. */
    anchored?: boolean;
    /** Put this paper in the path, or take it out again. Absent for a digest
     *  row with no arXiv id — there is nothing stable to address it by. */
    onAnchor?: () => void;
    state: RowState;
    openRows: Record<string, boolean>;
    onToggleRow: (row: RowKey) => void;
    onOpenNote: (section: CriticSection) => void;
    onRun: () => void;
    onCritic: () => void;
    onBreakdown: () => void;
    onClear: () => void;
    /** Take this row out of the reading; restored from the foot of the month. */
    onAside?: () => void;
    external?: External;
    /** The layer assumption from the sealed snapshot this paper was scored
     *  against — the written claim I¹ was measured against. */
    standingAssumption?: string;
    busy: boolean;
}) {
    const stored = heldScore(state);
    const critique = stored?.critique;
    // The stored row is the analyst's frozen prediction; what is shown is that
    // row with every accepted correction layered over it.
    const score = stored ? effectiveScore(stored, critique?.notes ?? []) : undefined;
    const reading = state.status === 'running';

    function flagFor(section: CriticSection): FlagState | undefined {
        const note = critique?.notes.find((n) => n.section === section);
        if (!note || note.agrees) return undefined;
        return note.resolution ?? 'open';
    }

    const openFlags = critique?.notes.filter((n) => !n.agrees && !n.resolution).length ?? 0;
    const canRun = Boolean(paper.id && paper.held);

    return (
        <article
            id={paper.id ? `paper-${paper.id}` : undefined}
            className={`border bg-charcoal transition-colors duration-500 ease-mechanical scroll-mt-[12.5rem] ${reading ? 'border-bronze-dim' : anchored ? 'border-bronze' : 'border-stone-line'
                }`}
        >
            {/* The instrument is reading this paper. */}
            {reading && <div className="kyros-sweep h-px w-full bg-stone-line" />}

            <header className="flex items-start justify-between gap-4 px-5 py-3">
                <div className="min-w-0">
                    <span className="flex items-baseline gap-2.5">
                        <span className="min-w-0 truncate font-sans text-[0.8rem] tracking-[0.03em] text-marble">
                            {paper.title}
                        </span>
                        {score?.category && score.category !== 'Unclassified' && (
                            <span className="shrink-0 border border-stone-line px-1.5 py-px font-mono text-[0.5rem] uppercase tracking-[0.14em] text-bronze">
                                {score.category}
                            </span>
                        )}
                    </span>
                    <span className="mt-1.5 block font-mono text-[0.55rem] tracking-[0.12em] text-platinum-dim">
                        {paper.id ? (
                            <a
                                href={sourceUrl(paper)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
                            >
                                ARXIV:{paper.id} ↗
                            </a>
                        ) : sourceUrl(paper) ? (
                            <a
                                href={sourceUrl(paper)}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="transition-colors duration-300 ease-mechanical hover:text-bronze-bright"
                            >
                                {paper.host ?? 'SOURCE'} ↗
                            </a>
                        ) : (
                            `NO ARXIV ID · ${paper.host ?? 'UNKNOWN'}`
                        )}
                        {external && <RepoTag external={external} />}
                        {paper.published && (
                            <>
                                {' · '}
                                <span className="border border-stone-line px-1.5 py-px text-[0.5rem] text-platinum-dim">
                                    PUBLISHED {publicationLabel(paper.published)}
                                </span>
                            </>
                        )}
                        {onAnchor && (
                            <>
                                {' · '}
                                <button
                                    type="button"
                                    onClick={onAnchor}
                                    title={anchored ? 'Return to the week' : 'Link to this paper'}
                                    className={`transition-colors duration-300 ease-mechanical hover:text-bronze-bright ${anchored ? 'text-bronze' : ''
                                        }`}
                                >
                                    {anchored ? 'LINKED' : 'LINK'}
                                </button>
                            </>
                        )}
                        {!paper.held && paper.id && ' · NOT PULLED'}
                        {score?.truncated && ' · TRUNCATED'}
                        {score && ` · ${band(score.product)}`}
                        {reading && (
                            <span className="kyros-reading ml-2 text-bronze">
                                {state.stage === 'critic' ? 'CHALLENGING' : 'READING'}
                            </span>
                        )}
                    </span>
                </div>


                <PaperControls
                    onAside={onAside}
                    score={score}
                    hasCritique={Boolean(critique)}
                    openFlags={openFlags}
                    canRun={canRun}
                    busy={busy}
                    failed={state.status === 'error'}
                    onRun={onRun}
                    onCritic={onCritic}
                    onBreakdown={onBreakdown}
                    onClear={onClear}
                />
            </header>

            {state.status === 'error' && (
                <p className="border-t border-stone-line px-5 py-3 font-sans text-[0.68rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                    {state.message}
                </p>
            )}

            {score && (
                <div className="border-t border-stone-line">
                    <Panel
                        label="Overview"
                        words={score.corePremise}
                        open={Boolean(openRows.overview)}
                        onToggle={() => onToggleRow('overview')}
                        flag={flagFor('summary')}
                        onFlag={() => onOpenNote('summary')}
                    >
                        <div className="flex flex-col gap-4">
                            <Bullets items={score.summary} />
                            <div className="grid gap-px border border-stone-line bg-stone-line sm:grid-cols-[0.9fr_1.4fr_0.7fr]">
                                <div className="bg-obsidian-800 px-3 py-2">
                                    <span className="block font-sans text-[0.48rem] uppercase tracking-[0.22em] text-platinum-dim">
                                        Contribution
                                    </span>
                                    <span className="mt-1 block font-sans text-[0.66rem] tracking-[0.03em] text-marble">
                                        {contributionLabel(score)}
                                    </span>
                                </div>
                                <div className="bg-obsidian-800 px-3 py-2">
                                    <span className="block font-sans text-[0.48rem] uppercase tracking-[0.22em] text-platinum-dim">
                                        Paradigm location
                                    </span>
                                    <span className="mt-1 block font-sans text-[0.66rem] tracking-[0.03em] text-marble">
                                        {paradigmLocation(score)}
                                    </span>
                                </div>
                                <div className="bg-obsidian-800 px-3 py-2">
                                    <span className="block font-sans text-[0.48rem] uppercase tracking-[0.22em] text-platinum-dim">
                                        Reading confidence
                                    </span>
                                    <span className="mt-1 block font-mono text-[0.56rem] uppercase tracking-[0.12em] text-platinum">
                                        {score.confidence}
                                        {critique && ` · ${critique.notes.filter((n) => !n.agrees).length} objections`}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </Panel>

                    {RANKS.map((r) => (
                        <Rank
                            key={r.key}
                            label={r.label}
                            symbol={r.symbol}
                            value={score[r.key].score}
                            words={rankHeadline(score, r.key)}
                            note={
                                r.key === 'incentives'
                                    ? outcomeNote(score)
                                    : r.key === 'inversion' && score.inversion.paradigm
                                          ? `· ${score.inversion.paradigm} (${score.inversion.paradigmImportance}/10)`
                                        : undefined
                            }
                            open={Boolean(openRows[r.key])}
                            onToggle={() => onToggleRow(r.key)}
                            flag={flagFor(DETAIL_FOR[r.key])}
                            onFlag={() => onOpenNote(DETAIL_FOR[r.key])}
                        >
                            {r.key === 'inversion' ? (
                                <InversionDetail
                                    score={score}
                                    standingAssumption={standingAssumption}
                                />
                            ) : r.key === 'incentives' ? (
                                <IncentivesDetail score={score} />
                            ) : (
                                <InflectionDetail
                                    score={score}
                                    position={stored?.delta?.position}
                                    proposes={stored?.delta?.proposes}
                                    paradigmAsOf={stored?.delta?.paradigmAsOf}
                                />
                            )}
                        </Rank>
                    ))}

                    {paper.digest.lede && (
                        <Panel
                            label="Digest summary"
                            open={Boolean(openRows.digest)}
                            onToggle={() => onToggleRow('digest')}
                        >
                            <div className="flex flex-col gap-3">
                                <p className="font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-platinum">
                                    {paper.digest.lede}
                                </p>
                                {paper.digest.points.length > 0 && (
                                    <Bullets items={paper.digest.points} muted />
                                )}
                                {paper.links.length > 0 && (
                                    <div className="flex gap-4">
                                        {paper.links.map((l) => (
                                            <a
                                                key={l.url}
                                                href={l.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-bronze transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                                            >
                                                {l.label} ↗
                                            </a>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </Panel>
                    )}
                </div>
            )}
        </article>
    );
}
