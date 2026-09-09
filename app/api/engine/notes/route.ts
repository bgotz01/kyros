import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// ─── PATCH /api/engine/notes ─────────────────────────────────────────────────
// The same decision, taken over many objections at once. A critic pass over a
// month raises flags in dozens, and deciding them one request at a time is a
// different act from deciding them together — the first is adjudication, the
// second is a policy. Both are legitimate; only the second needed an endpoint.
//
// Nothing here touches a score. The analyst's row stays frozen and the
// correction is layered over it at read time, which is what makes this
// reversible: setting a resolution back to null puts every number back.
//
// Body: { ids: string[], resolution: 'applied' | 'dismissed' | null }

export async function PATCH(req: NextRequest) {
    try {
        const { ids, resolution } = (await req.json()) as {
            ids?: unknown;
            resolution?: unknown;
        };

        if (resolution !== 'applied' && resolution !== 'dismissed' && resolution !== null) {
            return Response.json(
                { error: 'resolution must be applied, dismissed or null' },
                { status: 400 },
            );
        }

        const noteIds = Array.isArray(ids) ? ids.filter((x): x is string => typeof x === 'string') : [];
        if (noteIds.length === 0) {
            return Response.json({ error: 'ids must be a non-empty array' }, { status: 400 });
        }

        const { count } = await db.engineNote.updateMany({
            where: { id: { in: noteIds } },
            data: { resolution, resolvedAt: resolution ? new Date() : null },
        });
        return Response.json({ ok: true, count });
    } catch (err) {
        console.error('[api/engine/notes PATCH]', err);
        return Response.json({ error: 'Failed to record the decisions' }, { status: 500 });
    }
}
