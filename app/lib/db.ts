/**
 * Database connection pool
 *
 * Single pg Pool instance shared across all Route Handlers.
 * Server-side only — never import this in client components.
 */

import { Pool } from 'pg';

declare global {
    // Persist pool across Next.js hot-reloads in development
    // eslint-disable-next-line no-var
    var _pgPool: Pool | undefined;
}

function createPool() {
    return new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 5_000,
    });
}

const pool: Pool = globalThis._pgPool ?? createPool();

if (process.env.NODE_ENV !== 'production') {
    globalThis._pgPool = pool;
}

export default pool;
