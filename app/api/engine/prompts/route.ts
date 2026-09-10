import {
    activePrompt,
    isSeat,
    promptHistory,
    revertPrompt,
    savePrompt,
    DOCS,
    LAWS,
    SEAT_NOTE,
    BUILT_IN,
} from '@/lib/engine/promptStore';

// ─── GET/POST /api/engine/prompts ────────────────────────────────────────────
// The seat prompts, as they will actually be sent, plus every stored version.
//
// Separate from /api/engine/guide, which serves the SCORING RULES — those are
// read straight out of lib/engine/paradigm.ts and cannot be edited from
// anywhere, because they are enforced by the route rather than sent to a model.
// A prompt is text handed to a seat; a rule is arithmetic. Only one of the two
// is safe to make editable, and keeping them on separate endpoints is what
// stops that distinction eroding.

export async function GET() {
    const rows = await Promise.all(
        DOCS.map(async (seat) => {
            const active = await activePrompt(seat);
            return {
                id: seat,
                name: seat[0].toUpperCase() + seat.slice(1),
                /** 'law' pages are what a law MEANS and are sent to every seat;
                 *  'seat' prompts are what a given model is asked to do. */
                kind: (LAWS as readonly string[]).includes(seat) ? 'law' : 'seat',
                note: SEAT_NOTE[seat],
                text: active.text,
                version: active.version,
                editedAt: active.editedAt,
                editNote: active.note,
                /** Whether the active text differs from what ships in the repo. */
                edited: active.text !== BUILT_IN[seat],
                builtInChars: BUILT_IN[seat].length,
                history: await promptHistory(seat),
            };
        }),
    );
    return Response.json({ prompts: rows });
}

export async function POST(req: Request) {
    try {
        const { seat, text, note, revert } = (await req.json()) as {
            seat?: unknown;
            text?: unknown;
            note?: unknown;
            revert?: unknown;
        };

        if (!isSeat(seat)) {
            return Response.json({ error: 'unknown seat' }, { status: 400 });
        }
        if (revert === true) {
            return Response.json(await revertPrompt(seat));
        }
        // An empty prompt is not an edit, it is a seat with no instructions —
        // and it would score, silently and badly, on every paper after it.
        if (typeof text !== 'string' || text.trim().length < 200) {
            return Response.json(
                { error: 'a prompt must be at least 200 characters' },
                { status: 400 },
            );
        }
        return Response.json(
            await savePrompt(seat, text, typeof note === 'string' ? note : undefined),
        );
    } catch (err) {
        console.error('[api/engine/prompts]', err);
        return Response.json({ error: 'could not save the prompt' }, { status: 500 });
    }
}
