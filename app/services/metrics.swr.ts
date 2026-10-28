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
