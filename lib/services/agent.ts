import { HistoryRepository } from "@/lib/repositories/history";
import { HundleAgentWithOpenAi } from "@/lib/services/hundleAgentWithOpenAi";
import { getStudyById } from "@/lib/services/study";
import { HistoryDTO } from "@/lib/interfaces/history.interface";

const historyRepository = new HistoryRepository();
const hundleAgentWithOpenAi = new HundleAgentWithOpenAi();

// Quantidade de mensagens anteriores enviadas para a IA como memória da conversa
const AGENT_CONTEXT_MESSAGES = 20;

export const AGENT_MAX_MESSAGE_LENGTH = 2000;

// Remove ids e campos internos do estudo para enviar só o conteúdo para a IA
function studyToContext(study: any) {
    return {
        titulo: study.title,
        vaga: study.vacancy ? {
            titulo: study.vacancy.title,
            empresa: study.vacancy.company,
            nivel: study.vacancy.level,
            tecnologias: study.vacancy.technologies,
        } : null,
        secoes: (study.sections ?? []).map((section: any) => ({
            secao: section.section,
            tipo: section.type,
            conteudo: section.content,
            pontosFortes: section.strengths?.map((s: any) => ({ habilidade: s.skill, importancia: s.importance, dica: s.advice })),
            lacunas: section.gaps?.map((g: any) => ({
                habilidade: g.skill,
                explicacao: g.explanation,
                prioridade: g.priority,
                tempoEstimado: g.estimatedTime,
                topicos: g.topics,
                recursos: g.resources,
                concluida: g.completed ?? false,
            })),
            planoSemanal: section.plans?.map((p: any) => ({ semana: p.week, foco: p.focus, metas: p.goals })),
        })),
    };
}

// Garante que o agente do estudo só é usado pelo dono do estudo
async function getStudyContext(userId: string, studyId: string | null) {
    if (!studyId) return { status: true, study: undefined };

    const study = await getStudyById(userId, studyId);

    if (!study) return { status: false, study: undefined };

    return { status: true, study: studyToContext(study) };
}

// Conversa atual com o agente. Se a última foi encerrada, o usuário começa uma conversa vazia
export async function getCurrentHistory(userId: string, studyId: string | null) {
    const context = await getStudyContext(userId, studyId);

    if (!context.status) {
        return { status: false, message: "Estudo não encontrado", history: null };
    }

    const history = await historyRepository.getLastHistory(userId, studyId);

    if (!history || history.stopConversation) {
        return { status: true, message: "Nenhuma conversa em andamento", history: null };
    }

    return { status: true, message: "Sucesso ao coletar a conversa", history };
}

// Salva a pergunta, envia a conversa para a IA e salva a resposta no mesmo histórico
export async function sendMessageToAgent(userId: string, text: string, studyId: string | null) {
    const context = await getStudyContext(userId, studyId);

    if (!context.status) {
        return { status: false, message: "Estudo não encontrado", messages: [] };
    }

    let history: HistoryDTO | null = await historyRepository.getLastHistory(userId, studyId);

    if (!history || history.stopConversation) {
        history = await historyRepository.createHistory(userId, studyId);
    }

    const userMessage = await historyRepository.createMessage({
        historyId: history.id,
        isBot: false,
        text
    });

    const lastMessages = await historyRepository.getLastMessages(history.id, AGENT_CONTEXT_MESSAGES);

    const answer = await hundleAgentWithOpenAi.answer(
        lastMessages.map((m) => ({ role: m.isBot ? "assistant" : "user", content: m.text })),
        context.study
    );

    if (!answer) {
        return {
            status: false,
            message: "Não conseguimos responder agora, tente novamente em instantes",
            historyId: history.id,
            messages: [userMessage]
        };
    }

    const botMessage = await historyRepository.createMessage({
        historyId: history.id,
        isBot: true,
        text: answer
    });

    return {
        status: true,
        message: "Sucesso ao responder a mensagem",
        historyId: history.id,
        messages: [userMessage, botMessage]
    };
}

// Encerra a conversa atual e abre um novo histórico vazio
export async function startNewHistory(userId: string, studyId: string | null) {
    const context = await getStudyContext(userId, studyId);

    if (!context.status) {
        return { status: false, message: "Estudo não encontrado", history: null };
    }

    await historyRepository.finishOpenHistories(userId, studyId);
    const history = await historyRepository.createHistory(userId, studyId);

    return { status: true, message: "Nova conversa iniciada", history };
}
