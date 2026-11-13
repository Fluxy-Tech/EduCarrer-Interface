// Perfis de usuário e áreas de interesse. Sem dependências de servidor: usado no front e no back.

export type UserRole = "user" | "recruiter" | "admin";

export const USER_ROLES: { id: UserRole; label: string; description: string }[] = [
    { id: "user", label: "Usuário", description: "Estuda para vagas, gera estudos e usa os agentes." },
    { id: "recruiter", label: "Recrutador", description: "Vê o ranking de candidatos, baixa currículos autorizados e cadastra vagas." },
    { id: "admin", label: "Administrador", description: "Acesso total, incluindo gestão de vagas, métricas e usuários." },
];

export function isRole(value: unknown): value is UserRole {
    return USER_ROLES.some((r) => r.id === value);
}

export function getRoleLabel(role: string | null | undefined): string {
    return USER_ROLES.find((r) => r.id === role)?.label ?? "Usuário";
}

// Tela inicial de cada perfil depois do login
export function getHomeForRole(role: string | null | undefined): string {
    return role === "recruiter" ? "/recruiter/ranking" : "/jobs";
}

export const AREAS_OF_INTEREST = [
    "Backend",
    "Frontend",
    "FullStack",
    "Mobile",
    "DevOps / Cloud",
    "Dados",
    "IA / Machine Learning",
    "QA / Testes",
    "UX / UI Design",
    "Segurança da Informação",
] as const;

export function isAreaOfInterest(value: unknown): value is (typeof AREAS_OF_INTEREST)[number] {
    return AREAS_OF_INTEREST.includes(value as any);
}

// Pontos extras no ranking de recrutadores (somados ao XP dos desafios)
export const RANK_BONUS_LINKS = 50;   // LinkedIn ou portfólio cadastrado no perfil
export const RANK_BONUS_RESUME = 100; // Currículo anexado e liberado para recrutadores
