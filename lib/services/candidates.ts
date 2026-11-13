import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";
import { refundCredits, spendCredits } from "@/lib/services/credits";
import { CANDIDATE_UNLOCK_DAYS } from "@/lib/credits/config";
import { GAPS_SECTION_TYPE, XP_PER_CORRECT_ANSWER } from "@/lib/utils/studyLevels";

interface Viewer {
    id: string;
    isAdmin: boolean;
}

// Desbloqueio ativo do recrutador para o candidato (null quando nunca desbloqueou ou já expirou)
export async function getActiveUnlock(recruiterId: string, candidateId: string) {
    return await prisma.candidateUnlock.findFirst({
        where: { recruiterId, candidateId, expiresAt: { gt: new Date() } },
        select: { unlockedAt: true, expiresAt: true },
    });
}

export async function canViewCandidate(viewer: Viewer, candidateId: string) {
    return viewer.isAdmin || !!(await getActiveUnlock(viewer.id, candidateId));
}

// Cobra os créditos e libera o candidato por CANDIDATE_UNLOCK_DAYS dias. Com acesso ativo não cobra de novo
export async function unlockCandidate(recruiterId: string, candidateId: string) {
    const candidate = await prisma.user.findUnique({ where: { id: candidateId }, select: { id: true, role: true, name: true } });

    if (!candidate || candidate.role === "recruiter") {
        return { status: false as const, message: "Candidato não encontrado" };
    }

    const active = await getActiveUnlock(recruiterId, candidateId);
    if (active) {
        return { status: true as const, alreadyUnlocked: true, expiresAt: active.expiresAt, message: "Este candidato já está desbloqueado" };
    }

    const spend = await spendCredits(recruiterId, "CANDIDATE_UNLOCK", candidateId);
    if (!spend.ok) return { status: false as const, insufficient: spend };

    try {
        const expiresAt = addDays(new Date(), CANDIDATE_UNLOCK_DAYS);

        // Renovação reaproveita o registro anterior (já expirado)
        const unlock = await prisma.candidateUnlock.upsert({
            where: { recruiterId_candidateId: { recruiterId, candidateId } },
            update: { unlockedAt: new Date(), expiresAt },
            create: { recruiterId, candidateId, expiresAt },
        });

        return {
            status: true as const,
            alreadyUnlocked: false,
            expiresAt: unlock.expiresAt,
            balance: spend.balance,
            message: `${candidate.name || "Candidato"} desbloqueado por ${CANDIDATE_UNLOCK_DAYS} dias`,
        };
    } catch (e) {
        console.error("Erro ao desbloquear candidato:", e);
        await refundCredits(recruiterId, spend.charge);
        return { status: false as const, message: "Não conseguimos desbloquear agora. Seus créditos foram devolvidos." };
    }
}

// Perfil completo do candidato para o recrutador: links, currículo, habilidades, experiências e estudos concluídos
export async function getCandidateDetails(viewer: Viewer, candidateId: string) {
    const unlock = viewer.isAdmin ? null : await getActiveUnlock(viewer.id, candidateId);

    if (!viewer.isAdmin && !unlock) {
        return { status: false as const, locked: true, message: "Desbloqueie o candidato para ver os dados" };
    }

    const user = await prisma.user.findUnique({
        where: { id: candidateId },
        select: {
            id: true,
            name: true,
            role: true,
            areaOfInterest: true,
            linkedinUrl: true,
            portfolioUrl: true,
            resumeKey: true,
            resumeVisible: true,
            skills: { orderBy: { level: "desc" }, select: { id: true, name: true, level: true, about: true } },
            experiences: {
                orderBy: [{ currentJob: "desc" }, { startDate: "desc" }],
                select: { id: true, name: true, seniority: true, about: true, startDate: true, endDate: true, currentJob: true },
            },
            study: {
                orderBy: { createdAt: "desc" },
                select: {
                    id: true,
                    title: true,
                    createdAt: true,
                    vacancy: { select: { title: true, company: true, level: true } },
                    sections: {
                        where: { type: GAPS_SECTION_TYPE },
                        select: { gaps: { select: { skill: true, completed: true, completedAt: true, bestScore: true } } },
                    },
                },
            },
        },
    });

    if (!user || user.role === "recruiter") {
        return { status: false as const, locked: false, message: "Candidato não encontrado" };
    }

    // Estudo concluído = todos os níveis (lacunas) da trilha concluídos
    const completedStudies = user.study
        .map((s) => {
            const levels = s.sections.flatMap((sec) => sec.gaps);
            const done = levels.length > 0 && levels.every((l) => l.completed);
            const completedAt = levels.reduce<Date | null>((max, l) => (l.completedAt && (!max || l.completedAt > max) ? l.completedAt : max), null);

            return {
                id: s.id,
                title: s.title,
                vacancy: s.vacancy,
                levels: levels.length,
                skills: levels.map((l) => l.skill),
                xp: levels.reduce((acc, l) => acc + l.bestScore * XP_PER_CORRECT_ANSWER, 0),
                completedAt,
                done,
            };
        })
        .filter((s) => s.done)
        .map(({ done, ...rest }) => rest);

    return {
        status: true as const,
        candidate: {
            id: user.id,
            name: user.name || "Candidato sem nome",
            areaOfInterest: user.areaOfInterest,
            linkedinUrl: user.linkedinUrl,
            portfolioUrl: user.portfolioUrl,
            resumeAvailable: !!user.resumeKey && user.resumeVisible,
            skills: user.skills,
            experiences: user.experiences,
            completedStudies,
            totalStudies: user.study.length,
            unlockExpiresAt: unlock?.expiresAt ?? null,
        },
    };
}
