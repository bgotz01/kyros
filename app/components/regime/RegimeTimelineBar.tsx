'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

export const REGIME_COLORS: Record<string, string> = {
    'Broad Growth': '#22c55e',
    'Long Duration': '#3b82f6',
    'Overvaluation': '#eab308',
    'Crisis': '#991b1b',
    'Bond Stress': '#ea580c',
    'Liquidity Shock': '#a855f7',
    'None': '#6b7280',
};

function buildSegments(data: { date: string; regime: string }[]) {
    if (!data.length) return [];
    const segs: { regime: string; startIdx: number; endIdx: number }[] = [];
    let cur = { regime: data[0].regime, startIdx: 0 };
    for (let i = 1; i < data.length; i++) {
        if (data[i].regime !== cur.regime) {
            segs.push({ ...cur, endIdx: i - 1 });
            cur = { regime: data[i].regime, startIdx: i };
        }
    }
    segs.push({ ...cur, endIdx: data.length - 1 });
    return segs;
}

const DATE_PRESETS = [
    { label: 'All', value: 'all' },
    { label: '5Y', value: '5y' },
    { label: '10Y', value: '10y' },
    { label: '20Y', value: '20y' },
    { label: '1960s', value: '1960s', start: '1960-01-01', end: '1969-12-31' },
    { label: '1970s', value: '1970s', start: '1970-01-01', end: '1979-12-31' },
    { label: '1980s', value: '1980s', start: '1980-01-01', end: '1989-12-31' },
    { label: '1990s', value: '1990s', start: '1990-01-01', end: '1999-12-31' },
    { label: '2000s', value: '2000s', start: '2000-01-01', end: '2009-12-31' },
    { label: '2010s', value: '2010s', start: '2010-01-01', end: '2019-12-31' },
    { label: '2020s', value: '2020s', start: '2020-01-01', end: '2029-12-31' },
];

export default function RegimeTimelineBar({ compact = false }: { compact?: boolean }) {
    const [data, setData] = useState<{ date: string; regime: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [preset, setPreset] = useState('all');
    const [tooltip, setTooltip] = useState<{ x: number; y: number; date: string; regime: string } | null>(null);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch('/api/regime/timeline')
            .then(r => r.json()).then(j => setData(j.data ?? []))
            .catch(() => { }).finally(() => setLoading(false));
    }, []);

    const filtered = useMemo(() => {
        if (!data.length || compact) return data;
        if (preset === 'all') return data;
        const p = DATE_PRESETS.find(x => x.value === preset) as any;
        if (p?.start) return data.filter(d => d.date >= p.start && d.date <= p.end);
        const years = preset === '5y' ? 5 : preset === '10y' ? 10 : 20;
        const cutoff = new Date(); cutoff.setFullYear(cutoff.getFullYear() - years);
        return data.filter(d => d.date >= cutoff.toISOString().split('T')[0]);
    }, [data, preset, compact]);

    const segments = useMemo(() => buildSegments(filtered), [filtered]);

    const yearMarkers = useMemo(() => {
        if (!filtered.length) return [];
        const markers: { year: string; position: number }[] = [];
        let last = '';
        const interval = filtered.length > 240 ? 5 : filtered.length > 120 ? 2 : 1;
        for (let i = 0; i < filtered.length; i++) {
            const y = filtered[i].date.substring(0, 4);
            if (y !== last && parseInt(y) % interval === 0) {
                markers.push({ year: y, position: (i / filtered.length) * 100 });
                last = y;
            }
        }
        return markers;
    }, [filtered]);

    const regimeSummary = useMemo(() => {
        const counts: Record<string, number> = {};
        for (const d of filtered) counts[d.regime] = (counts[d.regime] || 0) + 1;
        return Object.entries(counts)
            .sort((a, b) => b[1] - a[1])
            .map(([regime, months]) => ({ regime, months, pct: filtered.length > 0 ? ((months / filtered.length) * 100).toFixed(1) : '0' }));
    }, [filtered]);

    const onMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!ref.current || !filtered.length) return;
        const rect = ref.current.getBoundingClientRect();
        const pct = (e.clientX - rect.left) / rect.width;
        const idx = Math.min(Math.max(Math.floor(pct * filtered.length), 0), filtered.length - 1);
        const item = filtered[idx];
        if (item) setTooltip({ x: e.clientX - rect.left, y: e.clientY - rect.top, date: item.date, regime: item.regime });
    }, [filtered]);

    if (loading) return compact ? null : (
        <div className="h-20 flex items-center justify-center">
            <span className="text-[11px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>Loading timeline…</span>
        </div>
    );

    const bar = (
        <div
            ref={ref}
            className="relative cursor-crosshair"
            onMouseMove={onMove}
            onMouseLeave={() => setTooltip(null)}
        >
            <div className={`overflow-hidden flex ${compact ? 'h-5 rounded' : 'h-12 rounded-sm'}`}>
                {segments.map((seg, i) => (
                    <div
                        key={i}
                        className="h-full transition-opacity hover:opacity-80"
                        style={{ width: `${((seg.endIdx - seg.startIdx + 1) / filtered.length) * 100}%`, backgroundColor: REGIME_COLORS[seg.regime] || '#6b7280' }}
                    />
                ))}
            </div>
            <div className="relative h-4 mt-1">
                {yearMarkers.map(({ year, position }) => (
                    <span
                        key={year + position}
                        className="absolute text-[9px] -translate-x-1/2 tabular-nums"
                        style={{ left: `${position}%`, color: 'var(--text-muted)' }}
                    >
                        {year}
                    </span>
                ))}
            </div>
            {tooltip && (
                <div
                    className="absolute z-50 pointer-events-none px-2 py-1.5 rounded text-[11px] -translate-x-1/2 -translate-y-full border"
                    style={{ left: tooltip.x, top: tooltip.y - 12, backgroundColor: 'var(--surface-raised)', borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}
                >
                    <p className="font-medium">{new Date(tooltip.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</p>
                    <p className="flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-muted)' }}>
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REGIME_COLORS[tooltip.regime] || '#6b7280' }} />
                        {tooltip.regime}
                    </p>
                </div>
            )}
        </div>
    );

    if (compact) return bar;

    return (
        <div className="border rounded-sm p-4" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface-raised)' }}>
            <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] uppercase tracking-[0.3em]" style={{ color: 'var(--accent)' }}>Regime Timeline</div>
                <div className="flex gap-1 flex-wrap justify-end">
                    {DATE_PRESETS.map(p => (
                        <button
                            key={p.value}
                            onClick={() => setPreset(p.value)}
                            className="px-2 py-0.5 text-[10px] uppercase tracking-wider border rounded-sm transition-colors"
                            style={preset === p.value
                                ? { borderColor: 'var(--accent)', color: 'var(--accent)', backgroundColor: 'var(--accent-dim)' }
                                : { borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }
                            }
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            {bar}

            <div className="flex flex-wrap gap-2 mt-4">
                {regimeSummary.map(({ regime, months, pct }) => (
                    <div
                        key={regime}
                        className="flex items-center gap-1.5 px-2 py-1 border text-[10px]"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}
                    >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: REGIME_COLORS[regime] || '#6b7280' }} />
                        <span>{regime}</span>
                        <span className="tabular-nums" style={{ color: 'var(--text-muted)' }}>{months}mo · {pct}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
