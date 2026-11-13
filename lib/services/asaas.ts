// Cliente HTTP mínimo da API v3 do Asaas
// Docs: https://docs.asaas.com/reference

export interface AsaasPayment {
    object: "payment";
    id: string;
    customer: string;
    subscription?: string | null;
    value: number;
    netValue?: number;
    status: string;
    billingType: string;
    description?: string | null;
    externalReference?: string | null;
    invoiceUrl?: string | null;
    dueDate?: string | null;
    paymentDate?: string | null;
    clientPaymentDate?: string | null;
    confirmedDate?: string | null;
}

export interface AsaasSubscription {
    object: "subscription";
    id: string;
    customer: string;
    value: number;
    status: string;
    nextDueDate: string;
    externalReference?: string | null;
}

interface AsaasList<T> {
    data: T[];
    totalCount: number;
}

export class AsaasError extends Error {
    constructor(message: string, public status: number, public details?: unknown) {
        super(message);
    }
}

function getConfig() {
    const raw = (process.env.ASAAS_API_KEY ?? "").trim();

    if (!raw) throw new AsaasError("ASAAS_API_KEY não configurada", 500);

    // A chave do Asaas começa com "$". No .env ela fica sem o "$" para não ser interpretada como variável
    const apiKey = raw.startsWith("$") ? raw : `$${raw}`;

    // Chaves de homologação (aact_hmlg_) usam o sandbox
    const defaultUrl = apiKey.includes("_hmlg_") ? "https://api-sandbox.asaas.com/v3" : "https://api.asaas.com/v3";
    const baseUrl = (process.env.ASAAS_API_URL || defaultUrl).replace(/\/$/, "");

    return { apiKey, baseUrl };
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const { apiKey, baseUrl } = getConfig();

    const res = await fetch(`${baseUrl}${path}`, {
        method,
        headers: {
            "Content-Type": "application/json",
            "User-Agent": "EduCarrer",
            access_token: apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : null;

    if (!res.ok) {
        const description = data?.errors?.map((e: any) => e.description).join("; ");
        console.error(`Asaas ${method} ${path} -> ${res.status}`, data);
        throw new AsaasError(description || `Erro ${res.status} na API do Asaas`, res.status, data);
    }

    return data as T;
}

// Data no formato YYYY-MM-DD no fuso de São Paulo (o Asaas recusa vencimento no passado)
export function asaasDate(date = new Date()): string {
    return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(date);
}

export const asaas = {
    createCustomer(data: { name: string; email: string; cpfCnpj: string; externalReference: string }) {
        return request<{ id: string }>("POST", "/customers", { ...data, notificationDisabled: false });
    },

    updateCustomer(id: string, data: { name?: string; email?: string; cpfCnpj?: string }) {
        return request<{ id: string }>("PUT", `/customers/${id}`, data);
    },

    createSubscription(data: {
        customer: string;
        value: number;
        nextDueDate: string;
        description: string;
        externalReference: string;
    }) {
        // UNDEFINED: o cliente escolhe PIX, cartão ou boleto na fatura do Asaas
        return request<AsaasSubscription>("POST", "/subscriptions", {
            ...data,
            billingType: "UNDEFINED",
            cycle: "MONTHLY",
        });
    },

    listSubscriptionPayments(subscriptionId: string) {
        return request<AsaasList<AsaasPayment>>("GET", `/subscriptions/${subscriptionId}/payments`);
    },

    deleteSubscription(subscriptionId: string) {
        return request<{ deleted: boolean; id: string }>("DELETE", `/subscriptions/${subscriptionId}`);
    },

    createPayment(data: {
        customer: string;
        value: number;
        dueDate: string;
        description: string;
        externalReference: string;
    }) {
        return request<AsaasPayment>("POST", "/payments", { ...data, billingType: "UNDEFINED" });
    },
};
