'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { ScreenerRow } from '@/app/lib/queries/screener';
import PresetFilters from './screener/PresetFilters';

// ─── types ───────────────────────────────────────────────────────────────────

type ColType = 'string' | 'number' | 'percent' | 'ratio' | 'currency';

interface ColDef {
    key: string;
    label: string;
    type: ColType;
    section: string;
    decimal?: boolean; // true = stored as 0.15, display as 15%
}

type MergedRow = ScreenerRow & { [key: string]: string | number | null };

// ─── column config ────────────────────────────────────────────────────────────

const STATIC_COLS: ColDef[] = [
    { key: 'Symbol', label: 'Symbol', type: 'string', section: 'info' },
    { key: 'Company', label: 'Company', type: 'string', section: 'info' },
    { key: 'Sector', label: 'Sector', type: 'string', section: 'info' },
    { key: 'Industry', label: 'Industry', type: 'string', section: 'info' },
    { key: 'Exchange', label: 'Exchange', type: 'string', section: 'info' },
    { key: 'Currency', label: 'Currency', type: 'string', section: 'info' },
    { key: 'IPO', label: 'IPO', type: 'number', section: 'info' },
    { key: 'YearsActive', label: 'Yrs Active', type: 'number', section: 'info' },
    { key: 'Price', label: 'Price', type: 'number', section: 'info' },
    { key: 'MarketCap', label: 'Mkt Cap ($B)', type: 'currency', section: 'price' },
    { key: 'Dma200', label: 'P/200MA', type: 'ratio', section: 'price' },
    { key: 'Dma50', label: 'P/50MA', type: 'ratio', section: 'price' },
    { key: 'Slope200', label: 'Slope 200', type: 'percent', section: 'price', decimal: true },
    { key: 'Div50200', label: 'Div 50/200', type: 'ratio', section: 'price' },
    { key: 'DaysAbove200', label: 'Days>200MA', type: 'number', section: 'price' },
    { key: 'Return2026', label: '2026 Ret', type: 'percent', section: 'annual', decimal: true },
    { key: 'Return2025', label: '2025 Ret', type: 'percent', section: 'annual', decimal: true },
    { key: 'Return2024', label: '2024 Ret', type: 'percent', section: 'annual', decimal: true },
    { key: 'Return2023', label: '2023 Ret', type: 'percent', section: 'annual', decimal: true },
    { key: 'Return2022', label: '2022 Ret', type: 'percent', section: 'annual', decimal: true },
    { key: 'PS_TTM', label: 'P/S TTM', type: 'ratio', section: 'valuation' },
    { key: 'PE_TTM', label: 'P/E TTM', type: 'ratio', section: 'valuation' },
    { key: 'PS2024', label: 'P/S 2024', type: 'ratio', section: 'valuation' },
    { key: 'PE2024', label: 'P/E 2024', type: 'ratio', section: 'valuation' },
    { key: 'TtmRevenue', label: 'TTM Rev', type: 'number', section: 'fundamental' },
    { key: 'TtmNetIncome', label: 'TTM NI', type: 'number', section: 'fundamental' },
    { key: 'TtmRevGrowth', label: 'TTM Rev%', type: 'percent', section: 'fundamental', decimal: true },
    { key: 'Rev2025', label: '2025 Rev', type: 'number', section: 'fundamental' },
    { key: 'Rev2024', label: '2024 Rev', type: 'number', section: 'fundamental' },
    { key: 'Rev2023', label: '2023 Rev', type: 'number', section: 'fundamental' },
    { key: 'RevGrowth2025', label: '2025 Rev%', type: 'percent', section: 'fundamental', decimal: true },
    { key: 'RevGrowth2024', label: '2024 Rev%', type: 'percent', section: 'fundamental', decimal: true },
    { key: 'RevGrowth2023', label: '2023 Rev%', type: 'percent', section: 'fundamental', decimal: true },
    { key: 'NetMargin2025', label: '2025 NM%', type: 'percent', section: 'cashflow' },
    { key: 'NetMargin2024', label: '2024 NM%', type: 'percent', section: 'cashflow' },
    { key: 'EbitdaMargin2025', label: '2025 EBITDA%', type: 'percent', section: 'cashflow' },
    { key: 'EbitdaMargin2024', label: '2024 EBITDA%', type: 'percent', section: 'cashflow' },
    { key: 'Ebitda2025', label: '2025 EBITDA', type: 'number', section: 'cashflow' },
    { key: 'Ebitda2024', label: '2024 EBITDA', type: 'number', section: 'cashflow' },
    { key: 'Fcf2025', label: '2025 FCF', type: 'number', section: 'cashflow' },
    { key: 'Fcf2024', label: '2024 FCF', type: 'number', section: 'cashflow' },
    { key: 'Assets2025', label: '2025 Assets', type: 'number', section: 'balance' },
    { key: 'Cash2025', label: '2025 Cash', type: 'number', section: 'balance' },
    { key: 'Debt2025', label: '2025 Debt', type: 'number', section: 'balance' },
    { key: 'NetDebt2025', label: '2025 ND', type: 'number', section: 'balance' },
    { key: 'RangeReturn', label: 'Range Ret', type: 'percent', section: 'price', decimal: true },
];

const SECTION_ORDER = ['info', 'price', 'annual', 'valuation', 'fundamental', 'cashflow', 'balance', 'quarterly', 'quarterly-margin'];
const SECTION_LABEL: Record<string, string> = {
    info: 'Company Info', price: 'Price & Technical', annual: 'Annual Returns',
    valuation: 'Valuation', fundamental: 'Fundamentals', cashflow: 'Cash Flow',
    balance: 'Balance Sheet', quarterly: 'Quarterly Rev Growth', 'quarterly-margin': 'Net Margin',
};
const DROPDOWN_COLS = new Set(['Sector', 'Industry', 'Exchange', 'Currency']);
const DEFAULT_COLS = ['Symbol', 'Sector', 'MarketCap', 'RevGrowth2025', 'RevGrowth2024', 'PE_TTM'];

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtVal(def: ColDef, v: number): string {
    if (def.type === 'percent') {
        const n = def.decimal ? v * 100 : v;
        return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`;
    }
    if (def.type === 'ratio') return v.toFixed(1);
    if (def.type === 'currency') return `$${(v / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}B`;
    if (Math.abs(v) >= 1000) return v.toLocaleString(undefined, { maximumFractionDigits: 0 });
    return v.toFixed(1);
}

function valColor(def: ColDef, v: number | null): string | undefined {
    if (v == null) return undefined;
    const n = def.decimal ? v * 100 : v;
    if (def.type === 'percent') {
        if (n < 0) return '#ef4444';
        if (n > 20) return '#22c55e';
    }
    return undefined;
}

function presetDates(label: '1Y' | '2Y' | '5Y') {
    const today = new Date();
    const yrs = label === '1Y' ? 1 : label === '2Y' ? 2 : 5;
    const start = new Date(today);
    start.setFullYear(start.getFullYear() - yrs);
    const fmt = (d: Date) => d.toISOString().slice(0, 10);
    return { start: fmt(start), end: fmt(today) };
}

function mapCsvRow(r: Record<string, string | number | null>): MergedRow {
    const pct = (k: string): number | null =>
        typeof r[k] === 'number' ? (r[k] as number) / 100 : null;
    return {
        Symbol: r['Symbol'], Company: r['Company'], Sector: r['Sector'],
        Industry: r['Industry'], Exchange: r['Exchange'], Currency: r['Currency'],
        YearEnd: r['Year_End'], IPO: r['IPO'], YearsActive: r['YearsActive'],
        Price: r['Price'], Shares: r['Shares'],
        // Live columns — left null in Phase 1, filled by DB in Phase 2 to avoid stale flicker
        MarketCap: null,
        PS_TTM: null, PE_TTM: null,
        PS2024: null, PE2024: null,
        TtmRevenue: null, TtmNetIncome: null, TtmEbitda: null,
        TtmRevGrowth: typeof r['Q_Rev%'] === 'number' ? (r['Q_Rev%'] as number) / 100 : null,
        Rev2026: null, Rev2025: r['2025_Revenue'], Rev2024: r['2024_Revenue'],
        Rev2023: r['2023_Revenue'], Rev2022: r['2022_Revenue'], Rev2021: r['2021_Revenue'], Rev2020: null,
        NI2026: null, NI2025: r['2025_NetIncome'], NI2024: r['2024_NetIncome'],
        NI2023: r['2023_NetIncome'], NI2022: null, NI2021: null,
        Ebitda2026: null, Ebitda2025: r['2025_EBITDA'], Ebitda2024: r['2024_EBITDA'],
        Ebitda2023: null, Ebitda2022: null,
        Fcf2025: r['2025_FCF'], Fcf2024: r['2024_FCF'], Fcf2023: null, Fcf2022: null,
        RevGrowth2025: pct('2025_Rev%'), RevGrowth2024: pct('2024_Rev%'),
        RevGrowth2023: pct('2023_Rev%'), RevGrowth2022: pct('2022_Rev%'),
        NetMargin2025: r['2025_NetMargin'], NetMargin2024: r['2024_NetMargin'],
        NetMargin2023: null, NetMargin2022: null,
        EbitdaMargin2025: r['2025_EBITDA%'], EbitdaMargin2024: r['2024_EBITDA%'], EbitdaMargin2023: null,
        Assets2025: r['2025_Assets'], Assets2024: r['2024_Assets'], Assets2023: null,
        Cash2025: r['2025_Cash'], Cash2024: r['2024_Cash'], Cash2023: null,
        Debt2025: r['2025_Debt'], Debt2024: r['2024_Debt'], Debt2023: null,
        NetDebt2025: r['2025_NetDebt'], NetDebt2024: r['2024_NetDebt'], NetDebt2023: null,
        Liabilities2025: r['2025_Liabilities'], Liabilities2024: r['2024_Liabilities'], Liabilities2023: null,
        Slope200: typeof r['Slope_200'] === 'number' ? (r['Slope_200'] as number) / 100 : null,
        Div50200: r['Divergence_200'], Div2050: null,
        Dma200: null, Dma50: null, Slope100: null, Slope50: null, DaysAbove200: null, Rsi14: null,
        Return2026: null, Return2025: null, Return2024: null,
        Return2023: null, Return2022: null, Return2021: null, Return2020: null,
    } as unknown as MergedRow;
}

// ─── columns modal ────────────────────────────────────────────────────────────

function ColumnsModal({ cols, visible, setVisible, onClose }: {
    cols: ColDef[]; visible: string[];
    setVisible: (v: string[]) => void; onClose: () => void;
}) {
    const toggle = (key: string) =>
        setVisible(visible.includes(key) ? visible.filter(k => k !== key) : [...visible, key]);
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)' }}>
            <div className="flex flex-col w-full max-w-5xl max-h-[85vh] border"
                style={{ background: 'var(--surface-raised)', borderColor: 'var(--surface-border)' }}>
                <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'var(--surface-border)' }}>
                    <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: 'var(--text-primary)' }}>Columns</span>
                    <button onClick={onClose} className="text-lg leading-none hover:opacity-70" style={{ color: 'var(--text-muted)' }}>✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
                    {SECTION_ORDER.map(sec => {
                        const secCols = cols.filter(c => c.section === sec);
                        if (!secCols.length) return null;
                        return (
                            <div key={sec} className="border p-3" style={{ borderColor: 'var(--surface-border)' }}>
                                <div className="text-[10px] tracking-[0.2em] uppercase mb-2" style={{ color: 'var(--accent)' }}>
                                    {SECTION_LABEL[sec]}
                                </div>
                                {secCols.map(c => (
                                    <label key={c.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                                        <input type="checkbox" checked={visible.includes(c.key)}
                                            onChange={() => toggle(c.key)} className="accent-[var(--accent)]" />
                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
                                    </label>
                                ))}
                            </div>
                        );
                    })}
                </div>
                <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'var(--surface-border)' }}>
                    <button onClick={onClose} className="border px-4 py-1.5 text-xs tracking-widest uppercase hover:opacity-70"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>Close</button>
                </div>
            </div>
        </div>
    );
}

// ─── main ─────────────────────────────────────────────────────────────────────

export default function StockScreener() {
    const [rawData, setRawData] = useState<MergedRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingFull, setLoadingFull] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [allCols, setAllCols] = useState<ColDef[]>(STATIC_COLS);

    const [symbolSearch, setSymbolSearch] = useState('');
    const [sectors, setSectors] = useState<string[]>([]);
    const [filterRanges, setFilterRanges] = useState<Record<string, { min: string; max: string }>>({});
    const [dropdownVals, setDropdownVals] = useState<Record<string, string>>({});

    const [visibleCols, setVisibleCols] = useState<string[]>(DEFAULT_COLS);
    const [sortKey, setSortKey] = useState<string | null>(null);
    const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [dragCol, setDragCol] = useState<string | null>(null);
    const PER_PAGE = 25;

    const [rangeStart, setRangeStart] = useState('');
    const [rangeEnd, setRangeEnd] = useState('');
    const [rangeReturns, setRangeReturns] = useState<Record<string, number>>({});
    const [rangeLoading, setRangeLoading] = useState(false);
    const [rangeLabel, setRangeLabel] = useState<string | null>(null);

    const [filtered, setFiltered] = useState<MergedRow[]>([]);
    const [hasFiltered, setHasFiltered] = useState(false);

    // ── two-phase load ────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;

        // Phase 1 — CSV (instant, ~30ms)
        fetch('/api/stocks/screener-csv')
            .then(r => r.json())
            .then((csv: Record<string, string | number | null>[]) => {
                if (cancelled || !Array.isArray(csv)) return;
                const mapped = csv.map(mapCsvRow);
                setRawData(mapped);
                setFiltered(mapped);
                setLoading(false);
                setLoadingFull(true);
            });

        // Phase 2 — full DB + quarterly (slow, runs in background)
        Promise.all([
            fetch('/api/stocks/screener').then(r => r.json()),
            fetch('/api/stocks/quarterly-growth').then(r => r.json()),
        ]).then(([screenerData, qData]) => {
            if (cancelled || !Array.isArray(screenerData)) return;
            const yoyCols: ColDef[] = (qData.yoyColumns ?? []).map((k: string) => ({
                key: k, label: k.replace('_YoY', ' YoY'), type: 'percent' as ColType,
                section: 'quarterly', decimal: true,
            }));
            const nmCols: ColDef[] = (qData.nmColumns ?? []).map((k: string) => ({
                key: k, label: k.replace('_NM', ' NM'), type: 'percent' as ColType,
                section: 'quarterly-margin', decimal: true,
            }));
            setAllCols([...STATIC_COLS, ...yoyCols, ...nmCols]);
            const qLookup: Record<string, Record<string, number>> = qData.data ?? {};
            const merged: MergedRow[] = screenerData.map((row: ScreenerRow) => ({
                ...row, ...qLookup[row.Symbol] ?? {},
            } as MergedRow));
            setRawData(merged);
            setFiltered(merged);
            setLoadingFull(false);
        }).catch(e => { if (!cancelled) { setError(e.message); setLoadingFull(false); } });

        return () => { cancelled = true; };
    }, []);

    // ── derived ───────────────────────────────────────────────────────────────
    const availableSectors = useMemo(() => {
        const s = new Set<string>();
        rawData.forEach(r => { if (r.Sector) s.add(r.Sector as string); });
        return Array.from(s).sort();
    }, [rawData]);

    const dropdownOptions = useMemo(() => {
        const out: Record<string, string[]> = {};
        for (const key of ['Sector', 'Industry', 'Exchange', 'Currency']) {
            out[key] = Array.from(new Set(
                rawData.map(r => r[key]).filter((v): v is string => typeof v === 'string' && v.trim() !== '')
            )).sort();
        }
        return out;
    }, [rawData]);

    // ── filters ───────────────────────────────────────────────────────────────
    const applyFilters = useCallback((
        overrideRanges?: Record<string, { min: string; max: string }>,
        overrideDropdowns?: Record<string, string>,
    ) => {
        const ranges = overrideRanges ?? filterRanges;
        const drops = overrideDropdowns ?? dropdownVals;
        const result = rawData.filter(row => {
            if (symbolSearch.trim() && !(row.Symbol as string).toUpperCase().includes(symbolSearch.trim().toUpperCase())) return false;
            if (sectors.length && !sectors.includes(row.Sector as string)) return false;
            for (const [col, val] of Object.entries(drops)) {
                if (val && row[col] !== val) return false;
            }
            for (const [col, { min, max }] of Object.entries(ranges)) {
                if (!min && !max) continue;
                const v = row[col];
                if (typeof v !== 'number') return false;
                const def = allCols.find(c => c.key === col);
                const conv = def?.decimal && def.type === 'percent';
                const minN = min ? (conv ? parseFloat(min) / 100 : parseFloat(min)) : -Infinity;
                const maxN = max ? (conv ? parseFloat(max) / 100 : parseFloat(max)) : Infinity;
                if (!isNaN(minN) && v < minN) return false;
                if (!isNaN(maxN) && v > maxN) return false;
            }
            return true;
        });
        setFiltered(result);
        setHasFiltered(true);
        setPage(1);
    }, [rawData, symbolSearch, sectors, dropdownVals, filterRanges, allCols]);

    const resetFilters = () => {
        setSymbolSearch(''); setSectors([]); setDropdownVals({});
        setFilterRanges({}); setFiltered(rawData); setHasFiltered(false); setPage(1);
    };

    // ── range return ──────────────────────────────────────────────────────────
    const fetchRangeReturns = async () => {
        if (!rangeStart || !rangeEnd) return;
        setRangeLoading(true);
        try {
            const res = await fetch(`/api/stocks/range-return?startDate=${rangeStart}&endDate=${rangeEnd}`);
            const json = await res.json();
            setRangeReturns(json.returns ?? {});
            setRangeLabel(`${json.startDate} → ${json.endDate}`);
            if (!visibleCols.includes('RangeReturn')) setVisibleCols(p => [...p, 'RangeReturn']);
        } finally { setRangeLoading(false); }
    };

    // ── sort & page ───────────────────────────────────────────────────────────
    const base = hasFiltered ? filtered : rawData;
    const enriched: MergedRow[] = base.map(row => ({
        ...row, RangeReturn: rangeReturns[row.Symbol as string] ?? null,
    }));

    const avgRangeReturn = useMemo(() => {
        const vals = Object.values(rangeReturns).filter(v => v != null);
        return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
    }, [rangeReturns]);

    const sorted = useMemo(() => {
        if (!sortKey) return enriched;
        return [...enriched].sort((a, b) => {
            const av = a[sortKey], bv = b[sortKey];
            if (av == null) return 1; if (bv == null) return -1;
            return sortDir === 'asc' ? (av as number) - (bv as number) : (bv as number) - (av as number);
        });
    }, [enriched, sortKey, sortDir]);

    const paged = sorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    const totalPages = Math.ceil(sorted.length / PER_PAGE);

    const toggleSort = (key: string) => {
        if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setSortKey(key); setSortDir('desc'); }
    };

    const handleDrop = (to: string) => {
        if (!dragCol || dragCol === to) return;
        setVisibleCols(prev => {
            const arr = [...prev];
            const fi = arr.indexOf(dragCol), ti = arr.indexOf(to);
            if (fi < 0 || ti < 0) return prev;
            arr.splice(fi, 1); arr.splice(ti, 0, dragCol);
            return arr;
        });
    };

    // ── shared styles ─────────────────────────────────────────────────────────
    const inputStyle: React.CSSProperties = {
        borderColor: 'var(--surface-border)', color: 'var(--text-primary)',
        background: 'transparent', caretColor: 'var(--accent)',
    };

    // ── render guards ─────────────────────────────────────────────────────────
    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <span className="h-1.5 w-1.5 rounded-full animate-pulse mr-2" style={{ background: 'var(--accent)' }} />
            <span className="text-[11px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                Loading screener…
            </span>
        </div>
    );

    if (error) return (
        <div className="border px-5 py-4 text-sm" style={{ borderColor: '#ef4444', color: '#ef4444' }}>
            Error: {error}
        </div>
    );

    // ── render ────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-4">

            {/* controls */}
            <div className="border p-4 space-y-3"
                style={{ borderColor: 'var(--surface-border)', background: 'var(--surface-raised)' }}>

                {/* row 1 — search + buttons + status */}
                <div className="flex flex-wrap items-center gap-2">
                    <input type="text" value={symbolSearch} placeholder="Symbol…"
                        onChange={e => setSymbolSearch(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && applyFilters()}
                        className="border px-2.5 py-1.5 text-sm w-24 focus:outline-none"
                        style={inputStyle} />
                    <PresetFilters
                        setFilterRanges={setFilterRanges}
                        setVisibleCols={setVisibleCols}
                        applyFilters={applyFilters}
                        currentFilterRanges={filterRanges}
                        currentVisibleCols={visibleCols}
                        rangeStart={rangeStart}
                        rangeEnd={rangeEnd}
                        onRangeStart={setRangeStart}
                        onRangeEnd={setRangeEnd}
                        sectors={sectors}
                        setSectors={setSectors}
                    />
                    <button onClick={() => applyFilters()}
                        className="border px-3 py-1.5 text-xs tracking-widest uppercase hover:opacity-70"
                        style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>Filter</button>
                    <button onClick={resetFilters}
                        className="border px-3 py-1.5 text-xs tracking-widest uppercase hover:opacity-70"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>Reset</button>
                    <button onClick={() => setShowModal(true)}
                        className="border px-3 py-1.5 text-xs tracking-widest uppercase hover:opacity-70"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>Columns</button>
                    <span className="ml-auto flex items-center gap-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
                        {loadingFull ? (
                            <>
                                <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{ background: 'var(--accent)' }} />
                                <span className="tracking-widest uppercase">Loading full data…</span>
                            </>
                        ) : (
                            <span className="tabular-nums">{sorted.length} / {rawData.length}</span>
                        )}
                    </span>
                </div>

                {/* sector pills */}
                <div className="flex flex-wrap gap-1.5">
                    {['All', ...availableSectors].map(s => {
                        const active = s === 'All' ? sectors.length === 0 : sectors.includes(s);
                        return (
                            <button key={s}
                                onClick={() => s === 'All' ? setSectors([]) : setSectors(
                                    sectors.includes(s) ? sectors.filter(x => x !== s) : [...sectors, s]
                                )}
                                className="px-2.5 py-0.5 text-[10px] tracking-[0.15em] uppercase border transition-all"
                                style={{
                                    borderColor: active ? 'var(--accent)' : 'var(--surface-border)',
                                    color: active ? 'var(--accent)' : 'var(--text-muted)',
                                    background: active ? 'var(--accent-dim)' : 'transparent',
                                }}>
                                {s}
                            </button>
                        );
                    })}
                </div>

                {/* range return */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t"
                    style={{ borderColor: 'var(--surface-border)' }}>
                    <span className="text-[10px] tracking-widest uppercase" style={{ color: 'var(--text-muted)' }}>
                        Range
                    </span>
                    <input type="date" value={rangeStart} onChange={e => setRangeStart(e.target.value)}
                        className="border px-2 py-1 text-xs focus:outline-none" style={inputStyle} />
                    <input type="date" value={rangeEnd} onChange={e => setRangeEnd(e.target.value)}
                        className="border px-2 py-1 text-xs focus:outline-none" style={inputStyle} />
                    {(['1Y', '2Y', '5Y'] as const).map(l => (
                        <button key={l} onClick={() => { const d = presetDates(l); setRangeStart(d.start); setRangeEnd(d.end); }}
                            className="border px-2 py-1 text-[10px] tracking-widest uppercase hover:opacity-70"
                            style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>{l}</button>
                    ))}
                    <button onClick={fetchRangeReturns} disabled={rangeLoading || !rangeStart || !rangeEnd}
                        className="border px-3 py-1 text-[10px] tracking-widest uppercase hover:opacity-70 disabled:opacity-30"
                        style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}>
                        {rangeLoading ? '…' : 'Go'}
                    </button>
                    {rangeLabel && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{rangeLabel}</span>}
                    {avgRangeReturn != null && (
                        <span className="text-sm font-bold tabular-nums"
                            style={{ color: avgRangeReturn >= 0 ? '#22c55e' : '#ef4444' }}>
                            avg {avgRangeReturn >= 0 ? '+' : ''}{(avgRangeReturn * 100).toFixed(1)}%
                        </span>
                    )}
                    {rangeReturns['SPY'] != null && (
                        <span className="text-sm font-bold tabular-nums"
                            style={{ color: rangeReturns['SPY'] >= 0 ? '#22c55e' : '#ef4444' }}>
                            SPY {rangeReturns['SPY'] >= 0 ? '+' : ''}{(rangeReturns['SPY'] * 100).toFixed(1)}%
                        </span>
                    )}
                </div>
            </div>

            {/* table */}
            <div className="border overflow-auto" style={{ borderColor: 'var(--surface-border)', maxHeight: 'calc(100vh - 340px)', minHeight: 400 }}>
                <table className="text-sm border-collapse" style={{ minWidth: visibleCols.length * 120 }}>
                    <thead className="sticky top-0 z-20">

                        {/* filter row */}
                        <tr style={{ background: 'var(--surface-raised)' }}>
                            {visibleCols.map(key => {
                                const def = allCols.find(c => c.key === key);
                                if (DROPDOWN_COLS.has(key)) {
                                    return (
                                        <th key={key} className="px-2 py-1.5 min-w-[120px]">
                                            <select className="w-full border px-1 py-1 text-xs focus:outline-none"
                                                style={{ ...inputStyle, background: 'var(--surface-raised)' }}
                                                value={dropdownVals[key] ?? ''}
                                                onChange={e => {
                                                    const updated = { ...dropdownVals, [key]: e.target.value };
                                                    setDropdownVals(updated);
                                                    applyFilters(undefined, updated);
                                                }}>
                                                <option value="">All</option>
                                                {(dropdownOptions[key] ?? []).map(o => <option key={o} value={o}>{o}</option>)}
                                            </select>
                                        </th>
                                    );
                                }
                                if (!def || def.type === 'string') return <th key={key} className="min-w-[120px]" />;
                                return (
                                    <th key={key} className="px-2 py-1 min-w-[120px]">
                                        <div className="flex flex-col gap-1">
                                            {(['min', 'max'] as const).map(b => (
                                                <input key={b} type="text" placeholder={b === 'min' ? 'Min' : 'Max'}
                                                    className="w-full border px-1.5 py-0.5 text-xs text-center focus:outline-none"
                                                    style={{ ...inputStyle, background: 'var(--surface-raised)' }}
                                                    value={filterRanges[key]?.[b] ?? ''}
                                                    onChange={e => setFilterRanges(p => ({ ...p, [key]: { ...p[key], [b]: e.target.value } }))}
                                                    onBlur={e => {
                                                        const updated = { ...filterRanges, [key]: { ...filterRanges[key], [b]: e.target.value } };
                                                        setFilterRanges(updated);
                                                        applyFilters(updated);
                                                    }}
                                                    onKeyDown={e => {
                                                        if (e.key === 'Enter') {
                                                            const val = (e.target as HTMLInputElement).value;
                                                            const updated = { ...filterRanges, [key]: { ...filterRanges[key], [b]: val } };
                                                            setFilterRanges(updated);
                                                            applyFilters(updated);
                                                        }
                                                    }}
                                                />
                                            ))}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>

                        {/* header row */}
                        <tr style={{ background: 'var(--surface-raised)' }}>
                            {visibleCols.map(key => {
                                const def = allCols.find(c => c.key === key);
                                const active = sortKey === key;
                                return (
                                    <th key={key}
                                        className="px-3 py-2 text-center text-[10px] tracking-[0.15em] uppercase min-w-[120px] border-b"
                                        style={{
                                            color: active ? 'var(--accent)' : 'var(--text-muted)',
                                            borderColor: 'var(--surface-border)',
                                            cursor: def?.type !== 'string' ? 'pointer' : 'default',
                                            userSelect: 'none', whiteSpace: 'nowrap',
                                        }}
                                        draggable
                                        onDragStart={() => setDragCol(key)}
                                        onDragOver={e => e.preventDefault()}
                                        onDrop={() => handleDrop(key)}
                                        onClick={() => def?.type !== 'string' && toggleSort(key)}>
                                        {def?.label ?? key}{active ? (sortDir === 'asc' ? ' ↑' : ' ↓') : ''}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    <tbody>
                        {paged.map((row, i) => (
                            <tr key={String(row.Symbol)} className="border-t"
                                style={{
                                    borderColor: 'var(--surface-border)',
                                    background: i % 2 === 0 ? 'transparent' : 'rgba(181,139,74,0.02)',
                                }}>
                                {visibleCols.map(key => {
                                    const def = allCols.find(c => c.key === key);
                                    const v = row[key];

                                    if (key === 'Symbol') return (
                                        <td key={key} className="px-3 py-1.5 text-center min-w-[120px]">
                                            <Link href={`/stocks/${v}/financials`}
                                                className="font-bold tracking-wider hover:opacity-70"
                                                style={{ color: 'var(--accent)' }}>
                                                {String(v)}
                                            </Link>
                                        </td>
                                    );
                                    if (key === 'Sector' && typeof v === 'string') return (
                                        <td key={key} className="px-3 py-1.5 text-center min-w-[120px] max-w-[160px]">
                                            <div className="truncate text-xs" style={{ color: 'var(--text-secondary)' }} title={v}>{v}</div>
                                        </td>
                                    );
                                    if (!def || def.type === 'string') return (
                                        <td key={key} className="px-3 py-1.5 text-center min-w-[120px] text-xs"
                                            style={{ color: 'var(--text-secondary)' }}>
                                            {v != null ? String(v) : '—'}
                                        </td>
                                    );

                                    const display = typeof v === 'number' ? fmtVal(def, v) : '—';
                                    const color = typeof v === 'number' ? valColor(def, v) : undefined;
                                    return (
                                        <td key={key} className="px-3 py-1.5 text-center tabular-nums min-w-[120px]"
                                            style={{ color: color ?? 'var(--text-primary)' }}>
                                            {display}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                        {paged.length === 0 && (
                            <tr>
                                <td colSpan={visibleCols.length} className="py-12 text-center text-sm"
                                    style={{ color: 'var(--text-muted)' }}>
                                    No results
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* pagination */}
            <div className="flex items-center justify-between">
                <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, sorted.length)} of {sorted.length}
                </span>
                <div className="flex items-center gap-1">
                    <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                        className="border px-3 py-1 text-xs disabled:opacity-30 hover:opacity-70"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>←</button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const p = Math.max(1, Math.min(totalPages - 4, page - 2)) + i;
                        if (p > totalPages) return null;
                        return (
                            <button key={p} onClick={() => setPage(p)}
                                className="border px-3 py-1 text-xs hover:opacity-70"
                                style={{
                                    borderColor: page === p ? 'var(--accent)' : 'var(--surface-border)',
                                    color: page === p ? 'var(--accent)' : 'var(--text-muted)',
                                }}>
                                {p}
                            </button>
                        );
                    })}
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                        className="border px-3 py-1 text-xs disabled:opacity-30 hover:opacity-70"
                        style={{ borderColor: 'var(--surface-border)', color: 'var(--text-muted)' }}>→</button>
                </div>
            </div>

            {showModal && (
                <ColumnsModal cols={allCols} visible={visibleCols} setVisible={setVisibleCols} onClose={() => setShowModal(false)} />
            )}
        </div>
    );
}
