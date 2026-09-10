// ─── Phase 3 · the backtest ──────────────────────────────────────────────────
// Scores a sample of the 2024 archive against the rewritten December 2023
// snapshot, through `buildScore` — exactly the code the engine runs, so the
// harness cannot pass a ladder the engine would fail.
//
// It writes nothing to the database. A backtest is an instrument check, not a
// reading, and the ledger holds frozen predictions; filling it with rows scored
// to answer a question about the rubric would destroy that.
//
//   npx tsx --env-file=.env.local scripts/backtest.ts --n 40 --model deepseek/deepseek-v4-flash
//
// Output: a JSON transcript and a printed report, both under backtest/.

import fs from 'node:fs';
import path from 'node:path';
import { buildScore, extractJson, type EngineScore } from '../lib/engine/scoring';
import {
    byRank,
    paperPeriod,
    PARADIGM_DEFINING_SCORE,
    scoreBand,
    type Paradigm,
} from '../lib/engine/paradigm';
import { loadParadigm } from '../lib/engine/paradigmStore';
import { buildSeatContext, MAX_PAPER_CHARS } from '../lib/pageContext';
import { buildPaperPrompt } from '../lib/engine/prompts';
import { activePrompt, lawContexts } from '../lib/engine/promptStore';
import { readPaper } from '../lib/engine/data';
import { openrouter } from '../lib/openrouter';
import { MODELS } from '../lib/models';

// ─── arguments ───────────────────────────────────────────────────────────────

function arg(name: string, fallback: string): string {
    const i = process.argv.indexOf(`--${name}`);
    return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const N = Number(arg('n', '40'));
/** An explicit comma-separated id list, for checking a specific week rather than
 *  the spread sample — the case that prompted a rubric change is usually a named
 *  set of papers, and re-deriving it out of an evenly-spaced sample is luck. */
const IDS = arg('ids', '');
const MODEL = arg('model', 'deepseek/deepseek-v4-flash');
const CONCURRENCY = Number(arg('concurrency', '4'));
const OUT = path.join(process.cwd(), 'backtest');

// ─── the sample ──────────────────────────────────────────────────────────────
// Evenly spaced across the year rather than the first N, which would be January
// alone and would test the snapshot at its freshest — the easiest month.

function sample(n: number): string[] {
    const dir = path.join(process.cwd(), 'papers', 'archive', '2024');
    const all = fs
        .readdirSync(dir)
        .filter((f) => f.endsWith('.md'))
        .map((f) => f.replace(/\.md$/, ''))
        .sort();
    if (n >= all.length) return all;
    const step = all.length / n;
    return Array.from({ length: n }, (_, i) => all[Math.floor(i * step)]);
}

/** The archive keeps the title in the file's own first heading; `readPaper`
 *  returns only text and date. Falls back to the id, which is what the engine
 *  does when a digest row carries no title either. */
function titleOf(id: string, text: string): string {
    return text.match(/^#\s+(.+)$/m)?.[1].trim() ?? id;
}

// ─── one paper ───────────────────────────────────────────────────────────────

interface Row {
    id: string;
    ok: boolean;
    error?: string;
    score?: EngineScore;
    /** The model's own JSON, kept so a rejected id can be read back. Without it
     *  a selection failure is indistinguishable from a deliberate null. */
    raw?: unknown;
}

async function scoreOne(id: string, paradigm: Paradigm): Promise<Row> {
    const paper = readPaper(id);
    if (!paper) return { id, ok: false, error: 'no text in archive' };

    const truncated = paper.text.length > MAX_PAPER_CHARS;
    const text = truncated ? paper.text.slice(0, MAX_PAPER_CHARS) : paper.text;
    const title = titleOf(id, paper.text);
    const meta = MODELS.find((m) => m.id === MODEL);

    const completion = await openrouter().chat.completions.create({
        model: MODEL,
        messages: [
            {
                role: 'system',
                content: [
                    buildSeatContext(paperPeriod(id, paper.published)),
                    '─── KYROS · THE THREE LAWS ─────────────────────────────────────────────────────',
                    await lawContexts(),
                    (await activePrompt('analyst')).text,
                ]
                    .filter(Boolean)
                    .join('\n\n'),
            },
            {
                role: 'user',
                content: buildPaperPrompt({
                    id,
                    title,
                    published: paper.published,
                    text,
                }),
            },
        ],
        max_tokens: Math.max(meta?.maxTokens ?? 4000, 16_000),
        temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? '';
    const parsed = extractJson(raw);
    if (!parsed) {
        return { id, ok: false, error: `unusable JSON (${completion.choices[0]?.finish_reason})` };
    }

    const usage = completion.usage as
        | { cost?: number; prompt_tokens?: number; completion_tokens?: number }
        | undefined;

    return {
        id,
        ok: true,
        raw: parsed,
        score: buildScore(parsed, paradigm, {
            id,
            title,
            model: MODEL,
            cost: usage?.cost ?? 0,
            promptTokens: usage?.prompt_tokens ?? 0,
            completionTokens: usage?.completion_tokens ?? 0,
            truncated,
        }),
    };
}

// ─── the report ──────────────────────────────────────────────────────────────
// The Phase 4 gate is read off these numbers, so each one answers a stated
// question rather than being a statistic for its own sake.

function histogram(values: number[], max: number): string {
    const counts = Array.from({ length: max + 1 }, () => 0);
    for (const v of values) counts[v] += 1;
    const peak = Math.max(...counts, 1);
    return counts
        .map((c, i) => {
            const bar = '█'.repeat(Math.round((c / peak) * 28));
            return `    ${String(i).padStart(2)} │ ${bar.padEnd(28)} ${c}`;
        })
        .join('\n');
}

function spearman(a: number[], b: number[]): number {
    const rank = (xs: number[]) => {
        const order = xs.map((v, i) => [v, i] as const).sort((p, q) => p[0] - q[0]);
        const r = new Array(xs.length).fill(0);
        order.forEach(([, i], k) => { r[i] = k; });
        return r;
    };
    const ra = rank(a);
    const rb = rank(b);
    const n = a.length;
    if (n < 3) return 0;
    const mean = (xs: number[]) => xs.reduce((s, x) => s + x, 0) / xs.length;
    const ma = mean(ra);
    const mb = mean(rb);
    let num = 0;
    let da = 0;
    let dbb = 0;
    for (let i = 0; i < n; i += 1) {
        num += (ra[i] - ma) * (rb[i] - mb);
        da += (ra[i] - ma) ** 2;
        dbb += (rb[i] - mb) ** 2;
    }
    return da && dbb ? num / Math.sqrt(da * dbb) : 0;
}

function report(rows: Row[], paradigm: Paradigm): string {
    const ok = rows.filter((r) => r.ok && r.score).map((r) => r.score!);
    const failed = rows.filter((r) => !r.ok);
    const out: string[] = [];
    const p = (s = '') => out.push(s);

    const i1 = ok.map((s) => s.inversion.score);
    const i2 = ok.map((s) => s.incentives.score);
    const i3 = ok.map((s) => s.inflection.score);
    const prod = ok.map((s) => s.product);

    p('═══ KYROS BACKTEST · 2024 papers against the rewritten 2023-12 snapshot ═══');
    p();
    p(`Model          ${MODEL}`);
    p(`Snapshot       ${paradigm.asOf} · ${paradigm.mode}`);
    p(`Scored         ${ok.length} of ${rows.length}${failed.length ? ` · ${failed.length} failed` : ''}`);
    p(`Cost           $${ok.reduce((s, r) => s + r.cost, 0).toFixed(3)}`);
    p();

    // ── 1. Does the instrument still spread? ─────────────────────────────────
    p('─── SCORE DISTRIBUTION ─────────────────────────────────────────────────────');
    p('A ledger where everything scores alike is a broken instrument, in either');
    p('direction. The frame expects most papers at 1-3 on I¹ and 2-4 on I³.');
    p();
    for (const [law, values] of [['I¹', i1], ['I²', i2], ['I³', i3]] as const) {
        const mean = values.reduce((s, v) => s + v, 0) / (values.length || 1);
        const sd = Math.sqrt(
            values.reduce((s, v) => s + (v - mean) ** 2, 0) / (values.length || 1),
        );
        const distinct = new Set(values).size;
        p(`  ${law}  mean ${mean.toFixed(2)} · sd ${sd.toFixed(2)} · ${distinct} distinct values`);
        p(histogram(values, 10));
        p();
    }

    // ── 2. Are the three laws measuring different things? ────────────────────
    p('─── INDEPENDENCE ───────────────────────────────────────────────────────────');
    p('The multiplication only means something if the laws disagree. Rank');
    p('correlation near 1 means one judgement was made and copied across.');
    p();
    p(`  I¹ ↔ I²   ρ ${spearman(i1, i2).toFixed(2)}`);
    p(`  I¹ ↔ I³   ρ ${spearman(i1, i3).toFixed(2)}`);
    p(`  I² ↔ I³   ρ ${spearman(i2, i3).toFixed(2)}`);
    const flat = ok.filter(
        (s) => s.inversion.score === s.incentives.score && s.incentives.score === s.inflection.score,
    );
    p();
    p(`  All three scores identical: ${flat.length} of ${ok.length} (${Math.round((flat.length / (ok.length || 1)) * 100)}%)`);
    p();

    // ── 3. Is the model actually selecting from the snapshot? ────────────────
    p('─── SELECTION ──────────────────────────────────────────────────────────────');
    p('The redesign replaced free-text matching with an id chosen from a printed');
    p('list. The old matcher failed on 106 of 107 rows across 2024 and nobody');
    p('could see it. These are the numbers that must not look like that.');
    p();
    const sel = (n: number) => `${n}/${ok.length} (${Math.round((n / (ok.length || 1)) * 100)}%)`;
    p(`  Baseline claim resolved   ${sel(ok.filter((s) => s.inversion.dimensionId).length)}`);
    p(`  Pressure resolved         ${sel(ok.filter((s) => s.incentives.dimensionId).length)}`);
    p(`  Precedent resolved        ${sel(ok.filter((s) => s.inflection.dimensionId).length)}`);
    p();

    // A miss and an honest null are different findings. The retired matcher
    // could not tell them apart, which is how it hid a 99% failure rate.
    const misses = new Map<string, number>();
    for (const s of ok) {
        for (const [law, u] of [
            ['I¹', s.inversion.unresolvedId],
            ['I²', s.incentives.unresolvedId],
            ['I³', s.inflection.unresolvedId],
        ] as const) {
            if (u) misses.set(`${law} ${u}`, (misses.get(`${law} ${u}`) ?? 0) + 1);
        }
    }
    if (misses.size) {
        p('  IDS ASKED FOR THAT DO NOT EXIST IN THE SNAPSHOT');
        [...misses.entries()]
            .sort((a, b) => b[1] - a[1])
            .forEach(([k, c]) => p(`      ${String(c).padStart(3)} × ${k}`));
        p();
    } else {
        p('  No invented ids — every selection either resolved or was a deliberate null.');
        p();
    }

    // All three laws now select from the same six dimensions, so these three
    // tables read together: a force that never appears under any law is one the
    // snapshot claims is driving the paradigm and the ledger never sees move.
    const dimensionIds: string[] = paradigm.dimensions.map((d) => d.id);

    // A law may name a second force. It is not scored against, so it does not
    // belong in the counts below — but a field nobody uses is decoration, and
    // one used on most rows is an analyst hedging instead of choosing.
    const seconds = ok.flatMap((s) =>
        [s.inversion.secondaryId, s.incentives.secondaryId, s.inflection.secondaryId].filter(Boolean),
    );
    p(`  SECOND FORCE named on ${seconds.length} of ${ok.length * 3} law-selections`);
    p();
    for (const [label, ids, all] of [
        ['I¹ BASELINE', ok.map((s) => s.inversion.dimensionId), dimensionIds],
        ['I² INCENTIVE', ok.map((s) => s.incentives.dimensionId), dimensionIds],
        ['I³ INFLECTION', ok.map((s) => s.inflection.dimensionId), dimensionIds],
    ] as const) {
        const counts = new Map<string, number>();
        for (const id of ids) counts.set(id ?? '(none)', (counts.get(id ?? '(none)') ?? 0) + 1);
        const used = all.filter((id) => counts.has(id)).length;
        p(`  ${label} · ${used} of ${all.length} entries used`);
        [...counts.entries()]
            .sort((a, b) => b[1] - a[1])
            .forEach(([id, c]) => p(`      ${String(c).padStart(3)} × ${id}`));
        const unused = all.filter((id) => !counts.has(id));
        if (unused.length) p(`      never selected: ${unused.join(', ')}`);
        p();
    }

    // ── 4. Is the whole scale in use? ────────────────────────────────────────
    // Eleven rungs each carry their own line of rubric, and the point of that is
    // resolution the two earlier instruments could not reach: a 0-5 rung opening
    // a band produced only endpoints, and collapsing the rung onto {0,2,4,6,8,10}
    // put three of the nine canon anchors out of reach. If the odd numbers never
    // appear, that resolution is notional and we are back where we started.
    p('─── THE SCALE ──────────────────────────────────────────────────────────────');
    p('Every value 0-10 carries its own rubric line. Values that never appear are');
    p('rungs the scorer is refusing, and a ledger clustered on a handful of them');
    p('is the endpoint habit under a new name.');
    p();
    for (const [label, key] of [
        ['I¹', 'inversion'],
        ['I²', 'incentives'],
        ['I³', 'inflection'],
    ] as const) {
        const used = new Set(ok.map((s) => s[key].score));
        const missing = Array.from({ length: 11 }, (_, i) => i).filter((n) => !used.has(n));
        p(`  ${label}  ${used.size} of 11 rungs used${missing.length ? ` · never: ${missing.join(', ')}` : ''}`);
    }
    p();
    const odd = ok.flatMap((s) => [s.inversion.score, s.incentives.score, s.inflection.score])
        .filter((n) => n % 2 === 1).length;
    const all = ok.length * 3;
    p(`  Odd-numbered scores: ${odd}/${all} (${Math.round((odd / (all || 1)) * 100)}%)`);
    p('  The retired instrument could not produce one. AlphaFold 2 at I³ 7 and');
    p('  ChatGPT at I³ 9 are canon anchors that need them.');
    p();

    // ── 4c. Zeros, and whether they are still distinguishable ────────────────
    // Six forces are a narrow claim, so a null selection is ordinary and a
    // zeroed product is common. What must NOT happen is every zero collapsing
    // into one indistinguishable block: a paper moving two forces and a survey
    // moving none both read 0, and only `reach` tells them apart.
    const zeros = ok.filter((s) => s.product === 0);
    const outside = ok.filter((s) => s.outsideFrame);
    p('─── THE ZEROS ──────────────────────────────────────────────────────────────');
    p('A law at 0 says that law found no relationship, and zeroes the product. That');
    p('is severity working. It becomes a defect only if the zeros stop being');
    p('rankable — `reach` is what keeps them apart.');
    p();
    p(`  Product 0                      ${zeros.length}/${ok.length}`);
    p(`  ...distinct reach values        ${new Set(zeros.map((s) => s.reach)).size}`);
    p(`  Outside the frame entirely      ${outside.length}/${ok.length}  (all three laws null)`);
    if (outside.length > ok.length / 3) {
        p();
        p('  WARNING: over a third of the sample moves none of the six forces. That is');
        p('  a finding about the SNAPSHOT before it is one about the papers — either');
        p('  the six are describing the wrong field, or the digest is off-paradigm.');
    }
    p();

    // ── 4b. The paradigm-defining band ───────────────────────────────────────
    p('─── THE PARADIGM BAND ──────────────────────────────────────────────────────');
    p('9-10 is not "very high" — it claims the creation modified the standing');
    p('paradigm on that law. A digest where this fires often is not measuring it.');
    p();
    for (const [law, values] of [['I¹', i1], ['I²', i2], ['I³', i3]] as const) {
        const hits = values.filter((v) => v >= PARADIGM_DEFINING_SCORE).length;
        p(`  ${law} in the 9-10 band   ${hits}/${ok.length} (${Math.round((hits / (ok.length || 1)) * 100)}%)`);
    }
    p('  Band mix across all three laws:');
    const bands = new Map<string, number>();
    for (const s of ok) {
        for (const [law, v] of [
            ['inversion', s.inversion.score],
            ['incentives', s.incentives.score],
            ['inflection', s.inflection.score],
        ] as const) {
            const key = `${law.padEnd(11)} ${scoreBand(v, law)}`;
            bands.set(key, (bands.get(key) ?? 0) + 1);
        }
    }
    [...bands.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([b, c]) => p(`      ${String(c).padStart(3)} × ${b}`));
    p();

    // ── 5. I² action mix ─────────────────────────────────────────────────────

    // ── 6. The tails, for eyeballing ─────────────────────────────────────────
    p('─── TOP 12 BY RANK ─────────────────────────────────────────────────────────');
    p('Read these for false positives. A weekly digest holding an AlphaFold-class');
    p('outlier is a once-a-year event.');
    p();
    [...ok]
        .sort(byRank)
        .slice(0, 12)
        .forEach((s) => {
            p(`  ${String(s.product).padStart(4)}  ${s.inversion.score}×${s.incentives.score}×${s.inflection.score}  r${String(s.reach).padStart(2)}  ${s.title.slice(0, 56)}`);
            p(`        I¹ ${s.inversion.score} ${s.inversion.dimensionId ?? '—'}  ·  I² ${s.incentives.score} ${s.incentives.dimensionId ?? '—'}  ·  I³ ${s.inflection.score} ${s.inflection.dimensionId ?? '—'}`)
        });
    p();

    p('─── BOTTOM 8 BY RANK ───────────────────────────────────────────────────────');
    p('Read these for false negatives — a real inversion filed as ordinary.');
    p();
    [...ok]
        .sort((a, b) => -byRank(a, b))
        .slice(0, 8)
        .forEach((s) => {
            p(`  ${String(s.product).padStart(4)}  ${s.inversion.score}×${s.incentives.score}×${s.inflection.score}  r${String(s.reach).padStart(2)}  ${s.title.slice(0, 56)}`);
            p(`        I¹ ${s.inversion.score} ${s.inversion.dimensionId ?? '—'}  ·  I² ${s.incentives.score} ${s.incentives.dimensionId ?? '—'}  ·  I³ ${s.inflection.score} ${s.inflection.dimensionId ?? '—'}`)
        });
    p();

    const zero = ok.filter((s) => s.product === 0).length;
    p(`  Rows scoring 0 (one law at 0): ${zero} of ${ok.length}`);
    p();

    if (failed.length) {
        p('─── FAILED ─────────────────────────────────────────────────────────────────');
        failed.forEach((r) => p(`  ${r.id}  ${r.error}`));
        p();
    }

    void prod;
    return out.join('\n');
}

// ─── run ─────────────────────────────────────────────────────────────────────

async function main() {
    const paradigm = loadParadigm('2024-12');
    if (!paradigm) throw new Error('No converted snapshot stands before 2024-12');

    const ids = IDS ? IDS.split(',').map((x) => x.trim()).filter(Boolean) : sample(N);
    fs.mkdirSync(OUT, { recursive: true });
    console.log(`Scoring ${ids.length} papers against ${paradigm.asOf} with ${MODEL}\n`);

    const rows: Row[] = [];
    let done = 0;
    const queue = [...ids];

    await Promise.all(
        Array.from({ length: CONCURRENCY }, async () => {
            for (;;) {
                const id = queue.shift();
                if (!id) return;
                try {
                    const row = await scoreOne(id, paradigm);
                    rows.push(row);
                    done += 1;
                    const s = row.score;
                    console.log(
                        `[${String(done).padStart(3)}/${ids.length}] ${id}  `
                        + (s
                            ? `${s.inversion.score}×${s.incentives.score}×${s.inflection.score}=${String(s.product).padStart(4)}  `
                              + `${s.title.slice(0, 54)}`
                            : `FAILED · ${row.error}`),
                    );
                } catch (err) {
                    done += 1;
                    const message = err instanceof Error ? err.message : String(err);
                    rows.push({ id, ok: false, error: message });
                    console.log(`[${String(done).padStart(3)}/${ids.length}] ${id}  ERROR · ${message}`);
                }
            }
        }),
    );

    rows.sort((a, b) => a.id.localeCompare(b.id));
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    fs.writeFileSync(path.join(OUT, `${stamp}.json`), JSON.stringify(rows, null, 2));

    const text = report(rows, paradigm);
    fs.writeFileSync(path.join(OUT, `${stamp}.txt`), text);
    console.log(`\n${text}`);
    console.log(`\nTranscript: backtest/${stamp}.json\nReport:     backtest/${stamp}.txt`);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
