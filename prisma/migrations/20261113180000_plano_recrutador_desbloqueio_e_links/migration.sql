-- Links de LinkedIn/portfólio do candidato e desbloqueio de candidatos pelos recrutadores (60 dias por desbloqueio)

-- AlterTable
ALTER TABLE "User" ADD COLUMN "linkedinUrl" TEXT,
ADD COLUMN "portfolioUrl" TEXT;

-- CreateTable
CREATE TABLE "CandidateUnlock" (
    "id" TEXT NOT NULL,
    "recruiterId" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "unlockedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CandidateUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CandidateUnlock_candidateId_idx" ON "CandidateUnlock"("candidateId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateUnlock_recruiterId_candidateId_key" ON "CandidateUnlock"("recruiterId", "candidateId");

-- AddForeignKey
ALTER TABLE "CandidateUnlock" ADD CONSTRAINT "CandidateUnlock_recruiterId_fkey" FOREIGN KEY ("recruiterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateUnlock" ADD CONSTRAINT "CandidateUnlock_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
