import { NextRequest, NextResponse } from 'next/server';
import { updateShares } from '@/app/lib/queries/stocks';

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ symbol: string }> },
) {
    const { symbol } = await params;
    const body = await request.json() as { shares?: number | null; impliedShares?: number | null };

    try {
        if ('shares' in body) {
            await updateShares(symbol.toUpperCase(), 'shares', body.shares ?? null);
        }
        if ('impliedShares' in body) {
            await updateShares(symbol.toUpperCase(), 'impliedShares', body.impliedShares ?? null);
        }
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('Failed to update shares:', err);
        return NextResponse.json({ error: 'Failed to update shares' }, { status: 500 });
    }
}
