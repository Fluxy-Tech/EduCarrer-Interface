import { getVacancysFromRedis } from "@/lib/redis/vacancy";
import { VacancyRepository } from "@/lib/repositories/vacancy";
import { CreateVacancyData, VacancyDTO } from "@/lib/interfaces/vacancy.interface";
import { ExperienceDTO } from "@/lib/interfaces/experience.interface";
import { SkillDTO } from "@/lib/interfaces/skill.interface";
import { clearVacancysCache } from "@/lib/redis/clearCacheVacancys";
import { getSkillByUserId } from "@/lib/services/skill";
import { getExperienceByUserId } from "@/lib/services/experience";
import { HundleStudyWithOpenAi } from "@/lib/services/hundleStudyWithOpenAi";
import { VacancyFilterRepository } from "@/lib/repositories/vacancyFilter";
import { refundCredits, spendCredits } from "@/lib/services/credits";
import { VACANCY_FREE_REFRESH_DAYS } from "@/lib/credits/config";
import { checkIfTheDateTimeHasPassedACertainNumberOfDays } from "@/lib/utils/checkIfTheDateTimeHasPassedACertainNumberOfDays";
import { addDays } from "date-fns";
import { prisma } from "@/lib/prisma";


const vacancysRedis = new getVacancysFromRedis();
const vacancysRepositoryDataBase = new VacancyRepository();

const vacancyFilterRepository = new VacancyFilterRepository();

function getNextFreeRefreshAt(filteredAt: Date | null) {
    return filteredAt ? addDays(filteredAt, VACANCY_FREE_REFRESH_DAYS) : null;
}

// Roda a IA sobre o perfil atual. null = falha da IA, [] = perfil sem habilidades ou nenhuma vaga compatível
async function runVacancyFilter(userId: string): Promise<VacancyDTO[] | null> {
    const [vacancies, skills, experiences, user] = await Promise.all([
        vacancysRepositoryDataBase.getVacancys(),
        getSkillByUserId(userId),
        getExperienceByUserId(userId),
        prisma.user.findUnique({ where: { id: userId }, select: { areasOfInterest: true } })
    ]);

    if (skills.length === 0) return [];

    return await filterVacanciesBaseOfUserProfileWithAgenteAI(
        vacancies.filter((v) => v.active),
        skills,
        experiences,
        user?.areasOfInterest ?? []
    );
}

// Vagas do usuário: a filtragem da IA fica salva e só é refeita (grátis) a cada VACANCY_FREE_REFRESH_DAYS dias
export async function getVacancys(userId: string) {
    const saved = await vacancyFilterRepository.getByUserId(userId);

    if (saved && !checkIfTheDateTimeHasPassedACertainNumberOfDays(saved.filteredAt, VACANCY_FREE_REFRESH_DAYS)) {
        return {
            vacancys: await vacancysRepositoryDataBase.getActiveVacancysByIds(saved.vacancyIds),
            filteredAt: saved.filteredAt,
            nextFreeRefreshAt: getNextFreeRefreshAt(saved.filteredAt)
        };
    }

    const filtered = await runVacancyFilter(userId);

    // Sem resultado não salva, para que o usuário receba vagas assim que completar o perfil
    if (!filtered || filtered.length === 0) {
        return {
            vacancys: saved ? await vacancysRepositoryDataBase.getActiveVacancysByIds(saved.vacancyIds) : [],
            filteredAt: saved?.filteredAt ?? null,
            nextFreeRefreshAt: null
        };
    }

    const record = await vacancyFilterRepository.save(userId, filtered.map((v) => v.id));

    return {
        vacancys: filtered,
        filteredAt: record.filteredAt,
        nextFreeRefreshAt: getNextFreeRefreshAt(record.filteredAt)
    };
}

// Atualização antes do prazo gratuito: cobra créditos e estorna se a IA falhar
export async function refreshVacancys(userId: string) {
    const skills = await getSkillByUserId(userId);

    if (skills.length === 0) {
        return {
            status: false as const,
            message: "Cadastre ao menos 1 habilidade no seu perfil para receber vagas recomendadas"
        };
    }

    const spend = await spendCredits(userId, "VACANCY_REFRESH");

    if (!spend.ok) {
        return { status: false as const, insufficient: spend };
    }

    const filtered = await runVacancyFilter(userId);

    if (filtered === null) {
        await refundCredits(userId, spend.charge);
        return {
            status: false as const,
            message: "Não conseguimos atualizar suas vagas agora. Seus créditos foram devolvidos."
        };
    }

    const record = await vacancyFilterRepository.save(userId, filtered.map((v) => v.id));

    return {
        status: true as const,
        message: filtered.length > 0 ? "Vagas atualizadas com base no seu perfil atual" : "Atualizamos, mas não encontramos vagas compatíveis com seu perfil agora",
        vacancys: filtered,
        filteredAt: record.filteredAt,
        nextFreeRefreshAt: getNextFreeRefreshAt(record.filteredAt),
        balance: spend.balance
    };
}

export async function getVacancysById(id: string) {
    const vacancy = await vacancysRedis.getVacanciesByIdFromRedis(id);

    if (vacancy) {
        return vacancy;
    }

    return await vacancysRepositoryDataBase.getVacancysById(id);
}

// Admin sempre lê direto do banco para editar a versão mais recente da vaga
export async function getVacancyByIdAdmin(id: string) {
    return await vacancysRepositoryDataBase.getVacancysById(id);
}

export async function createVacancy(data: CreateVacancyData) {
    await clearVacancysCache();
    return await vacancysRepositoryDataBase.createVacancy(data);
}

export async function updateVacancy(id: string, data: CreateVacancyData) {
    await clearVacancysCache();
    return await vacancysRepositoryDataBase.updateVacancy(id, data);
}

const recruiterVacancySelect = {
    id: true,
    title: true,
    company: true,
    level: true,
    modality: true,
    location: true,
    technologies: true,
    active: true,
    createdAt: true,
    _count: { select: { study: true } },
} as const;

// Vagas cadastradas por um recrutador (tela "Minhas vagas")
export async function getVacanciesByRecruiter(recruiterId: string) {
    return await prisma.vacancy.findMany({
        where: { createdById: recruiterId },
        orderBy: { createdAt: "desc" },
        select: recruiterVacancySelect,
    });
}

// Todas as vagas cadastradas por recrutadores, para o admin acompanhar e excluir
export async function getRecruiterVacanciesAdmin() {
    return await prisma.vacancy.findMany({
        where: { createdById: { not: null } },
        orderBy: { createdAt: "desc" },
        select: { ...recruiterVacancySelect, createdBy: { select: { id: true, name: true, email: true } } },
    });
}

export async function createRecruiterVacancy(recruiterId: string, data: CreateVacancyData) {
    return await createVacancy({ ...data, createdById: recruiterId });
}

// Exclusão pelo admin. Os estudos gerados para a vaga são removidos junto (cascade)
export async function deleteVacancy(id: string) {
    const vacancy = await prisma.vacancy.findUnique({ where: { id }, select: { id: true, _count: { select: { study: true } } } });

    if (!vacancy) return { status: false, message: "Vaga não encontrada" };

    await prisma.vacancy.delete({ where: { id } });
    await clearVacancysCache();

    return {
        status: true,
        message: vacancy._count.study > 0
            ? `Vaga excluída junto com ${vacancy._count.study} estudo(s) gerado(s) para ela`
            : "Vaga excluída",
    };
}

export async function getVacancysFromRedisAdmin() {
    return await vacancysRedis.getVacancysFromRedisAdmin()
}

export async function getNumberTotalVacancys() {
    return await vacancysRepositoryDataBase.getCountVacancies();
}

export async function getNumberTotalCompaniesByVacancys() {
    return await vacancysRepositoryDataBase.getCountCompaniesByVacancies();
}

// Filtrar vagas do usuario atraves do nosso agente de IA
async function filterVacanciesBaseOfUserProfileWithAgenteAI(vacancies: VacancyDTO[], skills: SkillDTO[], experiences: ExperienceDTO[], areasOfInterest: string[]): Promise<VacancyDTO[] | null> {
    const openAi = new HundleStudyWithOpenAi();

    const response = await openAi.filterVacancysToUser(
        skills,
        experiences,
        vacancies,
        areasOfInterest
    );

    if (!response) {
        return null;
    }

    let resAgentFilter: any;

    try {
        resAgentFilter = JSON.parse(response);
    } catch {
        return null;
    }

    if (!resAgentFilter.ids) {
        return null;
    }

    const vacancyIds = resAgentFilter.ids;

    if (!Array.isArray(vacancyIds) || vacancyIds.length === 0) {
        return [];
    }

    const vacanciesFiltered: VacancyDTO[] = []

    for (const id of vacancyIds) {
        const vacancyFindFirst = vacancies.find((v) => v.id == id);

        if (vacancyFindFirst) {
            vacanciesFiltered.push(vacancyFindFirst);
        }
    }

    return vacanciesFiltered;
}
