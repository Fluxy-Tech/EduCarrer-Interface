import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { CreateOrUpdateVacancy } from '@/app/services/vacancys.swr';

export interface RankingEntry {
    position: number;
    userId: string;
    name: string;
    areaOfInterest: string | null;
    resumeAvailable: boolean;
    xp: number;
    levelsCompleted: number;
    studies: number;
    studiesCompleted: number;
    rank: string;
    bestProgress: number;
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

export function useRanking(area: string) {
    const query = area === "todas" ? "" : `?area=${encodeURIComponent(area)}`;
    const { data, error, isLoading } = useSWR<{ ranking: RankingEntry[] }>(`${URL}/api/recruiter/ranking${query}`, fetcher, {
        keepPreviousData: true,
    });

    return { ranking: data?.ranking ?? [], isLoading, isError: error };
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
