import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import type { SavedSession } from '@/app/components/council/types';

// ─── GET /api/sessions ────────────────────────────────────────────────────────
// Returns all sessions ordered newest-first.

export async function GET() {
    try {
        const rows = await db.session.findMany({
            orderBy: { savedAt: 'desc' },
            take: 100,
        });

        const sessions: SavedSession[] = rows.map(dbRowToSession);
        return Response.json(sessions);
    } catch (err) {
        console.error('[api/sessions GET]', err);
        return Response.json({ error: 'Failed to load sessions' }, { status: 500 });
    }
}

// ─── POST /api/sessions ───────────────────────────────────────────────────────
// Upserts a session. Body must be a SavedSession.

export async function POST(req: NextRequest) {
    try {
        const session = (await req.json()) as SavedSession;
        if (!session?.id) {
            return Response.json({ error: 'Missing session id' }, { status: 400 });
        }

        const row = await db.session.upsert({
            where: { id: session.id },
            create: sessionToDbRow(session),
            update: sessionToDbRow(session),
        });

        return Response.json(dbRowToSession(row));
    } catch (err) {
        console.error('[api/sessions POST]', err);
        return Response.json({ error: 'Failed to save session' }, { status: 500 });
    }
}

// ─── DELETE /api/sessions?id=xxx ─────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
    try {
        const id = new URL(req.url).searchParams.get('id');
        if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

        await db.session.delete({ where: { id } }).catch(() => {
            // Ignore not-found — idempotent delete is fine.
        });

        return Response.json({ ok: true });
    } catch (err) {
        console.error('[api/sessions DELETE]', err);
        return Response.json({ error: 'Failed to delete session' }, { status: 500 });
    }
}

// ─── PATCH /api/sessions ──────────────────────────────────────────────────────
// Renames a session. Body: { id, title }

export async function PATCH(req: NextRequest) {
    try {
        const { id, title } = (await req.json()) as { id: string; title: string };
        if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

        const row = await db.session.update({
            where: { id },
            data: { title: title?.trim() || null },
        });

        return Response.json(dbRowToSession(row));
    } catch (err) {
        console.error('[api/sessions PATCH]', err);
        return Response.json({ error: 'Failed to rename session' }, { status: 500 });
    }
}

// ─── serialisation ────────────────────────────────────────────────────────────

type DbSession = Awaited<ReturnType<typeof db.session.findFirst>> & object;

function sessionToDbRow(s: SavedSession) {
    return {
        id: s.id,
        mode: s.mode,
        title: s.title ?? null,
        savedAt: new Date(s.savedAt),
        turnsJson: s.turns as unknown as object[],
        parallelMessagesJson: s.parallelMessages
            ? (s.parallelMessages as unknown as object[][])
            : undefined,
        agentsJson: s.agents as unknown as object[],
        refIds: (s.refs?.map((r) => r.id) ?? []) as unknown as string[],
        selectedIdxs: (s.selectedIdxs ?? []) as unknown as number[],
    };
}

function dbRowToSession(row: NonNullable<DbSession>): SavedSession {
    return {
        id: row.id,
        mode: row.mode as SavedSession['mode'],
        title: row.title ?? null,
        firstQuestion: firstQuestion(row),
        savedAt: row.savedAt.toISOString(),
        agents: row.agentsJson as unknown as SavedSession['agents'],
        turns: row.turnsJson as unknown as SavedSession['turns'],
        parallelMessages: row.parallelMessagesJson
            ? (row.parallelMessagesJson as unknown as SavedSession['parallelMessages'])
            : undefined,
        // refs are stored as ids only; the client already has the full metadata
        // from the corpus catalogue — just return an empty array so the shape
        // is valid. The attached refIds are preserved in the json column.
        refs: [],
        selectedIdxs: row.selectedIdxs as unknown as number[],
    };
}

function firstQuestion(row: NonNullable<DbSession>): string {
    const turns = row.turnsJson as unknown as { question?: string }[];
    if (Array.isArray(turns) && turns[0]?.question) return turns[0].question;
    const parallel = row.parallelMessagesJson as unknown as { role: string; content: string }[][] | null;
    if (Array.isArray(parallel)) {
        for (const thread of parallel) {
            const first = thread?.find((m) => m.role === 'user');
            if (first?.content) return first.content;
        }
    }
    return 'Untitled';
}
