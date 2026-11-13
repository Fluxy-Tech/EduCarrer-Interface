import useSWR from 'swr';
import axios from 'axios';

export interface AdminUser {
    id: string;
    name: string | null;
    email: string;
    role: string;
    areasOfInterest: string[];
    createdAt: string;
    _count: { study: number; createdVacancies: number };
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

export function useAdminUsers(search: string, role: string) {
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    if (role !== "todos") params.set("role", role);

    const { data, isLoading, mutate } = useSWR<{ users: AdminUser[] }>(
        `${URL}/api/admin/users?${params.toString()}`,
        async (url: string) => (await axios.get(url, { withCredentials: true })).data,
        { keepPreviousData: true }
    );

    return { users: data?.users ?? [], isLoading, refresh: mutate };
}

export async function setUserRole(userId: string, role: string): Promise<{ status: boolean; message: string }> {
    const { data } = await axios.put(`${URL}/api/admin/users/${userId}/role`, { role }, {
        withCredentials: true,
        validateStatus: (status) => status < 500
    });
    return data;
}
