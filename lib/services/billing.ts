import { addDays, addMonths } from "date-fns";
import { prisma } from "@/lib/prisma";
import { asaas, asaasDate, AsaasError, AsaasPayment } from "@/lib/services/asaas";
import { grantExtraCredits, grantPlanCredits } from "@/lib/services/credits";
import { PLAN_GRACE_DAYS, canSubscribePlan, formatCredits, getCreditPackage, getPlan } from "@/lib/credits/config";
import { isValidCpfCnpj, onlyDigits } from "@/lib/utils/document";

const PAID_STATUSES = ["RECEIVED", "CONFIRMED", "RECEIVED_IN_CASH"];
const OPEN_SUBSCRIPTION_STATUSES = ["PENDING", "ACTIVE", "OVERDUE"];

export const DOCUMENT_REQUIRED_CODE = "DOCUMENT_REQUIRED";

type BillingResult =
    | { status: true; message: string; invoiceUrl: string | null }
    | { status: false; message: string; code?: string };

// Garante o cliente do usuário no Asaas. O CPF/CNPJ só é pedido na primeira compra
async function ensureCustomer(userId: string, cpfCnpj?: string | null) {
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { id: true, name: true, email: true, cpfCnpj: true, asaasCustomerId: true },
    });

    const document = cpfCnpj ? onlyDigits(cpfCnpj) : user.cpfCnpj;

    if (cpfCnpj && !isValidCpfCnpj(cpfCnpj)) {
        return { ok: false as const, message: "CPF ou CNPJ inválido" };
    }

    if (user.asaasCustomerId) {
        if (document && document !== user.cpfCnpj) {
            await asaas.updateCustomer(user.asaasCustomerId, { cpfCnpj: document });
            await prisma.user.update({ where: { id: userId }, data: { cpfCnpj: document } });
        }
        return { ok: true as const, customerId: user.asaasCustomerId };
    }

    if (!document) {
        return { ok: false as const, code: DOCUMENT_REQUIRED_CODE, message: "Informe seu CPF ou CNPJ para gerar a cobrança" };
    }

    const customer = await asaas.createCustomer({
        name: user.name || user.email,
        email: user.email,
        cpfCnpj: document,
        externalReference: user.id,
    });

    await prisma.user.update({
        where: { id: userId },
        data: { asaasCustomerId: customer.id, cpfCnpj: document },
    });

    return { ok: true as const, customerId: customer.id };
}

function toDate(value?: string | null): Date | null {
    // Datas do Asaas vêm como YYYY-MM-DD; meio-dia evita virar o dia anterior por fuso
    return value ? new Date(`${value.slice(0, 10)}T12:00:00-03:00`) : null;
}

async function cancelAsaasSubscription(asaasSubscriptionId: string) {
    try {
        await asaas.deleteSubscription(asaasSubscriptionId);
    } catch (e) {
        // Já removida no Asaas: segue o fluxo
        if (!(e instanceof AsaasError && e.status === 404)) throw e;
    }
}

function billingError(e: unknown): BillingResult {
    console.error(e);
    const message = e instanceof AsaasError && e.status < 500
        ? `Não foi possível gerar a cobrança: ${e.message}`
        : "Não conseguimos falar com o meio de pagamento agora, tente novamente em instantes";
    return { status: false, message };
}

// Assina (ou troca) o plano mensal. Os créditos só são liberados quando o Asaas confirmar o pagamento
export async function subscribeToPlan(userId: string, planId: string, cpfCnpj?: string | null): Promise<BillingResult> {
    const plan = getPlan(planId);
    if (!plan) return { status: false, message: "Plano inválido" };

    // Recrutador só assina o plano de recrutador e usuário só os planos de estudo
    const owner = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!canSubscribePlan(owner?.role, plan.id)) {
        return { status: false, message: "Este plano não está disponível para o seu perfil" };
    }

    try {
        const current = await prisma.subscription.findFirst({
            where: { userId, status: { in: OPEN_SUBSCRIPTION_STATUSES } },
            orderBy: { createdAt: "desc" },
            include: { payments: { where: { status: { in: ["PENDING", "OVERDUE"] } }, orderBy: { createdAt: "desc" }, take: 1 } },
        });

        if (current && current.plan === plan.id && current.status !== "PENDING") {
            const pending = current.payments[0];
            if (pending?.invoiceUrl) {
                return { status: true, message: "Você já assina esse plano. Abrimos a fatura em aberto.", invoiceUrl: pending.invoiceUrl };
            }
            return { status: false, message: `Você já assina o plano ${plan.name}` };
        }

        const customer = await ensureCustomer(userId, cpfCnpj);
        if (!customer.ok) return { status: false, message: customer.message, code: customer.code };

        // Troca de plano: encerra a assinatura anterior. Créditos já pagos continuam valendo até o fim do ciclo
        if (current) {
            await cancelAsaasSubscription(current.asaasSubscriptionId);
            await prisma.subscription.update({
                where: { id: current.id },
                data: { status: "CANCELED", canceledAt: new Date() },
            });
        }

        const created = await asaas.createSubscription({
            customer: customer.customerId,
            value: plan.price,
            nextDueDate: asaasDate(),
            description: `EduCarrer - Plano ${plan.name} (${formatCredits(plan.credits)} créditos/mês)`,
            externalReference: `sub:${userId}:${plan.id}`,
        });

        const subscription = await prisma.subscription.create({
            data: {
                userId,
                plan: plan.id,
                value: plan.price,
                status: "PENDING",
                asaasSubscriptionId: created.id,
            },
        });

        const { data: payments } = await asaas.listSubscriptionPayments(created.id);
        const first = payments[0];

        if (first) {
            await upsertPaymentFromAsaas(first, {
                type: "SUBSCRIPTION",
                plan: plan.id,
                credits: plan.credits,
                userId,
                subscriptionId: subscription.id,
            });
        }

        return {
            status: true,
            message: "Assinatura criada! Conclua o pagamento para liberar os créditos.",
            invoiceUrl: first?.invoiceUrl ?? null,
        };
    } catch (e) {
        return billingError(e);
    }
}

// Cancela a renovação. Os créditos do ciclo já pago continuam até planExpiresAt
export async function cancelSubscription(userId: string) {
    const current = await prisma.subscription.findFirst({
        where: { userId, status: { in: OPEN_SUBSCRIPTION_STATUSES } },
        orderBy: { createdAt: "desc" },
    });

    if (!current) return { status: false, message: "Você não tem uma assinatura ativa" };

    try {
        await cancelAsaasSubscription(current.asaasSubscriptionId);
    } catch (e) {
        console.error(e);
        return { status: false, message: "Não conseguimos cancelar agora, tente novamente em instantes" };
    }

    await prisma.subscription.update({
        where: { id: current.id },
        data: { status: "CANCELED", canceledAt: new Date() },
    });

    return { status: true, message: "Assinatura cancelada. Seus créditos do ciclo atual continuam valendo até o fim do período." };
}

// Compra avulsa de créditos (não expiram)
export async function buyCreditPackage(userId: string, packageId: string, cpfCnpj?: string | null): Promise<BillingResult> {
    const pack = getCreditPackage(packageId);
    if (!pack) return { status: false, message: "Pacote inválido" };

    try {
        const customer = await ensureCustomer(userId, cpfCnpj);
        if (!customer.ok) return { status: false, message: customer.message, code: customer.code };

        const payment = await asaas.createPayment({
            customer: customer.customerId,
            value: pack.price,
            dueDate: asaasDate(addDays(new Date(), 1)),
            description: `EduCarrer - ${formatCredits(pack.credits)} créditos avulsos`,
            externalReference: `credits:${userId}:${pack.id}`,
        });

        await upsertPaymentFromAsaas(payment, {
            type: "CREDITS",
            packageId: pack.id,
            credits: pack.credits,
            userId,
        });

        return {
            status: true,
            message: "Cobrança gerada! Assim que o pagamento for confirmado os créditos entram na sua conta.",
            invoiceUrl: payment.invoiceUrl ?? null,
        };
    } catch (e) {
        return billingError(e);
    }
}

interface LocalPaymentData {
    type: "SUBSCRIPTION" | "CREDITS";
    credits: number;
    userId: string;
    plan?: string;
    packageId?: string;
    subscriptionId?: string;
}

async function upsertPaymentFromAsaas(payment: AsaasPayment, local: LocalPaymentData) {
    const common = {
        status: payment.status,
        invoiceUrl: payment.invoiceUrl ?? null,
        dueDate: toDate(payment.dueDate),
        value: payment.value,
    };

    return await prisma.payment.upsert({
        where: { asaasPaymentId: payment.id },
        update: common,
        create: {
            ...common,
            asaasPaymentId: payment.id,
            type: local.type,
            plan: local.plan ?? null,
            packageId: local.packageId ?? null,
            credits: local.credits,
            userId: local.userId,
            subscriptionId: local.subscriptionId ?? null,
        },
    });
}

// Libera os créditos de uma cobrança paga, uma única vez (webhooks podem chegar repetidos)
async function creditPaidPayment(paymentId: string, asaasPayment: AsaasPayment) {
    await prisma.$transaction(async (tx) => {
        const paidAt = toDate(asaasPayment.confirmedDate || asaasPayment.paymentDate || asaasPayment.clientPaymentDate) ?? new Date();

        const claimed = await tx.payment.updateMany({
            where: { id: paymentId, credited: false },
            data: { credited: true, paidAt },
        });

        if (claimed.count === 0) return;

        const payment = await tx.payment.findUniqueOrThrow({ where: { id: paymentId } });

        if (payment.type === "CREDITS") {
            await grantExtraCredits(tx, payment.userId, payment.credits, payment.id);
            return;
        }

        if (!payment.plan) throw new Error(`Pagamento de assinatura sem plano: ${payment.id}`);

        // Créditos do plano valem um ciclo a partir do vencimento + tolerância de atraso
        const cycleStart = payment.dueDate ?? paidAt;
        const expiresAt = addDays(addMonths(cycleStart, 1), PLAN_GRACE_DAYS);

        await grantPlanCredits(tx, payment.userId, payment.plan, expiresAt, payment.id);

        if (payment.subscriptionId) {
            await tx.subscription.updateMany({
                where: { id: payment.subscriptionId, status: { not: "CANCELED" } },
                data: { status: "ACTIVE" },
            });
        }
    });
}

// Processa os eventos do webhook do Asaas
export async function handleAsaasWebhook(body: any) {
    const event: string = body?.event ?? "";

    if (event.startsWith("SUBSCRIPTION_") && body.subscription?.id) {
        if (event === "SUBSCRIPTION_DELETED" || event === "SUBSCRIPTION_INACTIVATED") {
            await prisma.subscription.updateMany({
                where: { asaasSubscriptionId: body.subscription.id, status: { not: "CANCELED" } },
                data: { status: "CANCELED", canceledAt: new Date() },
            });
        }
        return;
    }

    const asaasPayment: AsaasPayment | undefined = body?.payment;
    if (!event.startsWith("PAYMENT_") || !asaasPayment?.id) return;

    let payment = await prisma.payment.findUnique({ where: { asaasPaymentId: asaasPayment.id } });

    // Mensalidades seguintes são criadas pelo próprio Asaas: registramos ao receber o evento
    if (!payment && asaasPayment.subscription) {
        const subscription = await prisma.subscription.findUnique({
            where: { asaasSubscriptionId: asaasPayment.subscription },
        });

        if (!subscription) return;

        payment = await upsertPaymentFromAsaas(asaasPayment, {
            type: "SUBSCRIPTION",
            plan: subscription.plan,
            credits: getPlan(subscription.plan)?.credits ?? 0,
            userId: subscription.userId,
            subscriptionId: subscription.id,
        });
    }

    // Cobrança que não foi gerada pela plataforma
    if (!payment) return;

    payment = await prisma.payment.update({
        where: { id: payment.id },
        data: {
            status: asaasPayment.status,
            invoiceUrl: asaasPayment.invoiceUrl ?? payment.invoiceUrl,
        },
    });

    if (PAID_STATUSES.includes(asaasPayment.status) || event === "PAYMENT_RECEIVED" || event === "PAYMENT_CONFIRMED") {
        await creditPaidPayment(payment.id, asaasPayment);
        return;
    }

    if (event === "PAYMENT_OVERDUE" && payment.subscriptionId) {
        await prisma.subscription.updateMany({
            where: { id: payment.subscriptionId, status: "ACTIVE" },
            data: { status: "OVERDUE" },
        });
    }

    if (event === "PAYMENT_REFUNDED" || event === "PAYMENT_CHARGEBACK_REQUESTED") {
        console.warn(`Pagamento ${payment.id} estornado/contestado no Asaas (${event}). Revise os créditos do usuário ${payment.userId}.`);
    }
}
