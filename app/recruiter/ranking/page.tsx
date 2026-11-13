"use client";

import { useState } from "react";
import { Download, FileX, GraduationCap, Medal, Search, Trophy, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { candidateResumeUrl, useRanking } from "@/app/services/recruiter.swr";
import { AREAS_OF_INTEREST } from "@/lib/users/roles";
import { cn } from "@/lib/utils";

const PODIUM = ["bg-gold text-white", "bg-ink text-white", "bg-ink-3 text-white"];

export default function RankingPage() {
  const [area, setArea] = useState("todas");
  const [search, setSearch] = useState("");
  const [onlyWithResume, setOnlyWithResume] = useState(false);
  const { ranking, isLoading } = useRanking(area);

  const term = search.trim().toLowerCase();
  const list = ranking.filter((r) =>
    (!term || r.name.toLowerCase().includes(term)) && (!onlyWithResume || r.resumeAvailable)
  );

  const withResume = ranking.filter((r) => r.resumeAvailable).length;

  return (
    <div className="flex flex-col gap-6">
      {/* Resumo */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-gradient p-6 sm:p-8 text-white animate-rise">
        <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-gold">Talentos em evolução</p>
            <h2 className="mt-2 font-display text-4xl sm:text-5xl leading-[1.05]">
              Quem mais <em className="text-gold-gradient">evolui</em> nas trilhas.
            </h2>
            <p className="mt-3 max-w-lg text-white/60">
              O desempenho é o XP conquistado nos desafios de cada nível. Baixe o currículo dos candidatos que autorizaram.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <Users className="size-4 text-gold" />
              <p className="mt-3 text-2xl font-extrabold tabular-nums">{ranking.length}</p>
              <p className="text-xs text-white/50">Candidatos no ranking</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <Download className="size-4 text-gold" />
              <p className="mt-3 text-2xl font-extrabold tabular-nums">{withResume}</p>
              <p className="text-xs text-white/50">Com currículo disponível</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtro por área */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-2">
          {["todas", ...AREAS_OF_INTEREST].map((a) => (
            <button
              key={a}
              onClick={() => setArea(a)}
              className={cn(
                "cursor-pointer rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                area === a ? "border-ink bg-ink text-white" : "border-border bg-white text-ink/70 hover:border-brand/40"
              )}
            >
              {a === "todas" ? "Todas as áreas" : a}
            </button>
          ))}
        </div>

        <div className="surface flex flex-col gap-3 p-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar candidato pelo nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-11"
            />
          </div>
          <label className="flex cursor-pointer items-center gap-2 px-2 text-sm font-semibold text-ink">
            <input
              type="checkbox"
              checked={onlyWithResume}
              onChange={(e) => setOnlyWithResume(e.target.checked)}
              className="size-4 accent-[var(--brand)]"
            />
            Só com currículo
          </label>
        </div>
      </div>

      {/* Lista */}
      {isLoading && ranking.length === 0 ? (
        <div className="surface flex items-center gap-4 p-6">
          <span className="relative grid place-items-center size-12 shrink-0">
            <span className="absolute inset-0 rounded-full border-4 border-brand-soft" />
            <span className="absolute inset-0 rounded-full border-4 border-brand border-r-transparent animate-spin" />
          </span>
          <p className="text-sm text-muted-foreground">Montando o ranking...</p>
        </div>
      ) : list.length === 0 ? (
        <div className="surface flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="grid place-items-center size-14 rounded-2xl bg-brand-soft text-brand">
            <Trophy className="size-6" />
          </span>
          <p className="max-w-md text-sm text-muted-foreground">
            Nenhum candidato encontrado{area !== "todas" ? ` em ${area}` : ""}. O ranking mostra quem já concluiu desafios nas trilhas de estudo.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3 stagger">
          {list.map((c) => (
            <li key={c.userId} className="surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
              <div className="flex min-w-0 flex-1 items-center gap-4">
                <span className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-extrabold tabular-nums",
                  PODIUM[c.position - 1] ?? "bg-brand-soft text-brand"
                )}>
                  {c.position <= 3 ? <Medal className="size-5" /> : c.position}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-bold text-ink">
                    {c.position <= 3 && <span className="mr-1.5 text-muted-foreground">#{c.position}</span>}
                    {c.name}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-full bg-gold-soft px-2 py-0.5 font-bold text-gold">{c.rank}</span>
                    <span className="rounded-full bg-sky px-2 py-0.5 font-semibold text-ink/70">
                      {c.areaOfInterest ?? "Área não informada"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center sm:w-80">
                <div>
                  <p className="text-xl font-extrabold text-ink tabular-nums">{c.xp.toLocaleString("pt-BR")}</p>
                  <p className="text-[11px] text-muted-foreground">XP</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-ink tabular-nums">{c.levelsCompleted}</p>
                  <p className="text-[11px] text-muted-foreground">Níveis</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-ink tabular-nums">{c.studiesCompleted}/{c.studies}</p>
                  <p className="text-[11px] text-muted-foreground">Estudos concluídos</p>
                </div>
              </div>

              {c.resumeAvailable ? (
                <Button asChild variant="create" className="shrink-0">
                  <a href={candidateResumeUrl(c.userId)} download>
                    <Download /> Currículo
                  </a>
                </Button>
              ) : (
                <span className="flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                  <FileX className="size-4" /> Não disponibilizado
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <GraduationCap className="size-4 text-brand" />
        Currículos só ficam disponíveis quando o próprio candidato autoriza no perfil.
      </p>
    </div>
  );
}
