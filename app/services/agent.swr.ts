import axios from 'axios';

export interface AgentMessage {
    id: string;
    isBot: boolean;
    text: string;
    createdAt: Date;
    historyId: string;
}

export interface AgentHistory {
    id: string;
    createdAt: Date;
    finishAt?: Date | null;
    stopConversation: boolean;
    studyId?: string | null;
    messages: AgentMessage[];
}

export interface ResultGetAgentHistory {
    status: boolean
    history: AgentHistory | null
    message: string
}

export interface ResultSendAgentMessage {
    status: boolean
    message: string
    historyId?: string
    messages: AgentMessage[]
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:5401" : "https://educarrerai.egnehl.easypanel.host"

// Sem studyId conversa com o agente da plataforma, com studyId conversa com o tutor do estudo
export async function getAgentHistory(studyId?: string): Promise<ResultGetAgentHistory> {
    const { data } = await axios.get(`${URL}/api/agent`, {
        params: studyId ? { studyId } : undefined,
        withCredentials: true,
        validateStatus: (status) => status < 500
    })
    return data
}

export async function sendAgentMessage(text: string, studyId?: string): Promise<ResultSendAgentMessage> {
    const { data } = await axios.post(`${URL}/api/agent`, {
        text,
        studyId
    }, {
        withCredentials: true,
        validateStatus: (status) => status < 500
    })
    return data
}

export async function startNewAgentHistory(studyId?: string): Promise<ResultGetAgentHistory> {
    const { data } = await axios.post(`${URL}/api/agent/new`, {
        studyId
    }, {
        withCredentials: true,
        validateStatus: (status) => status < 500
    })
    return data
}
