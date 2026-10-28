import useSWR from 'swr';
import axios from 'axios';

export interface ResultGetVacancys {
    status: boolean
    vacancys: Vacancy[]
    message: string
}

export interface ResultCreateOrUpdateVacancy {
    status: boolean,
    vacancy: Vacancy | null,
    message: string
}

export interface Vacancy {
    id: string;
    title: string;
    description: string;
    company: string;
    modality: string;
    level: string;
    technologies: string[];
    link: string;
    origin: string;
    location: string;
    salary: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

export interface CreateOrUpdateVacancy {
    title: string;
    description: string;
    company: string;
    modality: string;
    level: string;
    technologies: string[];
    link: string;
    origin: string;
    location: string;
    salary: string | null;
    active: boolean;
}

const fetcher = async (url: string): Promise<ResultGetVacancys> => {
    const { data } = await axios.get(url, {
        withCredentials: true
    })
    return data
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

export function useVacancys() {
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/vacancy`, fetcher);

    return {
        vacancys: data?.vacancys || [],
        isLoading,
        isError: error,
        message: data?.message,
        refresh: mutate
    }
}

export function useVacancysAdmin() {
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/vacancy/admin`, fetcher);

    return {
        vacancys: data?.vacancys || [],
        isLoading,
        isError: error,
        message: data?.message,
        refresh: mutate
    }
}

export async function createVacancy(data: CreateOrUpdateVacancy): Promise<ResultCreateOrUpdateVacancy> {
    const { data: response } = await axios.post(`${URL}/api/vacancy`, data, {
        withCredentials: true
    });
    return response;
}


export async function updateVacancy(id: string, data: CreateOrUpdateVacancy): Promise<ResultCreateOrUpdateVacancy> {
    const { data: response } = await axios.put(`${URL}/api/vacancy/${id}`, data, {
        withCredentials: true
    });
    return response;
}

