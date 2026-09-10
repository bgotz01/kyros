// ─── the seat prompts, as edited ──────────────────────────────────────────────
// The constants in lib/engine/prompts.ts are the BUILT-IN prompt for each seat,
// and they stay the source of truth until something overrides them. An override
// is a row in EnginePrompt, appended, never edited in place.
//
// Version 0 means "the file". That is deliberate: a fresh database, a checkout
// with no rows, and a seat nobody has touched all behave identically, and the
// built-in text is one `git log` away rather than one migration away.
//
// Every seat's version is stamped on the row it produced — `EngineScore.
// promptVersion` for the analyst, `EngineCritique.promptVersion` for the critic.
// The ledger holds frozen predictions, and a prediction is only frozen if the
// instrument behind it can still be identified: `paradigmAsOf` answers "measured
// against what", and this answers "measured how". Without it, two scores taken a
// day apart could be incomparable with nothing on either row saying so.

import fs from 'node:fs';
import path from 'node:path';
import { db } from '@/lib/db';
import { CRITIC_SYSTEM, ENGINE_SYSTEM, EXTERNAL_SYSTEM } from '@/lib/engine/prompts';

/** Every editable document, in two kinds.
 *
 *  SEATS are what a model is: the analyst reads a paper, the critic challenges a
 *  row, the external seat sorts repositories. LAWS are what a law means, and
 *  they are separate files for one reason — a change to I²'s guidance used to be
 *  a change to a single 28,000-character string all three laws shared, so there
 *  was no way to tune one without risking the other two and no way to tell from
 *  a diff which law an edit belonged to.
 *
 *  The laws are permanent and the paradigm is dated; keeping them apart is the
 *  same separation the snapshot already makes. */
export const SEATS = ['analyst', 'critic', 'external'] as const;
export const LAWS = ['inversion', 'incentives', 'inflection'] as const;
export const DOCS = [...SEATS, ...LAWS] as const;

export type Seat = (typeof DOCS)[number];
export type LawDoc = (typeof LAWS)[number];

export function isSeat(v: unknown): v is Seat {
    return typeof v === 'string' && (DOCS as readonly string[]).includes(v);
}

const LAW_DIR = path.join(process.cwd(), 'context', 'kyros');

/** A law's context as it ships. Read from disk rather than compiled in, so the
 *  file is the source of truth and a `git log` still answers what changed. */
function lawFile(id: LawDoc): string {
    try {
        return fs.readFileSync(path.join(LAW_DIR, `${id}.md`), 'utf-8').trim();
    } catch {
        return '';
    }
}

/** The text shipped in the repository, before any edit. */
export const BUILT_IN: Record<Seat, string> = {
    analyst: ENGINE_SYSTEM,
    critic: CRITIC_SYSTEM,
    external: EXTERNAL_SYSTEM,
    get inversion() {
        return lawFile('inversion');
    },
    get incentives() {
        return lawFile('incentives');
    },
    get inflection() {
        return lawFile('inflection');
    },
};

export const SEAT_NOTE: Record<Seat, string> = {
    analyst: 'Reads one paper and returns one row. Selects a force, then scores each law.',
    critic: 'Reads the same paper and the row as it currently stands, and challenges it.',
    external: 'Sorts the repositories a paper names from the ones it merely cites.',
    inversion: 'I¹ · how inverted is it? Sent to the analyst and the critic alike.',
    incentives: 'I² · how obvious is it? The sanity check on I¹.',
    inflection: 'I³ · how unprecedented is it? The game-changer law.',
};

/** The three law contexts, in reading order, as the seats receive them. */
export async function lawContexts(): Promise<string> {
    const rows = await Promise.all(LAWS.map((id) => activePrompt(id)));
    return rows.map((r) => r.text).filter(Boolean).join('\n\n');
}

/** Resolved prompts, cached until something is saved.
 *
 *  `activePrompt` is a database read, and a scoring pass calls it four times per
 *  paper — once for the seat and once for each law page. On a week of ten papers
 *  that is forty round-trips whose answer cannot have changed, ahead of every
 *  model call. The cache is invalidated on save rather than expiring, so an edit
 *  is still live on the very next paper. */
const cache = new Map<Seat, ActivePrompt>();

export function clearPromptCache(): void {
    cache.clear();
}

export interface ActivePrompt {
    seat: Seat;
    /** 0 is the built-in text; anything higher is a stored edit. */
    version: number;
    text: string;
    note: string | null;
    editedAt: string | null;
}

/** The prompt a seat should be sent right now, and the version to stamp on
 *  whatever it produces. Falls back to the file on any read failure — a seat
 *  that cannot reach the database should still score, using known text, rather
 *  than fail closed. */
export async function activePrompt(seat: Seat): Promise<ActivePrompt> {
    const builtIn: ActivePrompt = {
        seat,
        version: 0,
        text: BUILT_IN[seat],
        note: null,
        editedAt: null,
    };
    const hit = cache.get(seat);
    if (hit) return hit;

    try {
        const row = await db.enginePrompt.findFirst({
            where: { seat },
            orderBy: { version: 'desc' },
        });
        const active: ActivePrompt = row
            ? {
                  seat,
                  version: row.version,
                  text: row.text,
                  note: row.note,
                  editedAt: row.createdAt.toISOString(),
              }
            : builtIn;
        cache.set(seat, active);
        return active;
    } catch {
        // Not cached: a failed read is a transient, and caching it would pin the
        // built-in text for the rest of the process.
        return builtIn;
    }
}

/** Append a new version. Returns the row that will be used from now on.
 *
 *  Saving text identical to what is already active is a no-op rather than a new
 *  version — an unchanged edit should not make two runs look incomparable. */
export async function savePrompt(
    seat: Seat,
    text: string,
    note?: string,
): Promise<ActivePrompt> {
    const current = await activePrompt(seat);
    if (text === current.text) return current;

    const row = await db.enginePrompt.create({
        data: { seat, version: current.version + 1, text, note: note?.trim() || null },
    });
    clearPromptCache();
    return {
        seat,
        version: row.version,
        text: row.text,
        note: row.note,
        editedAt: row.createdAt.toISOString(),
    };
}

/** Drop back to the file. Recorded as a new version holding the built-in text,
 *  not by deleting rows — a run stamped with version 3 must still be able to
 *  say what version 3 said. */
export async function revertPrompt(seat: Seat): Promise<ActivePrompt> {
    return savePrompt(seat, BUILT_IN[seat], 'Reverted to the built-in prompt');
}

/** Every stored version of a seat, newest first. For the reader comparing two
 *  runs stamped with different numbers. */
export async function promptHistory(seat: Seat) {
    try {
        const rows = await db.enginePrompt.findMany({
            where: { seat },
            orderBy: { version: 'desc' },
            select: { version: true, note: true, createdAt: true, text: true },
        });
        return rows.map((r) => ({
            version: r.version,
            note: r.note,
            editedAt: r.createdAt.toISOString(),
            chars: r.text.length,
        }));
    } catch {
        return [];
    }
}
