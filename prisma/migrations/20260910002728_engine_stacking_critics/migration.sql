-- DropIndex
DROP INDEX "EngineCritique_scoreId_key";

-- AlterTable
ALTER TABLE "EngineCritique" ADD COLUMN     "round" INTEGER NOT NULL DEFAULT 1;

-- CreateIndex
CREATE INDEX "EngineCritique_scoreId_round_idx" ON "EngineCritique"("scoreId", "round");
