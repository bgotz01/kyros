import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// ─── /api/engine/aside ───────────────────────────────────────────────────────
// Which digest rows have been taken out of the reading. A judgement about the
// row, not about any one scoring of it — so it is keyed by the row's place in
// the digest and kept beside the runs rather than inside one.
//
// Nothing here deletes anything. A set-aside row keeps every score it ever had;
// it is simply not in the way any more.

export interface Aside {
    year: string;
    weekIdx: number;
    n: number;
    paperId: string | null;
}

/** "1,2,3" — the weeks of a month, in one request. */
function indices(raw: string | null): number[] {
    if (!raw) return [];
    return raw
        .split(',')
        .map((x) => Number(x.trim()))
        .filter((x) => Number.isInteger(x));
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') ?? 'ai';
    const year = searchParams.get('year');
    const weekIdx = indices(searchParams.get('weekIdx'));

    if (!year || weekIdx.length === 0) {
        return Response.json({ error: 'year and weekIdx are required' }, { status: 400 });
    }

    try {
        const rows = await db.engineAside.findMany({
            where: { domain, year, weekIdx: { in: weekIdx } },
            select: { year: true, weekIdx: true, n: true, paperId: true },
        });
        return Response.json(rows satisfies Aside[]);
    } catch (err) {
        console.error('[api/engine/aside] GET', err);
        return Response.json({ error: 'Failed to read set-aside rows' }, { status: 500 });
    }
}

interface AsideRowInput {
    weekIdx: number;
    n: number;
    paperId?: string | null;
}

function rowsOf(body: Record<string, unknown>): AsideRowInput[] {
    // One row or many. A month can hold a dozen digest entries the engine can
    // never run — clearing them one request at a time would be a dozen
    // round trips to say one thing.
    if (Array.isArray(body.rows)) {
        return body.rows
            .filter((r): r is Record<string, unknown> => Boolean(r) && typeof r === 'object')
            .map((r) => ({
                weekIdx: Number(r.weekIdx),
                n: Number(r.n),
                paperId: typeof r.paperId === 'string' ? r.paperId : null,
            }))
            .filter((r) => Number.isInteger(r.weekIdx) && Number.isInteger(r.n));
    }
    const one = {
        weekIdx: Number(body.weekIdx),
        n: Number(body.n),
        paperId: typeof body.paperId === 'string' ? body.paperId : null,
    };
    return Number.isInteger(one.weekIdx) && Number.isInteger(one.n) ? [one] : [];
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) ?? {};
        const domain = typeof body.domain === 'string' ? body.domain : 'ai';
        const year = body.year;
        const rows = rowsOf(body);

        if (typeof year !== 'string' || rows.length === 0) {
            return Response.json({ error: 'year and at least one row are required' }, { status: 400 });
        }

        // Setting a row aside twice is not an error, it is the same statement
        // made again — so the whole batch is idempotent and a partial retry is
        // safe.
        await db.$transaction(
            rows.map((r) =>
                db.engineAside.upsert({
                    where: { domain_year_weekIdx_n: { domain, year, weekIdx: r.weekIdx, n: r.n } },
                    create: { domain, year, weekIdx: r.weekIdx, n: r.n, paperId: r.paperId ?? null },
                    update: { paperId: r.paperId ?? null },
                }),
            ),
        );
        return Response.json({ ok: true, count: rows.length });
    } catch (err) {
        console.error('[api/engine/aside] POST', err);
        return Response.json({ error: 'Failed to set the rows aside' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const domain = searchParams.get('domain') ?? 'ai';
    const year = searchParams.get('year');
    const weekIdx = Number(searchParams.get('weekIdx'));
    const n = Number(searchParams.get('n'));

    if (!year || !Number.isInteger(weekIdx) || !Number.isInteger(n)) {
        return Response.json({ error: 'year, weekIdx and n are required' }, { status: 400 });
    }

    try {
        await db.engineAside.deleteMany({ where: { domain, year, weekIdx, n } });
        return Response.json({ ok: true });
    } catch (err) {
        console.error('[api/engine/aside] DELETE', err);
        return Response.json({ error: 'Failed to restore the row' }, { status: 500 });
    }
}
