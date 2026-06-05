'use client';

import React from 'react';

interface Props {
    stock: Record<string, string | number>;
    years: string[];
    capLookup: Record<string, number>; // year -> marketCap (raw $)
}

const N = (v: string | number | undefined) =>
    v !== undefined && v !== '' ? Number(v) : 0;

const fmt = (val: number | null, decimals = 1) => {
    if (val == null || isNaN(val) || val === 0) return '—';
    return val.toLocaleString('en-US', { maximumFractionDigits: decimals });
};

const fmtPct = (val: number | null) => {
    if (val == null || isNaN(val)) return '—';
    return `${val.toFixed(1)}%`;
};

const colorPct = (val: number | null) => {
    if (val == null || isNaN(val)) return undefined;
    if (val < 0) return 'var(--color-red, #ef4444)';
    if (val > 20) return 'var(--color-green, #22c55e)';
    return undefined;
};

const SectionHeader = ({ label, accent }: { label: string; accent: string }) => (
    <tr>
        <td
            colSpan={100}
            className="px-6 py-2 text-[10px] tracking-[0.22em] uppercase font-semibold border-t"
            style={{
                background: `${accent}14`,
                color: accent,
                borderColor: `${accent}30`,
            }}
        >
            {label}
        </td>
    </tr>
);

export default function StockAnnualTable({ stock, years, capLookup }: Props) {
    const thStyle: React.CSSProperties = { color: 'var(--text-muted)' };
    const tdLabel: React.CSSProperties = {
        color: 'var(--text-secondary)',
        borderColor: 'var(--surface-border)',
        background: 'var(--surface-raised)',
    };
    const tdVal: React.CSSProperties = { color: 'var(--text-primary)' };
    const rowEven: React.CSSProperties = { background: 'rgba(181,139,74,0.03)' };
    const rowOdd: React.CSSProperties = { background: 'transparent' };

    const row = (idx: number) => (idx % 2 === 0 ? rowEven : rowOdd);

    return (
        <div className="overflow-x-auto rounded border" style={{ borderColor: 'var(--surface-border)' }}>
            <table className="table-auto border-collapse text-sm min-w-full" style={{ color: 'var(--text-primary)' }}>
                <thead>
                    <tr style={{ background: 'var(--surface-raised)' }}>
                        <th className="px-6 py-3 text-left font-medium sticky left-0 z-10 min-w-[180px]" style={{ ...thStyle, background: 'var(--surface-raised)' }}>
                            {(() => {
                                const raw = String(stock['yearEnd'] ?? stock['Year_End'] ?? '');
                                if (!raw) return 'Year End';
                                const [m, d] = raw.split('/');
                                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                                const label = months[parseInt(m) - 1] + '-' + d.padStart(2, '0');
                                return `Year End: ${label}`;
                            })()}
                        </th>
                        {years.map((y) => (
                            <th key={y} className="px-6 py-3 text-center font-medium" style={thStyle}>
                                {y}
                            </th>
                        ))}
                    </tr>
                </thead>

                <tbody>
                    {/* ── Financial Metrics ─────────────────────────────── */}
                    <SectionHeader label="Financial Metrics (millions)" accent="var(--accent)" />
                    {[
                        { key: 'Revenue', label: 'Revenue' },
                        { key: 'EBITDA', label: 'EBITDA' },
                        { key: 'NetIncome', label: 'Net Income' },
                        { key: 'FCF', label: 'FCF' },
                        { key: 'SG&A', label: 'SG&A' },
                    ].map(({ key, label }, idx) => (
                        <tr key={key} style={row(idx)}>
                            <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>
                                {label}
                            </td>
                            {years.map((y) => {
                                const val = N(stock[`${y}_${key}`]);
                                return (
                                    <td key={y} className="px-6 py-3 text-center tabular-nums" style={val < 0 ? { color: '#ef4444' } : tdVal}>
                                        {fmt(val || null)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}

                    {/* ── Market Valuation ─────────────────────────────── */}
                    <SectionHeader label="Market Valuation" accent="#60a5fa" />
                    {/* Market Cap */}
                    <tr style={row(0)}>
                        <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>Market Cap</td>
                        {years.map((y) => {
                            const cap = capLookup[y] ? Math.round(capLookup[y]! / 1e6) : null;
                            return (
                                <td key={y} className="px-6 py-3 text-center tabular-nums" style={tdVal}>
                                    {fmt(cap)}
                                </td>
                            );
                        })}
                    </tr>
                    {/* P/S */}
                    <tr style={row(1)}>
                        <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>P/S Ratio</td>
                        {years.map((y) => {
                            const cap = capLookup[y] ? capLookup[y]! / 1e6 : 0;
                            const rev = N(stock[`${y}_Revenue`]);
                            const ratio = rev ? cap / rev : null;
                            return (
                                <td key={y} className="px-6 py-3 text-center tabular-nums" style={tdVal}>
                                    {fmt(ratio)}
                                </td>
                            );
                        })}
                    </tr>
                    {/* P/E */}
                    <tr style={row(0)}>
                        <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>P/E Ratio</td>
                        {years.map((y) => {
                            const cap = capLookup[y] ? capLookup[y]! / 1e6 : 0;
                            const income = N(stock[`${y}_NetIncome`]);
                            const ratio = income ? cap / income : null;
                            return (
                                <td key={y} className="px-6 py-3 text-center tabular-nums" style={tdVal}>
                                    {fmt(ratio)}
                                </td>
                            );
                        })}
                    </tr>

                    {/* ── Growth & Margins ─────────────────────────────── */}
                    <SectionHeader label="Growth & Margins" accent="#a78bfa" />
                    {/* Revenue YoY Growth */}
                    <tr style={row(0)}>
                        <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>Revenue Growth YoY</td>
                        {years.map((y, i) => {
                            if (i === years.length - 1) {
                                return <td key={y} className="px-6 py-3 text-center" style={{ color: 'var(--text-muted)' }}>—</td>;
                            }
                            const curr = N(stock[`${y}_Revenue`]);
                            const prev = N(stock[`${years[i + 1]}_Revenue`]);
                            const growth = prev ? ((curr - prev) / prev) * 100 : null;
                            const c = colorPct(growth);
                            return (
                                <td key={y} className="px-6 py-3 text-center tabular-nums font-semibold" style={c ? { color: c } : tdVal}>
                                    {fmtPct(growth)}
                                </td>
                            );
                        })}
                    </tr>
                    {[
                        { label: 'EBITDA Margin', key: 'EBITDA' },
                        { label: 'Net Margin', key: 'NetIncome' },
                        { label: 'FCF Margin', key: 'FCF' },
                        { label: 'SG&A / Revenue', key: 'SG&A' },
                    ].map((r, idx) => (
                        <tr key={r.label} style={row(idx + 1)}>
                            <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>{r.label}</td>
                            {years.map((y) => {
                                const base = N(stock[`${y}_${r.key}`]);
                                const rev = N(stock[`${y}_Revenue`]);
                                const margin = rev ? (base / rev) * 100 : null;
                                const c = colorPct(margin);
                                return (
                                    <td key={y} className="px-6 py-3 text-center tabular-nums font-semibold" style={c ? { color: c } : tdVal}>
                                        {fmtPct(margin)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}

                    {/* ── Balance Sheet ─────────────────────────────────── */}
                    <SectionHeader label="Balance Sheet (millions)" accent="#f59e0b" />
                    {['Assets', 'Liabilities', 'Cash', 'Debt', 'NetDebt'].map((key, idx) => (
                        <tr key={key} style={row(idx)}>
                            <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>{key}</td>
                            {years.map((y) => {
                                const val = N(stock[`${y}_${key}`]);
                                return (
                                    <td key={y} className="px-6 py-3 text-center tabular-nums" style={tdVal}>
                                        {fmt(val || null)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    <tr style={row(0)}>
                        <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>Net Debt / Assets</td>
                        {years.map((y) => {
                            const nd = N(stock[`${y}_NetDebt`]);
                            const a = N(stock[`${y}_Assets`]);
                            const r = a ? (nd / a) * 100 : null;
                            return (
                                <td key={y} className="px-6 py-3 text-center tabular-nums" style={r && r > 50 ? { color: '#ef4444' } : tdVal}>
                                    {fmtPct(r)}
                                </td>
                            );
                        })}
                    </tr>
                    <tr style={row(1)}>
                        <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>Net Debt / Revenue</td>
                        {years.map((y) => {
                            const nd = N(stock[`${y}_NetDebt`]);
                            const rev = N(stock[`${y}_Revenue`]);
                            const r = rev ? (nd / rev) * 100 : null;
                            return (
                                <td key={y} className="px-6 py-3 text-center tabular-nums" style={tdVal}>
                                    {fmtPct(r)}
                                </td>
                            );
                        })}
                    </tr>

                    {/* ── Leverage ─────────────────────────────────────── */}
                    <SectionHeader label="Leverage" accent="#f87171" />
                    {[
                        { key: 'Debt', label: 'Debt' },
                        { key: 'NetDebt', label: 'Net Debt' },
                        { key: 'InterestExpense', label: 'Interest Expense' },
                        { key: 'InterestIncome', label: 'Interest Income' },
                        { key: 'NetInterest', label: 'Net Interest' },
                    ].map(({ key, label }, idx) => (
                        <tr key={key} style={row(idx)}>
                            <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>{label}</td>
                            {years.map((y) => {
                                const val = N(stock[`${y}_${key}`]);
                                return (
                                    <td key={y} className="px-6 py-3 text-center tabular-nums" style={tdVal}>
                                        {fmt(val || null)}
                                    </td>
                                );
                            })}
                        </tr>
                    ))}
                    <tr style={row(0)}>
                        <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>Net Interest / Revenue</td>
                        {years.map((y) => {
                            const ni = N(stock[`${y}_NetInterest`]);
                            const rev = N(stock[`${y}_Revenue`]);
                            const r = rev ? (ni / rev) * 100 : null;
                            return (
                                <td key={y} className="px-6 py-3 text-center tabular-nums" style={r && r > 10 ? { color: '#ef4444' } : tdVal}>
                                    {fmtPct(r)}
                                </td>
                            );
                        })}
                    </tr>
                    <tr style={row(1)}>
                        <td className="px-6 py-3 font-medium border-r sticky left-0 z-10" style={tdLabel}>Net Interest / EBITDA</td>
                        {years.map((y) => {
                            const ni = N(stock[`${y}_NetInterest`]);
                            const eb = N(stock[`${y}_EBITDA`]);
                            const r = eb ? (ni / eb) * 100 : null;
                            return (
                                <td key={y} className="px-6 py-3 text-center tabular-nums" style={r && r > 10 ? { color: '#ef4444' } : tdVal}>
                                    {fmtPct(r)}
                                </td>
                            );
                        })}
                    </tr>
                </tbody>
            </table>
        </div>
    );
}
