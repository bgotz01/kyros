-- CreateTable
CREATE TABLE "EngineRun" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "weekIdx" INTEGER NOT NULL,
    "heading" TEXT NOT NULL,
    "analystModel" TEXT NOT NULL,
    "criticModel" TEXT,
    "frameReviewedAt" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EngineRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineScore" (
    "id" TEXT NOT NULL,
    "runId" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" JSONB NOT NULL,
    "level" TEXT NOT NULL,
    "inversion" INTEGER NOT NULL,
    "inverting" JSONB NOT NULL,
    "magnitude" TEXT NOT NULL,
    "incentives" INTEGER NOT NULL,
    "bottleneck" JSONB NOT NULL,
    "inflection" INTEGER NOT NULL,
    "unprecedented" JSONB NOT NULL,
    "product" INTEGER NOT NULL,
    "verdict" TEXT NOT NULL,
    "confidence" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "truncated" BOOLEAN NOT NULL DEFAULT false,
    "scoredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineCritique" (
    "id" TEXT NOT NULL,
    "scoreId" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineCritique_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EngineNote" (
    "id" TEXT NOT NULL,
    "critiqueId" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "agrees" BOOLEAN NOT NULL,
    "reasoning" JSONB NOT NULL,
    "proposedScore" INTEGER,
    "proposedBullets" JSONB,
    "resolution" TEXT,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "EngineNote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EngineRun_domain_year_weekIdx_startedAt_idx" ON "EngineRun"("domain", "year", "weekIdx", "startedAt" DESC);

-- CreateIndex
CREATE INDEX "EngineRun_startedAt_idx" ON "EngineRun"("startedAt" DESC);

-- CreateIndex
CREATE INDEX "EngineScore_runId_idx" ON "EngineScore"("runId");

-- CreateIndex
CREATE INDEX "EngineScore_paperId_idx" ON "EngineScore"("paperId");

-- CreateIndex
CREATE INDEX "EngineScore_product_idx" ON "EngineScore"("product" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "EngineCritique_scoreId_key" ON "EngineCritique"("scoreId");

-- CreateIndex
CREATE INDEX "EngineNote_critiqueId_idx" ON "EngineNote"("critiqueId");

-- AddForeignKey
ALTER TABLE "EngineScore" ADD CONSTRAINT "EngineScore_runId_fkey" FOREIGN KEY ("runId") REFERENCES "EngineRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineCritique" ADD CONSTRAINT "EngineCritique_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "EngineScore"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EngineNote" ADD CONSTRAINT "EngineNote_critiqueId_fkey" FOREIGN KEY ("critiqueId") REFERENCES "EngineCritique"("id") ON DELETE CASCADE ON UPDATE CASCADE;
