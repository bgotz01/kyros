import { NextResponse } from 'next/server';
import { getCurrentRegime } from '@/app/lib/queries/regime';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const regime = await getCurrentRegime();
        if (!regime) return NextResponse.json(null);
        return NextResponse.json({
            regime: regime.regime,
            date: regime.date,
            entryDate: regime.entryDate,
            triggerReason: regime.triggerReason,
            rey: regime.rey,
            eyp: regime.eyp,
            real10Y: regime.real10Y,
            real3M: regime.real3M,
            realM2: regime.realM2,
        }, { headers: { 'Cache-Control': 'public, max-age=300' } });
    } catch (err) {
        console.error('regime/current error', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
