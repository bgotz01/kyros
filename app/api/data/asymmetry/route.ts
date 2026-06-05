import { NextRequest, NextResponse } from 'next/server';
import {
    getCOTPositioning,
    getInsiderActivity,
    getBreadthDivergence,
    getETFConcentration,
} from '@/app/lib/queries/asymmetry';

export async function GET(req: NextRequest) {
    const { searchParams } = req.nextUrl;
    const symbol = searchParams.get('symbol') ?? undefined;
    const etf = searchParams.get('etf') ?? 'SPY';

    try {
        const [cot, insiders, breadth, concentration] = await Promise.all([
            getCOTPositioning(),
            getInsiderActivity(symbol),
            getBreadthDivergence(),
            getETFConcentration(etf),
        ]);

        return NextResponse.json({ cot, insiders, breadth, concentration });
    } catch (err) {
        console.error('[/api/data/asymmetry]', err);
        return NextResponse.json({ error: 'Failed to fetch asymmetry data' }, { status: 500 });
    }
}
