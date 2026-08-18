import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import type { CouncilMemory, MemoryEntry } from '@/app/components/council/types';
import { MemoryCategory } from '@/lib/generated/prisma/client';

// ─── GET /api/memory ─────────────────────────────────────────────────────────
// Returns { entries, lastDistilledAt, enabled }

export async function GET() {
    try {
        const [entries, settings] = await Promise.all([
            db.memoryEntry.findMany({ orderBy: { addedAt: 'desc' } }),
            db.memorySettings.findUnique({ where: { id: 'singleton' } }),
        ]);

        const memory: CouncilMemory & { enabled: boolean } = {
            entries: entries.map(dbEntryToEntry),
            lastDistilledAt: settings?.lastDistilledAt?.toISOString(),
            enabled: settings?.enabled ?? false,
        };

        return Response.json(memory);
    } catch (err) {
        console.error('[api/memory GET]', err);
        return Response.json({ error: 'Failed to load memory' }, { status: 500 });
    }
}

// ─── POST /api/memory ─────────────────────────────────────────────────────────
// Upserts a single MemoryEntry. Body: MemoryEntry

export async function POST(req: NextRequest) {
    try {
        const entry = (await req.json()) as MemoryEntry;
        if (!entry?.id || !entry?.text || !entry?.category) {
            return Response.json({ error: 'Invalid entry' }, { status: 400 });
        }

        const cat = toPrismaCategory(entry.category);
        if (!cat) return Response.json({ error: 'Invalid category' }, { status: 400 });

        const row = await db.memoryEntry.upsert({
            where: { id: entry.id },
            create: {
                id: entry.id,
                category: cat,
                text: entry.text,
                addedAt: new Date(entry.addedAt),
                sessionId: entry.sessionId ?? null,
            },
            update: {
                category: cat,
                text: entry.text,
                sessionId: entry.sessionId ?? null,
            },
        });

        return Response.json(dbEntryToEntry(row));
    } catch (err) {
        console.error('[api/memory POST]', err);
        return Response.json({ error: 'Failed to save memory entry' }, { status: 500 });
    }
}

// ─── DELETE /api/memory?id=xxx ───────────────────────────────────────────────

export async function DELETE(req: NextRequest) {
    try {
        const id = new URL(req.url).searchParams.get('id');
        if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });

        await db.memoryEntry.delete({ where: { id } }).catch(() => {});
        return Response.json({ ok: true });
    } catch (err) {
        console.error('[api/memory DELETE]', err);
        return Response.json({ error: 'Failed to delete memory entry' }, { status: 500 });
    }
}

// ─── PATCH /api/memory ───────────────────────────────────────────────────────
// Updates settings. Body: { enabled?, lastDistilledAt? }
// Also handles bulk upsert when body contains { entries: MemoryEntry[] }

export async function PATCH(req: NextRequest) {
    try {
        const body = (await req.json()) as {
            enabled?: boolean;
            lastDistilledAt?: string;
            entries?: MemoryEntry[];
        };

        // Bulk upsert path — used by mergeDistilled.
        if (Array.isArray(body.entries)) {
            await db.$transaction(
                body.entries.map((entry) => {
                    const cat = toPrismaCategory(entry.category);
                    if (!cat) throw new Error(`Invalid category: ${entry.category}`);
                    return db.memoryEntry.upsert({
                        where: { id: entry.id },
                        create: {
                            id: entry.id,
                            category: cat,
                            text: entry.text,
                            addedAt: new Date(entry.addedAt),
                            sessionId: entry.sessionId ?? null,
                        },
                        update: {
                            category: cat,
                            text: entry.text,
                        },
                    });
                }),
            );

            if (body.lastDistilledAt !== undefined || body.enabled !== undefined) {
                await db.memorySettings.upsert({
                    where: { id: 'singleton' },
                    create: {
                        id: 'singleton',
                        enabled: body.enabled ?? false,
                        lastDistilledAt: body.lastDistilledAt
                            ? new Date(body.lastDistilledAt)
                            : null,
                    },
                    update: {
                        ...(body.enabled !== undefined && { enabled: body.enabled }),
                        ...(body.lastDistilledAt !== undefined && {
                            lastDistilledAt: new Date(body.lastDistilledAt),
                        }),
                    },
                });
            }

            return Response.json({ ok: true });
        }

        // Settings-only update.
        const settings = await db.memorySettings.upsert({
            where: { id: 'singleton' },
            create: {
                id: 'singleton',
                enabled: body.enabled ?? false,
                lastDistilledAt: body.lastDistilledAt
                    ? new Date(body.lastDistilledAt)
                    : null,
            },
            update: {
                ...(body.enabled !== undefined && { enabled: body.enabled }),
                ...(body.lastDistilledAt !== undefined && {
                    lastDistilledAt: new Date(body.lastDistilledAt),
                }),
            },
        });

        return Response.json({
            enabled: settings.enabled,
            lastDistilledAt: settings.lastDistilledAt?.toISOString(),
        });
    } catch (err) {
        console.error('[api/memory PATCH]', err);
        return Response.json({ error: 'Failed to update memory settings' }, { status: 500 });
    }
}

// ─── helpers ─────────────────────────────────────────────────────────────────

type DbEntry = Awaited<ReturnType<typeof db.memoryEntry.findFirst>>;

function dbEntryToEntry(row: NonNullable<DbEntry>): MemoryEntry {
    return {
        id: row.id,
        category: row.category as MemoryEntry['category'],
        text: row.text,
        addedAt: row.addedAt.toISOString(),
        sessionId: row.sessionId ?? undefined,
    };
}

function toPrismaCategory(cat: string): MemoryCategory | null {
    const valid: MemoryCategory[] = ['theme', 'preference', 'good_idea', 'dismissed', 'question'];
    return valid.includes(cat as MemoryCategory) ? (cat as MemoryCategory) : null;
}
