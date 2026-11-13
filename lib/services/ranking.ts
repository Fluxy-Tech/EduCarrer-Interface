import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GAPS_SECTION_TYPE, XP_PER_CORRECT_ANSWER, getRank } from "@/lib/utils/studyLevels";

interface RankingRow {
    userId: string;
    name: string | null;
    areaOfInterest: string | null;
    resumeAvailable: boolean;
    xp: number;
    levelsCompleted: number;
    studies: number;
    studiesCompleted: number;
    bestProgress: number;
}

// Ranking de desempenho dos usuários para recrutadores.
// Desempenho = XP total (melhor resultado de cada nível × XP por acerto); desempate por níveis concluídos.
export async function getUsersRanking(area: string | null, limit = 100) {
    const areaFilter = area ? Prisma.sql`AND u."areaOfInterest" = ${area}` : Prisma.empty;

    const rows = await prisma.$queryRaw<RankingRow[]>`
        WITH per_study AS (
            SELECT s."id", s."userId",
                   COUNT(g."id")::int AS total,
                   COUNT(g."id") FILTER (WHERE g."completed")::int AS done,
                   COALESCE(SUM(g."bestScore"), 0)::int AS score
            FROM "Study" s
            LEFT JOIN "StudySection" sec ON sec."studyId" = s."id" AND sec."type" = ${GAPS_SECTION_TYPE}
            LEFT JOIN "StudyGap" g ON g."sectionId" = sec."id"
            GROUP BY s."id", s."userId"
        )
        SELECT u."id" AS "userId",
               u."name",
               u."areaOfInterest",
               (u."resumeVisible" AND u."resumeKey" IS NOT NULL) AS "resumeAvailable",
               (SUM(p.score) * ${XP_PER_CORRECT_ANSWER})::int AS "xp",
               SUM(p.done)::int AS "levelsCompleted",
               COUNT(p."id")::int AS "studies",
               COUNT(p."id") FILTER (WHERE p.total > 0 AND p.done = p.total)::int AS "studiesCompleted",
               COALESCE(MAX(CASE WHEN p.total > 0 THEN (p.done * 100.0 / p.total) END), 0)::float AS "bestProgress"
        FROM "User" u
        JOIN per_study p ON p."userId" = u."id"
        WHERE u."role" <> 'recruiter' AND (u."banned" IS NULL OR u."banned" = false) ${areaFilter}
        GROUP BY u."id"
        HAVING SUM(p.score) > 0
        ORDER BY "xp" DESC, "levelsCompleted" DESC, u."name" ASC
        LIMIT ${limit}
    `;

    return rows.map((r, i) => ({
        position: i + 1,
        userId: r.userId,
        name: r.name || "Candidato sem nome",
        areaOfInterest: r.areaOfInterest,
        resumeAvailable: r.resumeAvailable,
        xp: r.xp,
        levelsCompleted: r.levelsCompleted,
        studies: r.studies,
        studiesCompleted: r.studiesCompleted,
        // Patente da melhor trilha do usuário
        rank: getRank(Math.round(r.bestProgress)),
        bestProgress: Math.round(r.bestProgress),
    }));
}
