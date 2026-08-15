import fs from 'fs';
import path from 'path';

const CONTEXT_ROOT = path.join(process.cwd(), 'context');

/** Reconstruct the relative path from the catch-all segments.
 *  e.g. ["ai", "canon", "chain-of-thought"] → "ai/canon/chain-of-thought.md" */
function filePath(segments: string[]): string {
    const rel = segments.join('/') + '.md';
    // Guard against path traversal
    const resolved = path.resolve(CONTEXT_ROOT, rel);
    if (!resolved.startsWith(CONTEXT_ROOT + path.sep)) {
        throw new Error('Invalid path');
    }
    return resolved;
}

/** GET /api/context/[...id] — returns { content: string } */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string[] }> },
) {
    try {
        const { id } = await params;
        const full = filePath(id);
        const content = fs.readFileSync(full, 'utf-8');
        return Response.json({ content });
    } catch {
        return Response.json({ error: 'Not found' }, { status: 404 });
    }
}

/** PUT /api/context/[...id] — body: { content: string }, returns { ok: true } */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string[] }> },
) {
    try {
        const { id } = await params;
        const full = filePath(id);
        const { content } = await req.json() as { content: string };
        if (typeof content !== 'string') {
            return Response.json({ error: 'content must be a string' }, { status: 400 });
        }
        fs.writeFileSync(full, content, 'utf-8');
        return Response.json({ ok: true });
    } catch (err) {
        if (err instanceof Error && err.message === 'Invalid path') {
            return Response.json({ error: 'Invalid path' }, { status: 400 });
        }
        return Response.json({ error: 'Write failed' }, { status: 500 });
    }
}
