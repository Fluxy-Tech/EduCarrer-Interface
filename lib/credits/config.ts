// Configuração única de planos, pacotes avulsos e custos de créditos.
// Arquivo sem dependências de servidor: pode ser usado no front e no back.

export type PlanId = "INICIANTE" | "MEDIANO" | "PROFISSIONAL" | "RECRUTADOR";
export type CreditPackageId = "PACK_5K" | "PACK_15K" | "PACK_40K";
export type CreditAction = "VACANCY_REFRESH" | "STUDY" | "AGENT_MESSAGE" | "CANDIDATE_UNLOCK";

// Para quem o plano é vendido: usuários (estudos e agentes) ou recrutadores (desbloqueio de candidatos)
export type PlanAudience = "user" | "recruiter";

export interface PlanConfig {
    id: PlanId;
    name: string;
    credits: number;
    // Valor mensal em reais
    price: number;
    audience: PlanAudience;
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

// Planos dos usuários (estudantes)
export const PLANS: PlanConfig[] = [
    { id: "INICIANTE", name: "Iniciante", credits: 20000, price: 19.9, audience: "user" },
    { id: "MEDIANO", name: "Mediano", credits: 50000, price: 39.9, audience: "user", highlight: true },
    { id: "PROFISSIONAL", name: "Profissional", credits: 80000, price: 59.9, audience: "user" },
];

// Plano dos recrutadores: créditos para desbloquear candidatos no ranking
export const RECRUITER_PLANS: PlanConfig[] = [
    { id: "RECRUTADOR", name: "Recrutador", credits: 80000, price: 60, audience: "recruiter", highlight: true },
];

const ALL_PLANS = [...PLANS, ...RECRUITER_PLANS];

// Dias que um candidato fica desbloqueado para o recrutador depois de pagar
export const CANDIDATE_UNLOCK_DAYS = 60;

// Planos que cada perfil pode assinar (admin vê todos)
export function getPlansForRole(role: string | null | undefined): PlanConfig[] {
    if (role === "recruiter") return RECRUITER_PLANS;
    if (role === "admin") return ALL_PLANS;
    return PLANS;
}

export function canSubscribePlan(role: string | null | undefined, planId: string): boolean {
    return getPlansForRole(role).some((p) => p.id === planId);
}

export const CREDIT_PACKAGES: CreditPackageConfig[] = [
    { id: "PACK_5K", credits: 5000, price: 5 },
    { id: "PACK_15K", credits: 15000, price: 15 },
    { id: "PACK_40K", credits: 40000, price: 40 },
];

export const CREDIT_COSTS: Record<CreditAction, number> = {
    VACANCY_REFRESH: 1000,
    STUDY: 2000,
    AGENT_MESSAGE: 200,
    CANDIDATE_UNLOCK: 1000,
};

export const CREDIT_ACTION_LABELS: Record<CreditAction, string> = {
    VACANCY_REFRESH: "Atualização de vagas antes do prazo",
    STUDY: "Geração de estudo",
    AGENT_MESSAGE: "Mensagem para o agente",
    CANDIDATE_UNLOCK: "Desbloqueio de candidato",
};

export const CREDIT_REASON_LABELS: Record<string, string> = {
    WELCOME: "Créditos de boas-vindas",
    PLAN_RENEWAL: "Renovação do plano",
    PURCHASE: "Compra de créditos avulsos",
    REFUND: "Estorno de créditos",
    ...CREDIT_ACTION_LABELS,
};

export function getPlan(id: string | null | undefined): PlanConfig | undefined {
    return ALL_PLANS.find((p) => p.id === id);
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
