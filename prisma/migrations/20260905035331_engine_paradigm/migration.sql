-- AlterTable
ALTER TABLE "EngineScore" ADD COLUMN     "category" TEXT NOT NULL DEFAULT 'Unclassified',
ADD COLUMN     "corePremise" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "previous" JSONB,
ADD COLUMN     "previousParadigm" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "proposed" JSONB;
