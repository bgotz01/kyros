-- CreateTable
CREATE TABLE "EngineAside" (
    "id" TEXT NOT NULL,
    "domain" TEXT NOT NULL,
    "year" TEXT NOT NULL,
    "weekIdx" INTEGER NOT NULL,
    "n" INTEGER NOT NULL,
    "paperId" TEXT,
    "setAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EngineAside_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EngineAside_domain_year_weekIdx_idx" ON "EngineAside"("domain", "year", "weekIdx");

-- CreateIndex
CREATE UNIQUE INDEX "EngineAside_domain_year_weekIdx_n_key" ON "EngineAside"("domain", "year", "weekIdx", "n");
