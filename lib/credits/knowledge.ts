// Conhecimento sobre planos e créditos que os agentes de IA recebem no prompt.
// Gerado a partir de config.ts para nunca divergir dos valores reais da plataforma.

import {
    CREDIT_COSTS,
    CREDIT_PACKAGES,
    PLANS,
    PLAN_GRACE_DAYS,
    VACANCY_FREE_REFRESH_DAYS,
    WELCOME_CREDITS,
    formatCredits,
    formatPrice,
    getPlan,
} from "@/lib/credits/config";

// Situação atual do usuário, para o agente responder perguntas sobre o próprio saldo
export interface UserCreditsSnapshot {
    total: number;
    planCredits: number;
    extraCredits: number;
    plan: string | null;
    planExpiresAt: Date | null;
    subscriptionStatus: string | null;
    subscriptionPlan: string | null;
    nextFreeVacancyRefreshAt: Date | null;
}

const SUBSCRIPTION_STATUS_TEXT: Record<string, string> = {
    PENDING: "criada, aguardando o pagamento da primeira mensalidade",
    ACTIVE: "ativa",
    OVERDUE: "com pagamento atrasado",
};

const formatDate = (date: Date) =>
    date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", dateStyle: "short", timeStyle: "short" });

export function buildCreditsKnowledge(): string {
    const plans = PLANS.map((p) =>
        `  - ${p.name}: ${formatPrice(p.price)}/mês com ${formatCredits(p.credits)} créditos por mês (até ${Math.floor(p.credits / CREDIT_COSTS.STUDY)} estudos ou ${formatCredits(Math.floor(p.credits / CREDIT_COSTS.AGENT_MESSAGE))} mensagens).`
    ).join("\n");

    const packages = CREDIT_PACKAGES.map((p) => `${formatPrice(p.price)} = ${formatCredits(p.credits)} créditos`).join("; ");

    return [
        "Planos e créditos da plataforma (use exatamente estes valores, nunca invente outros):",
        "- As funcionalidades de IA consomem créditos. Custos por ação:",
        `  - Gerar um estudo para uma vaga: ${formatCredits(CREDIT_COSTS.STUDY)} créditos.`,
        `  - Cada mensagem enviada para um agente (o EduBot do perfil ou o tutor de um estudo): ${formatCredits(CREDIT_COSTS.AGENT_MESSAGE)} créditos. Esta conversa também consome créditos a cada mensagem do usuário.`,
        `  - Atualizar as vagas recomendadas antes do prazo: ${formatCredits(CREDIT_COSTS.VACANCY_REFRESH)} créditos.`,
        `- Grátis: a recomendação de vagas é refeita automaticamente a cada ${VACANCY_FREE_REFRESH_DAYS} dias; estudar os níveis, responder os desafios (quiz), ganhar XP, ver o progresso, editar o perfil e importar o currículo não consomem créditos.`,
        `- Toda conta nova ganha ${formatCredits(WELCOME_CREDITS)} créditos de boas-vindas (avulsos).`,
        "- Planos mensais (assinatura recorrente, cancela quando quiser):",
        plans,
        `- Créditos avulsos, para recarregar sem trocar de plano: ${packages}. Créditos avulsos não expiram.`,
        `- Os créditos do plano são renovados para o total do plano a cada mensalidade paga e valem durante aquele ciclo (com ${PLAN_GRACE_DAYS} dias de tolerância). Não acumulam de um mês para o outro.`,
        "- Ordem de consumo: primeiro os créditos do plano, depois os avulsos.",
        "- Se a IA falhar e não concluir uma ação, os créditos daquela ação são devolvidos automaticamente.",
        "- Sem créditos suficientes, as ações de IA ficam bloqueadas e a plataforma oferece a compra de créditos avulsos ou um plano. Estudos, níveis e progresso continuam acessíveis.",
        "- Trocar de plano: a nova assinatura começa a valer quando for paga e os créditos do plano passam a ser os do novo plano. Ao cancelar, os créditos do ciclo já pago continuam valendo até o fim do período.",
        "- Pagamento pelo Asaas, com PIX, cartão de crédito ou boleto. O CPF ou CNPJ é pedido na primeira compra. Os créditos entram automaticamente quando o pagamento é confirmado (PIX e cartão costumam ser imediatos; boleto pode levar até 3 dias úteis).",
        "- Tudo isso fica na tela Planos (menu lateral): saldo, planos, compra de avulsos, cobranças em aberto, extrato de movimentações e cancelamento da assinatura. O saldo também aparece no card 'Créditos de IA' do menu lateral.",
        "",
        "Regras ao falar de créditos:",
        "- Você não consegue comprar, cancelar, transferir, devolver ou dar créditos. Para isso, oriente o usuário a usar a tela Planos.",
        "- Não prometa descontos, bônus ou estornos fora das regras acima. Problemas de pagamento devem ser vistos na tela Planos (cobranças em aberto e extrato).",
        "- Ao sugerir uma ação que consome créditos, informe o custo. Se o saldo do usuário não for suficiente, diga isso e indique a tela Planos.",
    ].join("\n");
}

export function buildUserCreditsContext(snapshot: UserCreditsSnapshot | null | undefined): string {
    if (!snapshot) return "";

    const lines = [
        "Situação atual do usuário (dados reais do sistema, já descontada a mensagem atual):",
        `- Saldo total: ${formatCredits(snapshot.total)} créditos (${formatCredits(snapshot.planCredits)} do plano + ${formatCredits(snapshot.extraCredits)} avulsos).`,
    ];

    const plan = getPlan(snapshot.plan);
    if (plan && snapshot.planExpiresAt && snapshot.planExpiresAt > new Date()) {
        lines.push(`- Plano: ${plan.name}. Créditos do plano válidos até ${formatDate(snapshot.planExpiresAt)}.`);
    } else {
        lines.push("- Sem plano com créditos ativos no momento.");
    }

    if (snapshot.subscriptionStatus) {
        const subPlan = getPlan(snapshot.subscriptionPlan)?.name ?? snapshot.subscriptionPlan;
        lines.push(`- Assinatura do plano ${subPlan}: ${SUBSCRIPTION_STATUS_TEXT[snapshot.subscriptionStatus] ?? snapshot.subscriptionStatus}.`);
    }

    if (snapshot.nextFreeVacancyRefreshAt) {
        const free = snapshot.nextFreeVacancyRefreshAt <= new Date();
        lines.push(free
            ? "- A próxima atualização de vagas já é gratuita."
            : `- Próxima atualização gratuita das vagas: ${formatDate(snapshot.nextFreeVacancyRefreshAt)}.`);
    }

    const possible = [
        `${Math.floor(snapshot.total / CREDIT_COSTS.STUDY)} estudo(s)`,
        `${Math.floor(snapshot.total / CREDIT_COSTS.AGENT_MESSAGE)} mensagem(ns)`,
    ];
    lines.push(`- Com o saldo atual dá para gerar até ${possible[0]} ou enviar até ${possible[1]}.`);

    return lines.join("\n");
}
