'use client';

import { useEffect, useState } from 'react';

// ─── the seat prompts ─────────────────────────────────────────────────────────
// The literal system text each seat is given, shown beside the dated snapshot
// it is printed into — and editable, because tuning a scorer means tuning its
// instructions and doing that through a file edit and a redeploy is not tuning.
//
// Every save appends a VERSION rather than overwriting, and the version is
// stamped on whatever the seat then produces. That is not bookkeeping: this
// ledger holds frozen predictions, and a prediction is only frozen if you can
// still say what instrument made it. `paradigmAsOf` answers "measured against
// what"; the prompt version answers "measured how". Without it two scores taken
// a day apart could be incomparable with nothing on either row saying so.
//
// The SCORING RULES are deliberately not editable from anywhere. A rule is
// arithmetic the route enforces; a prompt is text handed to a model. Only the
// second is safe to hand to an interface.

interface Version {
    version: number;
    note: string | null;
    editedAt: string;
    chars: number;
}

interface Seat {
    id: string;
    name: string;
    kind: 'seat' | 'law';
    note: string;
    text: string;
    version: number;
    editedAt: string | null;
    editNote: string | null;
    edited: boolean;
    builtInChars: number;
    history: Version[];
}

const LAW_SYMBOL: Record<string, string> = {
    inversion: 'I¹',
    incentives: 'I²',
    inflection: 'I³',
};

export default function SeatPrompts() {
    const [seats, setSeats] = useState<Seat[] | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState('');
    const [copied, setCopied] = useState<'yes' | 'failed' | null>(null);

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState('');
    const [note, setNote] = useState('');
    const [saving, setSaving] = useState(false);

    function load() {
        return fetch('/api/engine/prompts')
            .then((r) => r.json())
            .then((g: { prompts?: Seat[] }) => {
                const rows = g.prompts ?? [];
                setSeats(rows);
                setOpen((cur) => cur || rows[0]?.id || '');
            })
            .catch(() => setError('Could not read the prompts.'));
    }

    useEffect(() => {
        load();
    }, []);

    const active = seats?.find((s) => s.id === open);

    /** Two routes and an honest failure. `navigator.clipboard` needs a focused
     *  document in a secure context; a detached textarea covers most of the rest. */
    function copy() {
        if (!active) return;
        const flash = (state: 'yes' | 'failed') => {
            setCopied(state);
            setTimeout(() => setCopied(null), state === 'yes' ? 2000 : 3000);
        };
        const viaTextarea = () => {
            const ta = document.createElement('textarea');
            ta.value = active.text;
            ta.setAttribute('readonly', '');
            ta.style.position = 'fixed';
            ta.style.top = '-1000px';
            ta.style.opacity = '0';
            document.body.appendChild(ta);
            ta.select();
            let ok = false;
            try {
                ok = document.execCommand('copy');
            } catch {
                ok = false;
            }
            ta.remove();
            flash(ok ? 'yes' : 'failed');
        };
        try {
            navigator.clipboard.writeText(active.text).then(() => flash('yes'), viaTextarea);
        } catch {
            viaTextarea();
        }
    }

    async function save(body: Record<string, unknown>) {
        if (!active) return;
        setSaving(true);
        setError(null);
        try {
            const res = await fetch('/api/engine/prompts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ seat: active.id, ...body }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error ?? 'Could not save the prompt.');
                return;
            }
            await load();
            setEditing(false);
            setNote('');
        } catch {
            setError('Could not save the prompt.');
        } finally {
            setSaving(false);
        }
    }

    if (error && !seats) {
        return (
            <p className="px-6 py-6 font-sans text-[0.7rem] tracking-[0.03em] text-platinum-dim">
                {error}
            </p>
        );
    }
    if (!seats) {
        return (
            <p className="px-6 py-6 font-mono text-[0.6rem] uppercase tracking-[0.2em] text-platinum-dim">
                Reading&hellip;
            </p>
        );
    }

    return (
        <>
            <div className="px-6 py-4">
                <span className="block font-sans text-[0.58rem] uppercase tracking-[0.22em] text-bronze">
                    The instrument, as sent
                </span>
                <p className="mt-1.5 font-sans text-[0.62rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                    Three LAW pages — what each law means — and three SEAT prompts, assembled with
                    the snapshot on the other tab into what a model actually receives. The laws are
                    permanent; the paradigm is dated. Editing appends a version, and the version is
                    recorded on every row scored afterwards.
                </p>
            </div>

            <div className="flex flex-wrap gap-px border-y border-stone-line bg-stone-line">
                {seats.map((s) => (
                    <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                            setOpen(s.id);
                            setCopied(null);
                            setEditing(false);
                            setError(null);
                        }}
                        className={`min-w-[6.5rem] flex-1 px-3 py-2.5 text-left font-sans text-[0.58rem] uppercase tracking-[0.16em] transition-colors duration-500 ease-mechanical ${
                            s.id === open
                                ? 'bg-charcoal text-bronze-bright'
                                : 'bg-obsidian-800 text-platinum-dim hover:text-bronze'
                        }`}
                    >
                        <span className="block truncate">
                            {s.kind === 'law' && (
                                <span className="mr-1 font-serif text-[0.7rem] normal-case text-bronze">
                                    {LAW_SYMBOL[s.id] ?? ''}
                                </span>
                            )}
                            {s.name}
                            {s.edited && <span className="ml-1 text-bronze">v{s.version}</span>}
                        </span>
                    </button>
                ))}
            </div>

            {active && (
                <div className="px-6 py-4">
                    <p className="mb-3 font-sans text-[0.64rem] leading-relaxed tracking-[0.03em] text-platinum-dim">
                        {active.note}
                    </p>

                    {error && (
                        <p className="mb-3 border-l-2 border-halt pl-3 font-sans text-[0.64rem] tracking-[0.03em] text-halt-bright">
                            {error}
                        </p>
                    )}

                    {editing ? (
                        <>
                            <textarea
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                spellCheck={false}
                                className="h-[46vh] w-full resize-none overflow-auto whitespace-pre-wrap break-words border border-bronze-dim bg-obsidian-800 px-4 py-3 font-mono text-[0.6rem] leading-relaxed text-marble outline-none focus:border-bronze"
                            />
                            <input
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="What changed, and why — shown beside the version"
                                className="mt-2 w-full border border-stone-line bg-obsidian-800 px-3 py-2 font-sans text-[0.64rem] tracking-[0.03em] text-marble outline-none placeholder:text-platinum-dim/60 focus:border-stone-line-strong"
                            />
                            <div className="mt-3 flex items-center gap-3">
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => save({ text: draft, note })}
                                    className="border border-bronze-dim px-4 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] text-bronze transition-colors duration-500 ease-mechanical hover:border-bronze hover:text-bronze-bright disabled:opacity-40"
                                >
                                    {saving ? 'Saving…' : `Save as v${active.version + 1}`}
                                </button>
                                <button
                                    type="button"
                                    disabled={saving}
                                    onClick={() => {
                                        setEditing(false);
                                        setError(null);
                                    }}
                                    className="font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-platinum disabled:opacity-40"
                                >
                                    Cancel
                                </button>
                                <span className="ml-auto font-mono text-[0.55rem] uppercase tracking-[0.14em] text-platinum-dim/70">
                                    {draft.length.toLocaleString()} characters
                                </span>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={copy}
                                    aria-label={`Copy the ${active.name.toLowerCase()} prompt`}
                                    title={`Copy the ${active.name.toLowerCase()} prompt`}
                                    className="absolute right-2 top-2 z-10 border border-stone-line bg-charcoal px-2 py-1 font-mono text-[0.55rem] uppercase tracking-[0.14em] text-platinum-dim transition-colors duration-300 ease-mechanical hover:border-stone-line-strong hover:text-bronze-bright"
                                >
                                    {copied === 'yes'
                                        ? 'copied'
                                        : copied === 'failed'
                                          ? 'copy blocked'
                                          : '⧉ copy'}
                                </button>
                                <pre className="max-h-[46vh] overflow-auto whitespace-pre-wrap break-words border border-stone-line bg-obsidian-800 px-4 py-3 pr-16 font-mono text-[0.6rem] leading-relaxed text-platinum">
                                    {active.text}
                                </pre>
                            </div>

                            <div className="mt-3 flex flex-wrap items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDraft(active.text);
                                        setEditing(true);
                                    }}
                                    className="border border-stone-line px-4 py-2 font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:border-stone-line-strong hover:text-bronze-bright"
                                >
                                    Edit
                                </button>
                                {active.edited && (
                                    <button
                                        type="button"
                                        disabled={saving}
                                        onClick={() => save({ revert: true })}
                                        title="Append a version holding the text that ships in the repository"
                                        className="font-sans text-[0.6rem] uppercase tracking-[0.24em] text-platinum-dim transition-colors duration-500 ease-mechanical hover:text-bronze-bright disabled:opacity-40"
                                    >
                                        Restore built-in
                                    </button>
                                )}
                                <span className="ml-auto font-mono text-[0.55rem] uppercase tracking-[0.14em] text-platinum-dim/70">
                                    {active.version === 0
                                        ? 'built-in'
                                        : `v${active.version}${active.edited ? '' : ' · built-in text'}`}
                                    {' · '}
                                    {active.text.length.toLocaleString()} characters
                                </span>
                            </div>

                            {/* Which versions exist, so a row stamped v2 can be
                                read against the text v2 actually held. */}
                            {active.history.length > 0 && (
                                <div className="mt-4 border-t border-stone-line pt-3">
                                    <span className="mb-2 block font-sans text-[0.46rem] uppercase tracking-[0.22em] text-platinum-dim">
                                        Versions
                                    </span>
                                    <ul className="flex flex-col gap-1">
                                        {active.history.map((h) => (
                                            <li
                                                key={h.version}
                                                className="flex items-baseline gap-3 font-mono text-[0.55rem] tracking-[0.1em] text-platinum-dim"
                                            >
                                                <span className="w-8 shrink-0 text-bronze">
                                                    v{h.version}
                                                </span>
                                                <span className="w-24 shrink-0">
                                                    {h.editedAt.slice(0, 10)}
                                                </span>
                                                <span className="min-w-0 flex-1 truncate font-sans text-[0.62rem] tracking-[0.03em]">
                                                    {h.note ?? '—'}
                                                </span>
                                                <span className="shrink-0">
                                                    {h.chars.toLocaleString()}
                                                </span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}
        </>
    );
}
