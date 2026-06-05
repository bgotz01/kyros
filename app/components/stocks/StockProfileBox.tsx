'use client';

import { useState, useEffect } from 'react';
import type { StockProfile, LatestPrice, TTMData } from '@/app/lib/queries/stocks';

interface Props {
    symbol: string;
    profile: StockProfile;
    latest: LatestPrice;
    ttm: TTMData;
}

function MetricCard({
    label,
    value,
    accent = false,
}: {
    label: string;
    value: string;
    accent?: boolean;
}) {
    return (
        <div
            className="rounded px-4 py-3"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--surface-border)' }}
        >
            <div
                className="text-[10px] tracking-[0.22em] uppercase mb-1"
                style={{ color: 'var(--text-muted)' }}
            >
                {label}
            </div>
            <div
                className="text-lg font-semibold tabular-nums"
                style={{ color: accent ? 'var(--accent)' : 'var(--text-primary)' }}
            >
                {value}
            </div>
        </div>
    );
}

export default function StockProfileBox({ symbol, profile, latest, ttm }: Props) {
    const [editingShares, setEditingShares] = useState(false);
    const [editingImplied, setEditingImplied] = useState(false);
    const [sharesVal, setSharesVal] = useState(profile.shares ?? '');
    const [impliedVal, setImpliedVal] = useState(profile.impliedShares ?? '');
    const [saving, setSaving] = useState(false);

    const price = latest.close ?? 0;
    const priceDate = latest.date;
    const shares = profile.shares ? Number(profile.shares) : null;
    const impliedShares = profile.impliedShares ? Number(profile.impliedShares) : null;

    const marketCapB = shares ? (price * shares) / 1e9 : null;
    const marketCapM = marketCapB ? marketCapB * 1000 : null;

    const ttmPS = marketCapM && ttm.revenue && ttm.revenue > 0
        ? (marketCapM / ttm.revenue).toFixed(2) : null;
    const ttmPE = marketCapM && ttm.netIncome && ttm.netIncome > 0
        ? (marketCapM / ttm.netIncome).toFixed(2) : null;

    const ipoYear = profile.ipoDate ? new Date(profile.ipoDate).getFullYear() : null;
    const yearsActive = ipoYear ? new Date().getFullYear() - ipoYear : null;

    const saveShares = async (field: 'shares' | 'impliedShares', value: string) => {
        setSaving(true);
        try {
            await fetch(`/api/stocks/${symbol}/shares`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ [field]: value ? Number(value) : null }),
            });
            window.location.reload();
        } finally {
            setSaving(false);
        }
    };

    const labelCls = 'text-[10px] tracking-[0.22em] uppercase';
    const valueCls = 'text-sm font-semibold mt-0.5';

    return (
        <div
            className="rounded border overflow-hidden"
            style={{
                background: 'var(--surface-raised)',
                borderColor: 'var(--surface-border)',
            }}
        >
            {/* Header */}
            <div
                className="px-6 py-4 border-b flex items-center justify-between"
                style={{ borderColor: 'var(--surface-border)' }}
            >
                <div className="flex items-center gap-3">
                    <span
                        className="text-xl font-bold tracking-widest"
                        style={{ color: 'var(--accent)' }}
                    >
                        {symbol}
                    </span>
                    {profile.company && (
                        <span
                            className="text-sm"
                            style={{ color: 'var(--text-secondary)' }}
                        >
                            {profile.company}
                        </span>
                    )}
                </div>
                <span
                    className="text-[10px] tracking-widest tabular-nums"
                    style={{ color: 'var(--text-muted)' }}
                >
                    as of {priceDate}
                </span>
            </div>

            {/* Sector / industry badges */}
            {(profile.sector || profile.industry) && (
                <div
                    className="px-6 pt-3 flex items-center gap-2 flex-wrap"
                >
                    {profile.sector && (
                        <span
                            className="text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border"
                            style={{
                                borderColor: 'var(--surface-border)',
                                color: 'var(--text-muted)',
                            }}
                        >
                            {profile.sector}
                        </span>
                    )}
                    {profile.industry && (
                        <span
                            className="text-[10px] tracking-[0.15em] uppercase px-2 py-0.5 border"
                            style={{
                                borderColor: 'var(--surface-border)',
                                color: 'var(--text-muted)',
                            }}
                        >
                            {profile.industry}
                        </span>
                    )}
                </div>
            )}

            {/* Key metrics grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-5">
                <MetricCard
                    label="Price"
                    value={`$${price.toFixed(2)}`}
                    accent
                />
                <MetricCard
                    label="Market Cap"
                    value={
                        marketCapB
                            ? `$${marketCapB.toLocaleString(undefined, { maximumFractionDigits: 2 })}B`
                            : '—'
                    }
                />
                <MetricCard label="P/S (TTM)" value={ttmPS ?? '—'} />
                <MetricCard label="P/E (TTM)" value={ttmPE ?? '—'} />
            </div>

            {/* Detail grid */}
            <div
                className="grid grid-cols-2 md:grid-cols-4 gap-x-6 gap-y-4 px-6 pb-6 pt-4 border-t"
                style={{ borderColor: 'var(--surface-border)' }}
            >
                <div>
                    <div className={labelCls} style={{ color: 'var(--text-muted)' }}>IPO Date</div>
                    <div className={valueCls} style={{ color: 'var(--text-primary)' }}>
                        {profile.ipoDate ? profile.ipoDate.slice(0, 10) : '—'}
                    </div>
                </div>
                <div>
                    <div className={labelCls} style={{ color: 'var(--text-muted)' }}>Years Active</div>
                    <div className={valueCls} style={{ color: 'var(--text-primary)' }}>
                        {yearsActive ?? '—'}
                    </div>
                </div>
                <div>
                    <div className={labelCls} style={{ color: 'var(--text-muted)' }}>Diluted Cap</div>
                    <div className={valueCls} style={{ color: 'var(--text-primary)' }}>
                        {impliedShares
                            ? `$${((price * impliedShares) / 1e9).toLocaleString(undefined, { maximumFractionDigits: 2 })}B`
                            : '—'}
                    </div>
                </div>
                <div>
                    <div className={labelCls} style={{ color: 'var(--text-muted)' }}>Currency</div>
                    <div className={valueCls} style={{ color: 'var(--text-primary)' }}>
                        {profile.currency ?? '—'}
                    </div>
                </div>
                <div>
                    <div className={labelCls} style={{ color: 'var(--text-muted)' }}>Latest Quarter</div>
                    <div className={valueCls} style={{ color: 'var(--text-primary)' }}>
                        {ttm.latestQuarter
                            ? new Date(ttm.latestQuarter).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                            })
                            : '—'}
                    </div>
                </div>

                {/* Editable Shares */}
                <div className="group">
                    <div className={labelCls} style={{ color: 'var(--text-muted)' }}>Shares</div>
                    {editingShares ? (
                        <div className="flex items-center gap-1 mt-0.5">
                            <input
                                type="number"
                                value={sharesVal}
                                onChange={(e) => setSharesVal(e.target.value)}
                                disabled={saving}
                                className="w-28 border bg-transparent px-1.5 py-0.5 text-xs focus:outline-none"
                                style={{ borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}
                                autoFocus
                            />
                            <button
                                onClick={() => { saveShares('shares', sharesVal); setEditingShares(false); }}
                                disabled={saving}
                                className="text-xs"
                                style={{ color: 'var(--accent)' }}
                            >✓</button>
                            <button
                                onClick={() => { setSharesVal(profile.shares ?? ''); setEditingShares(false); }}
                                disabled={saving}
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                            >✕</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={valueCls} style={{ color: 'var(--text-primary)' }}>
                                {shares
                                    ? `${(shares / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`
                                    : '—'}
                            </span>
                            <button
                                onClick={() => setEditingShares(true)}
                                className="opacity-0 group-hover:opacity-60 text-[10px] transition-opacity"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                ✎
                            </button>
                        </div>
                    )}
                </div>

                {/* Editable Implied Shares */}
                <div className="group">
                    <div className={labelCls} style={{ color: 'var(--text-muted)' }}>Implied Shares</div>
                    {editingImplied ? (
                        <div className="flex items-center gap-1 mt-0.5">
                            <input
                                type="number"
                                value={impliedVal}
                                onChange={(e) => setImpliedVal(e.target.value)}
                                disabled={saving}
                                className="w-28 border bg-transparent px-1.5 py-0.5 text-xs focus:outline-none"
                                style={{ borderColor: 'var(--surface-border)', color: 'var(--text-primary)' }}
                                autoFocus
                            />
                            <button
                                onClick={() => { saveShares('impliedShares', impliedVal); setEditingImplied(false); }}
                                disabled={saving}
                                className="text-xs"
                                style={{ color: 'var(--accent)' }}
                            >✓</button>
                            <button
                                onClick={() => { setImpliedVal(profile.impliedShares ?? ''); setEditingImplied(false); }}
                                disabled={saving}
                                className="text-xs"
                                style={{ color: 'var(--text-muted)' }}
                            >✕</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={valueCls} style={{ color: 'var(--text-primary)' }}>
                                {impliedShares
                                    ? `${(impliedShares / 1e6).toLocaleString(undefined, { maximumFractionDigits: 1 })}M`
                                    : '—'}
                            </span>
                            <button
                                onClick={() => setEditingImplied(true)}
                                className="opacity-0 group-hover:opacity-60 text-[10px] transition-opacity"
                                style={{ color: 'var(--text-muted)' }}
                            >
                                ✎
                            </button>
                        </div>
                    )}
                </div>

                <div>
                    <div className={labelCls} style={{ color: 'var(--text-muted)' }}>Exchange</div>
                    <div className={valueCls} style={{ color: 'var(--text-primary)' }}>
                        {profile.exchange ?? '—'}
                    </div>
                </div>
            </div>
        </div>
    );
}
