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


const vacancysRedis = new getVacancysFromRedis();
const vacancysRepositoryDataBase = new VacancyRepository();

const vacancyFilterRepository = new VacancyFilterRepository();

function getNextFreeRefreshAt(filteredAt: Date | null) {
    return filteredAt ? addDays(filteredAt, VACANCY_FREE_REFRESH_DAYS) : null;
}

// Roda a IA sobre o perfil atual. null = falha da IA, [] = perfil sem habilidades ou nenhuma vaga compatível
async function runVacancyFilter(userId: string): Promise<VacancyDTO[] | null> {
    const [vacancies, skills, experiences] = await Promise.all([
        vacancysRepositoryDataBase.getVacancys(),
        getSkillByUserId(userId),
        getExperienceByUserId(userId)
    ]);

    if (skills.length === 0) return [];

    return await filterVacanciesBaseOfUserProfileWithAgenteAI(vacancies.filter((v) => v.active), skills, experiences);
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
async function filterVacanciesBaseOfUserProfileWithAgenteAI(vacancies: VacancyDTO[], skills: SkillDTO[], experiences: ExperienceDTO[]): Promise<VacancyDTO[] | null> {
    const openAi = new HundleStudyWithOpenAi();

    const response = await openAi.filterVacancysToUser(
        skills,
        experiences,
        vacancies
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
