import useSWR, { mutate as globalMutate } from 'swr';
import axios from 'axios';

export interface ResultGetVacancys {
    status: boolean
    vacancys: Vacancy[]
    message: string
    filteredAt?: string | null
    nextFreeRefreshAt?: string | null
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
    const { data, error, isLoading, mutate } = useSWR(`${URL}/api/vacancy`, fetcher, {
        // A filtragem fica salva no servidor; não precisa refazer a consulta a cada foco da aba
        revalidateOnFocus: false,
    });

    return {
        vacancys: data?.vacancys || [],
        filteredAt: data?.filteredAt ?? null,
        nextFreeRefreshAt: data?.nextFreeRefreshAt ?? null,
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
    const { data: response } = await axios.put(`${URL}/api/vacancy/admin/${id}`, data, {
        withCredentials: true
    });
    return response;
}

const fetcherVacancy = async (url: string): Promise<ResultCreateOrUpdateVacancy> => {
    const { data } = await axios.get(url, {
        withCredentials: true,
        validateStatus: (status) => status < 500
    })
    return data
}

// Vaga pelo id para a tela de edição do admin
export function useVacancyAdmin(id: string | undefined) {
    const { data, error, isLoading, mutate } = useSWR(id ? `${URL}/api/vacancy/admin/${id}` : null, fetcherVacancy, {
        revalidateOnFocus: false,
    });

    return {
        vacancy: data?.vacancy ?? null,
        isLoading,
        isError: error,
        message: data?.message,
        refresh: mutate
    }
}

// Atualiza a lista de vagas do admin depois de criar ou editar
export function refreshVacancysAdmin() {
    return globalMutate(`${URL}/api/vacancy/admin`);
}

