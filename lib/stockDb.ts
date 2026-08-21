// ─── Stock-data DB client ─────────────────────────────────────────────────────
// Individual equity price history (historical_prices), company profiles and
// index constituents. Separate postgres connection from the macro database.
// Uses a pg pool singleton to avoid exhausting connections in dev hot-reloads.

import { Pool } from 'pg';

const globalForStock = globalThis as unknown as { stockPool?: Pool };

export const stockDb =
    globalForStock.stockPool ??
    new Pool({ connectionString: process.env.STOCKDATA_DATABASE_URL });

if (process.env.NODE_ENV !== 'production') globalForStock.stockPool = stockDb;
