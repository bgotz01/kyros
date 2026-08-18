// ─── Prisma client singleton ──────────────────────────────────────────────────
// Next.js hot-reloads in dev, which would spawn a new PrismaClient on every
// module reload and exhaust the connection pool. The global pattern prevents
// that while staying safe in production (where the module is loaded once).

import { PrismaClient } from './generated/prisma/client';

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db;
