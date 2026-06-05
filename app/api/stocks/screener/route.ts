import { NextResponse } from 'next/server';
import { getScreenerData } from '@/app/lib/queries/screener';

export const dynamic = 'force-dynamic';

// In-memory cache: reuse data for up to 5 minutes
let cache: { data: unknown; ts: number } | null = null;
const TTL_MS = 5 * 60 * 1000;

export async function GET() {
    try {
        const now = Date.now();
        if (cache && now - cache.ts < TTL_MS) {
            return NextResponse.json(cache.data);
        }
        const rows = await getScreenerData();
        cache = { data: rows, ts: now };
        return NextResponse.json(rows);
    } catch (err) {
        console.error('Screener error:', err);
        return NextResponse.json({ error: 'Failed to load screener data' }, { status: 500 });
    }
}
