-- Os níveis da trilha passam a ser as lacunas (StudyGap): o progresso e as perguntas saem da seção e vão para a lacuna

-- DropForeignKey
ALTER TABLE "StudyQuestion" DROP CONSTRAINT "StudyQuestion_sectionId_fkey";

-- DropIndex
DROP INDEX "StudyQuestion_sectionId_idx";

-- AlterTable
ALTER TABLE "StudyGap" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bestScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "StudyQuestion" DROP COLUMN "sectionId",
ADD COLUMN     "gapId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "StudySection" DROP COLUMN "attempts",
DROP COLUMN "bestScore",
DROP COLUMN "completed",
DROP COLUMN "completedAt";

-- CreateIndex
CREATE INDEX "StudyQuestion_gapId_idx" ON "StudyQuestion"("gapId");

-- AddForeignKey
ALTER TABLE "StudyQuestion" ADD CONSTRAINT "StudyQuestion_gapId_fkey" FOREIGN KEY ("gapId") REFERENCES "StudyGap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

