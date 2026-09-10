import { allWeeks } from '@/lib/engine/data';

// ─── GET /api/engine/weeks ───────────────────────────────────────────────────
// The digest, as batches. `held` says whether a paper's text is in the archive —
// the engine can only score what has been pulled.

export async function GET() {
    try {
        return Response.json(allWeeks());
    } catch (err) {
        console.error('[api/engine/weeks]', err);
        return Response.json({ error: 'Failed to read digests' }, { status: 500 });
    }
}
