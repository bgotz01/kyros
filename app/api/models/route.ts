import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';

const MODELS_PATH = path.join(process.cwd(), 'lib', 'models.ts');

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

        // Match the specific model line by its id field and replace the whole object literal
        // Pattern: { id: 'originalId', label: '...', inputCost: ..., outputCost: ..., context: '...', maxTokens: ... }
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

        return NextResponse.json({ ok: true });
    } catch (err) {
        console.error('[PUT /api/models]', err);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
