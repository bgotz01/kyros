import { notFound } from 'next/navigation';
import {
    getStockProfile,
    getLatestPrice,
    getIncomeStatements,
    getBalanceSheets,
    getMarketCapSnapshots,
    getQuarterlyFinancials,
    computeTTM,
} from '@/app/lib/queries/stocks';
import FinancialsClient from './FinancialsClient';

interface PageProps {
    params: Promise<{ symbol: string }>;
}

export default async function FinancialsPage({ params }: PageProps) {
    const { symbol: raw } = await params;
    const symbol = raw.toUpperCase();

    const [profile, latestPrice, incomeRows, balanceRows, snapshots, quarterlyRows] =
        await Promise.all([
            getStockProfile(symbol),
            getLatestPrice(symbol),
            getIncomeStatements(symbol),
            getBalanceSheets(symbol),
            getMarketCapSnapshots(symbol),
            getQuarterlyFinancials(symbol, 4),
        ]);

    if (!profile || !latestPrice) notFound();

    const ttm = computeTTM(quarterlyRows);

    // ── Build capLookup: year -> raw marketCap ($) ───────────────────────
    const capLookup: Record<string, number> = {};
    for (const snap of snapshots) {
        const y = String(snap.year);
        if (!(y in capLookup) && snap.marketCap !== null) {
            capLookup[y] = snap.marketCap;
        }
    }

    // ── Flatten income + balance into a single stock map ─────────────────
    const stock: Record<string, string | number> = {
        Symbol: profile.symbol,
        yearEnd: profile.yearEnd ?? '',
    };

    // Values are already stored in millions in income_statements and balance_sheet
    for (const r of incomeRows) {
        const y = String(r.year);
        if (r.revenue !== null) stock[`${y}_Revenue`] = r.revenue;
        if (r.netIncome !== null) stock[`${y}_NetIncome`] = r.netIncome;
        if (r.ebitda !== null) stock[`${y}_EBITDA`] = r.ebitda;
        if (r.fcf !== null) stock[`${y}_FCF`] = r.fcf;
        if (r.sga !== null) stock[`${y}_SG&A`] = r.sga;
        if (r.interestExpense !== null) stock[`${y}_InterestExpense`] = r.interestExpense;
        if (r.interestIncome !== null) stock[`${y}_InterestIncome`] = r.interestIncome;
        if (r.netInterest !== null) stock[`${y}_NetInterest`] = r.netInterest;
    }

    for (const r of balanceRows) {
        const y = String(r.year);
        if (r.assets !== null) stock[`${y}_Assets`] = r.assets;
        if (r.cash !== null) stock[`${y}_Cash`] = r.cash;
        if (r.debt !== null) stock[`${y}_Debt`] = r.debt;
        if (r.netDebt !== null) stock[`${y}_NetDebt`] = r.netDebt;
        if (r.liabilities !== null) stock[`${y}_Liabilities`] = r.liabilities;
    }

    // ── Build year columns ────────────────────────────────────────────────
    const incomeYears = new Set(incomeRows.map((r) => r.year));
    const latestYear = incomeYears.size ? Math.max(...incomeYears) : new Date().getFullYear();

    const baseYears = Array.from({ length: 7 }, (_, i) => latestYear - i)
        .filter((y) => incomeYears.has(y))
        .map(String);

    const oldYears = Array.from({ length: 11 }, (_, i) => latestYear - 7 - i)
        .filter((y) => incomeYears.has(y))
        .map(String);

    return (
        <FinancialsClient
            symbol={symbol}
            profile={profile}
            latestPrice={latestPrice}
            ttm={ttm}
            stock={stock}
            baseYears={baseYears}
            oldYears={oldYears}
            capLookup={capLookup}
        />
    );
}
