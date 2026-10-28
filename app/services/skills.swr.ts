import useSWR from 'swr';
import axios from 'axios';

export interface ResultGetVagas {
    status: boolean
    skills: Skill[]
    message: string
}

export interface Skill {
    id: string;
    name: string;
    level: number;
    about?: string | null;
    updatedAt?: Date;
    userId: string;
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

const fetcher = async (url: string): Promise<ResultGetVagas> => {
    const { data } = await axios.get(url, {
        withCredentials: true
    })
    return data
}

export function useSkills() {
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/skill`, fetcher);

    return {
        skills: data?.skills || [],
        isLoading,
        isError: error,
        message: data?.message,
        refresh: mutate
    }
}

export async function createSkill(name: string, level?: number, about?: string) {
    const { data } = await axios.post(`${URL}/api/skill`, {
        name,
        level,
        about
    }, {
        withCredentials: true
    })
    return data
}

export async function updateSkill(id: string, name: string, level?: number, about?: string) {
    const { data } = await axios.put(`${URL}/api/skill/${id}`, {
        name,
        level,
        about
    }, {
        withCredentials: true
    })
    return data
}

export async function deleteSkill(id: string) {
    const { data } = await axios.delete(`${URL}/api/skill/${id}`, {
        withCredentials: true
    })
    return data
}