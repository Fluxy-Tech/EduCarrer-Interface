import useSWR from 'swr';
import axios from 'axios';

export interface ResultGetExperience {
    status: boolean
    experiences: Experience[]
    message: string
}

export interface Experience {
    id: string;
    name: string;
    seniority: string;
    about: string;
    startDate?: Date | null;
    endDate?: Date | null;
    currentJob: boolean;
    updatedAt?: Date | null;
    userId: string;
}

const fetcher = async (url: string): Promise<ResultGetExperience> => {
    const { data } = await axios.get(url, {
        withCredentials: true
    })
    return data
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

export function useExperiences() {
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/experience`, fetcher);

    return {
        experiences: data?.experiences || [],
        isLoading,
        isError: error,
        message: data?.message,
        refresh: mutate
    }
}

export async function createExperience(name: string, seniority?: string, about?: string, startDate?: Date, endDate?: Date, currentJob?: boolean) {
    const { data } = await axios.post(`${URL}/api/experience`, {
        name,
        seniority,
        about,
        startDate,
        endDate,
        currentJob
    }, {
        withCredentials: true
    })
    return data
}

export async function updateExperience(id: string, name: string, seniority?: string, about?: string, startDate?: Date, endDate?: Date, currentJob?: boolean) {
    const { data } = await axios.put(`${URL}/api/experience/${id}`, {
        name,
        seniority,
        about,
        startDate,
        endDate,
        currentJob
    }, {
        withCredentials: true
    })
    return data
}

export async function deleteExperience(id: string) {
    const { data } = await axios.delete(`${URL}/api/experience/${id}`, {
        withCredentials: true
    })
    return data
}