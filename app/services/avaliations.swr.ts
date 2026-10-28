import useSWR from 'swr';
import axios from 'axios';

export interface ResultGetAvaliations {
    status: boolean
    avaliations: Avaliation[]
    message: string
}

export interface Avaliation {
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
    avaliation: Avaliation | null
    message: string
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

const fetcher = async (url: string): Promise<ResultGetAvaliations> => {
    const { data } = await axios.get(url, {
        withCredentials: true
    })
    return data
}

export function useAvaliations() {
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/avaliations`, fetcher);

    return {
        avaliations: data?.avaliations || [],
        isLoading,
        isError: error,
        message: data?.message,
        refresh: mutate
    }
}

export async function createAvaliation(satisfied: boolean, studyId: string, comment?: string): Promise<ResultGeral> {
    const { data } = await axios.post(`${URL}/api/avaliations`, {
        satisfied,
        comment,
        studyId
    }, {
        withCredentials: true
    })
    return data
}

export async function updateAvaliation(id: string, satisfied: boolean, comment?: string): Promise<ResultGeral> {
    const { data } = await axios.put(`${URL}/api/avaliations/${id}`, {
        satisfied,
        comment
    }, {
        withCredentials: true
    })
    return data
}

export async function getAvaliationsByUserIdAndStudyId(id: string): Promise<ResultGeral> {
    const { data } = await axios.get(`${URL}/api/avaliations/${id}`, {
        withCredentials: true
    })

    console.log("Resposta da API:", data);
    return data
}