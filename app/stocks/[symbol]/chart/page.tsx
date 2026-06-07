import { notFound } from 'next/navigation';
import {
    getStockProfile,
    getLatestPrice,
    getQuarterlyFinancials,
    computeTTM,
} from '@/app/lib/queries/stocks';
import ChartClient from './ChartClient';

interface PageProps {
    params: Promise<{ symbol: string }>;
}

export default async function ChartPage({ params }: PageProps) {
    const { symbol: raw } = await params;
    const symbol = raw.toUpperCase();

    const [profile, latestPrice, quarterlyRows] = await Promise.all([
        getStockProfile(symbol),
        getLatestPrice(symbol),
        getQuarterlyFinancials(symbol, 4),
    ]);

    if (!profile || !latestPrice) notFound();

    const ttm = computeTTM(quarterlyRows);

    return (
        <ChartClient
            symbol={symbol}
            profile={profile}
            latestPrice={latestPrice}
            ttm={ttm}
        />
    );
}
