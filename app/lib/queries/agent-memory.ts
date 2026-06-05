/**
 * Agent memory — RAG knowledge base
 *
 * Stores conversation summaries, user preferences, and manual insights.
 * Retrieval uses Postgres full-text search (tsvector) for now.
 * Can be upgraded to pgvector embeddings later.
 */

import pool from '../db';

export type MemoryType = 'summary' | 'preference' | 'insight';

export interface MemoryEntry {
    id: string;
    type: MemoryType;
    content: string;
    sessionId: string | null;
    tags: string[];
    createdAt: Date;
}

/**
 * Save a new memory entry.
 */
export async function saveMemory(params: {
    type: MemoryType;
    content: string;
    sessionId?: string;
    tags?: string[];
}): Promise<string> {
    const { type, content, sessionId = null, tags = [] } = params;
    const result = await pool.query<{ id: string }>(
        `INSERT INTO agent_memory (id, type, content, "sessionId", tags, "appId", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, 'panteon', NOW())
         RETURNING id`,
        [type, content, sessionId, tags]
    );
    return result.rows[0].id;
}

/**
 * Retrieve the most relevant memories for a given query using full-text search.
 * Preferences are always included regardless of the query.
 */
export async function retrieveMemories(query: string, limit = 5): Promise<MemoryEntry[]> {
    const result = await pool.query<MemoryEntry>(
        `SELECT id, type, content, "sessionId", tags, "createdAt"
         FROM agent_memory
         WHERE "appId" = 'panteon'
           AND (
             type = 'preference'
             OR to_tsvector('english', content) @@ plainto_tsquery('english', $1)
           )
         ORDER BY
           CASE WHEN type = 'preference' THEN 0 ELSE 1 END,
           ts_rank(to_tsvector('english', content), plainto_tsquery('english', $1)) DESC,
           "createdAt" DESC
         LIMIT $2`,
        [query, limit]
    );
    return result.rows;
}

/**
 * Get all memories of a given type, newest first.
 */
export async function getMemoriesByType(type: MemoryType, limit = 20): Promise<MemoryEntry[]> {
    const result = await pool.query<MemoryEntry>(
        `SELECT id, type, content, "sessionId", tags, "createdAt"
         FROM agent_memory
         WHERE "appId" = 'panteon' AND type = $1
         ORDER BY "createdAt" DESC
         LIMIT $2`,
        [type, limit]
    );
    return result.rows;
}

/**
 * Format retrieved memories for injection into a system prompt.
 */
export function formatMemoriesForContext(memories: MemoryEntry[]): string {
    if (!memories.length) return '';

    const preferences = memories.filter(m => m.type === 'preference');
    const other = memories.filter(m => m.type !== 'preference');

    const lines: string[] = ['## What You Know From Memory'];

    if (preferences.length) {
        lines.push('\n### User Preferences');
        preferences.forEach(m => lines.push(`- ${m.content}`));
    }

    if (other.length) {
        lines.push('\n### Relevant Past Conclusions');
        other.forEach(m => {
            const date = new Date(m.createdAt).toISOString().slice(0, 10);
            lines.push(`- [${date}] ${m.content}`);
        });
    }

    return lines.join('\n') + '\n\n';
}
