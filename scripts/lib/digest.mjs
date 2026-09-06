// ─── digest parsing ──────────────────────────────────────────────────────────
// The year digests are third-party weekly compilations: a markdown table per
// week, one row per paper. Shared by `week` and `week:fetch`.

import fs from 'node:fs';
import path from 'node:path';

export const DIGESTS = path.join(process.cwd(), 'papers', 'digests');

/** Every week in a digest year, ordered oldest-first. Digest files run
 *  newest-first, so the in-file order is reversed rather than date-parsed —
 *  the "December 30 - January 5" week straddles a year boundary and its
 *  heading date cannot be trusted to sort. */
export function weeksIn(year) {
    const file = path.join(DIGESTS, `${year}.md`);
    if (!fs.existsSync(file)) return [];
    const text = fs.readFileSync(file, 'utf-8');
    const heads = [...text.matchAll(/^## (Top AI Papers of the Week.*)$/gm)];
    return heads
        .map((h, i) => {
            const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
            return { year: String(year), heading: h[1], rows: parseRows(text.slice(h.index, end)) };
        })
        .reverse();
}

/** Digest years present, ascending. */
export function digestYears() {
    if (!fs.existsSync(DIGESTS)) return [];
    return fs
        .readdirSync(DIGESTS)
        .map((f) => f.match(/^(\d{4})\.md$/)?.[1])
        .filter(Boolean)
        .sort();
}

/** Resolves `[year] [pick]` from argv into a week. `pick` is an index (0 is the
 *  most recent, since digests run newest-first) or a substring of the heading. */
export function pickWeek(argv) {
    const args = [...argv];
    const year = /^\d{4}$/.test(args[0]) ? args.shift() : String(new Date().getFullYear());
    const pick = args[0] ?? '0';

    const file = path.join(DIGESTS, `${year}.md`);
    if (!fs.existsSync(file)) {
        const have = fs.existsSync(DIGESTS) ? fs.readdirSync(DIGESTS).filter((f) => f.endsWith('.md')) : [];
        throw new Error(`No digest for ${year}. Have: ${have.join(', ') || 'none'}`);
    }

    const text = fs.readFileSync(file, 'utf-8');
    const heads = [...text.matchAll(/^## (Top AI Papers of the Week.*)$/gm)];
    if (heads.length === 0) throw new Error(`No week headings in ${year}.md.`);

    const idx = /^\d+$/.test(pick)
        ? Number(pick)
        : heads.findIndex((h) => h[1].toLowerCase().includes(pick.toLowerCase()));
    if (idx < 0 || idx >= heads.length) {
        throw new Error(`No week matching "${pick}". ${heads.length} weeks in ${year}.md.`);
    }

    const start = heads[idx].index;
    const end = idx + 1 < heads.length ? heads[idx + 1].index : text.length;
    const section = text.slice(start, end);

    return { year, heading: heads[idx][1], weeks: heads.length, rows: parseRows(section) };
}

/** One row per paper in a week's table. */
function parseRows(section) {
    return [...section.matchAll(/^\|\s*(\d+)\)\s*\*\*(.+?)\*\*([\s\S]*?)\|\s*$/gm)].map(
        ([, n, title, body]) => ({
            n: Number(n),
            title: title.trim(),
            id: body.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/i)?.[1] ?? null,
            host: body.match(/\[Paper\]\(https?:\/\/([^/)]+)/i)?.[1] ?? null,
            // The row's own links. A paper's repository is sometimes named here
            // and nowhere in the text, so the sweep reads both.
            body,
        }),
    );
}
