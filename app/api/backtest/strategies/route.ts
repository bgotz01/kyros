/**
 * GET  /api/backtest/strategies?regime=overvaluation
 *      Returns all saved strategies for the given regime slug.
 *
 * POST /api/backtest/strategies
 *      Save a new strategy (or upsert by name+regime).
 *      Body: { name, description?, regime, asset, rules, defaultSignal }
 */

import { NextRequest, NextResponse } from 'next/server';
import pool from '@/app/lib/db';

function newId(): string {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

export async function GET(req: NextRequest) {
    const regime = req.nextUrl.searchParams.get('regime');
    if (!regime) {
        return NextResponse.json({ error: 'regime param required' }, { status: 400 });
    }

    try {
        const { rows } = await pool.query(
            `SELECT id, name, description, regime, asset, rules, "defaultSignal", "isActive", "createdAt", "updatedAt"
             FROM backtest_strategies
             WHERE regime = $1 AND "isActive" = true
             ORDER BY "updatedAt" DESC`,
            [regime],
        );
        return NextResponse.json({ strategies: rows });
    } catch (err) {
        console.error('GET /api/backtest/strategies error', err);
        return NextResponse.json({ error: 'Failed to load strategies' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    let body: {
        name: string;
        description?: string;
        regime: string;
        asset: string;
        rules: unknown;
        defaultSignal: string;
    };

    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { name, description, regime, asset, rules, defaultSignal } = body;
    if (!name || !regime || !asset || !rules) {
        return NextResponse.json({ error: 'name, regime, asset, rules required' }, { status: 400 });
    }

    try {
        const now = new Date().toISOString();
        const id = newId();

        const { rows } = await pool.query(
            `INSERT INTO backtest_strategies (id, name, description, regime, asset, rules, "defaultSignal", "isActive", "createdAt", "updatedAt")
             VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8, $8)
             ON CONFLICT (id) DO NOTHING
             RETURNING *`,
            [id, name, description ?? null, regime, asset, JSON.stringify(rules), defaultSignal ?? 'flat', now],
        );

        return NextResponse.json({ strategy: rows[0] }, { status: 201 });
    } catch (err) {
        console.error('POST /api/backtest/strategies error', err);
        return NextResponse.json({ error: 'Failed to save strategy' }, { status: 500 });
    }
}
