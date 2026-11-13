import { prisma } from "@/lib/prisma";
import { GAPS_SECTION_TYPE } from "@/lib/utils/studyLevels";

// Métricas de evolução dos estudos para o painel administrativo. Todos os usuários entram, inclusive administradores.

const TZ = "America/Sao_Paulo";

interface StudyProgressRow {
    studyId: string;
    userId: string;
    totalLevels: number;
    completedLevels: number;
    lastCompletedAt: Date | null;
}

interface MonthCountRow {
    month: string;
    count: number;
}

export interface FunnelStage {
    key: "users" | "withStudy" | "half" | "completed";
    label: string;
    count: number;
    // Percentual em relação ao total de usuários
    percentOfUsers: number;
    // Percentual em relação à etapa anterior do funil
    percentOfPrevious: number | null;
}

export interface StudyEvolutionMetrics {
    funnel: FunnelStage[];
    totals: {
        users: number;
        studies: number;
        studiesPerUserWithStudy: number;
        averageProgress: number;
        studiesHalf: number;
        studiesCompleted: number;
        levelsCompleted: number;
    };
    distribution: { label: string; count: number }[];
    evolution: {
        month: string;
        newUsers: number;
        studiesCreated: number;
        levelsCompleted: number;
        studiesCompleted: number;
    }[];
}

const percent = (part: number, total: number) => (total > 0 ? Number(((part / total) * 100).toFixed(1)) : 0);

function progressOf(row: StudyProgressRow) {
    return row.totalLevels > 0 ? (row.completedLevels / row.totalLevels) * 100 : 0;
}

// Lista dos últimos N meses no formato YYYY-MM (mês atual incluso)
function lastMonths(months: number): string[] {
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: TZ }));
    const list: string[] = [];

    for (let i = months - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        list.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    return list;
}

function toMap(rows: MonthCountRow[]) {
    return new Map(rows.map((r) => [r.month, Number(r.count)]));
}

export async function getStudyEvolutionMetrics(months = 6): Promise<StudyEvolutionMetrics> {
    const range = lastMonths(months);
    const since = new Date(`${range[0]}-01T00:00:00-03:00`);

    const [totalUsers, studies, usersByMonth, studiesByMonth, levelsByMonth] = await Promise.all([
        prisma.user.count(),

        // Progresso de cada estudo: níveis são as lacunas da seção de trilha
        prisma.$queryRaw<StudyProgressRow[]>`
            SELECT s."id" AS "studyId",
                   s."userId" AS "userId",
                   COUNT(g."id")::int AS "totalLevels",
                   COUNT(g."id") FILTER (WHERE g."completed")::int AS "completedLevels",
                   MAX(g."completedAt") AS "lastCompletedAt"
            FROM "Study" s
            LEFT JOIN "StudySection" sec ON sec."studyId" = s."id" AND sec."type" = ${GAPS_SECTION_TYPE}
            LEFT JOIN "StudyGap" g ON g."sectionId" = sec."id"
            GROUP BY s."id", s."userId"
        `,

        prisma.$queryRaw<MonthCountRow[]>`
            SELECT to_char((u."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}, 'YYYY-MM') AS "month", COUNT(*)::int AS "count"
            FROM "User" u
            WHERE u."createdAt" >= ${since}
            GROUP BY 1
        `,

        prisma.$queryRaw<MonthCountRow[]>`
            SELECT to_char((s."createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}, 'YYYY-MM') AS "month", COUNT(*)::int AS "count"
            FROM "Study" s
            WHERE s."createdAt" >= ${since}
            GROUP BY 1
        `,

        prisma.$queryRaw<MonthCountRow[]>`
            SELECT to_char((g."completedAt" AT TIME ZONE 'UTC') AT TIME ZONE ${TZ}, 'YYYY-MM') AS "month", COUNT(*)::int AS "count"
            FROM "StudyGap" g
            WHERE g."completed" AND g."completedAt" >= ${since}
            GROUP BY 1
        `,
    ]);

    // Só estudos com trilha entram nas métricas de progresso
    const withLevels = studies.filter((s) => s.totalLevels > 0);

    const usersWithStudy = new Set(studies.map((s) => s.userId));
    const usersHalf = new Set(withLevels.filter((s) => progressOf(s) >= 50).map((s) => s.userId));
    const usersCompleted = new Set(withLevels.filter((s) => progressOf(s) >= 100).map((s) => s.userId));

    const stages: Omit<FunnelStage, "percentOfUsers" | "percentOfPrevious">[] = [
        { key: "users", label: "Usuários na plataforma", count: totalUsers },
        { key: "withStudy", label: "Criaram estudo para uma vaga", count: usersWithStudy.size },
        { key: "half", label: "Evoluíram 50% de um estudo", count: usersHalf.size },
        { key: "completed", label: "Concluíram 100% de um estudo", count: usersCompleted.size },
    ];

    const funnel: FunnelStage[] = stages.map((stage, i) => ({
        ...stage,
        percentOfUsers: percent(stage.count, totalUsers),
        percentOfPrevious: i === 0 ? null : percent(stage.count, stages[i - 1].count),
    }));

    const buckets = [
        { label: "Não iniciados (0%)", test: (p: number) => p === 0 },
        { label: "Começaram (1–49%)", test: (p: number) => p > 0 && p < 50 },
        { label: "Avançados (50–99%)", test: (p: number) => p >= 50 && p < 100 },
        { label: "Concluídos (100%)", test: (p: number) => p >= 100 },
    ];

    const distribution = buckets.map((b) => ({
        label: b.label,
        count: withLevels.filter((s) => b.test(progressOf(s))).length,
    }));

    // Mês em que o estudo foi concluído = mês do último nível concluído
    const completedByMonth = new Map<string, number>();
    for (const s of withLevels) {
        if (progressOf(s) < 100 || !s.lastCompletedAt) continue;
        const local = new Date(new Date(s.lastCompletedAt).toLocaleString("en-US", { timeZone: TZ }));
        const key = `${local.getFullYear()}-${String(local.getMonth() + 1).padStart(2, "0")}`;
        completedByMonth.set(key, (completedByMonth.get(key) ?? 0) + 1);
    }

    const users = toMap(usersByMonth);
    const created = toMap(studiesByMonth);
    const levels = toMap(levelsByMonth);

    const evolution = range.map((month) => ({
        month,
        newUsers: users.get(month) ?? 0,
        studiesCreated: created.get(month) ?? 0,
        levelsCompleted: levels.get(month) ?? 0,
        studiesCompleted: completedByMonth.get(month) ?? 0,
    }));

    const averageProgress = withLevels.length > 0
        ? Number((withLevels.reduce((acc, s) => acc + progressOf(s), 0) / withLevels.length).toFixed(1))
        : 0;

    return {
        funnel,
        totals: {
            users: totalUsers,
            studies: studies.length,
            studiesPerUserWithStudy: usersWithStudy.size > 0 ? Number((studies.length / usersWithStudy.size).toFixed(1)) : 0,
            averageProgress,
            studiesHalf: withLevels.filter((s) => progressOf(s) >= 50).length,
            studiesCompleted: withLevels.filter((s) => progressOf(s) >= 100).length,
            levelsCompleted: withLevels.reduce((acc, s) => acc + s.completedLevels, 0),
        },
        distribution,
        evolution,
    };
}
