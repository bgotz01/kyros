import { NextResponse } from 'next/server';
import {
    getCurrentRegime,
    getRegimeTimeline,
    getMacroSignals,
    getMarketBreadth,
    getYieldCurve,
} from '@/app/lib/queries/regime';

export async function GET() {
    try {
        const [regime, history, signals, breadth, yieldCurve] = await Promise.all([
            getCurrentRegime(),
            getRegimeTimeline(12),
            getMacroSignals(),
            getMarketBreadth(),
            getYieldCurve(),
        ]);

        return NextResponse.json({ regime, history, signals, breadth, yieldCurve });
    } catch (err) {
        console.error('[/api/data/regime]', err);
        return NextResponse.json({ error: 'Failed to fetch regime data' }, { status: 500 });
    }
}
