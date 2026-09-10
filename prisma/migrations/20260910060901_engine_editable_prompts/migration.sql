-- AlterTable
ALTER TABLE "EngineCritique" ADD COLUMN     "promptVersion" INTEGER;

-- AlterTable
ALTER TABLE "EngineScore" ADD COLUMN     "promptVersion" INTEGER;

-- CreateTable
CREATE TABLE "EnginePrompt" (
    "id" TEXT NOT NULL,
    "seat" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "text" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnginePrompt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnginePrompt_seat_version_idx" ON "EnginePrompt"("seat", "version" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "EnginePrompt_seat_version_key" ON "EnginePrompt"("seat", "version");
