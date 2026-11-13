import { Vacancy } from "@/lib/entities/vacancy";
import { CreateVacancyData } from "@/lib/interfaces/vacancy.interface";
import { prisma } from "@/lib/prisma"

export class VacancyRepository {

    async getVacancys(): Promise<Vacancy[]> {

        const vacancys = await prisma.vacancy.findMany();

        return vacancys.map(v => new Vacancy(
            v.id,
            v.title,
            v.description,
            v.company,
            v.modality,
            v.level,
            v.technologies,
            v.link,
            v.origin,
            v.location,
            v.salary,
            v.createdAt,
            v.updatedAt,
            v.active,
            null,
            null
        ));
    }

    // Vagas ativas pelos ids, mantendo a ordem recebida (ordem de relevância definida pela IA)
    async getActiveVacancysByIds(ids: string[]): Promise<Vacancy[]> {
        if (ids.length === 0) return [];

        const vacancys = await prisma.vacancy.findMany({
            where: { id: { in: ids }, active: true }
        });

        const byId = new Map(vacancys.map((v) => [v.id, v]));

        return ids
            .map((id) => byId.get(id))
            .filter((v): v is NonNullable<typeof v> => !!v)
            .map(v => new Vacancy(
                v.id,
                v.title,
                v.description,
                v.company,
                v.modality,
                v.level,
                v.technologies,
                v.link,
                v.origin,
                v.location,
                v.salary,
                v.createdAt,
                v.updatedAt,
                v.active,
                null,
                null
            ));
    }

    async getVacancysById(id: string): Promise<Vacancy | null> {
        const vacancy = await prisma.vacancy.findFirst({
            where: { id }
        });

        if (!vacancy) return null;

        return new Vacancy(
            vacancy.id,
            vacancy.title,
            vacancy.description,
            vacancy.company,
            vacancy.modality,
            vacancy.level,
            vacancy.technologies,
            vacancy.link,
            vacancy.origin,
            vacancy.location,
            vacancy.salary,
            vacancy.createdAt,
            vacancy.updatedAt,
            vacancy.active,
            null,
            null
        );
    }

    async createVacancy(data: CreateVacancyData) {
        const vacancy = await prisma.vacancy.create({
            data
        })

        return new Vacancy(
            vacancy.id,
            vacancy.title,
            vacancy.description,
            vacancy.company,
            vacancy.modality,
            vacancy.level,
            vacancy.technologies,
            vacancy.link,
            vacancy.origin,
            vacancy.location,
            vacancy.salary,
            vacancy.createdAt,
            vacancy.updatedAt,
            vacancy.active,
            null,
            null
        );
    }

    async updateVacancy(id: string, data: CreateVacancyData) {
        return await prisma.vacancy.update({
            where: { id },
            data
        })
    }

    async getCountVacancies(): Promise<number> {
        return await prisma.vacancy.count();
    }

    async getCountCompaniesByVacancies(): Promise<number> {
        const companies = await prisma.vacancy.findMany({
            distinct: ["company"],
            select: {
                company: true
            },
            where: {
                company: {
                    not: null
                }
            }
        });

        return companies.length;
    }
}