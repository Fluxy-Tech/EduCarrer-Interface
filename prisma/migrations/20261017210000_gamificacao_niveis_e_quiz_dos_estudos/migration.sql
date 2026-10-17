-- AlterTable
ALTER TABLE "StudySection" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "bestScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "completed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "completedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "StudyQuestion" (
    "id" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "options" TEXT[],
    "answerIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyQuestion_sectionId_idx" ON "StudyQuestion"("sectionId");

-- AddForeignKey
ALTER TABLE "StudyQuestion" ADD CONSTRAINT "StudyQuestion_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "StudySection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

