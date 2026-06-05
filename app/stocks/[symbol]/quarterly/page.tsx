import { notFound } from 'next/navigation';
import {
    getStockProfile,
    getLatestPrice,
    getQuarterlyFinancials,
    computeTTM,
} from '@/app/lib/queries/stocks';
import QuarterlyClient from './QuarterlyClient';

interface PageProps {
    params: Promise<{ symbol: string }>;
}

export default async function QuarterlyPage({ params }: PageProps) {
    const { symbol: raw } = await params;
    const symbol = raw.toUpperCase();

    const [profile, latestPrice, rows] = await Promise.all([
        getStockProfile(symbol),
        getLatestPrice(symbol),
        getQuarterlyFinancials(symbol, 20),
    ]);

    if (!profile || !latestPrice) notFound();

    const ttm = computeTTM(rows);

    return (
        <QuarterlyClient
            symbol={symbol}
            profile={profile}
            latestPrice={latestPrice}
            rows={rows}
            ttm={ttm}
        />
    );
}
