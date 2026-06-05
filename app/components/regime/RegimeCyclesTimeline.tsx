'use client';

import { useState } from 'react';
import CycleCard, { Section, Phase, Row, MiniNote, Break, RegimeEvent } from './CycleCard';

const cyclesData = [
    {
        cycleNumber: 1,
        title: "Asset Bubble Regime",
        subtitle: "Internet & Housing",
        period: "1996 – 2008",
        borderAccent: "border-l-cyan-400",
        tabColor: "rgba(34,211,238,1)",
        isCurrent: false,
        oldMechanism: "Normal credit expansion and multiple growth begins to stall.",
        transition: "Early internet adoption and speculative equity appetite accelerate.",
        phases: [
            {
                title: "Phase 1",
                subtitle: "Tech Duration Bubble",
                period: "1996–2000",
                drivers: "Negative EYP • Low Real Earnings Yield",
                result: "Growth equities dominate • Extreme multiple expansion • Internet speculation",
                note: null,
                isCurrent: false,
            },
            {
                title: "Phase 2",
                subtitle: "Housing & Credit Expansion",
                period: "2001–2007",
                note: "Tech crash destroys speculative tech appetite. Capital rotates toward real assets.",
                drivers: "Low interest rates • Credit expansion • Mortgage securitization",
                result: "Real estate boom • Financial sector expansion • Household leverage",
                isCurrent: false,
            },
        ],
        phaseBreak: "Dot-com crash (2000) — long-duration equities collapse.",
        regimeBreak: {
            year: "2008",
            description: "Housing and credit collapse.",
            breakdown: "Lower interest rates no longer stimulate the system. Debt saturation prevents further transmission.",
        },
    },
    {
        cycleNumber: 2,
        title: "Liquidity Regime",
        subtitle: "QE Era",
        period: "2008 – 2020",
        borderAccent: "border-l-violet-400",
        tabColor: "rgba(167,139,250,1)",
        isCurrent: false,
        oldMechanism: "Interest-rate stimulus.",
        transition: "Financial crisis and Fed intervention. QE is introduced as the new transmission mechanism.",
        phases: [
            {
                title: "Phase 1",
                subtitle: "QE Stabilization",
                period: "2008–2012",
                note: null,
                drivers: "Quantitative Easing • Emergency liquidity",
                result: "Asset prices stabilize • Valuations normalize • Financial system recapitalizes",
                isCurrent: false,
            },
            {
                title: "Phase 2",
                subtitle: "Liquidity Expansion",
                period: "2012–2020",
                note: "Rise of the platform economy: social media, cloud, mobile.",
                drivers: "Positive EYP • Low Real Earnings Yield • Zero interest rates",
                result: "Growth stocks dominate • Passive investing boom • Mega-cap tech concentration",
                isCurrent: false,
            },
        ],
        phaseBreak: "Crisis recovery largely completes. Markets begin functioning more normally again.",
        regimeBreak: {
            year: "2020",
            description: "COVID lockdowns force direct fiscal response.",
            breakdown: "QE and multiple expansion alone no longer work. Liquidity must reach the real economy.",
        },
    },
    {
        cycleNumber: 3,
        title: "Fiscal / Power Regime",
        subtitle: "Stimulus, Inflation, Consolidation",
        period: "2020 – ~2032",
        borderAccent: "border-l-amber-400",
        tabColor: "rgba(251,191,36,1)",
        isCurrent: true,
        oldMechanism: "QE-driven asset inflation.",
        transition: "Direct stimulus, money supply expansion, and inflation emerge together.",
        phases: [
            {
                title: "Phase 1",
                subtitle: "Liquidity Mania & Crash",
                period: "2020–2024",
                note: null,
                drivers: "Massive balance-sheet expansion • Fiscal stimulus • Liquidity surge",
                result: "Speculative mania • SPACs • Meme stocks • Crypto bubble",
                isCurrent: false,
            },
            {
                title: "Phase 2",
                subtitle: "Power Consolidation",
                period: "2024+",
                isCurrent: true,
                note: "Ongoing transition: emergence of the AI infrastructure economy.",
                drivers: "Weak or negative Real Earnings Yield • Negative EYP • Capital concentration",
                result: "Power consolidation • War • Semiconductors (AI)",
            },
        ],
        phaseBreak: "Inflation accelerates. Central banks are forced to raise rates and tighten liquidity conditions.",
        regimeBreak: null,
    },
];

export default function RegimeCyclesTimeline() {
    const [activeTab, setActiveTab] = useState<number>(3);
    const [expandedPhase, setExpandedPhase] = useState<number | null>(null);

    const activeCycle = cyclesData.find(c => c.cycleNumber === activeTab)!;

    return (
        <div className="space-y-0">
            {/* Tabs */}
            <div className="overflow-x-auto rounded-t-sm border border-b-0 px-3 pt-3"
                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
                <div className="flex gap-1 min-w-max">
                    {cyclesData.map((cycle) => {
                        const isActive = activeTab === cycle.cycleNumber;
                        return (
                            <button
                                key={cycle.cycleNumber}
                                onClick={() => setActiveTab(cycle.cycleNumber)}
                                className="relative flex flex-col items-start gap-0.5 rounded-t-sm border-b-2 px-4 py-3 text-left transition-all whitespace-nowrap"
                                style={{
                                    borderBottomColor: isActive ? cycle.tabColor : 'transparent',
                                    color: isActive ? cycle.tabColor : 'var(--text-muted)',
                                }}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-sm border text-[11px] font-bold"
                                        style={{
                                            borderColor: isActive ? cycle.tabColor : 'var(--surface-border)',
                                            backgroundColor: isActive ? `${cycle.tabColor}20` : 'var(--surface)',
                                            color: isActive ? cycle.tabColor : 'var(--text-muted)',
                                        }}>
                                        {cycle.cycleNumber}
                                    </span>
                                    <span className="text-sm font-semibold leading-tight">{cycle.title}</span>
                                    {cycle.isCurrent && (
                                        <span className="rounded-sm border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em]"
                                            style={{ borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }}>
                                            Current
                                        </span>
                                    )}
                                </div>
                                <span className="pl-7 text-[11px] font-medium uppercase tracking-[0.12em] opacity-70">
                                    {cycle.period}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="rounded-b-sm border border-l-4 overflow-hidden"
                style={{ borderColor: 'var(--surface-border)' }}
            // Use Tailwind for the left border color class by inlining style
            >
                <div className="px-5 py-5" style={{ backgroundColor: 'var(--surface-raised)' }}>
                    <div className="space-y-4">
                        {/* Old mechanism & transition */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Section label="Old Mechanism Failing">{activeCycle.oldMechanism}</Section>
                            <Section label="Transition (~2 years)">{activeCycle.transition}</Section>
                        </div>

                        {/* Phases */}
                        {activeCycle.phases.map((phase, idx) => (
                            <div key={idx}>
                                <Phase
                                    title={phase.title}
                                    subtitle={phase.subtitle}
                                    period={phase.period}
                                    isCurrent={phase.isCurrent}
                                >
                                    {phase.note && <MiniNote>{phase.note}</MiniNote>}
                                    <Row label="Drivers">{phase.drivers}</Row>
                                    <Row label="Result">{phase.result}</Row>
                                </Phase>

                                {idx === 0 && activeCycle.phases.length > 1 && (
                                    <div className="my-2">
                                        <Break kind="phase">{activeCycle.phaseBreak}</Break>
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Regime break */}
                        {activeCycle.regimeBreak && (
                            <RegimeEvent
                                year={activeCycle.regimeBreak.year}
                                title="Regime Break"
                                description={activeCycle.regimeBreak.description}
                                breakdown={activeCycle.regimeBreak.breakdown}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
