import EngineAI from '../../EngineAI';

// ─── /engine/ai/[year]/[month] ───────────────────────────────────────────────
// The only route the engine has. Weeks and papers are fragments of a month, not
// pages beneath it, so they travel in the hash — which also means moving
// between them never remounts the month or re-reads its runs.

export default async function Page({
    params,
}: {
    params: Promise<{ year: string; month: string }>;
}) {
    const { year, month } = await params;
    return <EngineAI year={year} month={month} />;
}
