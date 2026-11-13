import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { GAPS_SECTION_TYPE, XP_PER_CORRECT_ANSWER, getRank } from "@/lib/utils/studyLevels";
import { RANK_BONUS_LINKS, RANK_BONUS_RESUME } from "@/lib/users/roles";

interface RankingRow {
    userId: string;
    name: string | null;
    areasOfInterest: string[];
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    resumeAvailable: boolean;
    xp: number;
    linksBonus: number;
    resumeBonus: number;
    points: number;
    levelsCompleted: number;
    studies: number;
    studiesCompleted: number;
    bestProgress: number;
    unlockExpiresAt: Date | null;
}

interface RankingOptions {
    // Áreas de interesse selecionadas: entra quem tiver ao menos uma delas (vazio = todas)
    areas: string[];
    // Busca nas habilidades do candidato (ex.: "React", "Node")
    stack: string | null;
    viewerId: string;
    // Admin vê todos os dados sem precisar desbloquear
    viewerIsAdmin: boolean;
    limit?: number;
}

// Escapa curingas do LIKE para a busca por stack ser literal
const likeTerm = (value: string) => `%${value.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;

// Ranking de candidatos para recrutadores.
// Pontos = XP dos desafios + 50 (LinkedIn ou portfólio) + 100 (currículo liberado para recrutadores).
// Dados de contato e currículo só saem para quem desbloqueou o candidato nos últimos 60 dias (ou admin).
export async function getUsersRanking({ areas, stack, viewerId, viewerIsAdmin, limit = 100 }: RankingOptions) {
    const areaFilter = areas.length ? Prisma.sql`AND u."areasOfInterest" && ${areas}::text[]` : Prisma.empty;
    const stackFilter = stack
        ? Prisma.sql`AND EXISTS (SELECT 1 FROM "Skill" sk WHERE sk."userId" = u."id" AND sk."name" ILIKE ${likeTerm(stack)})`
        : Prisma.empty;

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
        ),
        per_user AS (
            SELECT "userId",
                   SUM(score)::int AS score,
                   SUM(done)::int AS done,
                   COUNT("id")::int AS studies,
                   COUNT("id") FILTER (WHERE total > 0 AND done = total)::int AS completed,
                   COALESCE(MAX(CASE WHEN total > 0 THEN done * 100.0 / total END), 0)::float AS best
            FROM per_study
            GROUP BY "userId"
        ),
        scored AS (
            SELECT u."id" AS "userId",
                   u."name",
                   u."areasOfInterest",
                   u."linkedinUrl",
                   u."portfolioUrl",
                   (u."resumeVisible" AND u."resumeKey" IS NOT NULL) AS "resumeAvailable",
                   (COALESCE(p.score, 0) * ${XP_PER_CORRECT_ANSWER})::int AS "xp",
                   (CASE WHEN COALESCE(u."linkedinUrl", u."portfolioUrl") IS NOT NULL THEN ${RANK_BONUS_LINKS} ELSE 0 END)::int AS "linksBonus",
                   (CASE WHEN u."resumeVisible" AND u."resumeKey" IS NOT NULL THEN ${RANK_BONUS_RESUME} ELSE 0 END)::int AS "resumeBonus",
                   COALESCE(p.done, 0)::int AS "levelsCompleted",
                   COALESCE(p.studies, 0)::int AS "studies",
                   COALESCE(p.completed, 0)::int AS "studiesCompleted",
                   COALESCE(p.best, 0)::float AS "bestProgress",
                   cu."expiresAt" AS "unlockExpiresAt"
            FROM "User" u
            LEFT JOIN per_user p ON p."userId" = u."id"
            LEFT JOIN "CandidateUnlock" cu ON cu."candidateId" = u."id" AND cu."recruiterId" = ${viewerId} AND cu."expiresAt" > NOW()
            WHERE u."role" <> 'recruiter' AND u."banned" = false ${areaFilter} ${stackFilter}
        )
        SELECT *, ("xp" + "linksBonus" + "resumeBonus")::int AS "points"
        FROM scored
        WHERE ("xp" + "linksBonus" + "resumeBonus") > 0
        ORDER BY "points" DESC, "levelsCompleted" DESC, "name" ASC
        LIMIT ${limit}
    `;

    return rows.map((r, i) => {
        const unlocked = viewerIsAdmin || !!r.unlockExpiresAt;

        return {
            position: i + 1,
            userId: r.userId,
            name: r.name || "Candidato sem nome",
            areasOfInterest: r.areasOfInterest,
            points: r.points,
            xp: r.xp,
            linksBonus: r.linksBonus,
            resumeBonus: r.resumeBonus,
            levelsCompleted: r.levelsCompleted,
            studies: r.studies,
            studiesCompleted: r.studiesCompleted,
            // Patente da melhor trilha do usuário
            rank: getRank(Math.round(r.bestProgress)),
            unlocked,
            unlockExpiresAt: viewerIsAdmin ? null : r.unlockExpiresAt,
            // Só depois do desbloqueio
            linkedinUrl: unlocked ? r.linkedinUrl : null,
            portfolioUrl: unlocked ? r.portfolioUrl : null,
            resumeAvailable: unlocked ? r.resumeAvailable : false,
        };
    });
}

// Pontos de ranking de um usuário, com a mesma fórmula do ranking dos recrutadores:
// XP dos desafios + bônus de links + bônus de currículo liberado
export async function getUserRankPoints(user: {
    id: string;
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    resumeKey: string | null;
    resumeVisible: boolean;
}) {
    const { _sum } = await prisma.studyGap.aggregate({
        _sum: { bestScore: true },
        where: { section: { type: GAPS_SECTION_TYPE, study: { userId: user.id } } },
    });

    const xp = (_sum.bestScore ?? 0) * XP_PER_CORRECT_ANSWER;
    const linksBonus = user.linkedinUrl || user.portfolioUrl ? RANK_BONUS_LINKS : 0;
    const resumeBonus = user.resumeVisible && user.resumeKey ? RANK_BONUS_RESUME : 0;

    return xp + linksBonus + resumeBonus;
}
