// Configuração única de planos, pacotes avulsos e custos de créditos.
// Arquivo sem dependências de servidor: pode ser usado no front e no back.

export type PlanId = "INICIANTE" | "MEDIANO" | "PROFISSIONAL";
export type CreditPackageId = "PACK_5K" | "PACK_15K" | "PACK_40K";
export type CreditAction = "VACANCY_REFRESH" | "STUDY" | "AGENT_MESSAGE";

export interface PlanConfig {
    id: PlanId;
    name: string;
    credits: number;
    // Valor mensal em reais
    price: number;
    highlight?: boolean;
}

export interface CreditPackageConfig {
    id: CreditPackageId;
    credits: number;
    price: number;
}

// Créditos que todo usuário novo recebe para testar a plataforma (não expiram)
export const WELCOME_CREDITS = 2000;

// Vagas filtradas pela IA são refeitas grátis a cada X dias. Antes disso, a atualização é cobrada
export const VACANCY_FREE_REFRESH_DAYS = 3;

// Dias de tolerância após o fim do ciclo antes dos créditos do plano expirarem (pagamento atrasado)
export const PLAN_GRACE_DAYS = 5;

export const PLANS: PlanConfig[] = [
    { id: "INICIANTE", name: "Iniciante", credits: 20000, price: 19.9 },
    { id: "MEDIANO", name: "Mediano", credits: 50000, price: 39.9, highlight: true },
    { id: "PROFISSIONAL", name: "Profissional", credits: 80000, price: 59.9 },
];

export const CREDIT_PACKAGES: CreditPackageConfig[] = [
    { id: "PACK_5K", credits: 5000, price: 5 },
    { id: "PACK_15K", credits: 15000, price: 15 },
    { id: "PACK_40K", credits: 40000, price: 40 },
];

export const CREDIT_COSTS: Record<CreditAction, number> = {
    VACANCY_REFRESH: 1000,
    STUDY: 2000,
    AGENT_MESSAGE: 200,
};

export const CREDIT_ACTION_LABELS: Record<CreditAction, string> = {
    VACANCY_REFRESH: "Atualização de vagas antes do prazo",
    STUDY: "Geração de estudo",
    AGENT_MESSAGE: "Mensagem para o agente",
};

export const CREDIT_REASON_LABELS: Record<string, string> = {
    WELCOME: "Créditos de boas-vindas",
    PLAN_RENEWAL: "Renovação do plano",
    PURCHASE: "Compra de créditos avulsos",
    REFUND: "Estorno de créditos",
    ...CREDIT_ACTION_LABELS,
};

export function getPlan(id: string | null | undefined): PlanConfig | undefined {
    return PLANS.find((p) => p.id === id);
}

export function getCreditPackage(id: string | null | undefined): CreditPackageConfig | undefined {
    return CREDIT_PACKAGES.find((p) => p.id === id);
}

export function formatCredits(value: number): string {
    return value.toLocaleString("pt-BR");
}

export function formatPrice(value: number): string {
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// Código retornado pela API (HTTP 402) quando o usuário não tem créditos para a ação
export const INSUFFICIENT_CREDITS_CODE = "INSUFFICIENT_CREDITS";
