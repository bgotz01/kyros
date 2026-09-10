-- AlterTable
ALTER TABLE "EngineScore" ADD COLUMN     "baselineId" TEXT,
ADD COLUMN     "incentiveAction" TEXT,
ADD COLUMN     "incentivesLevel" INTEGER,
ADD COLUMN     "inflectionLevel" INTEGER,
ADD COLUMN     "inversionLevel" INTEGER,
ADD COLUMN     "paradigmTag" TEXT,
ADD COLUMN     "precedentId" TEXT,
ADD COLUMN     "precedentName" TEXT,
ADD COLUMN     "pressureId" TEXT,
ALTER COLUMN "magnitude" DROP NOT NULL;
