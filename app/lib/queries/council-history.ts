/**
 * Council conversation persistence
 *
 * Saves sessions and turns to the council_sessions / council_turns tables
 * that live in the shared stockdata Postgres DB.
 */

import pool from '../db';

export interface SaveTurnParams {
    sessionId: string;
    question: string;
    agents: string[];
    responses: Record<string, string>; // { agentName: responseText }
    synthesis?: string;
}

/**
 * Creates a new session row and returns its id.
 * Title is derived from the first question (truncated to 200 chars).
 */
export async function createSession(firstQuestion: string, appId = 'panteon'): Promise<string> {
    const title = firstQuestion.slice(0, 200);
    const result = await pool.query<{ id: string }>(
        `INSERT INTO council_sessions (id, title, "appId", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
         RETURNING id`,
        [title, appId]
    );
    return result.rows[0].id;
}

/**
 * Appends a turn to an existing session.
 */
export async function saveTurn(params: SaveTurnParams): Promise<void> {
    const { sessionId, question, agents, responses, synthesis } = params;
    await pool.query(
        `INSERT INTO council_turns (id, "sessionId", question, agents, responses, synthesis, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
        [
            sessionId,
            question,
            agents,
            JSON.stringify(responses),
            synthesis ?? null,
        ]
    );
}

/**
 * Fetches recent sessions, newest first.
 */
export async function getRecentSessions(limit = 50) {
    const result = await pool.query(
        `SELECT id, title, "appId", "createdAt"
         FROM council_sessions
         ORDER BY "createdAt" DESC
         LIMIT $1`,
        [limit]
    );
    return result.rows;
}

/**
 * Fetches all turns for a given session, oldest first.
 */
export async function getSessionTurns(sessionId: string) {
    const result = await pool.query(
        `SELECT id, question, agents, responses, synthesis, "createdAt"
         FROM council_turns
         WHERE "sessionId" = $1
         ORDER BY "createdAt" ASC`,
        [sessionId]
    );
    return result.rows;
}
