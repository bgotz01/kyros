/**
 * GET /api/athena/sessions
 * Returns recent council sessions with turn count, newest first.
 *
 * GET /api/athena/sessions?id=<sessionId>
 * Returns all turns for a specific session.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getRecentSessions, getSessionTurns } from '@/app/lib/queries/council-history';

export async function GET(req: NextRequest) {
    const id = req.nextUrl.searchParams.get('id');

    if (id) {
        const turns = await getSessionTurns(id);
        return NextResponse.json({ turns });
    }

    const sessions = await getRecentSessions(30);
    return NextResponse.json({ sessions });
}
