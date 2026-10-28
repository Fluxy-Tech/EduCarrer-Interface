import { prisma } from "@/lib/prisma";
import { CreateMessageDTO, HistoryDTO, MessageDTO } from "@/lib/interfaces/history.interface";

export class HistoryRepository {

    // Última conversa do usuário com o agente. studyId null é o agente da plataforma
    async getLastHistory(userId: string, studyId: string | null): Promise<HistoryDTO | null> {
        return await prisma.history.findFirst({
            where: {
                userId,
                studyId
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                messages: {
                    orderBy: { createdAt: "asc" }
                }
            }
        });
    }

    async createHistory(userId: string, studyId: string | null): Promise<HistoryDTO> {
        return await prisma.history.create({
            data: {
                userId,
                studyId
            },
            include: {
                messages: true
            }
        });
    }

    // Encerra todas as conversas abertas do agente para começar uma nova
    async finishOpenHistories(userId: string, studyId: string | null) {
        return await prisma.history.updateMany({
            where: {
                userId,
                studyId,
                stopConversation: false
            },
            data: {
                stopConversation: true,
                finishAt: new Date()
            }
        });
    }

    async createMessage(data: CreateMessageDTO): Promise<MessageDTO> {
        return await prisma.messages.create({
            data
        });
    }

    // Últimas mensagens da conversa, em ordem cronológica, para servir de memória ao agente
    async getLastMessages(historyId: string, take: number): Promise<MessageDTO[]> {
        const messages = await prisma.messages.findMany({
            where: {
                historyId
            },
            orderBy: {
                createdAt: "desc"
            },
            take
        });

        return messages.reverse();
    }
}
