import fs from 'fs';
import path from 'path';
import type { Paradigm } from '@/lib/engine/paradigm';
import { renderParadigm } from '@/lib/engine/paradigm';

const CONTEXT_ROOT = path.join(process.cwd(), 'context');

/** Returns the absolute path for a markdown file, guarded against traversal.
 *  e.g. ["ai", "canon", "chain-of-thought"] → ".../context/ai/canon/chain-of-thought.md" */
function mdPath(segments: string[]): string {
    const rel = segments.join('/') + '.md';
    const resolved = path.resolve(CONTEXT_ROOT, rel);
    if (!resolved.startsWith(CONTEXT_ROOT + path.sep)) throw new Error('Invalid path');
    return resolved;
}

/** True when the id segments point to a paradigm snapshot.
 *  Pattern: [..., "paradigm", "YYYY-MM"] */
function isParadigmId(segments: string[]): boolean {
    return (
        segments.length >= 2 &&
        segments[segments.length - 2] === 'paradigm' &&
        /^\d{4}-\d{2}$/.test(segments[segments.length - 1])
    );
}

/** Reads a paradigm snapshot directly by its exact date slug, bypassing the
 *  strict-before semantics of loadParadigm() which is designed for scoring. */
function readParadigmExact(segments: string[]): Paradigm | null {
    const rel = segments.join('/') + '.json';
    const resolved = path.resolve(CONTEXT_ROOT, rel);
    if (!resolved.startsWith(CONTEXT_ROOT + path.sep)) throw new Error('Invalid path');
    try {
        return JSON.parse(fs.readFileSync(resolved, 'utf-8')) as Paradigm;
    } catch {
        return null;
    }
}

/** GET /api/context/[...id] — returns { content: string } */
export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string[] }> },
) {
    try {
        const { id } = await params;

        // Paradigm snapshots are .json; return both the rendered text and the
        // typed object so the page can render them as structured read-only views.
        if (isParadigmId(id)) {
            const snapshot = readParadigmExact(id);
            if (!snapshot) return Response.json({ error: 'Not found' }, { status: 404 });
            const content = renderParadigm(snapshot) ?? '';
            return Response.json({ content, paradigm: snapshot });
        }

        const full = mdPath(id);
        const content = fs.readFileSync(full, 'utf-8');
        return Response.json({ content });
    } catch {
        return Response.json({ error: 'Not found' }, { status: 404 });
    }
}

/** PUT /api/context/[...id] — body: { content: string }, returns { ok: true }
 *  Paradigm snapshots are read-only and cannot be updated through this route. */
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string[] }> },
) {
    try {
        const { id } = await params;

        if (isParadigmId(id)) {
            return Response.json({ error: 'Paradigm snapshots are read-only' }, { status: 403 });
        }

        const full = mdPath(id);
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
