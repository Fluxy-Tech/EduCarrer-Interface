import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
    CREDIT_ACTION_LABELS,
    CREDIT_COSTS,
    CreditAction,
    INSUFFICIENT_CREDITS_CODE,
    formatCredits,
    getPlan,
} from "@/lib/credits/config";

type Tx = Prisma.TransactionClient;

interface UserCredits {
    planCredits: number;
    planExpiresAt: Date | null;
    extraCredits: number;
}

// Débito feito em uma ação, guardado para conseguir estornar para os mesmos saldos
export interface CreditCharge {
    action: CreditAction;
    fromPlan: number;
    fromExtra: number;
    referenceId?: string | null;
}

export type SpendResult =
    | { ok: true; charge: CreditCharge; balance: number }
    | { ok: false; required: number; balance: number };

// Créditos do plano só valem até planExpiresAt (fim do ciclo pago + tolerância)
export function getEffectivePlanCredits(user: UserCredits, now = new Date()): number {
    if (!user.planExpiresAt || user.planExpiresAt.getTime() <= now.getTime()) return 0;
    return Math.max(user.planCredits, 0);
}

export function getTotalCredits(user: UserCredits, now = new Date()): number {
    return getEffectivePlanCredits(user, now) + Math.max(user.extraCredits, 0);
}

// Trava a linha do usuário até o fim da transação para evitar gasto duplo em requisições simultâneas
async function lockUser(tx: Tx, userId: string) {
    await tx.$queryRaw`SELECT "id" FROM "User" WHERE "id" = ${userId} FOR UPDATE`;

    return await tx.user.findUniqueOrThrow({
        where: { id: userId },
        select: { planCredits: true, planExpiresAt: true, extraCredits: true },
    });
}

export async function getCreditsSummary(userId: string) {
    const [user, subscription, transactions, pendingPayments] = await Promise.all([
        prisma.user.findUniqueOrThrow({
            where: { id: userId },
            select: { plan: true, planCredits: true, planExpiresAt: true, extraCredits: true, cpfCnpj: true },
        }),
        prisma.subscription.findFirst({
            where: { userId, status: { in: ["PENDING", "ACTIVE", "OVERDUE"] } },
            orderBy: { createdAt: "desc" },
            select: { id: true, plan: true, status: true, value: true, createdAt: true },
        }),
        prisma.creditTransaction.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            take: 30,
            select: { id: true, amount: true, reason: true, description: true, balance: true, createdAt: true },
        }),
        prisma.payment.findMany({
            where: { userId, status: { in: ["PENDING", "OVERDUE"] } },
            orderBy: { createdAt: "desc" },
            take: 5,
            select: { id: true, type: true, plan: true, credits: true, value: true, status: true, invoiceUrl: true, createdAt: true },
        }),
    ]);

    const planCredits = getEffectivePlanCredits(user);
    const planActive = planCredits > 0 || (!!user.planExpiresAt && user.planExpiresAt > new Date());

    return {
        plan: planActive ? user.plan : null,
        planName: planActive ? getPlan(user.plan)?.name ?? null : null,
        planCredits,
        planExpiresAt: planActive ? user.planExpiresAt : null,
        extraCredits: Math.max(user.extraCredits, 0),
        total: planCredits + Math.max(user.extraCredits, 0),
        hasDocument: !!user.cpfCnpj,
        subscription,
        transactions,
        pendingPayments,
        costs: CREDIT_COSTS,
    };
}

// Debita os créditos de uma ação: primeiro os do plano (que expiram), depois os avulsos
export async function spendCredits(userId: string, action: CreditAction, referenceId?: string | null): Promise<SpendResult> {
    const cost = CREDIT_COSTS[action];

    return await prisma.$transaction(async (tx) => {
        const user = await lockUser(tx, userId);
        const planAvailable = getEffectivePlanCredits(user);
        const total = planAvailable + Math.max(user.extraCredits, 0);

        if (total < cost) {
            return { ok: false as const, required: cost, balance: total };
        }

        const fromPlan = Math.min(planAvailable, cost);
        const fromExtra = cost - fromPlan;

        await tx.user.update({
            where: { id: userId },
            data: {
                planCredits: planAvailable - fromPlan,
                extraCredits: { decrement: fromExtra },
            },
        });

        await tx.creditTransaction.create({
            data: {
                userId,
                amount: -cost,
                reason: action,
                description: CREDIT_ACTION_LABELS[action],
                referenceId: referenceId ?? null,
                balance: total - cost,
            },
        });

        return { ok: true as const, charge: { action, fromPlan, fromExtra, referenceId }, balance: total - cost };
    });
}

// Devolve um débito quando a IA falha, para os mesmos saldos de onde saiu
export async function refundCredits(userId: string, charge: CreditCharge) {
    try {
        await prisma.$transaction(async (tx) => {
            const user = await lockUser(tx, userId);
            const amount = charge.fromPlan + charge.fromExtra;

            // Se o plano expirou entre o débito e o estorno, devolve como avulso
            const planStillValid = !!user.planExpiresAt && user.planExpiresAt > new Date();
            const toPlan = planStillValid ? charge.fromPlan : 0;
            const toExtra = amount - toPlan;

            const updated = await tx.user.update({
                where: { id: userId },
                data: {
                    planCredits: { increment: toPlan },
                    extraCredits: { increment: toExtra },
                },
                select: { planCredits: true, planExpiresAt: true, extraCredits: true },
            });

            await tx.creditTransaction.create({
                data: {
                    userId,
                    amount,
                    reason: "REFUND",
                    description: `Estorno: ${CREDIT_ACTION_LABELS[charge.action]} não concluída`,
                    referenceId: charge.referenceId ?? null,
                    balance: getTotalCredits(updated),
                },
            });
        });
    } catch (e) {
        console.error("Erro ao estornar créditos:", e);
    }
}

// Renovação/ativação do plano: o saldo do plano volta ao total do plano e vale até expiresAt
export async function grantPlanCredits(tx: Tx, userId: string, planId: string, expiresAt: Date, referenceId: string) {
    const plan = getPlan(planId);
    if (!plan) throw new Error(`Plano desconhecido: ${planId}`);

    await lockUser(tx, userId);

    const updated = await tx.user.update({
        where: { id: userId },
        data: { plan: plan.id, planCredits: plan.credits, planExpiresAt: expiresAt },
        select: { planCredits: true, planExpiresAt: true, extraCredits: true },
    });

    await tx.creditTransaction.create({
        data: {
            userId,
            amount: plan.credits,
            reason: "PLAN_RENEWAL",
            description: `Plano ${plan.name}: ${formatCredits(plan.credits)} créditos`,
            referenceId,
            balance: getTotalCredits(updated),
        },
    });
}

// Compra avulsa: soma nos créditos que não expiram
export async function grantExtraCredits(tx: Tx, userId: string, credits: number, referenceId: string) {
    await lockUser(tx, userId);

    const updated = await tx.user.update({
        where: { id: userId },
        data: { extraCredits: { increment: credits } },
        select: { planCredits: true, planExpiresAt: true, extraCredits: true },
    });

    await tx.creditTransaction.create({
        data: {
            userId,
            amount: credits,
            reason: "PURCHASE",
            description: `${formatCredits(credits)} créditos avulsos`,
            referenceId,
            balance: getTotalCredits(updated),
        },
    });
}

// Registra no extrato os créditos de boas-vindas (o saldo já vem do default da coluna extraCredits)
export async function registerWelcomeCredits(userId: string) {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { extraCredits: true },
        });

        if (!user) return;

        await prisma.creditTransaction.create({
            data: {
                userId,
                amount: user.extraCredits,
                reason: "WELCOME",
                description: "Créditos de boas-vindas",
                balance: user.extraCredits,
            },
        });
    } catch (e) {
        console.error("Erro ao registrar créditos de boas-vindas:", e);
    }
}

// Resposta padrão (HTTP 402) quando falta crédito. O front abre a oferta de compra ao receber esse código
export function insufficientCreditsResponse(
    result: { required: number; balance: number },
    extra: Record<string, unknown> = {}
) {
    return NextResponse.json(
        {
            status: false,
            code: INSUFFICIENT_CREDITS_CODE,
            required: result.required,
            balance: result.balance,
            message: `Você precisa de ${formatCredits(result.required)} créditos para isso e tem ${formatCredits(result.balance)}. Compre créditos avulsos ou assine um plano para continuar.`,
            ...extra,
        },
        { status: 402 }
    );
}
