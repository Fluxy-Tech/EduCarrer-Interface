"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { Check, ChevronRight, Code2, Coins, Download, Globe, Linkedin, Loader2, Lock, LockOpen, Medal, Search, Trophy, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
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
} from "@/components/ui/alert-dialog";
import { ToastPersonalizado } from "@/components/toast";
import { CandidateSheet } from "@/components/recruiter/candidate-sheet";
import { RankingEntry, candidateResumeUrl, unlockCandidate, useRanking } from "@/app/services/recruiter.swr";
import { isInsufficientCredits, refreshCredits, useCredits } from "@/app/services/credits.swr";
import { useSession } from "@/lib/auth/auth-client";
import { AREAS_OF_INTEREST, RANK_BONUS_LINKS, RANK_BONUS_RESUME } from "@/lib/users/roles";
import { CANDIDATE_UNLOCK_DAYS, CREDIT_COSTS, formatCredits } from "@/lib/credits/config";
import { cn } from "@/lib/utils";

const PODIUM = ["bg-gold text-white", "bg-ink text-white", "bg-ink-3 text-white"];
const UNLOCK_COST = CREDIT_COSTS.CANDIDATE_UNLOCK;

export default function RankingPage() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const { credits } = useCredits();

  const [areas, setAreas] = useState<string[]>([]);
  const [stackInput, setStackInput] = useState("");
  const [stack, setStack] = useState("");
  const [search, setSearch] = useState("");
  const [toUnlock, setToUnlock] = useState<RankingEntry | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [openCandidate, setOpenCandidate] = useState<string | null>(null);

  // Busca por stack só depois que o recrutador para de digitar
  useEffect(() => {
    const t = setTimeout(() => setStack(stackInput), 400);
    return () => clearTimeout(t);
  }, [stackInput]);

  const { ranking, isLoading, refresh } = useRanking(areas, stack);

  const toggleArea = (a: string) =>
    setAreas((current) => (current.includes(a) ? current.filter((x) => x !== a) : [...current, a]));

  const term = search.trim().toLowerCase();
  const list = ranking.filter((r) => !term || r.name.toLowerCase().includes(term));
  const unlockedCount = ranking.filter((r) => r.unlocked).length;

  const handleUnlock = async (candidate: RankingEntry) => {
    try {
      setUnlocking(candidate.userId);
      const res = await unlockCandidate(candidate.userId);

      // Sem créditos o diálogo de compra abre sozinho
      if (isInsufficientCredits(res)) return;

      ToastPersonalizado({ mensagem: res.message });
      if (res.status) {
        await Promise.all([refresh(), refreshCredits()]);
        setOpenCandidate(candidate.userId);
      }
    } catch (e) {
      console.error(e);
      ToastPersonalizado({ mensagem: "Não conseguimos desbloquear agora, tente novamente." });
    } finally {
      setUnlocking(null);
    }
  };

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
              Desbloqueie um candidato por {formatCredits(UNLOCK_COST)} créditos e veja contato, currículo, habilidades, experiências e estudos concluídos por {CANDIDATE_UNLOCK_DAYS} dias.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <Users className="size-4 text-gold" />
              <p className="mt-3 text-2xl font-extrabold tabular-nums">{ranking.length}</p>
              <p className="text-xs text-white/50">Candidatos</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <LockOpen className="size-4 text-gold" />
              <p className="mt-3 text-2xl font-extrabold tabular-nums">{unlockedCount}</p>
              <p className="text-xs text-white/50">Desbloqueados</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
              <Coins className="size-4 text-gold" />
              <p className="mt-3 text-2xl font-extrabold tabular-nums">{credits ? formatCredits(credits.total) : "—"}</p>
              <p className="text-xs text-white/50">Seus créditos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Filtros: área e stack */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por áreas de interesse">
          <button
            onClick={() => setAreas([])}
            aria-pressed={areas.length === 0}
            className={cn(
              "cursor-pointer rounded-full border px-4 py-2 text-xs font-bold transition-colors",
              areas.length === 0 ? "border-ink bg-ink text-white" : "border-border bg-white text-ink/70 hover:border-brand/40"
            )}
          >
            Todas as áreas
          </button>
          {AREAS_OF_INTEREST.map((a) => {
            const selected = areas.includes(a);
            return (
              <button
                key={a}
                onClick={() => toggleArea(a)}
                aria-pressed={selected}
                className={cn(
                  "inline-flex cursor-pointer items-center gap-1 rounded-full border px-4 py-2 text-xs font-bold transition-colors",
                  selected ? "border-ink bg-ink text-white" : "border-border bg-white text-ink/70 hover:border-brand/40"
                )}
              >
                {selected && <Check className="size-3.5" />}
                {a}
              </button>
            );
          })}
        </div>
        {areas.length > 1 && (
          <p className="text-xs text-muted-foreground">
            Mostrando candidatos com interesse em ao menos uma das {areas.length} áreas selecionadas.
          </p>
        )}

        <div className="surface grid gap-3 p-3 sm:grid-cols-2">
          <div className="relative">
            <Code2 className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Filtrar por stack (ex.: React, Node, Python)..."
              value={stackInput}
              onChange={(e) => setStackInput(e.target.value)}
              className="h-11 pl-11"
            />
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Buscar candidato pelo nome..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 pl-11"
            />
          </div>
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
            Nenhum candidato encontrado{areas.length ? ` em ${areas.join(", ")}` : ""}{stack ? ` com a stack "${stack}"` : ""}.
          </p>
        </div>
      ) : (
        <ol className="flex flex-col gap-3 stagger">
          {list.map((c) => (
            <li key={c.userId} className={cn("surface flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5", c.unlocked && "ring-1 ring-success/30")}>
              <button
                type="button"
                disabled={!c.unlocked}
                onClick={() => setOpenCandidate(c.userId)}
                className={cn("flex min-w-0 flex-1 items-center gap-4 text-left", c.unlocked && "cursor-pointer group")}
              >
                <span className={cn(
                  "grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-extrabold tabular-nums",
                  PODIUM[c.position - 1] ?? "bg-brand-soft text-brand"
                )}>
                  {c.position <= 3 ? <Medal className="size-5" /> : c.position}
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 truncate text-base font-bold text-ink group-hover:text-brand">
                    {c.position <= 3 && <span className="mr-0.5 text-muted-foreground">#{c.position}</span>}
                    {c.name}
                    {c.unlocked && <ChevronRight className="size-4 shrink-0 text-muted-foreground group-hover:text-brand" />}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="rounded-full bg-gold-soft px-2 py-0.5 font-bold text-gold">{c.rank}</span>
                    {c.areasOfInterest.length ? (
                      c.areasOfInterest.map((a) => (
                        <span key={a} className="rounded-full bg-sky px-2 py-0.5 font-semibold text-ink/70">{a}</span>
                      ))
                    ) : (
                      <span className="rounded-full bg-sky px-2 py-0.5 font-semibold text-ink/70">Área não informada</span>
                    )}
                    {c.unlocked && c.unlockExpiresAt && (
                      <span className="text-muted-foreground">liberado até {format(new Date(c.unlockExpiresAt), "dd/MM")}</span>
                    )}
                  </div>
                </div>
              </button>

              <div className="grid grid-cols-3 gap-4 text-center sm:w-72">
                <div>
                  <p className="text-xl font-extrabold text-ink tabular-nums">{c.points.toLocaleString("pt-BR")}</p>
                  <p className="text-[11px] text-muted-foreground">Pontos</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-ink tabular-nums">{c.levelsCompleted}</p>
                  <p className="text-[11px] text-muted-foreground">Níveis</p>
                </div>
                <div>
                  <p className="text-xl font-extrabold text-ink tabular-nums">{c.studiesCompleted}</p>
                  <p className="text-[11px] text-muted-foreground">Estudos concluídos</p>
                </div>
              </div>

              {c.unlocked ? (
                <div className="flex shrink-0 flex-wrap gap-2 sm:w-56 sm:justify-end">
                  {c.linkedinUrl && (
                    <Button asChild variant="outline" size="icon-sm" title="LinkedIn">
                      <a href={c.linkedinUrl} target="_blank" rel="noopener noreferrer"><Linkedin /></a>
                    </Button>
                  )}
                  {c.portfolioUrl && (
                    <Button asChild variant="outline" size="icon-sm" title="Portfólio">
                      <a href={c.portfolioUrl} target="_blank" rel="noopener noreferrer"><Globe /></a>
                    </Button>
                  )}
                  {c.resumeAvailable && (
                    <Button asChild variant="outline" size="icon-sm" title="Baixar currículo">
                      <a href={candidateResumeUrl(c.userId)} download><Download /></a>
                    </Button>
                  )}
                  <Button variant="create" size="sm" onClick={() => setOpenCandidate(c.userId)}>Ver perfil</Button>
                </div>
              ) : (
                <Button
                  variant="gold"
                  className="shrink-0 sm:w-56"
                  disabled={unlocking === c.userId}
                  onClick={() => setToUnlock(c)}
                >
                  {unlocking === c.userId ? <Loader2 className="animate-spin" /> : <Lock />}
                  Desbloquear · {formatCredits(UNLOCK_COST)}
                </Button>
              )}
            </li>
          ))}
        </ol>
      )}

      <p className="text-xs text-muted-foreground">
        Pontos = XP dos desafios das trilhas + {RANK_BONUS_LINKS} se o candidato cadastrou LinkedIn ou portfólio + {RANK_BONUS_RESUME} se liberou o currículo para recrutadores.
      </p>

      <AlertDialog open={!!toUnlock} onOpenChange={(open) => !open && setToUnlock(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desbloquear {toUnlock?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Serão consumidos {formatCredits(UNLOCK_COST)} créditos e você terá acesso por {CANDIDATE_UNLOCK_DAYS} dias aos links, ao currículo (se o candidato liberou), às habilidades, às experiências e aos estudos concluídos.
              {credits && ` Saldo atual: ${formatCredits(credits.total)} créditos.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => toUnlock && handleUnlock(toUnlock)}>
              Desbloquear por {formatCredits(UNLOCK_COST)} créditos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CandidateSheet userId={openCandidate} onClose={() => setOpenCandidate(null)} />

      {isAdmin && (
        <p className="text-xs text-muted-foreground">Como administrador você vê todos os candidatos desbloqueados, sem consumir créditos.</p>
      )}
    </div>
  );
}
