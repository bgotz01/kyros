// ─── score one paper ─────────────────────────────────────────────────────────
// A single reading, printed rather than stored — for interrogating the
// instrument on a specific paper without adding a row to the ledger.
//
//   npm run score -- 2411.02337 [model]
import { buildScore, extractJson } from '../lib/engine/scoring';
import { paperPeriod, scoreBand, LEVEL_RUBRIC } from '../lib/engine/paradigm';
import { loadParadigm } from '../lib/engine/paradigmStore';
import { buildSeatContext, MAX_PAPER_CHARS } from '../lib/pageContext';
import { buildPaperPrompt } from '../lib/engine/prompts';
import { activePrompt, lawContexts } from '../lib/engine/promptStore';
import { readPaper } from '../lib/engine/data';
import { openrouter } from '../lib/openrouter';

async function main() {
    const id = process.argv[2];
    const model = process.argv[3] ?? 'deepseek/deepseek-v4-flash';
    const paper = readPaper(id)!;
    const period = paperPeriod(id, paper.published);
    const p = loadParadigm(period)!;
    const title = paper.text.match(/^#\s+(.+)$/m)?.[1].trim() ?? id;

    const c = await openrouter().chat.completions.create({
        model,
        messages: [
            {
                role: 'system',
                content: [
                    buildSeatContext(period),
                    '─── KYROS · THE THREE LAWS ─────────────────────────────────────────────────────',
                    await lawContexts(),
                    (await activePrompt('analyst')).text,
                ].join('\n\n'),
            },
            { role: 'user', content: buildPaperPrompt({ id, title, published: paper.published, text: paper.text.slice(0, MAX_PAPER_CHARS) }) },
        ],
        max_tokens: 16000, temperature: 0.3,
    });
    const parsed = extractJson(c.choices[0]?.message?.content ?? '');
    if (!parsed) { console.log('no JSON', c.choices[0]?.finish_reason); return; }
    const u = c.usage as { cost?: number } | undefined;
    const s = buildScore(parsed, p, { id, title, model, cost: u?.cost ?? 0, promptTokens: 0, completionTokens: 0, truncated: false });

    console.log(`\n${title}`);
    console.log(`arXiv:${id} · published ${paper.published} · judged against ${p.asOf} · ${model}\n`);
    const laws = [
        ['I¹ INVERSION ', s.inversion, s.inversion.dimensionId, s.inversion.inverting],
        ['I² INCENTIVES', s.incentives, s.incentives.dimensionId, s.incentives.bottleneck],
        ['I³ INFLECTION', s.inflection, s.inflection.dimensionId, s.inflection.unprecedented],
    ] as const;
    for (const [name, block, sel, bullets] of laws) {
        const law = name.slice(0, 2) === 'I¹' ? 'inversion' : name.slice(0, 2) === 'I²' ? 'incentives' : 'inflection';
        console.log(`${name}  ${String(block.score).padStart(2)}/10  ${scoreBand(block.score, law as 'inversion').toUpperCase()}`);
        console.log(`   level ${block.level} · ${LEVEL_RUBRIC[law as 'inversion'][block.level!]}`);
        console.log(`   selected: ${sel ?? '—'}`);
        bullets.forEach((b: string) => console.log(`   · ${b}`));
        console.log();
    }
    console.log(`PRODUCT  ${s.inversion.score} × ${s.incentives.score} × ${s.inflection.score} = ${s.product}`);
    console.log(`\nprevious: ${s.previousParadigm}\nproposes: ${s.corePremise}`);
    console.log(`verdict: ${s.verdict} · confidence: ${s.confidence} · $${(u?.cost ?? 0).toFixed(4)}`);
}
main();
