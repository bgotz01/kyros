import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import type { Prisma } from '@/lib/generated/prisma/client';
import {
    candidatesFor,
    factsFor,
    fetchRepo,
    linkContext,
    type RepoFacts,
    type RepoRole,
} from '@/lib/engine/external';
import { hasApiKey, openrouter } from '@/lib/openrouter';
import { MODELS } from '@/lib/models';
import { buildExternalPrompt } from '@/lib/engine/prompts';
import { activePrompt } from '@/lib/engine/promptStore';

export const maxDuration = 120;

export interface External {
    paperId: string;
    repos: RepoFacts[];
    noRepo: boolean;
    model: string;
    cost: number;
    checkedAt: string;
}

const ROLES: RepoRole[] = ['artefact', 'baseline', 'dataset', 'tooling', 'unrelated'];

function extractJson(raw: string): Record<string, unknown> | null {
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    const body = fenced ? fenced[1] : raw;
    const start = body.indexOf('{');
    const end = body.lastIndexOf('}');
    if (start === -1 || end <= start) return null;
    try {
        return JSON.parse(body.slice(start, end + 1));
    } catch {
        return null;
    }
}

/** Roles for each candidate. Failure is not fatal: the repositories are still
 *  real and still worth showing, just unsorted. */
async function classify(
    title: string,
    candidates: { owner: string; name: string }[],
    context: string,
    model: string,
    signal?: AbortSignal,
): Promise<{ roles: Map<string, { role: RepoRole; why: string }>; cost: number; prompt: number; completion: number }> {
    const empty = { roles: new Map(), cost: 0, prompt: 0, completion: 0 };
    if (!model || !hasApiKey() || candidates.length === 0) return empty;

    try {
        const meta = MODELS.find((m) => m.id === model);
        const completion = await openrouter().chat.completions.create({
            model,
            messages: [
                { role: 'system', content: (await activePrompt('external')).text },
                { role: 'user', content: buildExternalPrompt(title, candidates, context) },
            ],
            max_tokens: Math.min(meta?.maxTokens ?? 2000, 2000),
            temperature: 0,
        // A stopped sweep should not keep paying for the paper it was on.
        }, { signal });

        const parsed = extractJson(completion.choices[0]?.message?.content ?? '');
        const rows = Array.isArray(parsed?.repos) ? parsed.repos : [];
        const roles = new Map<string, { role: RepoRole; why: string }>();
        for (const row of rows) {
            const r = row as Record<string, unknown>;
            const key = `${String(r.owner ?? '').toLowerCase()}/${String(r.name ?? '').toLowerCase()}`;
            const role = ROLES.find((x) => x === String(r.role ?? '').toLowerCase()) ?? 'unknown';
            roles.set(key, { role, why: String(r.why ?? '').slice(0, 80) });
        }

        const usage = completion.usage as
            | { cost?: number; prompt_tokens?: number; completion_tokens?: number }
            | undefined;
        return {
            roles,
            cost: usage?.cost ?? 0,
            prompt: usage?.prompt_tokens ?? 0,
            completion: usage?.completion_tokens ?? 0,
        };
    } catch (err) {
        console.error('[external classify]', err);
        return empty;
    }
}

// ─── POST /api/engine/external ───────────────────────────────────────────────
// Looks the paper's repositories up on GitHub and stores what it finds.
//
// Body: { id: string, links?: string[] }
//
// The result is confirmation evidence. It is stored against the paper, not
// against a score, and nothing here feeds the ranking.

export async function POST(req: NextRequest) {
    try {
        const { id, title, links, model } = (await req.json()) as {
            id?: string;
            title?: string;
            links?: string[];
            model?: string;
        };
        if (!id || !/^\d{4}\.\d{4,5}$/.test(id)) {
            return Response.json({ error: 'Invalid arXiv id' }, { status: 400 });
        }

        const { repos: candidates, haystack, hf } = candidatesFor(id, Array.isArray(links) ? links : []);

        // Sort them before spending GitHub's rate limit on them.
        const judged = await classify(
            title ?? id,
            candidates,
            linkContext(haystack, candidates, hf),
            model ?? '',
            req.signal,
        );

        // classify() treats its own failures as non-fatal and returns no roles,
        // which is right for a model that misbehaves and wrong for a stop: the
        // sweep would carry on spending GitHub's hourly allowance and store an
        // unjudged record for a paper the user interrupted.
        if (req.signal.aborted) {
            return Response.json({ error: 'Stopped' }, { status: 499 });
        }

        // Anything the seat dismissed outright is not looked up at all.
        const worth = candidates.filter((c) => {
            const r = judged.roles.get(`${c.owner.toLowerCase()}/${c.name.toLowerCase()}`);
            return !r || r.role !== 'unrelated';
        });

        const facts = await factsFor(worth);
        const repos: RepoFacts[] = facts.map((f) => {
            const r = judged.roles.get(`${f.owner.toLowerCase()}/${f.name.toLowerCase()}`);
            return { ...f, role: r?.role ?? 'unknown', why: r?.why ?? '' };
        });
        // The paper's own artefact leads; the rest keep their order.
        repos.sort((a, b) => Number(b.role === 'artefact') - Number(a.role === 'artefact'));

        const noRepo = repos.length === 0;

        const row = await db.engineExternal.upsert({
            where: { paperId: id },
            // Prisma types Json columns as an index-signature shape; an array of
            // typed objects satisfies the column but not that signature.
            create: {
                paperId: id,
                repos: repos as unknown as Prisma.InputJsonValue,
                noRepo,
                model: model ?? '',
                cost: judged.cost,
                promptTokens: judged.prompt,
                completionTokens: judged.completion,
            },
            update: {
                repos: repos as unknown as Prisma.InputJsonValue,
                noRepo,
                model: model ?? '',
                cost: judged.cost,
                promptTokens: judged.prompt,
                completionTokens: judged.completion,
                checkedAt: new Date(),
            },
        });

        const out: External = {
            paperId: id,
            repos,
            noRepo,
            model: row.model,
            cost: row.cost,
            checkedAt: row.checkedAt.toISOString(),
        };
        return Response.json(out);
    } catch (err) {
        console.error('[api/engine/external]', err);
        const message = err instanceof Error ? err.message : 'Lookup failed';
        return Response.json({ error: message }, { status: 500 });
    }
}

// ─── PATCH /api/engine/external ──────────────────────────────────────────────
// Re-fetches GitHub facts for repos already stored against a paper and updates
// stars/forks/openIssues/pushedAt/archived/description in place.
// The role classification and LLM call are not repeated.
//
// Body: { id: string }

export async function PATCH(req: NextRequest) {
    try {
        const { id } = (await req.json()) as { id?: string };
        if (!id || !/^\d{4}\.\d{4,5}$/.test(id)) {
            return Response.json({ error: 'Invalid arXiv id' }, { status: 400 });
        }

        const existing = await db.engineExternal.findUnique({ where: { paperId: id } });
        if (!existing) {
            return Response.json({ error: 'No external record for this paper' }, { status: 404 });
        }

        const storedRepos = (existing.repos ?? []) as unknown as RepoFacts[];
        if (storedRepos.length === 0) {
            return Response.json({ paperId: id, updated: 0 });
        }

        // Re-fetch GitHub facts for every stored repo, preserving the existing role/why.
        const refreshed: RepoFacts[] = [];
        for (const r of storedRepos) {
            const fresh = await fetchRepo(r.owner, r.name);
            refreshed.push({ ...fresh, role: r.role, why: r.why });
        }

        const row = await db.engineExternal.update({
            where: { paperId: id },
            data: {
                repos: refreshed as unknown as Prisma.InputJsonValue,
                checkedAt: new Date(),
            },
        });

        return Response.json({
            paperId: id,
            updated: refreshed.length,
            checkedAt: row.checkedAt.toISOString(),
        });
    } catch (err) {
        console.error('[api/engine/external PATCH]', err);
        const message = err instanceof Error ? err.message : 'Update failed';
        return Response.json({ error: message }, { status: 500 });
    }
}

// ─── GET /api/engine/external?ids=a,b,c ──────────────────────────────────────

export async function GET(req: NextRequest) {
    try {
        const ids = (new URL(req.url).searchParams.get('ids') ?? '')
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean);
        if (ids.length === 0) return Response.json([]);

        const rows = await db.engineExternal.findMany({ where: { paperId: { in: ids } } });
        return Response.json(
            rows.map((r): External => ({
                paperId: r.paperId,
                repos: (r.repos ?? []) as unknown as RepoFacts[],
                noRepo: r.noRepo,
                model: r.model,
                cost: r.cost,
                checkedAt: r.checkedAt.toISOString(),
            })),
        );
    } catch (err) {
        console.error('[api/engine/external GET]', err);
        return Response.json({ error: 'Failed to read external evidence' }, { status: 500 });
    }
}
