// ─── engine data ─────────────────────────────────────────────────────────────
// Server-side reads of the paper archive and the year digests. The digests are
// parsed here rather than shared with scripts/lib/digest.mjs because that file
// is plain ESM for the CLI; the shapes are deliberately the same.

import fs from 'fs';
import path from 'path';

const PAPERS = path.join(process.cwd(), 'papers');
const DIGESTS = path.join(PAPERS, 'digests');

export interface PaperRow {
    n: number;
    title: string;
    /** null when the digest links somewhere other than arXiv. */
    id: string | null;
    host: string | null;
    /** true when text has been pulled into the archive. */
    held: boolean;
    /** First arXiv submission date. Older archive entries only carry enough
     *  information for YYYY-MM; newly fetched entries carry YYYY-MM-DD. */
    published: string | null;
    /** The digest's own account of the paper — its lede and bullets. Written by
     *  a third party, so it is shown alongside the analysis, never scored from. */
    digest: { lede: string; points: string[] };
    links: { label: string; url: string }[];
}

export interface WeekRow {
    year: string;
    /** Index within the year, oldest-first. */
    idx: number;
    heading: string;
    papers: PaperRow[];
    heldCount: number;
    arxivCount: number;
}

/** One digest row: `| N) **Title** - lede <br>● point <br>● point | [Paper](url), … |`
 *  Split on the pipes rather than matched in one expression — neither the
 *  prose nor a URL can contain one, and the two columns want different
 *  treatment. */
function parseRows(section: string): Omit<PaperRow, 'held' | 'published'>[] {
    const out: Omit<PaperRow, 'held' | 'published'>[] = [];

    for (const line of section.split('\n')) {
        const m = line.match(/^\|\s*(\d+)\)\s*\*\*(.+?)\*\*([\s\S]*)$/);
        if (!m) continue;
        const [, n, title, rest] = m;

        const cells = rest.split('|');
        const bodyCell = cells[0] ?? '';
        const linkCell = cells.slice(1).join('|');

        // The lede runs to the first bullet; `●` separates the rest.
        const parts = bodyCell.split(/<br\s*\/?>\s*●|●/).map((x) => clean(x)).filter(Boolean);

        out.push({
            n: Number(n),
            title: title.trim(),
            id: linkCell.match(/arxiv\.org\/(?:abs|pdf)\/(\d{4}\.\d{4,5})/i)?.[1] ?? null,
            host: linkCell.match(/\[Paper\]\(https?:\/\/([^/)]+)/i)?.[1] ?? null,
            digest: { lede: parts[0] ?? '', points: parts.slice(1) },
            links: [...linkCell.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map((l) => ({
                label: l[1],
                url: l[2],
            })),
        });
    }
    return out;
}

/** Digest prose carries stray markup and leading dashes from the table. */
function clean(text: string): string {
    return text
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/^\s*[-–—]\s*/, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** 2412.09764 → 2024. The arXiv id prefix is YYMM. */
export function yearOf(bare: string): number {
    return 2000 + Number(bare.slice(0, 2));
}

function archiveDir(bare: string): string {
    return path.join(PAPERS, 'archive', String(yearOf(bare)));
}

/** The archive filename for an id, which may carry a version suffix the digest
 *  does not. Returns null when the text has not been pulled. */
export function archiveFile(bare: string): string | null {
    const dir = archiveDir(bare);
    if (!fs.existsSync(dir)) return null;
    const match = fs.readdirSync(dir).find((f) => f.endsWith('.md') && f.startsWith(bare));
    return match ? path.join(dir, match) : null;
}

/** The arXiv id always gives an honest month, even for archive files fetched
 *  before we began storing the exact v1 date. Never substitute the fetch date:
 *  that would move the hindsight cutoff to the day Kyros happened to ingest it. */
function publicationMonth(bare: string): string | null {
    const m = /^(\d{2})(\d{2})\./.exec(bare);
    if (!m) return null;
    const month = Number(m[2]);
    if (month < 1 || month > 12) return null;
    return `20${m[1]}-${m[2]}`;
}

function publicationFromRaw(bare: string, raw: string): string | null {
    return raw.match(/^<!-- published:\s*(\d{4}-\d{2}-\d{2})\s*-->$/mi)?.[1]
        ?? publicationMonth(bare);
}

/** Publication metadata for the card without reading or exposing paper text. */
export function publicationDate(bare: string): string | null {
    const file = archiveFile(bare);
    if (!file) return publicationMonth(bare);
    try {
        // Metadata is in the first three comment lines. A bounded read avoids
        // loading hundreds of full papers merely to render the week index.
        const fd = fs.openSync(file, 'r');
        try {
            const buffer = Buffer.alloc(512);
            const bytes = fs.readSync(fd, buffer, 0, buffer.length, 0);
            return publicationFromRaw(bare, buffer.toString('utf-8', 0, bytes));
        } finally {
            fs.closeSync(fd);
        }
    } catch {
        return publicationMonth(bare);
    }
}

export function readPaper(bare: string): { text: string; published?: string } | null {
    const file = archiveFile(bare);
    if (!file) return null;
    const raw = fs.readFileSync(file, 'utf-8');
    return {
        text: raw.replace(/^<!--[\s\S]*?-->\s*/gm, '').trim(),
        published: publicationFromRaw(bare, raw) ?? undefined,
    };
}

/** Every week across every digest, oldest-first. Digest files run newest-first,
 *  so the in-file order is reversed rather than date-parsed — the week that
 *  straddles New Year cannot be sorted from its heading. */
export function allWeeks(): WeekRow[] {
    if (!fs.existsSync(DIGESTS)) return [];
    const years = fs
        .readdirSync(DIGESTS)
        .map((f) => f.match(/^(\d{4})\.md$/)?.[1])
        .filter((y): y is string => Boolean(y))
        .sort();

    const out: WeekRow[] = [];
    for (const year of years) {
        const text = fs.readFileSync(path.join(DIGESTS, `${year}.md`), 'utf-8');
        const heads = [...text.matchAll(/^## (Top AI Papers of the Week.*)$/gm)];
        const weeks = heads
            .map((h, i) => {
                const end = i + 1 < heads.length ? heads[i + 1].index! : text.length;
                return { heading: h[1], rows: parseRows(text.slice(h.index!, end)) };
            })
            .reverse();

        weeks.forEach((w, idx) => {
            const papers: PaperRow[] = w.rows.map((r) => ({
                ...r,
                held: r.id ? archiveFile(r.id) !== null : false,
                published: r.id ? publicationDate(r.id) : null,
            }));
            out.push({
                year,
                idx,
                heading: w.heading.replace('Top AI Papers of the Week ', '').trim(),
                papers,
                arxivCount: papers.filter((p) => p.id).length,
                heldCount: papers.filter((p) => p.held).length,
            });
        });
    }
    return out;
}
