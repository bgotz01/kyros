import {
    LAW_SCALE,
    SCORES,
    DIMENSION_COUNT,
    PARADIGM_DEFINING_SCORE,
    PARADIGM_TIER_RULE,
    SCORE_BANDS,
} from '@/lib/engine/paradigm';
import { CATEGORIES } from '@/lib/engine/prompts';

// ─── GET /api/engine/guide ───────────────────────────────────────────────────
// The instrument, described to a reader: the scoring vocabulary, and only that.
// Read straight out of lib/engine/paradigm.ts — the same tables the route
// enforces and the prompt prints — so the guide cannot drift from the instrument
// the way a hand-written explanation would.
//
// The seat prompts used to be served here too. They moved to
// /api/engine/prompts, which serves the text as EDITED rather than as shipped,
// and the split is the point: a rule is arithmetic the route enforces and
// nothing can change from the interface, a prompt is text handed to a model and
// now can be. Serving both from one endpoint invited that distinction to erode.

export async function GET() {
    // Law-specific names on a shared numeric spine: I¹ and I³ measure paradigm
    // movement, I² measures incentive strength, and the top band should not
    // claim the second is the first.
    const bands = [...SCORE_BANDS].reverse().map((b, i, all) => ({
        min: b.min,
        max: i === all.length - 1 ? 10 : all[i + 1].min - 1,
        tier: b.tier,
        inversion: b.inversion,
        incentives: b.incentives,
        inflection: b.inflection,
    }));

    return Response.json({
        rules: {
            bands,
            tierRule: PARADIGM_TIER_RULE,
            tiers: [
                { range: '0–6', name: 'Within the paradigm', note: 'progress inside how the field already works' },
                { range: '7–8', name: 'Interacts with the paradigm', note: 'questions, tests or exposes a core part of it' },
                { range: '9–10', name: 'Defines the paradigm', note: 'changes, replaces or creates a core part of it' },
            ],
            levels: SCORES.map((score) => ({
                level: score,
                score,
                inversion: LAW_SCALE.inversion[score],
                incentives: LAW_SCALE.incentives[score],
                inflection: LAW_SCALE.inflection[score],
            })),
            categories: CATEGORIES,
            limits: {
                dimensions: DIMENSION_COUNT,
                paradigmDefiningScore: PARADIGM_DEFINING_SCORE,
            },
        },
    });
}
