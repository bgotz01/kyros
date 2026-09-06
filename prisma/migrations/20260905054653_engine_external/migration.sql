-- CreateTable
CREATE TABLE "EngineExternal" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "repos" JSONB NOT NULL,
    "noRepo" BOOLEAN NOT NULL DEFAULT false,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineExternal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EngineExternal_paperId_key" ON "EngineExternal"("paperId");

-- CreateIndex
CREATE INDEX "EngineExternal_checkedAt_idx" ON "EngineExternal"("checkedAt" DESC);
