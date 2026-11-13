-- Área de interesse passa a aceitar várias opções (String? -> String[])
ALTER TABLE "User" ADD COLUMN "areasOfInterest" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Preserva a área que cada usuário já tinha escolhido
UPDATE "User" SET "areasOfInterest" = ARRAY["areaOfInterest"] WHERE "areaOfInterest" IS NOT NULL;

ALTER TABLE "User" DROP COLUMN "areaOfInterest";
