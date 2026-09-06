-- AlterTable
ALTER TABLE "EngineCritique" ADD COLUMN     "completionTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promptTokens" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "EngineScore" ADD COLUMN     "completionTokens" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "promptTokens" INTEGER NOT NULL DEFAULT 0;
