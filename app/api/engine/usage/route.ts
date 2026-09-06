import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

// ─── GET /api/engine/usage?domain=ai ─────────────────────────────────────────
// What the engine has spent, by seat, by model and by week. Read from the
// stored rows rather than accumulated in the browser, so it survives reloads
// and counts runs made in other sessions.

export interface UsageTotals {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost: number;
    calls: number;
}

export interface UsageByModel extends UsageTotals {
    model: string;
    seat: 'analyst' | 'critic';
}

export interface UsageByWeek extends UsageTotals {
    year: string;
    weekIdx: number;
    heading: string;
    runs: number;
    papers: number;
}

export interface UsageReport {
    total: UsageTotals;
    analyst: UsageTotals;
    critic: UsageTotals;
    byModel: UsageByModel[];
    byWeek: UsageByWeek[];
    runs: number;
}

const zero = (): UsageTotals => ({
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
    cost: 0,
    calls: 0,
});

/** Rows written before token counting was added carry no counts, and a single
 *  undefined would turn every total into NaN — which serialises as null and
 *  silently blanks the whole report. Each field is coerced on the way in. */
function add(
    into: UsageTotals,
    row: { promptTokens?: number | null; completionTokens?: number | null; cost?: number | null },
) {
    const prompt = row.promptTokens ?? 0;
    const completion = row.completionTokens ?? 0;
    into.promptTokens += prompt;
    into.completionTokens += completion;
    into.totalTokens += prompt + completion;
    into.cost += row.cost ?? 0;
    into.calls += 1;
}

export async function GET(req: NextRequest) {
    try {
        const domain = new URL(req.url).searchParams.get('domain') ?? 'ai';

        const runs = await db.engineRun.findMany({
            where: { domain },
            include: { scores: { include: { critique: true } } },
        });

        const report: UsageReport = {
            total: zero(),
            analyst: zero(),
            critic: zero(),
            byModel: [],
            byWeek: [],
            runs: runs.length,
        };

        const models = new Map<string, UsageByModel>();
        const weeks = new Map<string, UsageByWeek>();

        for (const run of runs) {
            const weekKey = `${run.year}:${run.weekIdx}`;
            if (!weeks.has(weekKey)) {
                weeks.set(weekKey, {
                    ...zero(),
                    year: run.year,
                    weekIdx: run.weekIdx,
                    heading: run.heading,
                    runs: 0,
                    papers: 0,
                });
            }
            const week = weeks.get(weekKey)!;
            week.runs += 1;
            week.papers += run.scores.length;

            for (const score of run.scores) {
                for (const [seat, row] of [
                    ['analyst', score] as const,
                    ...(score.critique ? ([['critic', score.critique]] as const) : []),
                ]) {
                    add(report.total, row);
                    add(report[seat], row);
                    add(week, row);

                    const key = `${seat}:${row.model}`;
                    if (!models.has(key)) models.set(key, { ...zero(), model: row.model, seat });
                    add(models.get(key)!, row);
                }
            }
        }

        report.byModel = [...models.values()].sort((a, b) => b.cost - a.cost);
        report.byWeek = [...weeks.values()].sort(
            (a, b) => b.year.localeCompare(a.year) || b.weekIdx - a.weekIdx,
        );
        return Response.json(report);
    } catch (err) {
        console.error('[api/engine/usage]', err);
        return Response.json({ error: 'Failed to read usage' }, { status: 500 });
    }
}
