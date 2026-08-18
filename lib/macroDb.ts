// ─── Macro-framework DB client ────────────────────────────────────────────────
// Separate postgres connection to the macro-framework database.
// Uses pg pool singleton to avoid exhausting connections in dev hot-reloads.

import { Pool } from 'pg';

const globalForMacro = globalThis as unknown as { macroPool?: Pool };

export const macroDb =
    globalForMacro.macroPool ??
    new Pool({ connectionString: process.env.MACRO_FRAMEWORK_DATABASE_URL });

if (process.env.NODE_ENV !== 'production') globalForMacro.macroPool = macroDb;
