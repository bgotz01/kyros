import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// ─── PATCH /api/engine/notes/[id] ────────────────────────────────────────────
// Records the analyst's decision on a critic objection. This does not touch the
// score row — the analyst's original stays frozen and the correction is layered
// over it at read time.
//
// Body: { resolution: 'applied' | 'dismissed' | null }

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const { resolution } = (await req.json()) as { resolution?: unknown };

        if (resolution !== 'applied' && resolution !== 'dismissed' && resolution !== null) {
            return Response.json({ error: 'resolution must be applied, dismissed or null' }, { status: 400 });
        }

        const note = await db.engineNote.update({
            where: { id },
            data: { resolution, resolvedAt: resolution ? new Date() : null },
        });
        return Response.json({ id: note.id, resolution: note.resolution });
    } catch (err) {
        console.error('[api/engine/notes PATCH]', err);
        return Response.json({ error: 'Failed to record decision' }, { status: 500 });
    }
}
