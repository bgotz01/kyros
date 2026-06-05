'use client';

import React from 'react';
import type { QuarterlyRow, TTMData } from '@/app/lib/queries/stocks';

interface Props {
    rows: QuarterlyRow[];
    ttm: TTMData;
}

const fmtNum = (v: number | null) => {
    if (v == null || isNaN(v)) return '—';
    return v.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
};

const fmtPct = (v: number | null) => {
    if (v == null || isNaN(v)) return '—';
    return `${(v * 100).toFixed(1)}%`;
};

const pctColor = (v: number | null): string | undefined => {
    if (v == null) return undefined;
    const n = v * 100;
    if (n < 0) return '#ef4444';
    if (n > 20) return '#22c55e';
    return undefined;
};

const quarterLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const month = d.toLocaleString('en-US', { month: 'short' });
    const year = d.getFullYear().toString().slice(-2);
    return `${month} '${year}`;
};

const fiscalLabel = (row: QuarterlyRow) =>
    row.fiscalYear && row.fiscalQuarter ? `Q${row.fiscalQuarter}` : null;

const METRICS: { key: keyof QuarterlyRow; label: string; subOf?: keyof QuarterlyRow; isPct?: boolean }[] = [
    { key: 'revenue', label: 'Revenue' },
    { key: 'revenueGrowthYoY', label: 'YoY Growth', subOf: 'revenue', isPct: true },
    { key: 'revenueGrowthQoQ', label: 'QoQ Growth', subOf: 'revenue', isPct: true },
    { key: 'netIncome', label: 'Net Income' },
    { key: 'netMargin', label: 'Net Margin', subOf: 'netIncome', isPct: true },
    { key: 'ebitda', label: 'EBITDA' },
    { key: 'grossProfit', label: 'Gross Profit' },
    { key: 'grossMargin', label: 'Gross Margin', subOf: 'grossProfit', isPct: true },
    { key: 'operatingIncome', label: 'Op. Income' },
    { key: 'operatingMargin', label: 'Op. Margin', subOf: 'operatingIncome', isPct: true },
    { key: 'eps', label: 'EPS' },
    { key: 'epsGrowth', label: 'EPS Growth', subOf: 'eps', isPct: true },
];

export default function QuarterlyTable({ rows, ttm }: Props) {
    const tdLabel: React.CSSProperties = {
        color: 'var(--text-secondary)',
        borderColor: 'var(--surface-border)',
        background: 'var(--surface-raised)',
    };
    const tdVal: React.CSSProperties = { color: 'var(--text-primary)' };
    const mutedStyle: React.CSSProperties = { color: 'var(--text-muted)' };

    const rowStyle = (idx: number): React.CSSProperties =>
        idx % 2 === 0
            ? { background: 'rgba(181,139,74,0.03)' }
            : { background: 'transparent' };

    const getTTMValue = (key: keyof QuarterlyRow): string => {
        if (key === 'revenue') return fmtNum(ttm.revenue);
        if (key === 'netIncome') return fmtNum(ttm.netIncome);
        if (key === 'ebitda') return fmtNum(ttm.ebitda);
        return '—';
    };

    return (
        <div className="overflow-x-auto rounded border" style={{ borderColor: 'var(--surface-border)' }}>
            <table className="table-auto border-collapse text-sm min-w-full" style={{ color: 'var(--text-primary)' }}>
                <thead>
                    <tr style={{ background: 'var(--surface-raised)' }}>
                        <th
                            className="px-5 py-3 text-left font-medium sticky left-0 z-10 min-w-[160px]"
                            style={{ ...tdLabel, borderColor: 'var(--surface-border)' }}
                        >
                            Metric
                        </th>
                        {/* TTM column */}
                        <th
                            className="px-5 py-3 text-center min-w-[100px] font-medium"
                            style={{
                                background: 'rgba(181,139,74,0.1)',
                                color: 'var(--accent)',
                                borderBottom: '1px solid var(--surface-border)',
                            }}
                        >
                            <div className="font-bold text-base">TTM</div>
                            {ttm.latestQuarter && (
                                <div className="text-[10px] font-normal mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                    {quarterLabel(ttm.latestQuarter)}
                                </div>
                            )}
                        </th>
                        {rows.map((q) => (
                            <th
                                key={q.quarterEnd}
                                className="px-5 py-3 text-center min-w-[100px] font-medium"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                <div className="font-bold text-base">{quarterLabel(q.quarterEnd)}</div>
                                {fiscalLabel(q) && (
                                    <div className="text-[10px] font-normal mt-0.5" style={{ color: 'var(--text-muted)' }}>
                                        {fiscalLabel(q)}
                                    </div>
                                )}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {METRICS.map(({ key, label, subOf, isPct }, idx) => (
                        <tr key={key} style={rowStyle(idx)}>
                            <td
                                className={`px-5 py-3 border-r sticky left-0 z-10 ${subOf ? 'pl-8 italic' : 'font-medium'}`}
                                style={tdLabel}
                            >
                                {label}
                            </td>

                            {/* TTM cell */}
                            <td
                                className="px-5 py-3 text-center tabular-nums"
                                style={{ background: 'rgba(181,139,74,0.06)', color: 'var(--text-primary)' }}
                            >
                                {isPct ? <span style={mutedStyle}>—</span> : getTTMValue(key)}
                            </td>

                            {/* Quarter cells */}
                            {rows.map((q) => {
                                const raw = q[key] as number | null;
                                if (isPct) {
                                    const c = pctColor(raw);
                                    return (
                                        <td key={q.quarterEnd} className="px-5 py-3 text-center tabular-nums" style={c ? { color: c } : mutedStyle}>
                                            {fmtPct(raw)}
                                        </td>
                                    );
                                }
                                return (
                                    <td key={q.quarterEnd} className="px-5 py-3 text-center tabular-nums" style={raw !== null && raw < 0 ? { color: '#ef4444' } : tdVal}>
                                        {fmtNum(raw)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
