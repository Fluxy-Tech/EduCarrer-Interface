import useSWR from 'swr';
import axios from 'axios';

export interface ResultGetVagas {
    status: boolean
    avaliations: AvaliationVacancy[]
    message: string
}

export interface AvaliationVacancy {
    id: string;
    satisfied: boolean;
    comment: number;
    studyId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface ResultGeral {
    status: boolean
    avaliation: AvaliationVacancy | null
    message: string
}

export interface ResultAvaliationByUserId {
    status: boolean
    solicited: boolean
    message: string
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

const fetcher = async (url: string): Promise<ResultGetVagas> => {
    const { data } = await axios.get(url, {
        withCredentials: true
    })
    return data
}

export function useAvaliationsVacancys() {
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/avaliations-vacancy`, fetcher);

    return {
        avaliations: data?.avaliations || [],
        isLoading,
        isError: error,
        message: data?.message,
        refresh: mutate
    }
}

export function useAvaliationsVacancysAdmin() {
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/avaliations-vacancy/admin`, fetcher);

    return {
        avaliations: data?.avaliations || [],
        isLoading,
        isError: error,
        message: data?.message,
        refresh: mutate
    }
}


export async function createAvaliationVancancy( satisfied: boolean, comment?: string): Promise<ResultGeral> {
    const { data } = await axios.post(`${URL}/api/avaliations-vacancy`, {
        comment,
        satisfied
    }, {
        withCredentials: true
    })
    return data
}

export async function updateAvaliationVancancy(id: string, satisfied?: boolean, comment?: string): Promise<ResultGeral> {
    const { data } = await axios.put(`${URL}/api/avaliations-vacancy/${id}`, {
        satisfied,
        comment
    }, {
        withCredentials: true
    })
    return data
}

export async function getAvaliationVancancyByUserId(): Promise<ResultAvaliationByUserId> {
    const { data } = await axios.get(`${URL}/api/avaliations-vacancy`, {
        withCredentials: true
    })
    return data
}