/**
 * GET  /api/backtest/runs?strategyId=xxx
 *      Returns all runs for a strategy, newest first.
 *
 * POST /api/backtest/runs
 *      Save a completed backtest run.
 *      Body: { strategyId, rulesSnapshot, stats, equityCurve, periodResults, periodCount }
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

function newId(): string {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

export async function GET(req: NextRequest) {
    const strategyId = req.nextUrl.searchParams.get('strategyId');
    if (!strategyId) {
        return NextResponse.json({ error: 'strategyId param required' }, { status: 400 });
    }

    try {
        const { rows } = await pool.query(
            `SELECT id, "strategyId", "rulesSnapshot",
                    "totalReturn", cagr, sharpe, "maxDrawdown", calmar,
                    "tradeCount", "winRate", "avgWin", "avgLoss", "avgTradeReturn",
                    "periodCount", "equityCurve", "periodResults", "createdAt"
             FROM backtest_runs
             WHERE "strategyId" = $1
             ORDER BY "createdAt" DESC
             LIMIT 20`,
            [strategyId],
        );
        return NextResponse.json({ runs: rows });
    } catch (err) {
        console.error('GET /api/backtest/runs error', err);
        return NextResponse.json({ error: 'Failed to load runs' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    let body: {
        strategyId: string;
        rulesSnapshot: unknown;
        stats: {
            total_return?: number | null;
            cagr?: number | null;
            sharpe?: number | null;
            max_drawdown?: number | null;
            calmar?: number | null;
            trade_count?: number | null;
            win_rate?: number | null;
            avg_win?: number | null;
            avg_loss?: number | null;
            avg_trade_return?: number | null;
        };
        equityCurve: unknown;
        periodResults: unknown;
        periodCount?: number;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { strategyId, rulesSnapshot, stats, equityCurve, periodResults, periodCount } = body;
    if (!strategyId || !rulesSnapshot || !stats) {
        return NextResponse.json({ error: 'strategyId, rulesSnapshot, stats required' }, { status: 400 });
    }

    try {
        const id = newId();
        const now = new Date().toISOString();

        const { rows } = await pool.query(
            `INSERT INTO backtest_runs (
                id, "strategyId", "rulesSnapshot",
                "totalReturn", cagr, sharpe, "maxDrawdown", calmar,
                "tradeCount", "winRate", "avgWin", "avgLoss", "avgTradeReturn",
                "periodCount", "equityCurve", "periodResults", "createdAt"
             ) VALUES (
                $1, $2, $3,
                $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13,
                $14, $15, $16, $17
             ) RETURNING id, "createdAt"`,
            [
                id, strategyId, JSON.stringify(rulesSnapshot),
                stats.total_return ?? null,
                stats.cagr ?? null,
                stats.sharpe ?? null,
                stats.max_drawdown ?? null,
                stats.calmar ?? null,
                stats.trade_count ?? null,
                stats.win_rate ?? null,
                stats.avg_win ?? null,
                stats.avg_loss ?? null,
                stats.avg_trade_return ?? null,
                periodCount ?? null,
                JSON.stringify(equityCurve ?? []),
                JSON.stringify(periodResults ?? []),
                now,
            ],
        );

        return NextResponse.json({ run: rows[0] }, { status: 201 });
    } catch (err) {
        console.error('POST /api/backtest/runs error', err);
        return NextResponse.json({ error: 'Failed to save run' }, { status: 500 });
    }
}
