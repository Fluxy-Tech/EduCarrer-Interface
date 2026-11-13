import useSWR from 'swr';
import axios from 'axios';

export interface ResultGetMetricsAdmin {
    status: boolean
    metrics: MetricsAdmin
    message: string
}

export interface ResultGetMetrics {
    status: boolean,
    metrics: Metrics | null,
    message: string
}

export interface Metrics {
    totalVacancys: number,
    totalBussines: number,
    totalStudiesCreateds: number,
    totalSatisfation: number,
    bussinesMoreWithVacancys: Company[]
}

export interface Company {
    company: string,
    countVacancies: number
}

export interface MetricsAdmin {
    totalUsers: number,
    totalBussines: number,
    totalSatisfationOfThesRecomendationVancancy: number,
    countSatisfationOfThesRecomendationVancancy: number,
    countPositiveOfThesRecomendationVancancy: number,
    countNegativeOfThesRecomendationVancancy: number,
    totalSatisfationStudys: number,
    countSatisfationStudys: number,
    countPositiveSatisfationStudys: number,
    countNegativeSatisfationStudys: number,
}


const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

const fetcher = async (url: string): Promise<ResultGetMetrics> => {
    const { data } = await axios.get(url, {
        withCredentials: true
    })
    return data
}

export function useMetrics() {
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/metrics`, fetcher);

    return {
        metrics: data?.metrics || null,
        isLoading,
        isError: error,
        message: data?.message,
        refresh: mutate
    }
}

const fetcherAdmin = async (url: string): Promise<ResultGetMetricsAdmin> => {
    const { data } = await axios.get(url, {
        withCredentials: true
    })
    return data
}

export function useMetricsAdmin() {
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/metrics/admin`, fetcherAdmin);

    return {
        metrics: data?.metrics || null,
        isLoading,
        isError: error,
        message: data?.message,
        refresh: mutate
    }
}

export interface FunnelStage {
    key: "users" | "withStudy" | "half" | "completed";
    label: string;
    count: number;
    percentOfUsers: number;
    percentOfPrevious: number | null;
}

export interface StudyEvolutionMetrics {
    funnel: FunnelStage[];
    totals: {
        users: number;
        studies: number;
        studiesPerUserWithStudy: number;
        averageProgress: number;
        studiesHalf: number;
        studiesCompleted: number;
        levelsCompleted: number;
    };
    distribution: { label: string; count: number }[];
    evolution: {
        month: string;
        newUsers: number;
        studiesCreated: number;
        levelsCompleted: number;
        studiesCompleted: number;
    }[];
}

interface ResultGetStudyEvolution {
    status: boolean;
    metrics: StudyEvolutionMetrics | null;
    message: string;
}

const fetcherStudyEvolution = async (url: string): Promise<ResultGetStudyEvolution> => {
    const { data } = await axios.get(url, {
        withCredentials: true
    })
    return data
}

// Evolução dos estudos dos usuários no painel de métricas do admin
export function useStudyEvolutionMetrics(months: number) {
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/metrics/admin/studies?months=${months}`, fetcherStudyEvolution, {
        keepPreviousData: true,
    });

    return {
        metrics: data?.metrics ?? null,
        isLoading,
        isError: error,
        refresh: mutate
    }
}
