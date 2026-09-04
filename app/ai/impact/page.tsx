'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    I3_CATEGORIES,
    I3_CATEGORY_COLORS,
    I3_DATA,
    I3_MAX_SCORE,
    I3_MIN_YEAR,
    I3_MAX_YEAR,
    type I3Category,
    type I3Entry,
    type I3Scores,
} from '@/lib/i3Data';

// ─── chart constants ──────────────────────────────────────────────────────────

const CHART_PADDING = { top: 160, right: 32, bottom: 26, left: 60 };
const DOT_R = 4;
const STEM_WIDTH = 1;
const LABEL_GAP = 8;
const LABEL_ROTATE = -55;
const Y_TICKS = [0, 100, 200, 400, 600, 800, 1000];

// ─── types ────────────────────────────────────────────────────────────────────

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

// ─── helpers ─────────────────────────────────────────────────────────────────

function i3Band(score: number): string {
    if (score >= 900) return 'Historical outlier';
    if (score >= 600) return 'Exceptional inflection';
    if (score >= 300) return 'Paradigm-defining';
    if (score >= 100) return 'Structural shift';
    if (score >= 27) return 'Significant contribution';
    if (score >= 1) return 'Enabling contribution';
    return 'Canon threshold';
}

function formatYear(year: number, month: number): string {
    const m = new Date(year, month - 1).toLocaleString('default', { month: 'short' });
    return `${m} ${year}`;
}

function computeI3(s: I3Scores): number {
    return s.inversion * s.incentives * s.inflection;
}

// ─── score stepper ────────────────────────────────────────────────────────────

function ScoreStepper({ value, onChange }: { value: number; onChange: (next: number) => void }) {
    const btn =
        'flex h-6 w-6 shrink-0 items-center justify-center border border-stone-line font-mono text-sm text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-bronze hover:text-bronze-bright disabled:opacity-20 disabled:cursor-not-allowed';
    return (
        <div className="flex items-center gap-2">
            <button type="button" aria-label="Decrease" disabled={value <= 0} onClick={() => onChange(value - 1)} className={btn}>−</button>
            <span className="w-5 text-center font-serif text-2xl font-light leading-none text-marble">{value}</span>
            <button type="button" aria-label="Increase" disabled={value >= 10} onClick={() => onChange(value + 1)} className={btn}>+</button>
        </div>
    );
}

// ─── framework modal ──────────────────────────────────────────────────────────

function FrameworkModal({ onClose }: { onClose: () => void }) {
    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal
            aria-label="I³ scoring framework"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-lg flex-col border border-stone-line-strong bg-charcoal"
            >
                <header className="flex shrink-0 items-center justify-between border-b border-stone-line px-6 py-4">
                    <div className="flex items-baseline gap-3">
                        <h2 className="font-serif text-lg font-light tracking-wide text-marble">I³ Framework</h2>
                        <span className="font-mono text-[0.6rem] tracking-[0.14em] text-platinum-dim">y = I³</span>
                    </div>
                    <button type="button" onClick={onClose} className="font-sans text-[0.6rem] uppercase tracking-[0.28em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright">
                        Close
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto">
                    <div className="border-b border-stone-line px-6 py-5">
                        <p className="font-serif text-center text-2xl font-light tracking-[0.2em] text-marble">
                            I³ = Inversion × Incentives × Inflection
                        </p>
                        <p className="mt-3 text-center font-mono text-[0.58rem] tracking-[0.14em] text-platinum-dim">
                            Each dimension scored 0–10 · Product range 0–1,000
                        </p>
                    </div>

                    <div className="divide-y divide-stone-line border-b border-stone-line">
                        {([
                            { symbol: 'I¹', name: 'Inversion', question: 'How strongly does it invert the previous paradigm?', high: 'Replaces a fundamental assumption or method. The prior approach becomes obsolete.', low: 'Improves on the existing approach without challenging its foundations.' },
                            { symbol: 'I²', name: 'Incentives', question: 'How obviously relevant and useful is it?', high: 'Once available, powerful and immediate reasons to adopt exist across many actors.', low: 'Useful in narrow contexts or requires significant cost to adopt.' },
                            { symbol: 'I³', name: 'Inflection', question: 'How unique and useful is it?', high: 'Introduces something genuinely new that matters — no prior system had demonstrated this.', low: 'An incremental advance on existing methods with limited generality.' },
                        ]).map((dim) => (
                            <div key={dim.symbol} className="px-6 py-4">
                                <div className="mb-2 flex items-baseline gap-3">
                                    <span className="font-serif text-base font-light text-bronze-bright">{dim.symbol}</span>
                                    <span className="font-sans text-[0.7rem] uppercase tracking-[0.22em] text-marble">{dim.name}</span>
                                </div>
                                <p className="mb-2 font-sans text-[0.64rem] italic tracking-[0.03em] text-platinum-dim">{dim.question}</p>
                                <div className="flex gap-4 text-[0.6rem] leading-relaxed tracking-[0.03em]">
                                    <div className="flex-1">
                                        <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-bronze">10 </span>
                                        <span className="text-platinum-dim">{dim.high}</span>
                                    </div>
                                    <div className="flex-1">
                                        <span className="font-mono text-[0.55rem] uppercase tracking-[0.16em] text-platinum-dim">1 </span>
                                        <span className="text-platinum-dim">{dim.low}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="px-6 py-4">
                        <p className="font-sans text-[0.63rem] leading-relaxed tracking-[0.04em] text-platinum-dim">
                            Multiplication encodes a structural claim:{' '}
                            <span className="text-platinum">paradigm-defining developments require convergence across all three dimensions.</span>{' '}
                            The Transformer is a statistical freak because it achieved 10 × 10 × 10.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─── sub-components ───────────────────────────────────────────────────────────

function CategoryDot({ category, size = 7 }: { category: I3Category; size?: number }) {
    return (
        <span
            aria-hidden
            className="shrink-0 rounded-full"
            style={{ width: size, height: size, background: I3_CATEGORY_COLORS[category] }}
        />
    );
}

function SaveIndicator({ state }: { state: SaveState }) {
    if (state === 'idle') return null;
    return (
        <span className={`font-mono text-[0.58rem] uppercase tracking-[0.2em] transition-opacity duration-500 ${state === 'error' ? 'text-bronze-bright' :
            state === 'saving' ? 'animate-pulse text-bronze' :
                'text-platinum-dim'
            }`}>
            {state === 'saving' ? 'Saving…' : state === 'saved' ? 'Saved' : '⚠ Failed'}
        </span>
    );
}

// ─── detail modal ─────────────────────────────────────────────────────────────

function DetailModal({
    entry,
    scores,
    onScoreChange,
    saveState,
    onClose,
}: {
    entry: I3Entry;
    scores: I3Scores;
    onScoreChange: (dim: keyof I3Scores, value: number) => void;
    saveState: SaveState;
    onClose: () => void;
}) {
    useEffect(() => {
        const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', fn);
        return () => window.removeEventListener('keydown', fn);
    }, [onClose]);

    const i3Score = computeI3(scores);

    const dims: { key: keyof I3Scores; label: string; score: number }[] = [
        { key: 'inversion', label: 'I¹ Inversion', score: scores.inversion },
        { key: 'incentives', label: 'I² Incentives', score: scores.incentives },
        { key: 'inflection', label: 'I³ Inflection', score: scores.inflection },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/85 px-6 backdrop-blur-sm"
            onClick={onClose}
            role="dialog"
            aria-modal
            aria-label={entry.label}
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="relative flex max-h-[85vh] w-full max-w-2xl flex-col border border-stone-line-strong bg-charcoal"
            >
                {/* close button */}
                <button
                    type="button"
                    onClick={onClose}
                    aria-label="Close"
                    className="absolute right-4 top-4 z-10 flex h-7 w-7 items-center justify-center text-platinum-dim transition-colors duration-300 ease-mechanical hover:text-marble"
                >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
                        <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                </button>

                {/* header */}
                <header className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-line px-6 py-4 pr-12">
                    <div className="flex flex-col gap-1">
                        <h2 className="font-serif text-2xl font-light tracking-[0.1em] text-marble">{entry.label}</h2>
                        <div className="flex flex-wrap items-center gap-3">
                            <CategoryDot category={entry.category} />
                            <span className="font-sans text-[0.68rem] uppercase tracking-[0.22em] text-platinum-dim">{entry.category}</span>
                            <span className="font-mono text-[0.68rem] tracking-[0.14em] text-platinum-dim">{formatYear(entry.year, entry.month)}</span>
                        </div>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                        <div className="flex items-baseline gap-1.5">
                            <span className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-platinum-dim">I³</span>
                            <span className="font-serif text-4xl font-light leading-none text-bronze-bright tabular-nums" style={{ minWidth: '3.5ch' }}>{i3Score}</span>
                        </div>
                        <span className="font-sans text-[0.65rem] uppercase tracking-[0.14em] text-platinum-dim">{i3Band(i3Score)}</span>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto">
                    {/* description + previous paradigm */}
                    {(entry.description || entry.previousParadigm) && (
                        <div className="flex flex-col gap-4 border-b border-stone-line px-6 py-5">
                            {entry.description && (
                                <p className="text-sm leading-relaxed tracking-[0.03em] text-platinum">
                                    {entry.description}
                                </p>
                            )}
                            {entry.previousParadigm && (
                                <div className="flex gap-3">
                                    <span className="mt-0.5 shrink-0 font-mono text-[0.6rem] uppercase tracking-[0.16em] text-bronze-dim">
                                        Before
                                    </span>
                                    <p className="text-[0.74rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                                        {entry.previousParadigm}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* three dimension cards */}
                    <div className="grid grid-cols-3 gap-3 border-b border-stone-line p-5">
                        {dims.map(({ key, label, score }) => (
                            <div key={key} className="flex flex-col gap-2 border border-stone-line p-3">
                                <span className="font-sans text-[0.65rem] uppercase tracking-[0.2em] text-platinum-dim">{label}</span>
                                <ScoreStepper value={score} onChange={(v) => onScoreChange(key, v)} />
                                <span className="h-px w-full overflow-hidden bg-stone-line">
                                    <span
                                        className="block h-full transition-[width] duration-300 ease-mechanical"
                                        style={{ width: `${score * 10}%`, background: 'var(--color-bronze-dim)' }}
                                    />
                                </span>
                                <p className="font-sans text-[0.7rem] leading-relaxed tracking-[0.03em] text-platinum">
                                    {entry.rationale[key]}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* thesis */}
                    <div className="border-b border-stone-line px-6 py-4">
                        <div className="border-l-2 border-bronze-dim pl-4">
                            <p className="font-sans text-sm leading-relaxed tracking-[0.04em] text-marble">{entry.thesis}</p>
                        </div>
                    </div>

                    {/* consequence */}
                    {entry.consequenceYear && (
                        <div className="flex items-start gap-3 px-6 py-4">
                            <span className="mt-px font-mono text-[0.68rem] tracking-[0.1em] text-bronze">{entry.consequenceYear}</span>
                            <p className="font-sans text-[0.74rem] leading-relaxed tracking-[0.04em] text-platinum">{entry.consequenceNote}</p>
                        </div>
                    )}
                </div>

                {/* footer — fixed height so save indicator never shifts layout */}
                <div className="flex h-8 shrink-0 items-center border-t border-stone-line px-6">
                    <SaveIndicator state={saveState} />
                </div>
            </div>
        </div>
    );
}

// ─── dot chart ────────────────────────────────────────────────────────────────

interface DotChartProps {
    entries: I3Entry[];
    scoreOverrides: Map<string, I3Scores>;
    selected: string | null;
    onSelect: (id: string) => void;
}

function DotChart({ entries, scoreOverrides, selected, onSelect }: DotChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerW, setContainerW] = useState(800);
    const [containerH, setContainerH] = useState(400);

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver(([e]) => {
            setContainerW(e.contentRect.width);
            setContainerH(e.contentRect.height);
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    const sorted = useMemo(
        () => [...entries].sort((a, b) => a.year - b.year || a.month - b.month),
        [entries],
    );

    const { top, right, bottom, left } = CHART_PADDING;
    const plotW = containerW - left - right;
    const plotH = containerH - top - bottom;
    const baseline = top + plotH;
    const colSpacing = sorted.length > 1 ? plotW / (sorted.length - 1) : plotW / 2;

    function xForCol(i: number) {
        return sorted.length === 1 ? left + plotW / 2 : left + i * colSpacing;
    }
    function yForScore(score: number) {
        return top + plotH - (score / I3_MAX_SCORE) * plotH;
    }

    return (
        <div ref={containerRef} className="h-full w-full">
            <svg width={containerW} height={containerH} aria-label="I³ impact chart" className="block overflow-visible">

                {/* y-axis grid + labels */}
                {Y_TICKS.map((tick) => {
                    const y = yForScore(tick);
                    return (
                        <g key={tick}>
                            <line
                                x1={left} y1={y} x2={containerW - right} y2={y}
                                stroke={tick === 0 ? 'var(--color-stone-line-strong)' : 'var(--color-stone-line)'}
                                strokeWidth={1} strokeDasharray={tick === 0 ? undefined : '3 5'}
                            />
                            <text x={left - 8} y={y} textAnchor="end" dominantBaseline="middle"
                                fontSize={9} fontFamily="var(--font-geist-mono), monospace"
                                fill="var(--color-platinum-dim)" letterSpacing="0.06em">
                                {tick}
                            </text>
                        </g>
                    );
                })}

                {/* y-axis label */}
                <text x={12} y={top + plotH / 2} textAnchor="middle" fontSize={8}
                    fontFamily="var(--font-geist-mono), monospace" fill="var(--color-platinum-dim)"
                    letterSpacing="0.14em" transform={`rotate(-90, 12, ${top + plotH / 2})`}>
                    I³ SCORE
                </text>

                {/* stems + dots + labels */}
                {sorted.map((entry, i) => {
                    const s = scoreOverrides.get(entry.id) ?? entry.i3;
                    const i3Score = computeI3(s);
                    const cx = xForCol(i);
                    const cy = yForScore(i3Score);
                    const isSelected = selected === entry.id;
                    const dotFill = isSelected ? 'var(--color-bronze-bright)' : 'var(--color-platinum-dim)';
                    const stemColor = isSelected ? 'var(--color-stone-line-strong)' : 'var(--color-stone-line)';
                    const labelAnchorY = cy - DOT_R - LABEL_GAP;

                    return (
                        <g key={entry.id} className="cursor-pointer"
                            onClick={() => onSelect(entry.id)}
                            role="button" aria-pressed={isSelected}
                            aria-label={`${entry.label}, I³ ${i3Score}`}>

                            {/* hit area */}
                            <rect x={cx - 16} y={top} width={32} height={baseline - top + 20} fill="transparent" />

                            {/* stem */}
                            <line x1={cx} y1={baseline} x2={cx} y2={cy + DOT_R}
                                stroke={stemColor} strokeWidth={STEM_WIDTH}
                                className="transition-colors duration-300 ease-mechanical" />

                            {/* dot */}
                            <circle cx={cx} cy={cy} r={isSelected ? DOT_R + 1.5 : DOT_R}
                                fill={dotFill} className="transition-all duration-300 ease-mechanical" />

                            {/* score above dot */}
                            <text x={cx} y={cy - DOT_R - 3} textAnchor="middle" dominantBaseline="auto"
                                fontSize={8} fontFamily="var(--font-geist-mono), monospace"
                                fill={isSelected ? 'var(--color-bronze-bright)' : 'var(--color-platinum-dim)'}
                                className="transition-colors duration-300">
                                {i3Score}
                            </text>

                            {/* rotated label */}
                            <text x={cx} y={labelAnchorY - 14} textAnchor="start" fontSize={9.5}
                                fontFamily="var(--font-geist-sans), sans-serif"
                                fill={isSelected ? 'var(--color-marble)' : 'var(--color-platinum)'}
                                transform={`rotate(${LABEL_ROTATE}, ${cx}, ${labelAnchorY - 14})`}
                                className="transition-colors duration-300">
                                {entry.label}
                            </text>

                            {/* year */}
                            <text x={cx} y={baseline + 14} textAnchor="middle" fontSize={8}
                                fontFamily="var(--font-geist-mono), monospace"
                                fill={isSelected ? 'var(--color-platinum)' : 'var(--color-platinum-dim)'}
                                letterSpacing="0.08em">
                                {entry.year}
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function AiImpactNewPage() {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [frameworkOpen, setFrameworkOpen] = useState(false);
    const [activeCategories, setActiveCategories] = useState<Set<I3Category>>(new Set(I3_CATEGORIES));

    // Live score overrides — keyed by entry id, initialised from static data
    const [scoreOverrides, setScoreOverrides] = useState<Map<string, I3Scores>>(() => {
        const m = new Map<string, I3Scores>();
        for (const e of I3_DATA) m.set(e.id, { ...e.i3 });
        return m;
    });

    // Per-entry save state
    const [saveStates, setSaveStates] = useState<Map<string, SaveState>>(new Map());
    const savedTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

    const selectedEntry = I3_DATA.find((e) => e.id === selectedId) ?? null;

    // ── score change handler ──────────────────────────────────────────────────
    const handleScoreChange = useCallback(
        async (id: string, dim: keyof I3Scores, value: number) => {
            // 1. optimistic update
            setScoreOverrides((prev) => {
                const next = new Map(prev);
                const current = next.get(id) ?? { inversion: 0, incentives: 0, inflection: 0 };
                next.set(id, { ...current, [dim]: value });
                return next;
            });

            // 2. clear any pending "saved" timer
            const existing = savedTimers.current.get(id);
            if (existing) clearTimeout(existing);

            // 3. mark saving
            setSaveStates((prev) => new Map(prev).set(id, 'saving'));

            // 4. persist
            try {
                const scores = scoreOverrides.get(id)!;
                const updated = { ...scores, [dim]: value };
                const res = await fetch(`/api/i3-scores/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updated),
                });
                if (!res.ok) throw new Error();
                setSaveStates((prev) => new Map(prev).set(id, 'saved'));
                const t = setTimeout(() => {
                    setSaveStates((prev) => new Map(prev).set(id, 'idle'));
                }, 2000);
                savedTimers.current.set(id, t);
            } catch {
                setSaveStates((prev) => new Map(prev).set(id, 'error'));
            }
        },
        [scoreOverrides],
    );

    // ── category filter ───────────────────────────────────────────────────────
    function toggleCategory(cat: I3Category) {
        setActiveCategories((prev) => {
            const next = new Set(prev);
            if (next.has(cat)) {
                if (next.size === 1) return prev;
                next.delete(cat);
            } else {
                next.add(cat);
            }
            return next;
        });
    }

    function handleSelect(id: string) {
        setSelectedId((prev) => (prev === id ? null : id));
    }

    const filtered = useMemo(
        () => I3_DATA.filter((e) => activeCategories.has(e.category)),
        [activeCategories],
    );

    const allActive = activeCategories.size === I3_CATEGORIES.length;

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="flex h-[calc(100svh-4rem-1px)] flex-col overflow-hidden">

            {/* header */}
            <header className="shrink-0 border-b border-stone-line px-8 py-4">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                    <h1 className="font-serif text-2xl font-light tracking-[0.16em] text-marble">AI IMPACT</h1>
                    <span className="font-mono text-sm tracking-[0.22em] text-bronze">y = I³</span>
                    <p className="hidden font-mono text-[0.7rem] tracking-[0.14em] text-platinum-dim lg:block">
                        {I3_MIN_YEAR}–{I3_MAX_YEAR} · {I3_DATA.length} developments · 0–1,000
                    </p>
                    <button
                        type="button"
                        onClick={() => setFrameworkOpen(true)}
                        className="font-sans text-[0.68rem] uppercase tracking-[0.22em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                    >
                        Framework
                    </button>

                    {/* category filters */}
                    <div className="ml-auto flex flex-wrap items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setActiveCategories(new Set(I3_CATEGORIES))}
                            className={`font-sans text-[0.68rem] uppercase tracking-[0.22em] transition-colors duration-500 ease-mechanical ${allActive ? 'text-bronze' : 'text-platinum-dim hover:text-platinum'}`}
                        >
                            All
                        </button>
                        {I3_CATEGORIES.map((cat) => {
                            const on = activeCategories.has(cat);
                            return (
                                <button key={cat} type="button" onClick={() => toggleCategory(cat)}
                                    className={`flex items-center gap-1.5 border px-2.5 py-1 font-sans text-[0.65rem] uppercase tracking-[0.18em] transition-colors duration-500 ease-mechanical ${on ? 'border-stone-line-strong text-platinum' : 'border-transparent text-platinum-dim hover:text-platinum'}`}>
                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: I3_CATEGORY_COLORS[cat], opacity: on ? 1 : 0.3 }} />
                                    {cat}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </header>

            {/* body — chart fills the full height now */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="min-h-0 flex-1 px-4 py-2">
                    <DotChart
                        entries={filtered}
                        scoreOverrides={scoreOverrides}
                        selected={selectedId}
                        onSelect={handleSelect}
                    />
                </div>
            </div>

            {/* modals */}
            {frameworkOpen && <FrameworkModal onClose={() => setFrameworkOpen(false)} />}

            {selectedEntry && (
                <DetailModal
                    entry={selectedEntry}
                    scores={scoreOverrides.get(selectedEntry.id) ?? selectedEntry.i3}
                    saveState={saveStates.get(selectedEntry.id) ?? 'idle'}
                    onScoreChange={(dim, val) => handleScoreChange(selectedEntry.id, dim, val)}
                    onClose={() => setSelectedId(null)}
                />
            )}
        </div>
    );
}
