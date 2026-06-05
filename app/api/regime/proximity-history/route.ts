import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

const SERIES = [
    { series_name: 'Earnings-Yield-Premium-5yr', key: 'eyp5yr' },
    { series_name: 'Real-Earnings-Yield-5yr', key: 'rey5yr' },
    { series_name: 'Real-10Y', key: 'real10Y' },
    { series_name: 'Real-3M', key: 'real3M' },
    { series_name: 'Real-M2-YoY', key: 'realM2' },
] as const;

type Key = typeof SERIES[number]['key'];

interface CondDef { dataKey: Key; threshold: number; direction: 'lte' | 'gte'; range: number }
interface RegimeDef { regime: string; conditions: CondDef[]; logic: 'AND' | 'OR' }

const DEFS: RegimeDef[] = [
    { regime: 'Liquidity Shock', conditions: [{ dataKey: 'realM2', threshold: 10, direction: 'gte', range: 8 }], logic: 'AND' },
    { regime: 'Crisis', conditions: [{ dataKey: 'real10Y', threshold: -1, direction: 'lte', range: 3 }, { dataKey: 'realM2', threshold: 5, direction: 'lte', range: 6 }], logic: 'AND' },
    { regime: 'Bond Stress', conditions: [{ dataKey: 'real10Y', threshold: -0.5, direction: 'lte', range: 3 }, { dataKey: 'real3M', threshold: -1, direction: 'lte', range: 3 }], logic: 'AND' },
    { regime: 'Overvaluation', conditions: [{ dataKey: 'eyp5yr', threshold: -2.5, direction: 'lte', range: 3 }, { dataKey: 'rey5yr', threshold: -0.5, direction: 'lte', range: 3 }], logic: 'OR' },
    { regime: 'Broad Growth', conditions: [{ dataKey: 'rey5yr', threshold: 3, direction: 'gte', range: 4 }], logic: 'AND' },
    { regime: 'Long Duration', conditions: [{ dataKey: 'eyp5yr', threshold: 0, direction: 'lte', range: 3 }, { dataKey: 'real10Y', threshold: 1, direction: 'gte', range: 3 }], logic: 'AND' },
];

function prox(v: number | null, threshold: number, dir: 'lte' | 'gte', range: number): number {
    if (v === null) return 0;
    if (dir === 'lte') {
        if (v <= threshold) return 100;
        const d = v - threshold; if (d >= range) return 0;
        return Math.round(((range - d) / range) * 100);
    } else {
        if (v >= threshold) return 100;
        const d = threshold - v; if (d >= range) return 0;
        return Math.round(((range - d) / range) * 100);
    }
}

function camel(s: string) { return s.replace(/\s+(.)/g, (_, c) => c.toUpperCase()).replace(/^(.)/, c => c.toLowerCase()); }

export async function GET() {
    try {
        const names = SERIES.map(s => s.series_name);
        const { rows } = await pool.query<{ series_name: string; date: string; value: number }>(
            `SELECT series_name, date::text as date, value FROM macro_percentile_analysis WHERE series_name = ANY($1) ORDER BY date ASC`,
            [names],
        );

        const byDate = new Map<string, Partial<Record<Key, number>>>();
        for (const row of rows) {
            const s = SERIES.find(x => x.series_name === row.series_name);
            if (!s) continue;
            if (!byDate.has(row.date)) byDate.set(row.date, {});
            byDate.get(row.date)![s.key] = row.value;
        }

        const result: Record<string, string | number>[] = [];
        for (const [date, metrics] of byDate) {
            const point: Record<string, string | number> = { date };
            for (const def of DEFS) {
                const proxies = def.conditions.map(c => prox(metrics[c.dataKey] ?? null, c.threshold, c.direction, c.range));
                point[camel(def.regime)] = def.logic === 'OR' ? Math.max(...proxies) : Math.min(...proxies);
            }
            result.push(point);
        }
        result.sort((a, b) => (a.date as string).localeCompare(b.date as string));

        return NextResponse.json({ data: result }, {
            headers: { 'Cache-Control': 'public, max-age=300, stale-while-revalidate=600' },
        });
    } catch (err) {
        console.error('regime/proximity-history error', err);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
