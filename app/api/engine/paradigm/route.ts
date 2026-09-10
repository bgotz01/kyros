import { NextRequest } from 'next/server';
import type { Paradigm } from '@/lib/engine/paradigm';
import { allParadigms, loadParadigm } from '@/lib/engine/paradigmStore';

// ─── GET /api/engine/paradigm ────────────────────────────────────────────────
// The standing paradigms, for reading. The scorer does not come through here —
// it loads the snapshot for the paper's own year directly, so that a paper can
// never be judged against a frame written after it.
//
//   ?asOf=2024-12   one snapshot
//   ?for=2025       the snapshot a paper of that year would be judged against
//   (no query)      every snapshot, newest first

export async function GET(req: NextRequest) {
    try {
        const params = new URL(req.url).searchParams;
        const asOf = params.get('asOf');
        const forYear = params.get('for');

        if (asOf || forYear) {
            const p: Paradigm | null = loadParadigm(asOf ?? forYear!);
            if (!p) return Response.json({ error: 'No paradigm standing at that date' }, { status: 404 });
            return Response.json([p]);
        }
        return Response.json(allParadigms());
    } catch (err) {
        console.error('[api/engine/paradigm]', err);
        return Response.json({ error: 'Failed to read the paradigm' }, { status: 500 });
    }
}
