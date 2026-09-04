'use client';

import { useState } from 'react';
import { Arrow, FlowNode, SectionHeader } from './system-primitives';

export default function ExecutionGraph() {
    const [expanded, setExpanded] = useState(false);

    return (
        <section className="border-b border-stone-line px-6 py-10 md:px-10 md:py-14 xl:px-14">
            <SectionHeader
                eyebrow="05 · Anatomy of a graph"
                title="A research system as an execution graph"
                body={
                    <p>
                        The graph makes methodology visible. Different information sources can fan out in parallel, merge into analysis, and then pass through a review gate before the system is allowed to answer.
                    </p>
                }
            />

            <div className="mt-8 border border-stone-line bg-obsidian/25 p-4 md:p-7">
                <div className="mx-auto max-w-5xl space-y-4">
                    <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-center">
                        <FlowNode tone="bronze">Plan</FlowNode>
                        <Arrow />
                        <FlowNode>Decide sources</FlowNode>
                    </div>

                    <div className="flex justify-center font-mono text-stone-line-strong">↓</div>

                    <div className="grid gap-2 md:grid-cols-3">
                        <FlowNode tone="dim">Web research</FlowNode>
                        <FlowNode tone="dim">Financial database</FlowNode>
                        <FlowNode tone="dim">Company documents</FlowNode>
                    </div>

                    <div className="flex justify-center font-mono text-stone-line-strong">↓ merge evidence</div>

                    <div className="mx-auto max-w-md">
                        <FlowNode tone="bronze">Analyze</FlowNode>
                    </div>

                    <div className="flex justify-center font-mono text-stone-line-strong">↓</div>

                    <div className="mx-auto max-w-md">
                        <FlowNode>Review</FlowNode>
                    </div>

                    <div className="grid gap-3 pt-1 md:grid-cols-2">
                        <div className="border border-stone-line p-4 text-center">
                            <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-platinum-dim">Pass</p>
                            <p className="mt-3 font-mono text-[0.68rem] tracking-[0.08em] text-bronze-bright">→ Answer</p>
                        </div>
                        <div className="border border-bronze-dim bg-bronze-dim/5 p-4 text-center">
                            <p className="font-mono text-[0.58rem] uppercase tracking-[0.2em] text-platinum-dim">Fail</p>
                            <p className="mt-3 font-mono text-[0.68rem] tracking-[0.08em] text-bronze-bright">→ Research → Review ↺</p>
                        </div>
                    </div>
                </div>
            </div>

            <button
                type="button"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className="mt-4 flex items-center gap-2 font-sans text-[0.62rem] uppercase tracking-[0.2em] text-platinum-dim transition-colors duration-300 hover:text-platinum"
            >
                <span className="text-bronze">{expanded ? '−' : '+'}</span>
                {expanded ? 'Hide why the graph matters' : 'Why the graph matters'}
            </button>

            {expanded && (
                <div className="mt-4 grid gap-px border border-stone-line bg-stone-line md:grid-cols-3">
                    {[
                        ['Repeatability', 'The same methodology runs every time instead of depending on one unconstrained prompt.'],
                        ['Inspection', 'You can see where evidence, routing or reasoning failed rather than debugging one opaque loop.'],
                        ['Control', 'High-risk steps can require deterministic checks or human approval while open-ended nodes retain autonomy.'],
                    ].map(([title, text]) => (
                        <div key={title} className="bg-obsidian px-5 py-5">
                            <p className="font-serif text-base tracking-[0.05em] text-marble">{title}</p>
                            <p className="mt-3 font-sans text-[0.73rem] leading-6 text-platinum-dim">{text}</p>
                        </div>
                    ))}
                </div>
            )}
        </section>
    );
}
