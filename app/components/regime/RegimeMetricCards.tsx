'use client';

import type { RegimeData } from './types';
import { fmt, fmtDate } from './types';

function pctColor(p: number | null, invert = false): string {
    if (p === null) return 'var(--text-muted)';
    const bands = invert
        ? ['#ef4444', '#eab308', '#3b82f6', '#22c55e', '#84cc16']
        : ['#84cc16', '#22c55e', '#3b82f6', '#eab308', '#ef4444'];
    if (p < 20) return bands[0]; if (p < 40) return bands[1]; if (p < 60) return bands[2]; if (p < 80) return bands[3]; return bands[4];
}

function MetricCard({ label, value, percentile, date, invert = false }: {
    label: string; value: string; percentile: number | null; date: string; invert?: boolean;
}) {
    return (
        <div className="border p-2 rounded-sm" style={{ borderColor: 'var(--surface-border)', backgroundColor: 'var(--surface)' }}>
            <div className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: 'var(--text-muted)' }}>{label}</div>
            <div className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</div>
            <div className="flex items-center justify-between mt-1.5">
                <span className="text-[9px] tabular-nums font-medium"
                    style={{ color: percentile !== null ? pctColor(percentile, invert) : 'var(--text-muted)' }}>
                    {percentile !== null ? `${percentile.toFixed(0)}th` : '—'}
                </span>
                <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{date}</span>
            </div>
        </div>
    );
}

export default function RegimeMetricCards({ data }: { data: RegimeData }) {
    return (
        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
            <MetricCard label="Fed Rate" value={fmt(data.fedFunds.value)} percentile={data.fedFunds.percentile} date={fmtDate(data.fedFunds.date)} />
            <MetricCard label="3M Yield" value={fmt(data.irx.value)} percentile={data.irx.percentile} date={fmtDate(data.irx.date)} />
            <MetricCard label="10Y Yield" value={fmt(data.tnx.value)} percentile={data.tnx.percentile} date={fmtDate(data.tnx.date)} />
            <MetricCard label="CPI" value={fmt(data.cpi.value)} percentile={data.cpi.percentile} date={fmtDate(data.cpi.date)} />
            <MetricCard label="Real M2 YoY" value={fmt(data.realM2.value)} percentile={data.realM2.percentile} date={fmtDate(data.realM2.date)} invert />
            <MetricCard label="PE 5yr" value={data.pe5yr.value !== null ? data.pe5yr.value.toFixed(1) : 'N/A'} percentile={data.pe5yr.percentile} date={fmtDate(data.pe5yr.date)} />
            <MetricCard label="EY 5yr" value={fmt(data.ey5yr.value)} percentile={data.ey5yr.percentile} date={fmtDate(data.ey5yr.date)} invert />
            <MetricCard label="EYP 5yr" value={fmt(data.eyp5yr.value)} percentile={data.eyp5yr.percentile} date={fmtDate(data.eyp5yr.date)} invert />
            <MetricCard label="Real EY" value={fmt(data.rey5yr.value)} percentile={data.rey5yr.percentile} date={fmtDate(data.rey5yr.date)} invert />
            <MetricCard label="Real 10Y" value={fmt(data.real10Y.value)} percentile={data.real10Y.percentile} date={fmtDate(data.real10Y.date)} invert />
            <MetricCard label="Real 3M" value={fmt(data.real3M.value)} percentile={data.real3M.percentile} date={fmtDate(data.real3M.date)} invert />
            <MetricCard label="Yield Curve" value={fmt(data.yieldCurve.value)} percentile={data.yieldCurve.percentile} date={fmtDate(data.yieldCurve.date)} />
        </div>
    );
}
