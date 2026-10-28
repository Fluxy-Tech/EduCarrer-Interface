import axios from 'axios';

export type ResumeItemAction = "create" | "update";

export interface ResumeSkill {
    name: string;
    level: number;
    about: string;
    action: ResumeItemAction;
    existingId: string | null;
}

export interface ResumeExperience {
    name: string;
    seniority: string;
    about: string;
    startDate: string | null;
    endDate: string | null;
    currentJob: boolean;
    action: ResumeItemAction;
    existingId: string | null;
}

export interface ResumeAnalysis {
    skills: ResumeSkill[];
    experiences: ResumeExperience[];
}

export interface ResultAnalyzeResume {
    status: boolean
    message: string
    analysis: ResumeAnalysis | null
}

export interface ResultConfirmResume {
    status: boolean
    message: string
    created?: number
    updated?: number
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

// validateStatus mantém a mensagem do back nos erros 400 (arquivo inválido, não é currículo)
export async function analyzeResume(file: File): Promise<ResultAnalyzeResume> {
    const formData = new FormData();
    formData.append("file", file);

    const { data } = await axios.post(`${URL}/api/resume`, formData, {
        withCredentials: true,
        validateStatus: (status) => status < 500
    })
    return data
}

export async function confirmResume(analysis: ResumeAnalysis): Promise<ResultConfirmResume> {
    const { data } = await axios.post(`${URL}/api/resume/confirm`, {
        skills: analysis.skills.map(({ name, level, about }) => ({ name, level, about })),
        experiences: analysis.experiences.map(({ name, seniority, about, startDate, endDate, currentJob }) => ({ name, seniority, about, startDate, endDate, currentJob }))
    }, {
        withCredentials: true,
        validateStatus: (status) => status < 500
    })
    return data
}
