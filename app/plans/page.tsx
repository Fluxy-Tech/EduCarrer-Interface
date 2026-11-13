"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  BookOpenCheck,
  BriefcaseBusiness,
  Check,
  Clock,
  Coins,
  Crown,
  ExternalLink,
  Gift,
  MessagesSquare,
  RefreshCw,
  LockOpen,
  Trophy,
} from "lucide-react";
import { useSession } from "@/lib/auth/auth-client";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ToastPersonalizado } from "@/components/toast";
import { useCreditsDialogs } from "@/components/credits/credits-provider";
import { cancelPlan, useCredits } from "@/app/services/credits.swr";
import {
  CREDIT_COSTS,
  CREDIT_PACKAGES,
  CREDIT_REASON_LABELS,
  CANDIDATE_UNLOCK_DAYS,
  getPlansForRole,
  VACANCY_FREE_REFRESH_DAYS,
  WELCOME_CREDITS,
  formatCredits,
  formatPrice,
  getPlan,
} from "@/lib/credits/config";
import { cn } from "@/lib/utils";

const SUBSCRIPTION_STATUS: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Aguardando pagamento", className: "bg-gold-soft text-gold" },
  ACTIVE: { label: "Ativa", className: "bg-success-soft text-success" },
  OVERDUE: { label: "Pagamento atrasado", className: "bg-danger-soft text-danger" },
};

const formatDate = (value: string | Date) => format(new Date(value), "dd 'de' MMM 'de' yyyy", { locale: ptBR });

export default function PlansPage() {
  const { credits, isLoading, refresh } = useCredits();
  const { openCheckout } = useCreditsDialogs();
  const [canceling, setCanceling] = useState(false);
  const { data: session } = useSession();
  const isRecruiter = session?.user?.role === "recruiter";
  // Recrutador vê o plano de recrutador; usuários (e admin) veem os planos de estudo
  const plans = getPlansForRole(isRecruiter ? "recruiter" : "user");

  const subscription = credits?.subscription ?? null;
  const subscribedPlan = subscription && subscription.status !== "PENDING" ? subscription.plan : null;

  const handleCancel = async () => {
    try {
      setCanceling(true);
      const res = await cancelPlan();
      ToastPersonalizado({ mensagem: res.message });
      await refresh();
    } catch (e) {
      console.error(e);
      ToastPersonalizado({ mensagem: "Não conseguimos cancelar agora, tente novamente." });
    } finally {
      setCanceling(false);
    }
  };

  const recruiterUsage = [
    {
      icon: LockOpen,
      title: "Desbloquear um candidato",
      cost: CREDIT_COSTS.CANDIDATE_UNLOCK,
      detail: `Libera por ${CANDIDATE_UNLOCK_DAYS} dias os links, o currículo, as habilidades, as experiências e os estudos concluídos do candidato.`,
    },
    {
      icon: RefreshCw,
      title: "Renovar o acesso depois do prazo",
      cost: CREDIT_COSTS.CANDIDATE_UNLOCK,
      detail: `Passados ${CANDIDATE_UNLOCK_DAYS} dias, o candidato volta a ficar bloqueado e pode ser desbloqueado de novo.`,
    },
    {
      icon: Trophy,
      title: "Ver o ranking e filtrar por área ou stack",
      cost: 0,
      detail: "Nome, patente e pontuação dos candidatos ficam sempre visíveis.",
    },
  ];

  const usage = isRecruiter ? recruiterUsage : [
    {
      icon: BookOpenCheck,
      title: "Gerar um estudo",
      cost: CREDIT_COSTS.STUDY,
      detail: "Trilha completa com níveis, quiz e plano semanal para uma vaga.",
    },
    {
      icon: MessagesSquare,
      title: "Mensagem para o agente",
      cost: CREDIT_COSTS.AGENT_MESSAGE,
      detail: "Cada pergunta enviada ao agente do perfil ou ao tutor de um estudo.",
    },
    {
      icon: RefreshCw,
      title: "Atualizar vagas antes do prazo",
      cost: CREDIT_COSTS.VACANCY_REFRESH,
      detail: `As vagas recomendadas são refeitas grátis a cada ${VACANCY_FREE_REFRESH_DAYS} dias. Antes disso, a atualização é cobrada.`,
    },
    {
      icon: BriefcaseBusiness,
      title: `Recomendação de vagas a cada ${VACANCY_FREE_REFRESH_DAYS} dias`,
      cost: 0,
      detail: "A IA cruza seu perfil com as vagas automaticamente, sem custo.",
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Saldo */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-gradient p-6 sm:p-8 lg:p-10 text-white animate-rise">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-gold">Saldo disponível</p>
            <p className="mt-3 font-display text-6xl sm:text-7xl leading-none tabular-nums">
              {isLoading ? "…" : formatCredits(credits?.total ?? 0)}
            </p>
            <p className="mt-2 text-white/60">créditos para usar com a IA</p>

            {subscription && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className={cn("rounded-full px-3 py-1 text-xs font-bold", SUBSCRIPTION_STATUS[subscription.status]?.className)}>
                  Plano {getPlan(subscription.plan)?.name}: {SUBSCRIPTION_STATUS[subscription.status]?.label}
                </span>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <button className="cursor-pointer text-xs text-white/50 underline-offset-4 hover:text-white hover:underline" disabled={canceling}>
                      Cancelar assinatura
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancelar a assinatura?</AlertDialogTitle>
                      <AlertDialogDescription>
                        A renovação mensal será interrompida. Os créditos do ciclo já pago continuam valendo até o fim do período e os créditos avulsos não expiram.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Manter plano</AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancel}>Cancelar assinatura</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
              <Crown className="size-4 text-gold" />
              <p className="mt-3 text-2xl font-extrabold tabular-nums">{formatCredits(credits?.planCredits ?? 0)}</p>
              <p className="text-xs text-white/50">
                {credits?.planName ? `Plano ${credits.planName}` : "Créditos do plano"}
              </p>
              {credits?.planExpiresAt && (
                <p className="mt-1 text-[11px] text-white/40">Válidos até {formatDate(credits.planExpiresAt)}</p>
              )}
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
              <Coins className="size-4 text-gold" />
              <p className="mt-3 text-2xl font-extrabold tabular-nums">{formatCredits(credits?.extraCredits ?? 0)}</p>
              <p className="text-xs text-white/50">Créditos avulsos</p>
              <p className="mt-1 text-[11px] text-white/40">Não expiram</p>
            </div>
          </div>
        </div>
      </section>

      {/* Cobranças em aberto */}
      {credits && credits.pendingPayments.length > 0 && (
        <section className="surface flex flex-col gap-3 p-5">
          <p className="eyebrow text-gold">Cobranças em aberto</p>
          {credits.pendingPayments.map((p) => (
            <div key={p.id} className="flex flex-col gap-3 rounded-xl bg-sky p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold text-ink">
                  {p.type === "SUBSCRIPTION" ? `Plano ${getPlan(p.plan)?.name ?? ""}` : `${formatCredits(p.credits)} créditos avulsos`} · {formatPrice(p.value)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {p.status === "OVERDUE" ? "Vencida" : "Aguardando pagamento"} · gerada em {formatDate(p.createdAt)}
                </p>
              </div>
              {p.invoiceUrl && (
                <Button asChild variant="create" size="sm">
                  <a href={p.invoiceUrl} target="_blank" rel="noopener noreferrer">
                    Pagar agora <ExternalLink />
                  </a>
                </Button>
              )}
            </div>
          ))}
        </section>
      )}

      {/* Planos */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-3xl text-ink">Planos mensais</h2>
          <p className="text-sm text-muted-foreground">Os créditos do plano são renovados a cada mês pago e usados antes dos avulsos.</p>
        </div>

        <div className={cn("grid gap-4 stagger", plans.length > 1 ? "md:grid-cols-3" : "max-w-md")}>
          {plans.map((plan) => {
            const current = subscribedPlan === plan.id;

            return (
              <div
                key={plan.id}
                className={cn(
                  "relative flex flex-col rounded-3xl border bg-white p-6 shadow-soft",
                  plan.highlight ? "border-brand ring-4 ring-brand-soft" : "border-border"
                )}
              >
                {plan.highlight && plan.audience === "user" && (
                  <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-[11px] font-bold text-white">
                    Mais escolhido
                  </span>
                )}
                <p className="eyebrow text-brand">{plan.name}</p>
                <p className="mt-3 font-display text-5xl text-ink tabular-nums">{formatPrice(plan.price)}</p>
                <p className="text-xs text-muted-foreground">por mês</p>

                <ul className="mt-6 flex flex-col gap-2 text-sm text-ink/80">
                  <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> {formatCredits(plan.credits)} créditos por mês</li>
                  {plan.audience === "recruiter" ? (
                    <>
                      <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> Até {Math.floor(plan.credits / CREDIT_COSTS.CANDIDATE_UNLOCK)} candidatos desbloqueados por mês</li>
                      <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> Cada desbloqueio vale {CANDIDATE_UNLOCK_DAYS} dias</li>
                      <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> Currículo, contato, habilidades e estudos concluídos</li>
                    </>
                  ) : (
                    <>
                      <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> Até {Math.floor(plan.credits / CREDIT_COSTS.STUDY)} estudos ou {formatCredits(Math.floor(plan.credits / CREDIT_COSTS.AGENT_MESSAGE))} mensagens</li>
                      <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> Vagas recomendadas a cada {VACANCY_FREE_REFRESH_DAYS} dias</li>
                    </>
                  )}
                  <li className="flex gap-2"><Check className="size-4 shrink-0 text-success" /> Cancele quando quiser</li>
                </ul>

                <Button
                  className="mt-6 w-full"
                  variant={current ? "outline" : plan.highlight ? "create" : "default"}
                  disabled={current}
                  onClick={() => openCheckout({ kind: "plan", id: plan.id })}
                >
                  {current ? "Seu plano atual" : subscribedPlan ? "Trocar para este plano" : "Assinar"}
                </Button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Avulsos */}
      <section>
        <div className="mb-4">
          <h2 className="font-display text-3xl text-ink">Créditos avulsos</h2>
          <p className="text-sm text-muted-foreground">Acabaram os créditos? Recarregue sem trocar de plano. Avulsos não expiram.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          {CREDIT_PACKAGES.map((pack) => (
            <div key={pack.id} className="surface flex items-center justify-between gap-4 p-5">
              <div>
                <p className="text-2xl font-extrabold text-ink tabular-nums">{formatCredits(pack.credits)}</p>
                <p className="text-xs text-muted-foreground">créditos · {formatPrice(pack.price)}</p>
              </div>
              <Button variant="gold" size="sm" onClick={() => openCheckout({ kind: "package", id: pack.id })}>
                Comprar
              </Button>
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px] xl:items-start">
        {/* Como funciona */}
        <section className="surface p-6">
          <p className="eyebrow text-brand">Como funcionam os créditos</p>
          <h3 className="mt-1 font-display text-2xl text-ink">Quanto custa cada ação</h3>

          <ul className="mt-5 flex flex-col divide-y divide-border">
            {usage.map((u) => (
              <li key={u.title} className="flex items-start gap-4 py-4">
                <span className="grid place-items-center size-10 shrink-0 rounded-xl bg-brand-soft text-brand">
                  <u.icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-ink">{u.title}</p>
                  <p className="text-xs text-muted-foreground">{u.detail}</p>
                </div>
                <span className={cn("shrink-0 rounded-full px-3 py-1 text-xs font-bold tabular-nums", u.cost ? "bg-gold-soft text-gold" : "bg-success-soft text-success")}>
                  {u.cost ? `${formatCredits(u.cost)} créditos` : "Grátis"}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="flex gap-3 rounded-xl bg-sky p-4">
              <Gift className="size-5 shrink-0 text-gold" />
              <p className="text-xs text-muted-foreground">
                Toda conta nova ganha <strong className="text-ink">{formatCredits(WELCOME_CREDITS)} créditos</strong> de boas-vindas para testar.
              </p>
            </div>
            <div className="flex gap-3 rounded-xl bg-sky p-4">
              <Clock className="size-5 shrink-0 text-brand" />
              <p className="text-xs text-muted-foreground">
                Usamos primeiro os créditos do plano. Se a IA falhar, os créditos da ação são devolvidos automaticamente.
              </p>
            </div>
          </div>
        </section>

        {/* Extrato */}
        <section className="surface p-6">
          <p className="eyebrow text-brand">Extrato</p>
          <h3 className="mt-1 font-display text-2xl text-ink">Últimas movimentações</h3>

          {credits && credits.transactions.length > 0 ? (
            <ul className="mt-4 flex flex-col">
              {credits.transactions.map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-3 border-b border-border py-3 last:border-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-ink">{t.description ?? CREDIT_REASON_LABELS[t.reason] ?? t.reason}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(t.createdAt), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                  <span className={cn("shrink-0 text-sm font-bold tabular-nums", t.amount > 0 ? "text-success" : "text-ink")}>
                    {t.amount > 0 ? "+" : ""}{formatCredits(t.amount)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Nenhuma movimentação ainda.</p>
          )}
        </section>
      </div>
    </div>
  );
}
