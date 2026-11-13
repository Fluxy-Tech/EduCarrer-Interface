import { prisma } from "@/lib/prisma";

export class VacancyFilterRepository {

    async getByUserId(userId: string) {
        return await prisma.vacancyFilter.findUnique({
            where: { userId }
        });
    }

    async save(userId: string, vacancyIds: string[]) {
        return await prisma.vacancyFilter.upsert({
            where: { userId },
            update: { vacancyIds, filteredAt: new Date() },
            create: { userId, vacancyIds, filteredAt: new Date() }
        });
    }
}
