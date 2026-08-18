-- CreateEnum
CREATE TYPE "MemoryCategory" AS ENUM ('theme', 'preference', 'good_idea', 'dismissed', 'question');

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "mode" TEXT NOT NULL,
    "title" TEXT,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "turnsJson" JSONB NOT NULL DEFAULT '[]',
    "parallelMessagesJson" JSONB,
    "agentsJson" JSONB NOT NULL DEFAULT '[]',
    "refIds" JSONB NOT NULL DEFAULT '[]',
    "selectedIdxs" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemoryEntry" (
    "id" TEXT NOT NULL,
    "category" "MemoryCategory" NOT NULL,
    "text" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemoryEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemorySettings" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "lastDistilledAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemorySettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Session_savedAt_idx" ON "Session"("savedAt" DESC);

-- CreateIndex
CREATE INDEX "MemoryEntry_category_idx" ON "MemoryEntry"("category");

-- CreateIndex
CREATE INDEX "MemoryEntry_addedAt_idx" ON "MemoryEntry"("addedAt" DESC);

-- AddForeignKey
ALTER TABLE "MemoryEntry" ADD CONSTRAINT "MemoryEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
