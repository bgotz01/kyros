import { NextRequest, NextResponse } from 'next/server';
import {
    getStockProfile,
    getMomentumSnapshot,
    getFundamentals,
    getQuarterlyFinancials,
    getTopMomentumStocks,
} from '@/app/lib/queries/assets';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get('symbol');

    try {
        if (!symbol) {
            // No symbol — return market-wide momentum leaders
            const leaders = await getTopMomentumStocks(25);
            return NextResponse.json({ leaders });
        }

        const [profile, momentum, fundamentals, quarterly] = await Promise.all([
            getStockProfile(symbol),
            getMomentumSnapshot(symbol),
            getFundamentals(symbol),
            getQuarterlyFinancials(symbol),
        ]);

        return NextResponse.json({ symbol: symbol.toUpperCase(), profile, momentum, fundamentals, quarterly });
    } catch (err) {
        console.error('[/api/data/asset]', err);
        return NextResponse.json({ error: 'Failed to fetch asset data' }, { status: 500 });
    }
}
