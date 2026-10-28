"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  Flame,
  Lock,
  Play,
  RotateCcw,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import {
  getStudyById,
  ResultGetFilterStudy,
  StudyFilterDTO,
} from "@/app/services/study.swr";

import {
  getAvaliationsByUserIdAndStudyId,
  createAvaliation,
  updateAvaliation,
} from "@/app/services/avaliations.swr";

import { ToastPersonalizado } from "@/components/toast";
import { ProgressRing } from "@/components/study/level-progress";
import {
  DiagnosisContent,
  FinalTipContent,
  GapLevelContent,
  StrengthsContent,
  WeeklyPlanContent,
  priorityTone,
} from "@/components/study/level-content";
import { QuizDialog } from "@/components/study/quiz-dialog";
import { AgentChat } from "@/components/agent/agent-chat";
import { getSectionIcon } from "@/components/study/level-icons";
import {
  QUIZ_MIN_CORRECT_TO_PASS,
  QUIZ_QUESTIONS_PER_LEVEL,
  SECTION_META,
  getStudyLevels,
  getStudyProgress,
  isLevelUnlocked,
} from "@/lib/utils/studyLevels";
import { cn } from "@/lib/utils";

type LevelState = "done" | "current" | "locked";
type Tab = "overview" | "trail" | "plan" | "tip" | "agent";

const TABS: { id: Tab; type: string; label: string }[] = [
  { id: "overview", type: "resume", label: "Visão geral" },
  { id: "trail", type: "lacunasaDevelop", label: "Trilha de estudo" },
  { id: "plan", type: "studyPlans", label: "Plano semanal" },
  { id: "tip", type: "finalTip", label: "Reta final" },
  { id: "agent", type: "agent", label: "Tutor IA" },
];

function SectionHeading({ type, children }: { type: string; children?: React.ReactNode }) {
  const Icon = getSectionIcon(type);
  const meta = SECTION_META[type];

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="grid place-items-center size-12 shrink-0 rounded-2xl bg-brand-soft text-brand">
          <Icon className="size-5" />
        </span>
        <div>
          <h3 className="font-display text-3xl leading-tight text-ink">{meta?.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{meta?.subtitle}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────────────────────────

export default function LearningPage(props: { id: string }) {
  const id = props?.id as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [study, setStudy] = useState<StudyFilterDTO | null>(null);
  const [evaluationPerformed, setEvaluationPerformed] = useState<boolean | null>(null);
  const [idAvaliation, setIdAvaliation] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  const handleGetAvaliation = useCallback(async (studyId: string) => {
    try {
      const res = await getAvaliationsByUserIdAndStudyId(studyId);
      if (res.avaliation) {
        setEvaluationPerformed(res.avaliation.satisfied);
        setIdAvaliation(res.avaliation.id);
      } else {
        setEvaluationPerformed(null);
        setIdAvaliation(null);
      }
    } catch (error) {
      console.error("Erro ao buscar avaliação:", error);
    }
  }, []);

  const handleUpdateOrCreateAvaliation = async (
    studyId: string,
    satisfied: boolean
  ) => {
    try {
      if (idAvaliation) {
        const res = await updateAvaliation(idAvaliation, satisfied, "");
        if (res.avaliation) {
          setEvaluationPerformed(res.avaliation.satisfied);
          setIdAvaliation(res.avaliation.id);
        }
        ToastPersonalizado({ mensagem: res.message || "Avaliação atualizada com sucesso!" });
        return;
      }

      const res = await createAvaliation(satisfied, studyId);
      if (res.avaliation) {
        setEvaluationPerformed(res.avaliation.satisfied);
        setIdAvaliation(res.avaliation.id);
      }
      ToastPersonalizado({ mensagem: res.message || "Avaliação criada com sucesso!" });
    } catch (error) {
      console.error(error);
      ToastPersonalizado({ mensagem: "Erro ao salvar avaliação." });
    }
  };

  const fetchStudy = async (id: string, silent = false) => {
    if (!id) {
      ToastPersonalizado({ mensagem: "Estudo não encontrado." });
      router.push("/learning");
      return;
    }

    try {
      if (!silent) setLoading(true);
      const res: ResultGetFilterStudy = await getStudyById(id);

      if (!res.study) {
        ToastPersonalizado({ mensagem: "Não encontramos esse estudo no momento!" });
        router.push("/learning");
        return;
      }

      setStudy(res.study);
      if (!silent) await handleGetAvaliation(id);
    } catch (error) {
      console.error(error);
      ToastPersonalizado({ mensagem: "Tivemos um erro inesperado." });
      router.push("/learning");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudy(id);
  }, [id]);

  const sectionByType = useMemo(() => {
    const map: Record<string, NonNullable<StudyFilterDTO["sections"]>[number]> = {};
    (study?.sections ?? []).forEach((s) => { map[s.type] = s; });
    return map;
  }, [study]);

  // Cada lacuna é um nível da trilha
  const levels = useMemo(() => getStudyLevels(study?.sections ?? []), [study]);
  const progress = useMemo(() => getStudyProgress(levels), [levels]);
  const currentIndex = levels.findIndex((l) => !l.completed);

  // Quem já começou a trilha abre direto nela, quem está chegando vê o diagnóstico primeiro
  useEffect(() => {
    if (!study) return;
    if (tab === null) setTab(progress.completed > 0 ? "trail" : "overview");
    if (selectedIndex === null && levels.length > 0) {
      setSelectedIndex(currentIndex === -1 ? levels.length - 1 : currentIndex);
    }
  }, [study, levels, currentIndex, selectedIndex, tab, progress.completed]);

  const levelState = (index: number): LevelState => {
    if (levels[index]?.completed) return "done";
    return isLevelUnlocked(levels, index) ? "current" : "locked";
  };

  const selectLevel = (index: number) => {
    if (levelState(index) === "locked") {
      ToastPersonalizado({ mensagem: "Conclua o desafio do nível anterior para liberar este nível." });
      return;
    }
    setSelectedIndex(index);
    setTab("trail");
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="h-64 rounded-3xl bg-ink/90 animate-pulse" />
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <div className="h-96 rounded-2xl bg-white border border-border" />
          <div className="h-96 rounded-2xl bg-white border border-border" />
        </div>
      </div>
    );
  }

  if (!study) return null;

  const selected = selectedIndex !== null ? levels[selectedIndex] : null;
  const isLastLevel = selectedIndex === levels.length - 1;
  const visibleTabs = TABS.filter((t) => t.id === "agent" || (t.id === "overview" ? (sectionByType.resume || sectionByType.strengths) : sectionByType[t.type]));

  return (
    <div className="w-full flex flex-col gap-8 pb-10">

      {/* ── Hero ── */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-gradient text-white animate-rise">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:linear-gradient(to_left,black,transparent_85%)]" />

        <div className="relative p-6 sm:p-8 lg:p-10">
          <Link href="/learning" className="inline-flex items-center gap-2 text-sm font-semibold text-white/60 hover:text-white transition-colors">
            <ArrowLeft className="size-4" /> Minhas trilhas
          </Link>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="min-w-0">
              {study.vacancy && (
                <p className="eyebrow text-gold flex items-center gap-2">
                  <Building2 className="size-3.5" />
                  {study.vacancy.company} · {study.vacancy.title}
                </p>
              )}
              <h2 className="mt-3 font-display text-4xl sm:text-5xl leading-[1.05] max-w-3xl">
                {study.title}
              </h2>

              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-gold px-3 py-1 text-xs font-bold text-ink">{progress.rank}</span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                  {progress.completed}/{progress.total} lacunas dominadas
                </span>
                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/80">
                  {QUIZ_QUESTIONS_PER_LEVEL} perguntas por nível
                </span>
              </div>
            </div>

            <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.05] p-5 backdrop-blur-sm">
              <ProgressRing percent={progress.percent} size={88} stroke={7} tone="light">
                <span className="text-lg font-extrabold tabular-nums">{progress.percent}%</span>
              </ProgressRing>
              <div className="min-w-[160px]">
                <p className="eyebrow text-white/45">Experiência</p>
                <p className="mt-1 text-2xl font-extrabold tabular-nums">
                  {progress.xp}<span className="text-sm font-semibold text-white/40"> / {progress.maxXp} XP</span>
                </p>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-gold to-[#F3D98B] transition-[width] duration-1000"
                    style={{ width: `${progress.maxXp ? (progress.xp / progress.maxXp) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Avaliação do estudo */}
        <div className="relative flex flex-col gap-3 border-t border-white/10 bg-white/[0.03] px-6 sm:px-8 lg:px-10 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-white/60">
            Este estudo foi útil?{" "}
            <span className="font-semibold text-white">
              {evaluationPerformed === null ? "Você ainda não avaliou." : evaluationPerformed ? "Você avaliou como positivo." : "Você avaliou como negativo."}
            </span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => handleUpdateOrCreateAvaliation(study.id, true)}
              className={cn(
                "cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                evaluationPerformed === true ? "bg-success text-white" : "border border-white/15 text-white/75 hover:bg-white/10"
              )}
            >
              <ThumbsUp className="size-4" /> Gostei
            </button>
            <button
              onClick={() => handleUpdateOrCreateAvaliation(study.id, false)}
              className={cn(
                "cursor-pointer inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors",
                evaluationPerformed === false ? "bg-danger text-white" : "border border-white/15 text-white/75 hover:bg-white/10"
              )}
            >
              <ThumbsDown className="size-4" /> Não gostei
            </button>
          </div>
        </div>
      </section>

      {/* ── Navegação entre as partes do estudo ── */}
      <nav className="surface flex gap-1 overflow-x-auto p-1.5">
        {visibleTabs.map((t) => {
          const Icon = getSectionIcon(t.type);
          const active = tab === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "cursor-pointer flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors",
                active ? "bg-ink text-white shadow-soft" : "text-muted-foreground hover:bg-sky hover:text-ink"
              )}
            >
              <Icon className={cn("size-4", active ? "text-gold" : "")} />
              {t.label}
              {t.id === "trail" && progress.total > 0 && (
                <span className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                  active ? "bg-white/15 text-white" : "bg-muted text-muted-foreground"
                )}>
                  {progress.completed}/{progress.total}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Visão geral: diagnóstico e pontos fortes ── */}
      {tab === "overview" && (
        <div key="overview" className="flex flex-col gap-6 animate-rise">
          {sectionByType.resume && (
            <section className="surface p-6 sm:p-8">
              <SectionHeading type="resume" />
              <div className="mt-6">
                <DiagnosisContent content={sectionByType.resume.content} />
              </div>
            </section>
          )}

          {sectionByType.strengths && sectionByType.strengths.strengths.length > 0 && (
            <section className="surface p-6 sm:p-8">
              <SectionHeading type="strengths" />
              <div className="mt-6">
                <StrengthsContent strengths={sectionByType.strengths.strengths} />
              </div>
            </section>
          )}

          {levels.length > 0 && (
            <div className="flex flex-col gap-4 rounded-2xl border border-brand/20 bg-white p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="eyebrow text-brand">Próximo passo</p>
                <p className="mt-1 text-lg font-bold text-ink">
                  {progress.finished
                    ? "Você dominou todas as lacunas desta vaga"
                    : `${levels.length - progress.completed} lacuna${levels.length - progress.completed === 1 ? "" : "s"} para estudar até a vaga`}
                </p>
              </div>
              <Button variant="create" size="lg" onClick={() => setTab("trail")}>
                {progress.completed > 0 ? "Continuar trilha" : "Começar trilha"} <ArrowRight />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Trilha: cada lacuna é um nível ── */}
      {tab === "trail" && (
        levels.length === 0 ? (
          <p className="surface p-8 text-center text-sm text-muted-foreground">Este estudo não possui lacunas para estudar.</p>
        ) : (
          <div key="trail" className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start animate-rise">

            <aside className="surface p-5 lg:sticky lg:top-28">
              <p className="eyebrow text-muted-foreground px-1">Níveis · uma lacuna por nível</p>

              <ol className="mt-4 flex flex-col">
                {levels.map((level, i) => {
                  const state = levelState(i);
                  const isSelected = selectedIndex === i;

                  return (
                    <li key={level.id} className="relative">
                      {i < levels.length - 1 && (
                        <span
                          className={cn(
                            "absolute left-[27px] top-[52px] bottom-[-4px] w-[2px]",
                            level.completed ? "bg-gold" : "bg-border"
                          )}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => selectLevel(i)}
                        className={cn(
                          "relative w-full flex items-center gap-3 rounded-xl p-2 text-left transition-colors",
                          state === "locked" ? "cursor-not-allowed" : "cursor-pointer hover:bg-sky",
                          isSelected && "bg-sky"
                        )}
                      >
                        <span
                          className={cn(
                            "relative grid place-items-center size-10 shrink-0 rounded-xl text-sm font-bold transition-all",
                            state === "done" && "bg-gold text-white",
                            state === "current" && "bg-brand text-white animate-pulse-ring",
                            state === "locked" && "bg-muted text-muted-foreground/60",
                            isSelected && state !== "locked" && "ring-4 ring-brand/15"
                          )}
                        >
                          {state === "done" ? <Check className="size-4" strokeWidth={3} /> : state === "locked" ? <Lock className="size-4" /> : i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={cn("block text-[11px] font-bold uppercase tracking-wider", state === "locked" ? "text-muted-foreground/60" : "text-muted-foreground")}>
                            Nível {i + 1}
                          </span>
                          <span className={cn("block truncate text-sm font-bold", state === "locked" ? "text-muted-foreground/70" : "text-ink")}>
                            {level.skill}
                          </span>
                        </span>
                        {state === "done" && (
                          <span className="shrink-0 rounded-full bg-gold-soft px-2 py-0.5 text-[11px] font-bold text-gold tabular-nums">
                            {level.bestScore ?? 0}/{QUIZ_QUESTIONS_PER_LEVEL}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ol>

              {progress.finished && (
                <div className="mt-5 flex items-center gap-3 rounded-xl bg-gold-soft p-4">
                  <Trophy className="size-5 text-gold shrink-0" />
                  <p className="text-sm font-semibold text-ink">Trilha concluída. Você está pronto para a vaga!</p>
                </div>
              )}
            </aside>

            {selected && selectedIndex !== null && (
              <section key={selected.id} className="flex flex-col gap-6 animate-rise">
                <div className="surface p-6 sm:p-8">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-start gap-4">
                      <span className="grid place-items-center size-12 shrink-0 rounded-2xl bg-brand-soft font-display text-2xl text-brand">
                        {selectedIndex + 1}
                      </span>
                      <div>
                        <p className="eyebrow text-brand">Nível {selectedIndex + 1} de {levels.length} · Lacuna</p>
                        <h3 className="mt-1 font-display text-3xl sm:text-4xl leading-tight text-ink">
                          {selected.skill}
                        </h3>
                      </div>
                    </div>
                    {selected.completed && (
                      <span className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full bg-success-soft px-3 py-1.5 text-xs font-bold text-success">
                        <Check className="size-3.5" strokeWidth={3} /> Dominado
                      </span>
                    )}
                  </div>

                  <div className="mt-8">
                    <GapLevelContent gap={selected} />
                  </div>
                </div>

                {/* Desafio do nível */}
                <div className={cn(
                  "relative overflow-hidden rounded-2xl border p-6 sm:p-8",
                  selected.completed ? "border-gold/30 bg-gold-soft/60" : "border-brand/20 bg-white shadow-soft"
                )}>
                  <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-4">
                      <span className={cn(
                        "grid place-items-center size-12 shrink-0 rounded-2xl",
                        selected.completed ? "bg-gold text-white" : "bg-ink text-white"
                      )}>
                        {selected.completed ? <Trophy className="size-5" /> : <Sparkles className="size-5" />}
                      </span>
                      <div>
                        <p className={cn("eyebrow", selected.completed ? "text-gold" : "text-brand")}>
                          Desafio do nível
                        </p>
                        <h4 className="mt-1 text-lg font-bold text-ink">
                          {selected.completed
                            ? `Melhor resultado: ${selected.bestScore ?? 0} de ${QUIZ_QUESTIONS_PER_LEVEL}`
                            : isLastLevel
                              ? "Estudou? Responda para concluir a trilha"
                              : `Estudou? Responda para liberar o nível ${selectedIndex + 2}`}
                        </h4>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {selected.completed
                            ? `${selected.attempts ?? 0} tentativa${selected.attempts === 1 ? "" : "s"}. Refaça quando quiser para melhorar seu XP.`
                            : `${QUIZ_QUESTIONS_PER_LEVEL} perguntas sobre ${selected.skill}. Acerte ${QUIZ_MIN_CORRECT_TO_PASS} para avançar.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                      {selected.completed && !isLastLevel && (
                        <Button variant="outline" onClick={() => selectLevel(selectedIndex + 1)}>
                          Próximo nível
                        </Button>
                      )}
                      <Button
                        variant={selected.completed ? "gold" : "create"}
                        size="lg"
                        onClick={() => setQuizOpen(true)}
                      >
                        {selected.completed ? <RotateCcw /> : <Play />}
                        {selected.completed ? "Refazer desafio" : "Iniciar desafio"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Prévia do próximo nível bloqueado */}
                {!isLastLevel && levelState(selectedIndex + 1) === "locked" && (
                  <div className="flex items-center gap-4 rounded-2xl border border-dashed border-input bg-white/60 p-5">
                    <span className="grid place-items-center size-10 shrink-0 rounded-xl bg-muted text-muted-foreground">
                      <Lock className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-ink">
                        Próximo: Nível {selectedIndex + 2} · {levels[selectedIndex + 1].skill}
                      </p>
                      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                        Será liberado assim que você vencer o desafio deste nível.
                        <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold", priorityTone(levels[selectedIndex + 1].priority))}>
                          <Flame className="size-3" /> {levels[selectedIndex + 1].priority}
                        </span>
                      </p>
                    </div>
                  </div>
                )}

                <QuizDialog
                  open={quizOpen}
                  onOpenChange={setQuizOpen}
                  studyId={study.id}
                  gapId={selected.id}
                  levelNumber={selectedIndex + 1}
                  levelTitle={selected.skill}
                  isLastLevel={isLastLevel}
                  onFinished={() => fetchStudy(study.id, true)}
                  onGoNext={() => {
                    setQuizOpen(false);
                    setSelectedIndex(selectedIndex + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
              </section>
            )}
          </div>
        )
      )}

      {/* ── Plano semanal: roteiro de estudo ── */}
      {tab === "plan" && sectionByType.studyPlans && (
        <section key="plan" className="surface p-6 sm:p-8 animate-rise">
          <SectionHeading type="studyPlans" />
          <div className="mt-6">
            <WeeklyPlanContent plans={sectionByType.studyPlans.plans} />
          </div>
        </section>
      )}

      {/* ── Reta final: dica ── */}
      {tab === "tip" && sectionByType.finalTip && (
        <section key="tip" className="surface p-6 sm:p-8 animate-rise">
          <SectionHeading type="finalTip" />
          <div className="mt-6">
            <FinalTipContent content={sectionByType.finalTip.content} />
          </div>
        </section>
      )}

      {/* ── Tutor IA: agente que responde sobre este estudo ── */}
      {tab === "agent" && (
        <div key="agent" className="animate-rise">
          <AgentChat
            studyId={study.id}
            eyebrow="Tutor IA"
            title="Pergunte sobre este estudo"
            description="O tutor conhece suas lacunas, o plano semanal e a vaga deste estudo"
            suggestions={[
              selected ? `Me explique os tópicos de ${selected.skill}` : "Por onde devo começar?",
              "Como organizar minha semana de estudos?",
              "Que perguntas podem cair na entrevista dessa vaga?",
            ]}
          />
        </div>
      )}
    </div>
  );
}
