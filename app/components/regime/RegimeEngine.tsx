'use client';

import { useState, useEffect } from 'react';
import { type RegimeFamily, REGIME_METADATA } from '@/app/lib/regime-state-machine';
import RegimeActiveCard from './RegimeActiveCard';
import RegimeTimelineBar from './RegimeTimelineBar';
import RegimeProximityBars from './RegimeProximityBars';
import RegimeMetricCards from './RegimeMetricCards';
import RegimeParametersChart from './RegimeParametersChart';
import { emptyMetric, type RegimeData } from './types';

const START_YEAR = 1960;

function getDateFromSlider(value: number): { year: number; month: number } {
    return { year: START_YEAR + Math.floor(value / 12), month: value % 12 };
}

export default function RegimeEngine() {
    const now = new Date();
    const totalMonths = (now.getFullYear() - START_YEAR) * 12 + now.getMonth();

    const [slider, setSlider] = useState(totalMonths);
    const [debounced, setDebounced] = useState(totalMonths);
    const [data, setData] = useState<RegimeData | null>(null);
    const [regimeState, setRegimeState] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Collapse states
    const [showProximity, setShowProximity] = useState(true);
    const [showMetrics, setShowMetrics] = useState(false);
    const [showChart, setShowChart] = useState(true);

    // Debounce slider
    useEffect(() => {
        const t = setTimeout(() => setDebounced(slider), 150);
        return () => clearTimeout(t);
    }, [slider]);

    const { year, month } = getDateFromSlider(slider);
    const isLatest = slider === totalMonths;
    const displayDate = isLatest
        ? 'Latest'
        : new Date(year, month).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const dateParam = isLatest
        ? 'latest'
        : `${year}-${String(month + 1).padStart(2, '0')}-${new Date(year, month + 1, 0).getDate()}`;

    useEffect(() => {
        const { year: y, month: m } = getDateFromSlider(debounced);
        const dp = debounced === totalMonths
            ? 'latest'
            : `${y}-${String(m + 1).padStart(2, '0')}-${new Date(y, m + 1, 0).getDate()}`;

        let cancelled = false;
        setError(null);

        Promise.all([
            fetch(`/api/regime/data?date=${dp}`).then(r => r.json()),
            fetch('/api/regime/custom-state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ targetDate: dp }),
            }).then(r => r.json()),
        ])
            .then(([regimeData, state]) => {
                if (cancelled) return;
                const d: RegimeData = {
                    fedFunds: regimeData.fedFunds ?? emptyMetric(),
                    irx: regimeData.irx ?? emptyMetric(),
                    tnx: regimeData.tnx ?? emptyMetric(),
                    cpi: regimeData.cpi ?? emptyMetric(),
                    eyp5yr: regimeData.eyp5yr ?? emptyMetric(),
                    rey5yr: regimeData.rey5yr ?? emptyMetric(),
                    real10Y: regimeData.real10Y ?? emptyMetric(),
                    real3M: regimeData.real3M ?? emptyMetric(),
                    realM2: regimeData.realM2 ?? emptyMetric(),
                    yieldCurve: regimeData.yieldCurve ?? emptyMetric(),
                    pe5yr: regimeData.pe5yr ?? emptyMetric(),
                    ey5yr: regimeData.ey5yr ?? emptyMetric(),
                };
                setData(d);
                setRegimeState(state);
            })
            .catch(e => { if (!cancelled) setError(e.message); })
            .finally(() => { if (!cancelled) setLoading(false); });

        return () => { cancelled = true; };
    }, [debounced, totalMonths]);

    const regime = (regimeState?.regime ?? 'None') as RegimeFamily;
    const meta = REGIME_METADATA[regime];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3 border-b pb-3 text-[10px] tracking-[0.3em] uppercase"
                style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>
                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ backgroundColor: 'var(--accent)' }} />
                <span style={{ color: 'var(--accent)' }}>Panteon</span>
                <span>/</span>
                <span>Regime</span>
                <span className="ml-auto tabular-nums">{displayDate}</span>
            </div>

            {/* Timeline slider */}
            <div>
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>{START_YEAR}</span>
                    <span className="text-[11px] tabular-nums font-semibold px-2 py-0.5 rounded-sm border"
                        style={{ color: 'var(--accent)', borderColor: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }}>
                        {displayDate}
                    </span>
                    <span className="text-[11px] tabular-nums font-medium" style={{ color: 'var(--text-secondary)' }}>{now.getFullYear()}</span>
                </div>
                <style>{`
                    .regime-slider { -webkit-appearance: none; appearance: none; width: 100%; height: 4px; border-radius: 2px; outline: none; cursor: pointer; }
                    .regime-slider::-webkit-slider-runnable-track { height: 4px; border-radius: 2px; background: rgba(181,139,74,0.25); }
                    .regime-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 16px; height: 16px; border-radius: 50%; background: #B58B4A; border: 2px solid #070605; margin-top: -6px; cursor: pointer; box-shadow: 0 0 0 2px rgba(181,139,74,0.35); }
                    .regime-slider::-moz-range-track { height: 4px; border-radius: 2px; background: rgba(181,139,74,0.25); }
                    .regime-slider::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: #B58B4A; border: 2px solid #070605; cursor: pointer; box-shadow: 0 0 0 2px rgba(181,139,74,0.35); }
                    :root.light .regime-slider::-webkit-slider-thumb { border-color: #F5F0E8; }
                    :root.light .regime-slider::-moz-range-thumb { border-color: #F5F0E8; }
                `}</style>
                <input
                    type="range" min={0} max={totalMonths} value={slider}
                    onChange={e => setSlider(parseInt(e.target.value))}
                    className="regime-slider"
                    style={{ backgroundColor: 'transparent' }}
                />
                {/* Decade markers */}
                <div className="flex justify-between mt-1.5 px-0.5">
                    {Array.from({ length: Math.floor((now.getFullYear() - START_YEAR) / 10) + 1 }, (_, i) => START_YEAR + i * 10)
                        .filter(y => y <= now.getFullYear())
                        .map(y => (
                            <span key={y} className="text-[9px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                                {y}
                            </span>
                        ))
                    }
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="border p-3 rounded-sm text-xs" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
                    Error: {error}
                </div>
            )}

            {/* Active regime card */}
            {loading ? (
                <div className="border rounded-sm p-6 flex items-center justify-center" style={{ borderColor: 'var(--surface-border)' }}>
                    <span className="text-[11px] uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>Loading regime engine…</span>
                </div>
            ) : regimeState && data && (
                <RegimeActiveCard
                    regime={regime}
                    entryDate={regimeState.entryDate}
                    currentDate={regimeState.currentDate}
                    monthsInRegime={regimeState.daysInRegime}
                    triggerReason={regimeState.triggerReason}
                    conditions={{
                        rey: data.rey5yr.value,
                        eyp: data.eyp5yr.value,
                        real10Y: data.real10Y.value,
                        real3M: data.real3M.value,
                        realM2: data.realM2.value,
                    }}
                />
            )}

            {/* Regime Proximity */}
            {data && (
                <div>
                    <button
                        className="w-full flex items-center justify-between pb-2 mb-3 border-b text-[10px] uppercase tracking-[0.25em]"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                        onClick={() => setShowProximity(s => !s)}
                    >
                        <span>Regime Proximity</span>
                        <svg className={`w-3 h-3 transition-transform ${showProximity ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showProximity && <RegimeProximityBars data={data} currentRegime={regime} />}
                </div>
            )}

            {/* Input Metrics */}
            {data && (
                <div>
                    <button
                        className="w-full flex items-center justify-between pb-2 mb-3 border-b text-[10px] uppercase tracking-[0.25em]"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                        onClick={() => setShowMetrics(s => !s)}
                    >
                        <span>Input Variables</span>
                        <svg className={`w-3 h-3 transition-transform ${showMetrics ? 'rotate-180' : ''}`}
                            fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    {showMetrics && <RegimeMetricCards data={data} />}
                </div>
            )}

            {/* Full timeline bar */}
            <RegimeTimelineBar />

            {/* Regime parameters chart */}
            <div>
                <button
                    className="w-full flex items-center justify-between pb-2 mb-3 border-b text-[10px] uppercase tracking-[0.25em]"
                    style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                    onClick={() => setShowChart(s => !s)}
                >
                    <span>Regime Parameters Chart</span>
                    <svg className={`w-3 h-3 transition-transform ${showChart ? 'rotate-180' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>
                {showChart && <RegimeParametersChart />}
            </div>
        </div>
    );
}
