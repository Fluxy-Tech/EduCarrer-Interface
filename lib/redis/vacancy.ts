import { redis } from "@/lib/redis/conection";
import { Vacancy } from "@/lib/entities/vacancy";
import { VacancyRepository } from "@/lib/repositories/vacancy";

import { VacancyDTO } from "@/lib/interfaces/vacancy.interface";

interface UsersVacancysCache {
    userId: string,
    vacancys: VacancyDTO[]
}

export class getVacancysFromRedis {

    async setVacancyInRedis(userId: string, vacancys: VacancyDTO[]) {
        const cacheKey = `vacancys:${userId}`;
        await redis.set(
            cacheKey,
            JSON.stringify(vacancys),
            "EX",
            3600
        );
    }

    async getVacancysFromRedis(userId: string): Promise<Vacancy[]> {
        try {
            const cacheKey = `vacancys:${userId}`;
            const cachedVacancysUser = await redis.get(cacheKey);

            if (cachedVacancysUser) {
                const vacancys: VacancyDTO[] = JSON.parse(cachedVacancysUser);

                if (vacancys.length > 0) {
                    console.log("Vacancies fetched from Redis cache.");

                    return vacancys.map(
                        (vacancy) =>
                            new Vacancy(
                                vacancy.id,
                                vacancy.title,
                                vacancy.description,
                                vacancy.company ?? null,
                                vacancy.modality ?? null,
                                vacancy.level ?? null,
                                vacancy.technologies,
                                vacancy.link ?? null,
                                vacancy.origin ?? null,
                                vacancy.location ?? null,
                                vacancy.salary ?? null,
                                new Date(vacancy.createdAt),
                                new Date(vacancy.updatedAt),
                                vacancy.active,
                                vacancy.matches ?? 0,
                                vacancy.score ?? 0
                            )
                    );
                }
            }

            return [];
        } catch (error) {
            console.error("Error fetching vacancies:", error);
            return [];
        }
    }

    async getVacancysFromRedisAdmin(): Promise<Vacancy[]> {
        try {
            const cacheKey = "vacancysadmin:list";
            const cachedVacancys = await redis.get(cacheKey) ?? null;

            if (cachedVacancys) {

                const vacancysData = JSON.parse(cachedVacancys);
                console.log("Vacancies fetched from Redis cache.");
                return vacancysData.map((v1: any) => new Vacancy(
                    v1.id,
                    v1.title,
                    v1.description,
                    v1.company,
                    v1.modality,
                    v1.level,
                    v1.technologies,
                    v1.link,
                    v1.origin,
                    v1.location,
                    v1.salary,
                    v1.createdAt,
                    v1.updatedAt,
                    v1.active,
                    null,
                    null
                ));
            }

            const getVacancysClass = new VacancyRepository();
            const vacancys = await getVacancysClass.getVacancys();

            // Não guarda lista vazia, senão vagas inseridas depois só aparecem quando o cache expirar
            if (vacancys.length > 0) {
                await redis.set(
                    cacheKey,
                    JSON.stringify(vacancys),
                    "EX", 3600
                ); // Cache por 1 hora
            }

            console.log("Vacancies fetched from database and cached.");

            return vacancys.map((v2: any) => new Vacancy(
                v2.id,
                v2.title,
                v2.description,
                v2.company,
                v2.modality,
                v2.level,
                v2.technologies,
                v2.link,
                v2.origin,
                v2.location,
                v2.salary,
                v2.createdAt,
                v2.updatedAt,
                v2.active,
                null,
                null
            ));

        } catch (e: any) {
            console.error("Error fetching vacancies from Redis:", e);
            return [];
        }
    }

    async getVacanciesByIdFromRedis(id: string): Promise<Vacancy | null> {
        try {

            const cacheKey = `vacancys:${id}`;
            const cachedVacancys = await redis.get(cacheKey);

            if (cachedVacancys) {
                const vacancys: VacancyDTO[] = JSON.parse(cachedVacancys);

                if (vacancys) {
                    const vacancyFindFirst = vacancys.find((vacancy: VacancyDTO) => vacancy.id == id);

                    if (vacancyFindFirst) {
                        return new Vacancy(
                            vacancyFindFirst.id,
                            vacancyFindFirst.title,
                            vacancyFindFirst.description,
                            vacancyFindFirst.company ?? null,
                            vacancyFindFirst.modality ?? null,
                            vacancyFindFirst.level ?? null,
                            vacancyFindFirst.technologies,
                            vacancyFindFirst.link ?? null,
                            vacancyFindFirst.origin ?? null,
                            vacancyFindFirst.location ?? null,
                            vacancyFindFirst.salary ?? null,
                            vacancyFindFirst.createdAt,
                            vacancyFindFirst.updatedAt,
                            vacancyFindFirst.active,
                            vacancyFindFirst.matches ?? null,
                            vacancyFindFirst.score ?? null
                        );
                    }
                }
            }

            return null;
        } catch (e: any) {
            console.error("Error fetching vacancy by ID from Redis:", e);
            return null;
        }
    }

    async getVacancysByIdFromDataBase(id: string): Promise<Vacancy | null> {
        try {
            const getVacancysClass = new VacancyRepository();
            const vacancys = await getVacancysClass.getVacancys();
            return vacancys.find((v: any) => v.id === id) || null;
        } catch (e: any) {
            console.error("Error fetching vacancy by ID from database:", e);
            return null;
        }
    }
}