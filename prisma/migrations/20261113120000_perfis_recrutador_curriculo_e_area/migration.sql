-- Perfis de usuário (user, recruiter, admin), área de interesse, currículo para recrutadores e vagas cadastradas por recrutadores

-- AlterTable
ALTER TABLE "User" ADD COLUMN "areaOfInterest" TEXT,
ADD COLUMN "resumeKey" TEXT,
ADD COLUMN "resumeFileName" TEXT,
ADD COLUMN "resumeVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "resumeUploadedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Vacancy" ADD COLUMN "createdById" TEXT;

-- CreateIndex
CREATE INDEX "Vacancy_createdById_idx" ON "Vacancy"("createdById");

-- AddForeignKey
ALTER TABLE "Vacancy" ADD CONSTRAINT "Vacancy_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
