import useSWR, { mutate } from 'swr';
import axios from 'axios';

export interface CareerProfile {
    // Pontos no ranking dos recrutadores (XP + bônus de links e currículo)
    rankPoints: number;
    areasOfInterest: string[];
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    resume: { fileName: string | null; visible: boolean; uploadedAt: string | null } | null;
}

interface Result {
    status: boolean;
    message: string;
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

const CAREER_KEY = `${URL}/api/user/career`;

const config = { withCredentials: true, validateStatus: (status: number) => status < 500 };

// enabled = false não faz a requisição (ex.: recrutador, que não tem perfil de carreira)
export function useCareer(enabled = true) {
    const { data, isLoading } = useSWR<{ career: CareerProfile | null }>(enabled ? CAREER_KEY : null, async (url: string) => {
        const { data } = await axios.get(url, { withCredentials: true });
        return data;
    });

    return { career: data?.career ?? null, isLoading };
}

export function refreshCareer() {
    return mutate(CAREER_KEY);
}

export async function updateCareer(data: { areasOfInterest?: string[]; resumeVisible?: boolean; linkedinUrl?: string | null; portfolioUrl?: string | null }): Promise<Result> {
    const { data: res } = await axios.put(CAREER_KEY, data, config);
    await refreshCareer();
    return res;
}

export async function uploadResumeFile(file: File, visible: boolean): Promise<Result> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("visible", String(visible));

    const { data } = await axios.post(`${URL}/api/user/resume-file`, formData, config);
    await refreshCareer();
    return data;
}

export async function removeResumeFile(): Promise<Result> {
    const { data } = await axios.delete(`${URL}/api/user/resume-file`, config);
    await refreshCareer();
    return data;
}

export const OWN_RESUME_URL = "/api/user/resume-file";
