-- AlterTable
ALTER TABLE "EngineScore" ADD COLUMN     "incentivesHeadline" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "inflectionHeadline" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "inversionHeadline" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "outcomeKind" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "paradigm" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "paradigmImportance" INTEGER NOT NULL DEFAULT 0;
