import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { CreateOrUpdateVacancy } from '@/app/services/vacancys.swr';

export interface RankingEntry {
    position: number;
    userId: string;
    name: string;
    areasOfInterest: string[];
    points: number;
    xp: number;
    linksBonus: number;
    resumeBonus: number;
    levelsCompleted: number;
    studies: number;
    studiesCompleted: number;
    rank: string;
    unlocked: boolean;
    unlockExpiresAt: string | null;
    // Preenchidos só depois do desbloqueio
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    resumeAvailable: boolean;
}

export interface CandidateDetails {
    id: string;
    name: string;
    areasOfInterest: string[];
    linkedinUrl: string | null;
    portfolioUrl: string | null;
    resumeAvailable: boolean;
    skills: { id: string; name: string; level: number; about: string | null }[];
    experiences: { id: string; name: string; seniority: string; about: string; startDate: string | null; endDate: string | null; currentJob: boolean }[];
    completedStudies: {
        id: string;
        title: string;
        vacancy: { title: string; company: string | null; level: string | null } | null;
        levels: number;
        skills: string[];
        xp: number;
        completedAt: string | null;
    }[];
    totalStudies: number;
    unlockExpiresAt: string | null;
}

export interface RecruiterVacancy {
    id: string;
    title: string;
    company: string | null;
    level: string | null;
    modality: string | null;
    location: string | null;
    technologies: string[];
    active: boolean;
    createdAt: string;
    _count: { study: number };
    createdBy?: { id: string; name: string | null; email: string };
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

const fetcher = async (url: string) => {
    const { data } = await axios.get(url, { withCredentials: true })
    return data
}

export function useRanking(areas: string[], stack: string) {
    const params = new URLSearchParams();
    areas.forEach((a) => params.append("area", a));
    if (stack.trim()) params.set("stack", stack.trim());

    const { data, error, isLoading, mutate: refresh } = useSWR<{ ranking: RankingEntry[] }>(`${URL}/api/recruiter/ranking?${params.toString()}`, fetcher, {
        keepPreviousData: true,
    });

    return { ranking: data?.ranking ?? [], isLoading, isError: error, refresh };
}

// Consome créditos e libera o candidato por 60 dias (402 abre a oferta de créditos automaticamente)
export async function unlockCandidate(userId: string): Promise<{ status: boolean; message: string; code?: string; alreadyUnlocked?: boolean }> {
    const { data } = await axios.post(`${URL}/api/recruiter/candidates/${userId}/unlock`, {}, {
        withCredentials: true,
        validateStatus: (status) => status < 500
    });
    return data;
}

export function useCandidateDetails(userId: string | null) {
    const { data, isLoading } = useSWR<{ status: boolean; candidate?: CandidateDetails; message?: string }>(
        userId ? `${URL}/api/recruiter/candidates/${userId}` : null,
        async (url: string) => (await axios.get(url, { withCredentials: true, validateStatus: (s) => s < 500 })).data
    );

    return { candidate: data?.candidate ?? null, message: data?.message, isLoading };
}

// Link direto: o navegador baixa o PDF com o cookie da sessão (o servidor confere a autorização do candidato)
export function candidateResumeUrl(userId: string) {
    return `/api/recruiter/candidates/${userId}/resume`;
}

const RECRUITER_VACANCIES_KEY = `${URL}/api/recruiter/vacancies`;

export function useRecruiterVacancies() {
    const { data, error, isLoading } = useSWR<{ vacancies: RecruiterVacancy[] }>(RECRUITER_VACANCIES_KEY, fetcher);
    return { vacancies: data?.vacancies ?? [], isLoading, isError: error };
}

export async function createRecruiterVacancy(vacancy: CreateOrUpdateVacancy): Promise<{ status: boolean; message: string }> {
    const { data } = await axios.post(RECRUITER_VACANCIES_KEY, vacancy, {
        withCredentials: true,
        validateStatus: (status) => status < 500
    });
    await mutate(RECRUITER_VACANCIES_KEY);
    return data;
}

// Admin: vagas cadastradas por recrutadores
const ADMIN_RECRUITER_VACANCIES_KEY = `${URL}/api/vacancy/admin/recruiters`;

export function useRecruiterVacanciesAdmin() {
    const { data, error, isLoading } = useSWR<{ vacancies: RecruiterVacancy[] }>(ADMIN_RECRUITER_VACANCIES_KEY, fetcher);
    return { vacancies: data?.vacancies ?? [], isLoading, isError: error };
}

export async function deleteVacancyAdmin(id: string): Promise<{ status: boolean; message: string }> {
    const { data } = await axios.delete(`${URL}/api/vacancy/admin/${id}`, {
        withCredentials: true,
        validateStatus: (status) => status < 500
    });
    await Promise.all([mutate(ADMIN_RECRUITER_VACANCIES_KEY), mutate(`${URL}/api/vacancy/admin`)]);
    return data;
}
