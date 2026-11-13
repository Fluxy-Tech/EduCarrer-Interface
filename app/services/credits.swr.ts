import useSWR, { mutate } from 'swr';
import axios from 'axios';
import { INSUFFICIENT_CREDITS_CODE } from '@/lib/credits/config';

export interface CreditTransaction {
    id: string;
    amount: number;
    reason: string;
    description: string | null;
    balance: number;
    createdAt: string;
}

export interface PendingPayment {
    id: string;
    type: "SUBSCRIPTION" | "CREDITS";
    plan: string | null;
    credits: number;
    value: number;
    status: string;
    invoiceUrl: string | null;
    createdAt: string;
}

export interface CreditsSummary {
    plan: string | null;
    planName: string | null;
    planCredits: number;
    planExpiresAt: string | null;
    extraCredits: number;
    total: number;
    hasDocument: boolean;
    subscription: { id: string; plan: string; status: string; value: number; createdAt: string } | null;
    transactions: CreditTransaction[];
    pendingPayments: PendingPayment[];
    costs: Record<string, number>;
}

export interface ResultGetCredits {
    status: boolean;
    credits: CreditsSummary | null;
    message: string;
}

export interface ResultBilling {
    status: boolean;
    message: string;
    invoiceUrl?: string | null;
    code?: string;
}

export interface ResultRefreshVacancys {
    status: boolean;
    message: string;
    code?: string;
    nextFreeRefreshAt?: string | null;
}

const URL = process.env.NEXT_PUBLIC_AMBIENTE == "dev" ? "http://localhost:8051" : "https://educarrer.fluxytechnologies.com.br"

export const CREDITS_KEY = `${URL}/api/credits`;

const fetcher = async (url: string): Promise<ResultGetCredits> => {
    const { data } = await axios.get(url, {
        withCredentials: true
    })
    return data
}

export function useCredits() {
    const { data, error, isLoading, mutate: refresh } = useSWR(CREDITS_KEY, fetcher, {
        // Atualiza ao voltar para a aba (ex.: depois de pagar a fatura do Asaas)
        revalidateOnFocus: true,
    });

    return {
        credits: data?.credits ?? null,
        isLoading,
        isError: error,
        refresh
    }
}

export function refreshCredits() {
    return mutate(CREDITS_KEY);
}

// Respostas 400 do billing trazem a mensagem do motivo (ex.: CPF obrigatório), por isso não lançam erro
const billingConfig = {
    withCredentials: true,
    validateStatus: (status: number) => status < 500
};

export async function subscribePlan(plan: string, cpfCnpj?: string): Promise<ResultBilling> {
    const { data } = await axios.post(`${URL}/api/billing/subscription`, { plan, cpfCnpj }, billingConfig);
    return data;
}

export async function cancelPlan(): Promise<ResultBilling> {
    const { data } = await axios.delete(`${URL}/api/billing/subscription`, billingConfig);
    return data;
}

export async function buyCredits(packageId: string, cpfCnpj?: string): Promise<ResultBilling> {
    const { data } = await axios.post(`${URL}/api/billing/credits`, { packageId, cpfCnpj }, billingConfig);
    return data;
}

export async function refreshVacancysPaid(): Promise<ResultRefreshVacancys> {
    const { data } = await axios.post(`${URL}/api/vacancy/refresh`, {}, billingConfig);
    return data;
}

// true quando a API respondeu 402 por falta de créditos (o diálogo de compra já é aberto automaticamente)
export function isInsufficientCredits(value: any): boolean {
    const data = value?.response?.data ?? value;
    return data?.code === INSUFFICIENT_CREDITS_CODE;
}
