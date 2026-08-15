'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import AgentRail from '@/app/components/council/AgentRail';
import ParallelView from '@/app/components/council/ParallelView';
import PromptsModal from '@/app/components/council/PromptsModal';
import RefsModal from '@/app/components/council/RefsModal';
import SessionsSidebar from '@/app/components/council/SessionsSidebar';
import ThreadView from '@/app/components/council/ThreadView';
import UsageModal from '@/app/components/council/UsageModal';
import {
    buildSession,
    deleteSession as storageDeleteSession,
    fetchRefs,
    loadPreferences,
    loadSelection,
    loadSessions,
    newSessionId,
    renameSession as storageRenameSession,
    savePreferences,
    saveSelection,
    streamChat,
    upsertSession,
    type StreamResult,
} from '@/app/components/council/storage';
import {
    AGENT_COUNT,
    AGENT_NAMES,
    SILENT_RESPONSE,
    defaultAgentConfigs,
    emptyMsgState,
    formatCost,
    formatTokens,
    turnsFromParallel,
    usageForAgent,
    type AgentConfig,
    type AgentMessage,
    type AgentResponse,
    type AgentState,
    type CouncilMode,
    type MsgState,
    type PageRefMeta,
    type SavedSession,
    type Turn,
} from '@/app/components/council/types';

const MODES: { id: CouncilMode; label: string; hint: string }[] = [
    { id: 'cascade', label: 'Cascade', hint: 'Each agent reads the ones before it.' },
    { id: 'parallel', label: 'Parallel', hint: 'Each agent answers in isolation.' },
    { id: 'loop', label: 'Loop', hint: 'The council debates itself over rounds.' },
];

const AGENT_IDXS = Array.from({ length: AGENT_COUNT }, (_, i) => i);

/** Ceiling for the auto-growing composer, in px. Mirrors `max-h-36`. */
const COMPOSER_MAX_HEIGHT = 144;

// ─── prompt construction ─────────────────────────────────────────────────────
// The identity suffix keeps an agent from ventriloquising the others — without
// it models routinely answer as the whole council.

function agentIdentity(idx: number, extra = ''): string {
    return `You are ${AGENT_NAMES[idx]} on this council. Respond only as yourself, in first person, from your own vantage. Do not open by announcing who you are, and never speak on behalf of the other agents.${extra ? `\n\n${extra}` : ''}`;
}

function withIdentity(agent: AgentConfig, idx: number, extra = ''): string {
    return `${agent.systemPrompt}\n\n${agentIdentity(idx, extra)}`;
}

/** Labels a response for the agent about to read it, so it can tell its own
 *  voice from the others'. */
function speakerLabel(agentIdx: number, readerIdx: number): string {
    return agentIdx === readerIdx ? `You (${AGENT_NAMES[agentIdx]})` : AGENT_NAMES[agentIdx];
}

/** Flattens prior turns into a single transcript block. */
function transcriptBlock(turns: Turn[], readerIdx: number): string {
    const lines: string[] = [];
    turns.forEach((t) => {
        if (t.round) lines.push(`--- Round ${t.round} ---`);
        lines.push(`Analyst: ${t.question}`);
        t.responses.forEach((r) => {
            lines.push(`${speakerLabel(r.agentIdx, readerIdx)}: ${r.content}`);
        });
    });
    return lines.join('\n');
}

function precedingBlock(responses: AgentResponse[], readerIdx: number): string {
    return responses
        .map((r) => `${speakerLabel(r.agentIdx, readerIdx)} said:\n${r.content}`)
        .join('\n\n');
}

export default function CouncilPage() {
    // ── configuration ─────────────────────────────────────────────────────────
    const [mode, setMode] = useState<CouncilMode>('cascade');
    const [agentConfigs, setAgentConfigs] = useState<AgentConfig[]>(defaultAgentConfigs);
    // One voice unless the analyst convenes more. Replaced on hydration by
    // whatever was last used.
    const [selectedIdxs, setSelectedIdxs] = useState<Set<number>>(() => new Set([0]));
    const [loopRounds, setLoopRounds] = useState(2);

    // ── references ────────────────────────────────────────────────────────────
    // The corpus is attached per conversation and injected into every agent's
    // system prompt, so it is configuration rather than conversation state.
    const [availableRefs, setAvailableRefs] = useState<PageRefMeta[]>([]);
    const [attachedRefs, setAttachedRefs] = useState<PageRefMeta[]>([]);
    const [refsStatus, setRefsStatus] = useState<'loading' | 'ready' | 'error'>('loading');

    // ── ui ────────────────────────────────────────────────────────────────────
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [promptsOpen, setPromptsOpen] = useState(false);
    const [refsOpen, setRefsOpen] = useState(false);
    const [usageOpen, setUsageOpen] = useState(false);
    const [promptTab, setPromptTab] = useState(0);
    const [input, setInput] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [sessions, setSessions] = useState<SavedSession[]>([]);
    const [hydrated, setHydrated] = useState(false);

    // ── per-mode conversation state ───────────────────────────────────────────
    const [parallelMsgs, setParallelMsgs] = useState<MsgState[]>(() => AGENT_IDXS.map(emptyMsgState));
    const [cascadeTurns, setCascadeTurns] = useState<Turn[]>([]);
    const [loopTurns, setLoopTurns] = useState<Turn[]>([]);
    const [activeIdx, setActiveIdx] = useState<number | null>(null); // agent currently speaking
    const [loopRound, setLoopRound] = useState(0);

    // One session id per mode, so switching modes doesn't overwrite an archive entry.
    const [sessionIds, setSessionIds] = useState<Record<CouncilMode, string | null>>({
        parallel: null, cascade: null, loop: null,
    });

    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const bottomRef = useRef<HTMLDivElement | null>(null);
    const parallelBottomRefs = useRef<(HTMLDivElement | null)[]>([null, null, null]);
    const pinnedToBottom = useRef(true);

    // ── derived ───────────────────────────────────────────────────────────────
    const agents: AgentState[] = useMemo(
        () => agentConfigs.map((cfg, i) => ({ ...cfg, ...parallelMsgs[i] })),
        [agentConfigs, parallelMsgs],
    );

    const turns = mode === 'loop' ? loopTurns : cascadeTurns;
    const busy = activeIdx !== null;
    const hasMessages =
        mode === 'parallel' ? parallelMsgs.some((m) => m.messages.length > 0) : turns.length > 0;

    // ── hydration ─────────────────────────────────────────────────────────────
    // Preferences and the archive live in localStorage, which does not exist
    // during SSR — reading them after mount is the only way to keep the server
    // and first client render identical.
    useEffect(() => {
        /* eslint-disable react-hooks/set-state-in-effect */
        setAgentConfigs(loadPreferences());
        setSelectedIdxs(loadSelection());
        setSessions(loadSessions());
        setHydrated(true);
        /* eslint-enable react-hooks/set-state-in-effect */
    }, []);

    useEffect(() => {
        if (!hydrated) return;
        const t = setTimeout(() => savePreferences(agentConfigs), 500);
        return () => clearTimeout(t);
    }, [agentConfigs, hydrated]);

    useEffect(() => {
        if (!hydrated) return;
        saveSelection(selectedIdxs);
    }, [selectedIdxs, hydrated]);

    // The catalogue is metadata only — small, and static for the session.
    useEffect(() => {
        let cancelled = false;
        fetchRefs()
            .then((refs) => {
                if (cancelled) return;
                setAvailableRefs(refs);
                setRefsStatus('ready');
            })
            .catch(() => {
                if (!cancelled) setRefsStatus('error');
            });
        return () => { cancelled = true; };
    }, []);

    // ── scrolling ─────────────────────────────────────────────────────────────
    // Grow the composer with its content. Measuring from 0 rather than `auto`
    // keeps the reading independent of however the flex parent happens to be
    // sized at that moment.
    useEffect(() => {
        const el = textareaRef.current;
        if (!el) return;
        if (!input) {
            el.style.height = ''; // fall back to the class's min-height
            return;
        }
        el.style.height = '0px';
        el.style.height = `${Math.min(el.scrollHeight, COMPOSER_MAX_HEIGHT)}px`;
    }, [input]);

    useEffect(() => {
        if (!pinnedToBottom.current) return;
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
        parallelBottomRefs.current.forEach((r) => r?.scrollIntoView({ behavior: 'smooth' }));
    }, [cascadeTurns, loopTurns, parallelMsgs, activeIdx]);

    function handleScroll(e: React.UIEvent<HTMLDivElement>) {
        const el = e.currentTarget;
        pinnedToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    }

    // ── session persistence ───────────────────────────────────────────────────
    const archive = useCallback(
        (nextTurns: Turn[], nextParallel?: AgentMessage[][]) => {
            const id = sessionIds[mode] ?? newSessionId();
            setSessionIds((prev) => (prev[mode] === id ? prev : { ...prev, [mode]: id }));
            const existing = sessions.find((s) => s.id === id);
            setSessions(
                upsertSession(
                    buildSession({
                        id,
                        mode,
                        title: existing?.title ?? null,
                        agents: agentConfigs,
                        turns: nextTurns,
                        parallelMessages: nextParallel,
                        refs: attachedRefs,
                        selectedIdxs: [...selectedIdxs],
                    }),
                ),
            );
        },
        [mode, agentConfigs, sessions, sessionIds, attachedRefs, selectedIdxs],
    );

    function resetSession() {
        setSessionIds((prev) => ({ ...prev, [mode]: null }));
        if (mode === 'parallel') setParallelMsgs(AGENT_IDXS.map(emptyMsgState));
        else if (mode === 'loop') setLoopTurns([]);
        else setCascadeTurns([]);
        setInput('');
        setError(null);
        setLoopRound(0);
        pinnedToBottom.current = true;
    }

    function restoreSession(session: SavedSession) {
        setMode(session.mode);
        setAgentConfigs(
            defaultAgentConfigs().map((d, i) => session.agents[i] ?? d),
        );
        // Sessions saved before these were tracked carry neither — leave the
        // current attachment and roster alone rather than blanking them.
        if (session.refs) setAttachedRefs(session.refs);
        if (session.selectedIdxs) setSelectedIdxs(new Set(session.selectedIdxs));
        setSessionIds((prev) => ({ ...prev, [session.mode]: session.id }));
        if (session.mode === 'parallel') {
            setParallelMsgs(
                AGENT_IDXS.map((i) => ({
                    messages: session.parallelMessages?.[i] ?? [],
                    loading: false,
                    error: false,
                })),
            );
        } else if (session.mode === 'loop') {
            setLoopTurns(session.turns);
        } else {
            setCascadeTurns(session.turns);
        }
        setInput('');
        setError(null);
        pinnedToBottom.current = true;
    }

    function removeSession(id: string) {
        setSessions(storageDeleteSession(id));
        setSessionIds((prev) => {
            const next = { ...prev };
            (Object.keys(next) as CouncilMode[]).forEach((m) => {
                if (next[m] === id) next[m] = null;
            });
            return next;
        });
    }

    function renameSessionTitle(id: string, title: string) {
        setSessions(storageRenameSession(id, title));
    }

    // ── configuration handlers ────────────────────────────────────────────────
    function setAgentModel(idx: number, model: string) {
        setAgentConfigs((prev) => prev.map((a, i) => (i === idx ? { ...a, model } : a)));
    }

    function setAgentPrompt(idx: number, systemPrompt: string) {
        setAgentConfigs((prev) => prev.map((a, i) => (i === idx ? { ...a, systemPrompt } : a)));
    }

    function toggleAgent(idx: number) {
        setSelectedIdxs((prev) => {
            const next = new Set(prev);
            if (next.has(idx)) next.delete(idx);
            else next.add(idx);
            return next;
        });
    }

    function openPrompt(idx: number) {
        setPromptTab(idx);
        setPromptsOpen(true);
    }

    // ── submission ────────────────────────────────────────────────────────────
    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        const question = input.trim();
        if (!question || busy) return;
        setInput('');
        setError(null);
        pinnedToBottom.current = true;

        if (mode === 'parallel') await runParallel(question);
        else if (mode === 'loop') await runLoop(question);
        else await runCascade(question);
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            void handleSubmit(e as unknown as React.FormEvent);
        }
    }

    /** Streams one agent into `onPartial`, resolving with the final text and
     *  what the call cost. Errors become the silent-instrument response so one
     *  dead agent can't stall a run. */
    async function speak(
        idx: number,
        messages: AgentMessage[],
        extraIdentity: string,
        onPartial: (text: string) => void,
    ): Promise<StreamResult> {
        try {
            return await streamChat(
                {
                    messages,
                    model: agentConfigs[idx].model,
                    systemPrompt: withIdentity(agentConfigs[idx], idx, extraIdentity),
                    refIds: attachedRefs.map((r) => r.id),
                },
                onPartial,
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'The request failed.');
            return { content: SILENT_RESPONSE, usage: null };
        }
    }

    async function runParallel(question: string) {
        const speaking = AGENT_IDXS.filter((i) => selectedIdxs.has(i));
        if (speaking.length === 0) {
            setError('Select at least one agent before posing a question.');
            return;
        }

        const userMsg: AgentMessage = { role: 'user', content: question };
        const priorPerAgent = parallelMsgs.map((m) => m.messages);

        // A silenced agent's thread is left exactly as it was, so re-including
        // it later resumes rather than restarts.
        setParallelMsgs((prev) =>
            prev.map((m, i) =>
                speaking.includes(i)
                    ? {
                          messages: [...m.messages, userMsg, { role: 'assistant' as const, content: '' }],
                          loading: true,
                          error: false,
                      }
                    : m,
            ),
        );
        setActiveIdx(-1); // several at once; no single agent to highlight

        const finals = await Promise.all(
            speaking.map(async (i) => {
                const { content, usage } = await speak(
                    i,
                    [...priorPerAgent[i], userMsg],
                    'You are answering independently — the other agents cannot see your response and you cannot see theirs.',
                    (partial) => {
                        setParallelMsgs((prev) =>
                            prev.map((m, j) => {
                                if (j !== i) return m;
                                const msgs = [...m.messages];
                                msgs[msgs.length - 1] = { role: 'assistant', content: partial };
                                return { ...m, messages: msgs };
                            }),
                        );
                    },
                );
                setParallelMsgs((prev) =>
                    prev.map((m, j) => {
                        if (j !== i) return m;
                        const msgs = [...m.messages];
                        msgs[msgs.length - 1] = { role: 'assistant', content, usage: usage ?? undefined };
                        return { messages: msgs, loading: false, error: content === SILENT_RESPONSE };
                    }),
                );
                return { agentIdx: i, content, usage: usage ?? undefined };
            }),
        );

        setActiveIdx(null);
        // `finals` is ordered by who spoke, not by agent index — look up rather
        // than index into it.
        const byAgent = new Map(finals.map((f) => [f.agentIdx, f]));
        archive(
            [{ question, responses: finals }],
            AGENT_IDXS.map((i) => {
                const final = byAgent.get(i);
                return final
                    ? [
                          ...priorPerAgent[i],
                          userMsg,
                          { role: 'assistant' as const, content: final.content, usage: final.usage },
                      ]
                    : priorPerAgent[i];
            }),
        );
    }

    async function runCascade(question: string) {
        const speaking = AGENT_IDXS.filter((i) => selectedIdxs.has(i));
        if (speaking.length === 0) {
            setError('Select at least one agent before posing a question.');
            return;
        }

        const priorTurns = cascadeTurns;
        const turnIdx = priorTurns.length;
        setCascadeTurns((prev) => [...prev, { question, responses: [] }]);

        const responses: AgentResponse[] = [];
        for (const i of speaking) {
            setActiveIdx(i);
            const messages: AgentMessage[] = [];

            if (priorTurns.length > 0) {
                messages.push({
                    role: 'assistant',
                    content: `[Prior deliberation]\n${transcriptBlock(priorTurns, i)}`,
                });
            }
            messages.push({ role: 'user', content: question });
            if (responses.length > 0) {
                messages.push({
                    role: 'user',
                    content: `These agents have already spoken this turn. Build on them, challenge them, or correct them — but answer only as ${AGENT_NAMES[i]}, in your own words. Never reuse another agent's phrasing.\n\n${precedingBlock(responses, i)}\n\nNow give your own reading.`,
                });
            }

            setCascadeTurns((prev) =>
                prev.map((t, ti) =>
                    ti === turnIdx ? { ...t, responses: [...responses, { agentIdx: i, content: '' }] } : t,
                ),
            );

            const { content, usage } = await speak(i, messages, '', (partial) => {
                setCascadeTurns((prev) =>
                    prev.map((t, ti) =>
                        ti === turnIdx ? { ...t, responses: [...responses, { agentIdx: i, content: partial }] } : t,
                    ),
                );
            });

            responses.push({ agentIdx: i, content, usage: usage ?? undefined });
            setCascadeTurns((prev) =>
                prev.map((t, ti) => (ti === turnIdx ? { ...t, responses: [...responses] } : t)),
            );
        }

        setActiveIdx(null);
        archive([...priorTurns, { question, responses }]);
    }

    /** Cascade only — one agent re-reads the whole thread and adds a response
     *  without a new question from the analyst. */
    async function nudge(idx: number) {
        if (busy || cascadeTurns.length === 0) return;
        setError(null);
        const priorTurns = cascadeTurns;
        const turnIdx = priorTurns.length - 1;
        const existing = priorTurns[turnIdx].responses;

        setActiveIdx(idx);
        const messages: AgentMessage[] = [
            { role: 'assistant', content: `[Deliberation so far]\n${transcriptBlock(priorTurns, idx)}` },
            {
                role: 'user',
                content: `Read the deliberation above and respond as ${AGENT_NAMES[idx]}. Do not summarise what the others said — advance the analysis.`,
            },
        ];

        setCascadeTurns((prev) =>
            prev.map((t, ti) =>
                ti === turnIdx ? { ...t, responses: [...existing, { agentIdx: idx, content: '' }] } : t,
            ),
        );

        const { content, usage } = await speak(idx, messages, '', (partial) => {
            setCascadeTurns((prev) =>
                prev.map((t, ti) =>
                    ti === turnIdx ? { ...t, responses: [...existing, { agentIdx: idx, content: partial }] } : t,
                ),
            );
        });

        const merged = [...existing, { agentIdx: idx, content, usage: usage ?? undefined }];
        setCascadeTurns((prev) => prev.map((t, ti) => (ti === turnIdx ? { ...t, responses: merged } : t)));
        setActiveIdx(null);
        archive(priorTurns.map((t, ti) => (ti === turnIdx ? { ...t, responses: merged } : t)));
    }

    async function runLoop(question: string) {
        const speaking = AGENT_IDXS.filter((i) => selectedIdxs.has(i));
        if (speaking.length === 0) {
            setError('Select at least one agent before posing a question.');
            return;
        }

        // Kept locally because setState inside the round loop won't be visible
        // to the next iteration in time.
        let accumulated = [...loopTurns];

        for (let round = 1; round <= loopRounds; round++) {
            setLoopRound(round);
            const turnIdx = accumulated.length;
            setLoopTurns((prev) => [...prev, { question, round, responses: [] }]);

            const responses: AgentResponse[] = [];
            for (const i of speaking) {
                setActiveIdx(i);
                const messages: AgentMessage[] = [];

                if (accumulated.length > 0) {
                    messages.push({
                        role: 'assistant',
                        content: `[Prior rounds]\nOriginal question: ${question}\n\n${transcriptBlock(accumulated, i)}`,
                    });
                }
                messages.push({
                    role: 'user',
                    content:
                        round === 1
                            ? question
                            : `Round ${round} of ${loopRounds}. Continue the deliberation on: "${question}". Build on or challenge what was said in the earlier rounds — do not restate your previous position.`,
                });
                if (responses.length > 0) {
                    messages.push({
                        role: 'user',
                        content: `Others have spoken this round. Answer only as ${AGENT_NAMES[i]}, in your own words — never reuse another agent's phrasing.\n\n${precedingBlock(responses, i)}\n\nNow give your own reading.`,
                    });
                }

                setLoopTurns((prev) =>
                    prev.map((t, ti) =>
                        ti === turnIdx ? { ...t, responses: [...responses, { agentIdx: i, content: '' }] } : t,
                    ),
                );

                const { content, usage } = await speak(i, messages, '', (partial) => {
                    setLoopTurns((prev) =>
                        prev.map((t, ti) =>
                            ti === turnIdx
                                ? { ...t, responses: [...responses, { agentIdx: i, content: partial }] }
                                : t,
                        ),
                    );
                });

                responses.push({ agentIdx: i, content, usage: usage ?? undefined });
                setLoopTurns((prev) =>
                    prev.map((t, ti) => (ti === turnIdx ? { ...t, responses: [...responses] } : t)),
                );
            }

            accumulated = [...accumulated, { question, round, responses }];
        }

        setActiveIdx(null);
        setLoopRound(0);
        archive(accumulated);
    }

    // ── render ────────────────────────────────────────────────────────────────
    const modeHint = MODES.find((m) => m.id === mode)!.hint;
    const activeCount = selectedIdxs.size;

    // Parallel keeps per-agent threads rather than shared turns; folding them
    // into turn shape lets one set of helpers report on every mode.
    const usageTurns = mode === 'parallel' ? turnsFromParallel(parallelMsgs) : turns;
    const sessionUsage = usageForAgent(usageTurns);

    const emptyMessage =
        mode === 'parallel'
            ? 'Pose a question. Each agent answers alone.'
            : activeCount === 0
              ? 'No agents selected. Choose at least one.'
              : mode === 'loop'
                ? `Pose a question. The council will deliberate for ${loopRounds} ${loopRounds === 1 ? 'round' : 'rounds'}.`
                : 'Pose a question. Each agent reads the ones before it.';

    return (
        // 4rem is the navbar, the extra pixel its hairline border.
        <div className="flex h-[calc(100svh-4rem-1px)] overflow-hidden">
            {/* ── archive — sits left of the header, thread and composer alike ── */}
            <SessionsSidebar
                sessions={sessions}
                open={sidebarOpen}
                hasMessages={hasMessages}
                anyLoading={busy}
                activeId={sessionIds[mode]}
                onToggle={() => setSidebarOpen((v) => !v)}
                onNew={resetSession}
                onRestore={restoreSession}
                onDelete={removeSession}
                onRename={renameSessionTitle}
            />

            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                {/* ── header ── */}
                <header className="shrink-0 border-b border-stone-line px-6 py-4">
                    <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
                        <h1 className="font-serif text-xl font-light tracking-[0.16em] text-marble">
                            THE COUNCIL
                        </h1>

                        <div className="flex border border-stone-line">
                            {MODES.map((m, mi) => (
                                <button
                                    key={m.id}
                                    type="button"
                                    onClick={() => setMode(m.id)}
                                    disabled={busy}
                                    title={m.hint}
                                    className={`px-4 py-2 font-sans text-[0.62rem] uppercase tracking-[0.24em] transition-colors duration-500 ease-mechanical disabled:opacity-40 ${
                                        mi > 0 ? 'border-l border-stone-line' : ''
                                    } ${mode === m.id ? 'bg-charcoal text-bronze-bright' : 'text-platinum hover:text-marble'}`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {mode === 'loop' && (
                            <label className="flex items-center gap-3 font-sans text-[0.62rem] uppercase tracking-[0.24em] text-platinum-dim">
                                Rounds
                                <select
                                    value={loopRounds}
                                    onChange={(e) => setLoopRounds(Number(e.target.value))}
                                    disabled={busy}
                                    className="cursor-pointer appearance-none border border-stone-line bg-transparent px-2.5 py-1 font-mono text-[0.65rem] text-bronze outline-none disabled:opacity-40"
                                >
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <option key={n} value={n} className="bg-charcoal text-marble">
                                            {n}
                                        </option>
                                    ))}
                                </select>
                            </label>
                        )}

                        <div className="ml-auto flex items-center gap-6">
                            <span className="hidden font-mono text-[0.6rem] tracking-[0.16em] text-platinum-dim xl:inline">
                                {modeHint}
                            </span>
                            {/* The running total doubles as the way in — one
                                control rather than a readout beside a button. */}
                            <button
                                type="button"
                                onClick={() => setUsageOpen(true)}
                                title="Open the full accounting"
                                className="flex items-baseline gap-2.5 font-sans text-[0.62rem] uppercase tracking-[0.24em] text-platinum transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                            >
                                Usage
                                {sessionUsage && (
                                    <span className="font-mono text-[0.6rem] tracking-[0.12em] text-platinum-dim">
                                        {formatTokens(sessionUsage.totalTokens)} ·{' '}
                                        <span className="text-bronze">{formatCost(sessionUsage.cost)}</span>
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => setRefsOpen(true)}
                                title="Attach the corpus as context for this conversation"
                                className={`flex items-baseline gap-2.5 font-sans text-[0.62rem] uppercase tracking-[0.24em] transition-colors duration-500 ease-mechanical hover:text-bronze-bright ${
                                    attachedRefs.length > 0 ? 'text-bronze' : 'text-platinum'
                                }`}
                            >
                                References
                                {attachedRefs.length > 0 && (
                                    <span className="font-mono text-[0.6rem] tracking-[0.12em] text-platinum-dim">
                                        {attachedRefs.length}
                                    </span>
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={() => openPrompt(promptTab)}
                                className="font-sans text-[0.62rem] uppercase tracking-[0.24em] text-platinum transition-colors duration-500 ease-mechanical hover:text-bronze-bright"
                            >
                                Personas
                            </button>
                            <button
                                type="button"
                                onClick={resetSession}
                                disabled={!hasMessages || busy}
                                className="font-sans text-[0.62rem] uppercase tracking-[0.24em] text-platinum transition-colors duration-500 ease-mechanical hover:text-bronze-bright disabled:opacity-30"
                            >
                                New
                            </button>
                        </div>
                    </div>
                </header>

                {/* ── body ── */}
                <div className="flex min-h-0 flex-1 overflow-hidden">
                    {/* conversation column — the composer shares its width, so the
                        analyst's box lines up with the agents' above it */}
                    <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                        {mode === 'parallel' ? (
                            <ParallelView
                                agents={agents}
                                anyLoading={busy}
                                onModelChange={setAgentModel}
                                onOpenPrompt={openPrompt}
                                bottomRefs={parallelBottomRefs}
                                selected={selectedIdxs}
                                onToggle={toggleAgent}
                            />
                        ) : (
                            <ThreadView
                                turns={turns}
                                loadingIdx={activeIdx !== null && activeIdx >= 0 ? activeIdx : null}
                                emptyMessage={emptyMessage}
                                bottomRef={bottomRef}
                                onScroll={handleScroll}
                            />
                        )}

                        {/* ── composer ── */}
                        <div className="shrink-0 border-t border-stone-line bg-obsidian px-6 sm:px-10">
                            <div className={mode === 'parallel' ? '' : 'mx-auto w-full max-w-3xl'}>
                                {mode === 'loop' && loopRound > 0 && (
                                    <div className="flex items-center gap-4 pt-3">
                                        <span aria-hidden className="relative h-px flex-1 overflow-hidden bg-stone-line">
                                            <span
                                                className="absolute inset-y-0 left-0 bg-bronze transition-[width] duration-700 ease-mechanical"
                                                style={{ width: `${(loopRound / loopRounds) * 100}%` }}
                                            />
                                        </span>
                                        <span className="font-mono text-[0.6rem] uppercase tracking-[0.24em] text-bronze">
                                            Round {loopRound} / {loopRounds}
                                        </span>
                                    </div>
                                )}

                                {error && (
                                    <p
                                        className="pt-3 font-mono text-[0.65rem] tracking-[0.1em] text-bronze-bright"
                                        role="status"
                                    >
                                        ⚠ {error}
                                    </p>
                                )}

                                <form onSubmit={handleSubmit} className="flex items-end gap-5 py-5">
                                    <textarea
                                        ref={textareaRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        rows={1}
                                        disabled={busy}
                                        placeholder="Put an event, paper, company or decision to the council…"
                                        className="max-h-36 min-h-10 flex-1 resize-none bg-transparent font-serif text-lg font-light leading-relaxed text-marble outline-none placeholder:text-platinum-dim disabled:opacity-40"
                                    />
                                    <button
                                        type="submit"
                                        disabled={busy || !input.trim()}
                                        className="shrink-0 border border-stone-line-strong px-6 py-2.5 font-sans text-[0.65rem] uppercase tracking-[0.24em] text-marble-dim transition-colors duration-500 ease-mechanical hover:border-bronze hover:text-bronze-bright disabled:opacity-30"
                                    >
                                        {busy ? 'Deliberating' : 'Convene'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>

                    {mode !== 'parallel' && (
                        <AgentRail
                            agents={agentConfigs}
                            loadingIdx={activeIdx}
                            anyLoading={busy}
                            onModelChange={setAgentModel}
                            onOpenPrompt={openPrompt}
                            selected={selectedIdxs}
                            onToggle={toggleAgent}
                            onNudge={mode === 'cascade' ? nudge : undefined}
                            canNudge={cascadeTurns.length > 0}
                            footer={
                                <p className="font-sans text-[0.58rem] uppercase leading-relaxed tracking-[0.18em] text-platinum-dim">
                                    {activeCount === 0
                                        ? 'No agents selected'
                                        : activeCount === AGENT_COUNT
                                          ? 'All three agents respond'
                                          : `${activeCount} of ${AGENT_COUNT} agents respond`}
                                </p>
                            }
                        />
                    )}
                </div>
            </div>

            {usageOpen && (
                <UsageModal turns={usageTurns} sessions={sessions} onClose={() => setUsageOpen(false)} />
            )}

            {refsOpen && (
                <RefsModal
                    available={availableRefs}
                    attached={attachedRefs}
                    onChange={setAttachedRefs}
                    status={refsStatus}
                    onClose={() => setRefsOpen(false)}
                />
            )}

            {promptsOpen && (
                <PromptsModal
                    agents={agentConfigs}
                    tab={promptTab}
                    onTabChange={setPromptTab}
                    onPromptChange={setAgentPrompt}
                    onClose={() => setPromptsOpen(false)}
                />
            )}
        </div>
    );
}
