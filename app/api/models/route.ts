import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const MODELS_PATH = path.join(process.cwd(), 'lib', 'models.ts');
const MUTED_PATH = path.join(process.cwd(), 'lib', 'muted-models.json');

// ─── PUT /api/models ──────────────────────────────────────────────────────────
// Rewrites one model entry in lib/models.ts in-place.

export async function PUT(req: Request) {
    try {
        const body = await req.json() as {
            originalId: string;
            id: string;
            label: string;
            inputCost: number;
            outputCost: number;
            context: string;
            maxTokens: number;
        };

        const { originalId, id, label, inputCost, outputCost, context, maxTokens } = body;

        if (!originalId || !id || !label || isNaN(inputCost) || isNaN(outputCost) || !context || isNaN(maxTokens)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const src = await readFile(MODELS_PATH, 'utf-8');

        const escaped = originalId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const lineRe = new RegExp(
            `\\{\\s*id:\\s*'${escaped}'[^}]+\\}`,
        );

        const replacement = `{ id: '${id}', label: '${label}', inputCost: ${inputCost}, outputCost: ${outputCost}, context: '${context}', maxTokens: ${maxTokens} }`;

        if (!lineRe.test(src)) {
            return NextResponse.json({ error: 'Model not found in source' }, { status: 404 });
        }

        const updated = src.replace(lineRe, replacement);
        await writeFile(MODELS_PATH, updated, 'utf-8');

        // If id changed, update muted list too
        if (originalId !== id) {
            const muted: string[] = JSON.parse(await readFile(MUTED_PATH, 'utf-8'));
            const idx = muted.indexOf(originalId);
            if (idx !== -1) {
                muted[idx] = id;
                await writeFile(MUTED_PATH, JSON.stringify(muted, null, 2) + '\n', 'utf-8');
            }
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[PUT /api/models]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// ─── DELETE /api/models ───────────────────────────────────────────────────────
// Removes one model entry from lib/models.ts in-place.

export async function DELETE(req: Request) {
    try {
        const { id } = await req.json() as { id: string };

        if (!id) {
            return NextResponse.json({ error: 'id required' }, { status: 400 });
        }

        const src = await readFile(MODELS_PATH, 'utf-8');

        const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match the full line including leading whitespace, the object literal, optional comma, and trailing newline
        const lineRe = new RegExp(
            `^[ \\t]*\\{\\s*id:\\s*'${escaped}'[^}]+\\},?\\r?\\n`,
            'm',
        );

        if (!lineRe.test(src)) {
            return NextResponse.json({ error: 'Model not found in source' }, { status: 404 });
        }

        const updated = src.replace(lineRe, '');
        await writeFile(MODELS_PATH, updated, 'utf-8');

        // Also remove from muted list if present
        const muted: string[] = JSON.parse(await readFile(MUTED_PATH, 'utf-8'));
        const filtered = muted.filter((m) => m !== id);
        if (filtered.length !== muted.length) {
            await writeFile(MUTED_PATH, JSON.stringify(filtered, null, 2) + '\n', 'utf-8');
        }

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[DELETE /api/models]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// ─── PATCH /api/models ────────────────────────────────────────────────────────
// Toggles the muted state of a model (stored in lib/muted-models.json).

export async function PATCH(req: Request) {
    try {
        const { id, muted } = await req.json() as { id: string; muted: boolean };

        if (!id || typeof muted !== 'boolean') {
            return NextResponse.json({ error: 'id and muted (boolean) required' }, { status: 400 });
        }

        const list: string[] = JSON.parse(await readFile(MUTED_PATH, 'utf-8'));

        const already = list.includes(id);
        let updated: string[];

        if (muted && !already) {
            updated = [...list, id];
        } else if (!muted && already) {
            updated = list.filter((m) => m !== id);
        } else {
            // No change needed
            return NextResponse.json({ ok: true, muted });
        }

        await writeFile(MUTED_PATH, JSON.stringify(updated, null, 2) + '\n', 'utf-8');
        return NextResponse.json({ ok: true, muted });
    } catch (err) {
        console.error('[PATCH /api/models]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// ─── POST /api/models ─────────────────────────────────────────────────────────
// Appends a new model entry to lib/models.ts RAW_MODELS array.

export async function POST(req: Request) {
    try {
        const body = await req.json() as {
            id: string;
            label: string;
            inputCost: number;
            outputCost: number;
            context: string;
            maxTokens: number;
        };

        const { id, label, inputCost, outputCost, context, maxTokens } = body;

        if (!id || !label || isNaN(inputCost) || isNaN(outputCost) || !context || isNaN(maxTokens)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const src = await readFile(MODELS_PATH, 'utf-8');

        // Check for duplicate id
        const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        if (new RegExp(`id:\\s*'${escaped}'`).test(src)) {
            return NextResponse.json({ error: 'Model ID already exists' }, { status: 409 });
        }

        const newLine = `    { id: '${id}', label: '${label}', inputCost: ${inputCost}, outputCost: ${outputCost}, context: '${context}', maxTokens: ${maxTokens} },`;

        // Insert before the closing `] as const;` of RAW_MODELS
        const updated = src.replace(
            /^(\] as const;)/m,
            `${newLine}\n$1`,
        );

        if (updated === src) {
            return NextResponse.json({ error: 'Could not locate RAW_MODELS array end' }, { status: 500 });
        }

        await writeFile(MODELS_PATH, updated, 'utf-8');
        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[POST /api/models]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}

// ─── GET /api/models ──────────────────────────────────────────────────────────
// Returns the current muted model IDs.

export async function GET() {
    try {
        const muted: string[] = JSON.parse(await readFile(MUTED_PATH, 'utf-8'));
        return NextResponse.json({ muted });
    } catch (err) {
        console.error('[GET /api/models]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
