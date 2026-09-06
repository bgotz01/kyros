// ─── page context registry ───────────────────────────────────────────────────
// Every reference the council can attach as context. Content lives as markdown
// under context/ at the project root — never inline in this file.
//
// To add a reference: drop a .md file into any registered folder. The folder
// is scanned at request time, so a new file becomes attachable without touching
// any code. To add a new domain: create its directories, then register them in
// the CORPUS table below.
//
// This module reads the filesystem and must only ever be imported from server
// code. `content` is deliberately absent from what /api/context returns — the
// client receives metadata and sends back ids.

import fs from 'fs';
import path from 'path';
import { loadParadigm, renderParadigm } from './paradigm';

const CONTEXT_ROOT = path.join(process.cwd(), 'context');

export interface PageRef {
    /** Stable key sent by the client. Derived from the file's path under context/. */
    id: string;
    label: string;
    /** Top-level grouping shown in the modal. */
    group: string;
    /** Badge beside the group header — 'Method', 'Case', etc. */
    tag?: string;
    /** The text injected into the system prompt. */
    content: string;
}

/** Metadata only — the shape the client is allowed to see. */
export type PageRefMeta = Omit<PageRef, 'content'>;

function readMd(relativePath: string): string {
    try {
        return fs.readFileSync(path.join(CONTEXT_ROOT, relativePath), 'utf-8').trim();
    } catch {
        return `[Content unavailable: ${relativePath}]`;
    }
}

/** "attention-is-all-you-need" → "Attention Is All You Need". Short joining
 *  words stay lowercase so titles read as titles rather than as headlines. */
const MINOR_WORDS = new Set(['and', 'the', 'of', 'for', 'in', 'a', 'an', 'to', 'vs']);

function titleFromStem(stem: string): string {
    return stem
        .split('-')
        .map((word, i) =>
            i > 0 && MINOR_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join(' ');
}

/**
 * The document's own H1, which is the only place the correct casing of names
 * like AlexNet, ChatGPT or word2vec survives — a filename cannot carry it.
 * Falls back to the filename for a document that opens without one.
 */
function labelFor(content: string, stem: string): string {
    const heading = content.match(/^#\s+(.+)$/m)?.[1].trim();
    return heading || titleFromStem(stem);
}

/**
 * One PageRef per .json paradigm snapshot directly inside `relativeDir`.
 * The label is the `asOf` date from the file; content is rendered via
 * `renderParadigm` so the council sees the same structured text the engine uses.
 */
function refsFromParadigmFolder(relativeDir: string, group: string): PageRef[] {
    let files: string[];
    try {
        files = fs
            .readdirSync(path.join(CONTEXT_ROOT, relativeDir))
            .filter((f) => f.endsWith('.json'))
            .sort()
            .reverse(); // most recent first
    } catch {
        return [];
    }
    return files.flatMap((file) => {
        try {
            const raw = fs.readFileSync(path.join(CONTEXT_ROOT, relativeDir, file), 'utf-8');
            const snapshot = JSON.parse(raw);
            const rendered = renderParadigm(snapshot);
            if (!rendered) return [];
            const stem = file.replace(/\.json$/, '');
            return [{
                id: `${relativeDir}/${stem}`,
                label: `Paradigm Snapshot · ${snapshot.asOf ?? stem}`,
                group,
                tag: 'Paradigm',
                content: rendered,
            }];
        } catch {
            return [];
        }
    });
}

/**
 * One PageRef per .md file directly inside `relativeDir` (relative to context/).
 * Subdirectories are ignored — nest by registering the child folder separately.
 */
function refsFromFolder(
    relativeDir: string,
    group: string,
    opts: { tag?: string } = {},
): PageRef[] {
    let files: string[];
    try {
        files = fs.readdirSync(path.join(CONTEXT_ROOT, relativeDir)).filter((f) => f.endsWith('.md'));
    } catch {
        return []; // folder not created yet — an empty group beats a crashed page
    }
    return files
        .map((file) => {
            const stem = file.replace(/\.md$/, '');
            const content = readMd(`${relativeDir}/${file}`);
            return {
                id: `${relativeDir}/${stem}`,
                label: labelFor(content, stem),
                group,
                tag: opts.tag,
                content,
            };
        })
        .sort((a, b) => a.label.localeCompare(b.label));
}

// ─── corpus registry ─────────────────────────────────────────────────────────
// The corpus is discovered automatically from the filesystem. Drop a .md file
// into any subfolder under context/ and it appears in the modal without
// touching this file. Add a new domain by creating its directory — no code
// changes needed.
//
// Certain subfolder names carry a fixed tag badge. Everything else gets no tag.
// The `paradigm` folder is excluded because it holds dated JSON snapshots that
// are injected via buildSeatContext, not as attachable references.

/** Slugs that should never appear as attachable reference groups. */
const EXCLUDED_DIRS = new Set<string>();

/** Well-known subfolder name → badge tag. */
const FOLDER_TAGS: Record<string, string> = {
    method: 'I³',
    canon: 'Resolved',
    'false-positives': 'Resolved',
    bottlenecks: 'Open',
    candidates: 'Scored',
    regimes: 'Open',
    frameworks: 'Method',
    open: 'Open',
};

/** Converts a domain slug such as "ai" or "geopolitics" into a display name. */
function domainLabel(slug: string): string {
    return slug.charAt(0).toUpperCase() + slug.slice(1);
}

/** Scans context/ at request time and returns every folder spec. New domains
 *  and subfolders are picked up without a restart. */
function discoverCorpus(): { dir: string; group: string; tag?: string }[] {
    let domains: string[];
    try {
        domains = fs
            .readdirSync(CONTEXT_ROOT, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
            .sort();
    } catch {
        return [];
    }

    const specs: { dir: string; group: string; tag?: string }[] = [];

    for (const domain of domains) {
        const domainPath = path.join(CONTEXT_ROOT, domain);
        let subfolders: string[];
        try {
            subfolders = fs
                .readdirSync(domainPath, { withFileTypes: true })
                .filter((d) => d.isDirectory() && !EXCLUDED_DIRS.has(d.name))
                .map((d) => d.name)
                .sort();
        } catch {
            continue;
        }

        for (const sub of subfolders) {
            specs.push({
                dir: `${domain}/${sub}`,
                group: `${domainLabel(domain)} · ${titleFromStem(sub)}`,
                tag: FOLDER_TAGS[sub],
            });
        }
    }

    return specs;
}

/** Read fresh on every call so a newly added .md file or folder is picked up
 *  without a restart. The corpus is small and the reads are cheap. */
export function pageRefs(): PageRef[] {
    return discoverCorpus().flatMap(({ dir, group, tag }) => {
        // Paradigm folders hold .json snapshots, not markdown.
        if (dir.endsWith('/paradigm')) return refsFromParadigmFolder(dir, group);
        return refsFromFolder(dir, group, { tag });
    });
}

export function pageRefsMeta(): PageRefMeta[] {
    return pageRefs().map(({ id, label, group, tag }) => ({ id, label, group, tag }));
}

/** Wraps the attached references as a labelled system-prompt block. */
export function buildContextBlock(refs: PageRef[]): string {
    if (refs.length === 0) return '';
    const list = refs.map((r) => `"${r.label}"`).join(', ');
    return [
        '─── ATTACHED REFERENCES ────────────────────────────────────────────────────',
        `The analyst has attached ${refs.length === 1 ? 'this reference' : 'these references'} as context for this conversation: ${list}.`,
        '',
        'These are Kyros\'s own working notes — resolved cases, method and open bottlenecks.',
        'Reason with them. Cite them by name when they bear on the question, and say so',
        'plainly when a case in the corpus contradicts the reading you were about to give.',
        'They are calibration, not scripture: a candidate that fits no case in the corpus',
        'is not thereby noise. If asked what context you hold, name these references exactly.',
        '',
        ...refs.map((r) => `### ${r.label}\n\n${r.content}`),
        '─── END OF ATTACHED REFERENCES ─────────────────────────────────────────────',
    ].join('\n');
}

/** Resolves ids sent by the client, ignoring any it no longer recognises. */
export function refsByIds(ids: string[]): PageRef[] {
    const wanted = new Set(ids);
    return pageRefs().filter((r) => wanted.has(r.id));
}

// ─── standing frame ──────────────────────────────────────────────────────────
// The frame defines the three laws and the prevailing paradigm they are scored
// against. A council that has not read it is scoring "is it the opposite?"
// against nothing, so the frame is not attachable and not listed in CORPUS —
// it is injected on every call, ahead of anything the analyst attached, and
// cannot be switched off from the UI.

const FRAME_FILE = 'ai/frame.md';

/** The standing frame as a system-prompt block. Empty string if the file is
 *  missing, so a lost frame degrades to the old behaviour rather than a crash. */
export function buildFrameBlock(): string {
    const content = readMd(FRAME_FILE);
    if (content.startsWith('[Content unavailable')) return '';
    return [
        '─── STANDING FRAME ─────────────────────────────────────────────────────────',
        'This is the instrument, not evidence. The three laws define what you are',
        'measuring; the prevailing-paradigm section defines what a candidate is',
        'measured against. Score against these definitions and no others.',
        '',
        content,
        '─── END OF STANDING FRAME ──────────────────────────────────────────────────',
    ].join('\n');
}

/** The engine receives a dated snapshot of its own, so injecting the rolling
 *  §2 beside it would give the model two incompatible baselines. Keep the laws
 *  here and let the snapshot below be the sole answer to "what was normal?". */
function buildScoringLawsBlock(): string {
    const content = readMd(FRAME_FILE);
    if (content.startsWith('[Content unavailable')) return '';
    const paradigm = content.indexOf('# 2 — The prevailing paradigm');
    const laws = paradigm === -1 ? content : content.slice(0, paradigm).trim();
    return [
        '─── I³ SCORING LAWS ─────────────────────────────────────────────────────────',
        'These are the definitions only. The dated snapshot that follows is the sole',
        'paradigm baseline for this paper; do not import the current paradigm.',
        '',
        laws,
        '─── END OF I³ SCORING LAWS ─────────────────────────────────────────────────',
    ].join('\n');
}

// ─── bottleneck index ────────────────────────────────────────────────────────
// Rolling name and status only, retained for present-day/council surfaces.
// Historical engine seats use the dated list inside their snapshot instead.

export interface BottleneckMeta {
    slug: string;
    label: string;
    status: string;
}

export function bottleneckIndex(): BottleneckMeta[] {
    return refsFromFolder('ai/bottlenecks', 'AI · Bottlenecks').map((r) => ({
        slug: r.id.replace('ai/bottlenecks/', ''),
        label: r.label,
        // Each file opens with a bolded status line; a file without one is still
        // listed, just without the qualifier.
        status: r.content.match(/\*\*Status:\s*([\s\S]*?)\*\*/)?.[1].replace(/\s+/g, ' ').trim() ?? 'unstated',
    }));
}

/** The constraint surface as a compact prompt block. */
export function buildBottleneckBlock(): string {
    const rows = bottleneckIndex();
    if (rows.length === 0) return '';
    return [
        '─── THE CONSTRAINT SURFACE ─────────────────────────────────────────────────',
        'Name one of these in the incentives line, or say None. A paper that relieves',
        'none of them is almost certainly noise, however elegant.',
        '',
        ...rows.map((b) => `— ${b.label} — ${b.status}`),
        '─── END ────────────────────────────────────────────────────────────────────',
    ].join('\n');
}

/** The frame's own `Last reviewed` date. Stamped on every run so a score can be
 *  told apart from one made against a different prevailing-paradigm list. */
export function frameReviewedAt(): string | null {
    return readMd(FRAME_FILE).match(/Last reviewed:\s*([\d-]+)/)?.[1] ?? null;
}

// ─── the seat context ────────────────────────────────────────────────────────

/** Everything both engine seats read before they are given a job.
 *
 *  The analyst scores a paper and the critic checks that score; they must argue
 *  from the same definitions, the same constraint surface and the same dated
 *  paradigm, or the disagreement measures the gap between their briefings
 *  rather than anything about the paper. Assembled here once so the two cannot
 *  drift apart — they did once, when the paradigm reached the analyst alone and
 *  left the critic judging I¹ from its own memory of what the field believed.
 *
 *  `when` is the paper's own date, so the paradigm is the one standing when it
 *  was published rather than the newest on file. */
export function buildSeatContext(when: string): string {
    const paradigm = loadParadigm(when);
    // Bottlenecks live inside the dated snapshot. Appending the rolling index
    // here would recreate the hindsight bug that snapshots exist to prevent.
    return [buildScoringLawsBlock(), paradigm ? renderParadigm(paradigm) : '']
        .filter(Boolean)
        .join('\n\n');
}

/** How much of a paper either seat reads. Shared so a critic can never be
 *  challenging a score made on more text than it saw. */
export const MAX_PAPER_CHARS = 60_000;
