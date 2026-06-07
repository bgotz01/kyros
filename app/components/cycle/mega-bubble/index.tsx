'use client';

import { useState, useEffect } from 'react';
import { BUBBLES, type RealPriceRow } from './types';
import BubbleOverlay from './BubbleOverlay';
import BubbleRealChart from './BubbleRealChart';
import BubbleDivergenceChart from './BubbleDivergenceChart';
import BubbleDetail from './BubbleDetail';
import ComparisonTable from './ComparisonTable';
import PatternsNote from './PatternsNote';

// ─── Tab IDs ──────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'dow1929' | 'nikkei1989' | 'dotcom2000';

const TABS: { id: TabId; label: string; sub?: string; color?: string }[] = [
    { id: 'overview', label: 'Overview', sub: 'All Bubbles' },
    ...BUBBLES.map(b => ({ id: b.id as TabId, label: b.label, sub: b.sub, color: b.color })),
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function MegaBubble() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [priceData, setPriceData] = useState<Record<string, RealPriceRow[]>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeBubble = BUBBLES.find(b => b.id === activeTab) ?? null;

    // Fetch once per bubble on first visit to that tab
    useEffect(() => {
        if (!activeBubble) return;
        if (priceData[activeBubble.id]) return;

        let cancelled = false;
        setLoading(true);
        setError(null);

        fetch(`/api/mega-bubble?bubble=${activeBubble.apiKey}`)
            .then(r => r.json())
            .then(json => {
                if (!cancelled)
                    setPriceData(prev => ({ ...prev, [activeBubble.id]: json.data ?? [] }));
            })
            .catch(() => { if (!cancelled) setError('Failed to load price data'); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeTab]);

    const currentData = activeBubble ? (priceData[activeBubble.id] ?? []) : [];

    return (
        <div className="space-y-6">

            {/* Tab bar */}
            <div className="flex flex-wrap gap-px border rounded-sm overflow-hidden"
                style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-border)' }}>
                {TABS.map(tab => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className="flex flex-col items-center px-4 py-2.5 flex-1 min-w-[80px] transition-colors"
                            style={{
                                backgroundColor: isActive ? 'var(--surface-raised)' : 'var(--surface)',
                                borderBottom: isActive
                                    ? `2px solid ${tab.color ?? 'var(--accent)'}`
                                    : '2px solid transparent',
                            }}
                        >
                            <span className="text-[11px] font-medium tracking-wide whitespace-nowrap"
                                style={{ color: isActive ? (tab.color ?? 'var(--accent)') : 'var(--text-muted)' }}>
                                {tab.label}
                            </span>
                            {tab.sub && (
                                <span className="text-[8px] uppercase tracking-[0.15em] mt-0.5"
                                    style={{ color: isActive ? (tab.color ?? 'var(--accent)') : 'var(--text-muted)', opacity: 0.7 }}>
                                    {tab.sub}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* ── Overview tab ── */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <BubbleOverlay />
                    <ComparisonTable />
                    <PatternsNote />
                </div>
            )}

            {/* ── Individual bubble tabs ── */}
            {activeBubble && (
                <div className="space-y-6">
                    {/* Bubble title bar */}
                    <div className="flex items-center gap-3 pb-3 border-b"
                        style={{ borderColor: 'var(--surface-border)' }}>
                        <span className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: activeBubble.color }} />
                        <div>
                            <div className="text-[13px] font-semibold" style={{ color: activeBubble.color }}>
                                {activeBubble.label}
                            </div>
                            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                {activeBubble.sub} · Peak {activeBubble.peakDate} · {activeBubble.drawdown} max drawdown
                            </div>
                        </div>
                    </div>

                    {/* Loading state */}
                    {loading && !currentData.length && (
                        <div className="border rounded-sm p-8 flex items-center justify-center"
                            style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
                            <span className="text-[11px] uppercase tracking-widest animate-pulse"
                                style={{ color: 'var(--text-muted)' }}>Loading price data…</span>
                        </div>
                    )}

                    {/* Error state */}
                    {error && (
                        <div className="border rounded-sm p-4 text-[11px]"
                            style={{ borderColor: '#ef444440', color: '#ef4444' }}>
                            {error}
                        </div>
                    )}

                    {/* Charts */}
                    {currentData.length > 0 && (
                        <>
                            <BubbleRealChart bubble={activeBubble} data={currentData} />
                            <BubbleDivergenceChart bubble={activeBubble} data={currentData} />
                        </>
                    )}

                    {/* Fundamentals + phases */}
                    <BubbleDetail bubble={activeBubble} />
                </div>
            )}
        </div>
    );
}
