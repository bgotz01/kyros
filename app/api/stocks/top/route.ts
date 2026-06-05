import { NextResponse } from 'next/server';
import { getTopStocksByMarketCap } from '@/app/lib/queries/stockScreen';

export async function GET() {
    try {
        const stocks = await getTopStocksByMarketCap(30);
        return NextResponse.json(stocks);
    } catch (err) {
        console.error('Error in /api/stocks/top:', err);
        return NextResponse.json({ error: 'Failed to load stock data' }, { status: 500 });
    }
}
