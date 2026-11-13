"use client";

import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { ArrowDown, BookOpenCheck, Flag, GraduationCap, Layers, TrendingUp, Trophy, Users } from "lucide-react";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { useStudyEvolutionMetrics } from "@/app/services/metrics.swr";
import { cn } from "@/lib/utils";

const PERIODS = [3, 6, 12];

const MONTHS = ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"];

const formatMonth = (value: string) => {
  const [year, month] = value.split("-");
  return `${MONTHS[Number(month) - 1]}/${year.slice(2)}`;
};

const formatNumber = (value: number) => value.toLocaleString("pt-BR");
const formatPercent = (value: number) => `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;

const entryConfig = {
  newUsers: { label: "Novos usuários", color: "var(--chart-3)" },
  studiesCreated: { label: "Estudos criados", color: "var(--chart-1)" },
} satisfies ChartConfig;

const progressConfig = {
  levelsCompleted: { label: "Níveis concluídos", color: "var(--chart-1)" },
  studiesCompleted: { label: "Estudos concluídos", color: "var(--chart-2)" },
} satisfies ChartConfig;

const FUNNEL_ICONS = {
  users: Users,
  withStudy: BookOpenCheck,
  half: TrendingUp,
  completed: Trophy,
};

const FUNNEL_COLORS = {
  users: "bg-ink",
  withStudy: "bg-ink-3",
  half: "bg-brand",
  completed: "bg-gold",
};

export default function AdminMetricsPage() {
  const [months, setMonths] = useState(6);
  const { metrics, isLoading } = useStudyEvolutionMetrics(months);

  if (isLoading && !metrics) {
    return (
      <div className="surface flex items-center gap-4 p-6">
        <span className="relative grid place-items-center size-12 shrink-0">
          <span className="absolute inset-0 rounded-full border-4 border-brand-soft" />
          <span className="absolute inset-0 rounded-full border-4 border-brand border-r-transparent animate-spin" />
        </span>
        <p className="text-sm text-muted-foreground">Calculando a evolução dos estudos...</p>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="surface p-6 text-sm text-muted-foreground">
        Não conseguimos carregar as métricas. Verifique se você está logado como administrador.
      </div>
    );
  }

  const { funnel, totals, distribution, evolution } = metrics;
  const maxDistribution = Math.max(...distribution.map((d) => d.count), 1);

  const kpis = [
    { icon: Layers, label: "Estudos criados", value: formatNumber(totals.studies), hint: `${totals.studiesPerUserWithStudy.toLocaleString("pt-BR")} por usuário que estuda` },
    { icon: GraduationCap, label: "Progresso médio", value: formatPercent(totals.averageProgress), hint: "Média de níveis concluídos por estudo" },
    { icon: TrendingUp, label: "Estudos com 50% ou mais", value: formatNumber(totals.studiesHalf), hint: `${formatPercent(totals.studies ? (totals.studiesHalf / totals.studies) * 100 : 0)} dos estudos` },
    { icon: Flag, label: "Níveis concluídos", value: formatNumber(totals.levelsCompleted), hint: `${formatNumber(totals.studiesCompleted)} estudos concluídos` },
  ];

  return (
    <div className="flex flex-col gap-8">
      {/* Funil */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-gradient p-6 sm:p-8 text-white animate-rise">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="eyebrow text-gold">Funil de evolução</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Do cadastro à conclusão</h2>
          </div>
          <p className="max-w-sm text-xs text-white/50 sm:text-right">
            Cada etapa mostra o percentual sobre o total de usuários e a conversão em relação à etapa anterior. Administradores não entram na contagem.
          </p>
        </div>

        <ol className="mt-8 flex flex-col">
          {funnel.map((stage, i) => {
            const Icon = FUNNEL_ICONS[stage.key];

            return (
              <li key={stage.key}>
                {i > 0 && (
                  <div className="flex items-center gap-2 py-2 pl-4 text-xs text-white/55">
                    <ArrowDown className="size-3.5" />
                    <span>
                      <strong className="text-white">{formatPercent(stage.percentOfPrevious ?? 0)}</strong> da etapa anterior
                      <span className="text-white/35"> · {formatNumber(funnel[i - 1].count - stage.count)} ficaram pelo caminho</span>
                    </span>
                  </div>
                )}

                <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:grid-cols-[minmax(0,260px)_1fr_auto] sm:items-center">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10">
                      <Icon className="size-4 text-gold" />
                    </span>
                    <p className="text-sm font-semibold">{stage.label}</p>
                  </div>

                  <div className="h-3 overflow-hidden rounded-full bg-white/10">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", FUNNEL_COLORS[stage.key], stage.key === "users" && "bg-white/70")}
                      style={{ width: `${Math.max(stage.percentOfUsers, stage.count > 0 ? 2 : 0)}%` }}
                    />
                  </div>

                  <div className="flex items-baseline gap-3 sm:justify-end">
                    <span className="text-2xl font-extrabold tabular-nums">{formatNumber(stage.count)}</span>
                    <span className="w-16 text-right text-sm font-bold text-gold tabular-nums">{formatPercent(stage.percentOfUsers)}</span>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 stagger">
        {kpis.map((k) => (
          <div key={k.label} className="surface p-5">
            <span className="grid place-items-center size-10 rounded-xl bg-brand-soft text-brand">
              <k.icon className="size-4" />
            </span>
            <p className="mt-4 text-3xl font-extrabold text-ink tabular-nums">{k.value}</p>
            <p className="text-sm font-semibold text-ink">{k.label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{k.hint}</p>
          </div>
        ))}
      </div>

      {/* Evolução mensal */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl text-ink">Evolução mês a mês</h2>
            <p className="text-sm text-muted-foreground">Entrada de usuários, criação de estudos e avanço nas trilhas.</p>
          </div>
          <div className="inline-flex rounded-xl border border-border bg-white p-1">
            {PERIODS.map((p) => (
              <button
                key={p}
                onClick={() => setMonths(p)}
                className={cn(
                  "cursor-pointer rounded-lg px-3 py-1.5 text-xs font-bold transition-colors",
                  months === p ? "bg-ink text-white" : "text-muted-foreground hover:text-ink"
                )}
              >
                {p} meses
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <div className="surface p-5">
            <p className="text-sm font-bold text-ink">Novos usuários e estudos criados</p>
            <ChartContainer config={entryConfig} className="mt-4 aspect-auto h-64 w-full">
              <BarChart data={evolution} margin={{ left: -16, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatMonth} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(v) => formatMonth(String(v))} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="newUsers" fill="var(--color-newUsers)" radius={[6, 6, 0, 0]} />
                <Bar dataKey="studiesCreated" fill="var(--color-studiesCreated)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </div>

          <div className="surface p-5">
            <p className="text-sm font-bold text-ink">Níveis e estudos concluídos</p>
            <ChartContainer config={progressConfig} className="mt-4 aspect-auto h-64 w-full">
              <LineChart data={evolution} margin={{ left: -16, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={formatMonth} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={40} />
                <ChartTooltip cursor={false} content={<ChartTooltipContent labelFormatter={(v) => formatMonth(String(v))} />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Line type="monotone" dataKey="levelsCompleted" stroke="var(--color-levelsCompleted)" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="studiesCompleted" stroke="var(--color-studiesCompleted)" strokeWidth={2.5} dot={{ r: 3 }} />
              </LineChart>
            </ChartContainer>
          </div>
        </div>
      </section>

      {/* Distribuição */}
      <section className="surface p-6">
        <p className="eyebrow text-brand">Distribuição</p>
        <h3 className="mt-1 font-display text-2xl text-ink">Em que ponto estão os estudos</h3>
        <p className="text-sm text-muted-foreground">Percentual de níveis concluídos em cada estudo com trilha.</p>

        <ul className="mt-6 flex flex-col gap-4">
          {distribution.map((d, i) => (
            <li key={d.label} className="grid gap-2 sm:grid-cols-[200px_1fr_80px] sm:items-center">
              <span className="text-sm font-semibold text-ink">{d.label}</span>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn("h-full rounded-full", ["bg-muted-foreground/40", "bg-ink-3", "bg-brand", "bg-gold"][i])}
                  style={{ width: `${(d.count / maxDistribution) * 100}%` }}
                />
              </div>
              <span className="text-sm font-bold text-ink tabular-nums sm:text-right">{formatNumber(d.count)}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
