import fs from 'fs';
import path from 'path';

const DATA_FILE = path.join(process.cwd(), 'lib', 'i3Data.ts');

/** Read the source file once per request — cheap and always fresh. */
function readSource(): string {
    return fs.readFileSync(DATA_FILE, 'utf-8');
}

/** Find the i3 block for a given entry id and return the current scores.
 *
 *  Matches a block like:
 *    id: 'some-id',
 *    ...
 *    i3: { inversion: 9, incentives: 10, inflection: 8 },
 *
 *  The regex is intentionally simple: it finds the id string then the next
 *  i3: { ... } on any following line (before the next entry's closing brace).
 */
function parseScores(source: string, id: string): { inversion: number; incentives: number; inflection: number } | null {
    // Escape special regex chars in the id
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(
        `id:\\s*'${escapedId}'[\\s\\S]*?i3:\\s*\\{\\s*inversion:\\s*(\\d+),\\s*incentives:\\s*(\\d+),\\s*inflection:\\s*(\\d+)`,
    );
    const m = re.exec(source);
    if (!m) return null;
    return {
        inversion: parseInt(m[1], 10),
        incentives: parseInt(m[2], 10),
        inflection: parseInt(m[3], 10),
    };
}

/** Patch the i3 block for `id` in the source string and return the new source. */
function patchScores(
    source: string,
    id: string,
    scores: { inversion: number; incentives: number; inflection: number },
): string | null {
    const escapedId = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    // Capture the full i3: { ... } literal for this entry so we can replace it
    const re = new RegExp(
        `(id:\\s*'${escapedId}'[\\s\\S]*?)(i3:\\s*\\{\\s*inversion:\\s*\\d+,\\s*incentives:\\s*\\d+,\\s*inflection:\\s*\\d+\\s*\\})`,
    );
    if (!re.test(source)) return null;
    return source.replace(
        re,
        (_, prefix) =>
            `${prefix}i3: { inversion: ${scores.inversion}, incentives: ${scores.incentives}, inflection: ${scores.inflection} }`,
    );
}

// ─── GET /api/i3-scores/[id] ─────────────────────────────────────────────────

export async function GET(
    _req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const source = readSource();
    const scores = parseScores(source, id);
    if (!scores) return Response.json({ error: 'Entry not found' }, { status: 404 });
    return Response.json(scores);
}

// ─── PUT /api/i3-scores/[id] ─────────────────────────────────────────────────
// Body: { inversion: number, incentives: number, inflection: number }

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> },
) {
    const { id } = await params;
    const body = await req.json() as { inversion?: unknown; incentives?: unknown; inflection?: unknown };

    const inversion  = Number(body.inversion);
    const incentives = Number(body.incentives);
    const inflection = Number(body.inflection);

    if (
        !Number.isInteger(inversion)  || inversion  < 0 || inversion  > 10 ||
        !Number.isInteger(incentives) || incentives < 0 || incentives > 10 ||
        !Number.isInteger(inflection) || inflection < 0 || inflection > 10
    ) {
        return Response.json({ error: 'Each score must be an integer 0–10' }, { status: 400 });
    }

    const source = readSource();
    const patched = patchScores(source, id, { inversion, incentives, inflection });
    if (!patched) return Response.json({ error: 'Entry not found' }, { status: 404 });

    fs.writeFileSync(DATA_FILE, patched, 'utf-8');
    return Response.json({ ok: true, inversion, incentives, inflection });
}
