"use client"

import { useEffect, useState } from "react"
import { ArrowLeft, ArrowRight, Check, Loader2, RotateCcw, Sparkles, Trophy, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import {
  QuizQuestionDTO,
  ResultSubmitQuiz,
  getQuizBySection,
  submitQuizBySection,
} from "@/app/services/study.swr"
import { QUIZ_MIN_CORRECT_TO_PASS, XP_PER_CORRECT_ANSWER } from "@/lib/utils/studyLevels"
import { cn } from "@/lib/utils"

interface QuizDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  studyId: string
  sectionId: string
  levelNumber: number
  levelTitle: string
  isLastLevel: boolean
  onFinished: (result: ResultSubmitQuiz) => void
  onGoNext: () => void
}

type Phase = "loading" | "error" | "answering" | "submitting" | "result"

const LETTERS = ["A", "B", "C", "D"]

export function QuizDialog({
  open,
  onOpenChange,
  studyId,
  sectionId,
  levelNumber,
  levelTitle,
  isLastLevel,
  onFinished,
  onGoNext,
}: QuizDialogProps) {
  const [phase, setPhase] = useState<Phase>("loading")
  const [errorMessage, setErrorMessage] = useState("")
  const [questions, setQuestions] = useState<QuizQuestionDTO[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [current, setCurrent] = useState(0)
  const [result, setResult] = useState<ResultSubmitQuiz | null>(null)

  const loadQuiz = async () => {
    setPhase("loading")
    setErrorMessage("")
    setAnswers({})
    setCurrent(0)
    setResult(null)

    try {
      const res = await getQuizBySection(studyId, sectionId)

      if (!res.status || res.questions.length == 0) {
        setErrorMessage(res.message || "Não conseguimos carregar o desafio.")
        setPhase("error")
        return
      }

      setQuestions(res.questions)
      setPhase("answering")
    } catch (e) {
      setErrorMessage("Não conseguimos carregar o desafio. Tente novamente.")
      setPhase("error")
    }
  }

  useEffect(() => {
    if (open) loadQuiz()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sectionId])

  const handleSubmit = async () => {
    setPhase("submitting")

    try {
      const res = await submitQuizBySection(studyId, sectionId, answers)

      if (!res.status) {
        setErrorMessage(res.message || "Não conseguimos corrigir suas respostas.")
        setPhase("error")
        return
      }

      setResult(res)
      setPhase("result")
      onFinished(res)
    } catch (e) {
      setErrorMessage("Não conseguimos corrigir suas respostas. Tente novamente.")
      setPhase("error")
    }
  }

  const question = questions[current]
  const answeredCount = Object.keys(answers).length
  const isLast = current === questions.length - 1

  return (
    <Dialog open={open} onOpenChange={(v) => phase !== "submitting" && onOpenChange(v)}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden gap-0 max-h-[92vh] flex flex-col">
        {/* Cabeçalho */}
        <div className="relative overflow-hidden bg-ink-gradient px-6 sm:px-8 pt-6 pb-5 text-white">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
          <div className="relative">
            <p className="eyebrow text-gold">Desafio · Nível {levelNumber}</p>
            <DialogTitle className="mt-1 font-display text-3xl font-normal leading-tight text-white">
              {levelTitle}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-white/55">
              Acerte {QUIZ_MIN_CORRECT_TO_PASS} de {questions.length || 5} perguntas para {isLastLevel ? "concluir a trilha" : "liberar o próximo nível"}.
            </DialogDescription>

            {(phase === "answering" || phase === "submitting") && (
              <div className="mt-5 grid grid-cols-5 gap-1.5">
                {questions.map((q, i) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrent(i)}
                    aria-label={`Ir para a pergunta ${i + 1}`}
                    className={cn(
                      "cursor-pointer h-1.5 rounded-full transition-colors",
                      i === current ? "bg-gold" : answers[q.id] !== undefined ? "bg-white/70" : "bg-white/15"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6">
          {phase === "loading" && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <span className="grid place-items-center size-14 rounded-2xl bg-brand-soft text-brand">
                <Sparkles className="size-6 animate-pulse" />
              </span>
              <div>
                <p className="font-semibold text-ink">Preparando seu desafio...</p>
                <p className="text-sm text-muted-foreground">Na primeira vez, nossa IA cria as perguntas a partir do conteúdo do nível.</p>
              </div>
            </div>
          )}

          {phase === "error" && (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <span className="grid place-items-center size-14 rounded-2xl bg-danger-soft text-danger">
                <X className="size-6" />
              </span>
              <p className="max-w-sm text-sm text-muted-foreground">{errorMessage}</p>
              <Button variant="create" onClick={loadQuiz}>
                <RotateCcw /> Tentar novamente
              </Button>
            </div>
          )}

          {(phase === "answering" || phase === "submitting") && question && (
            <div key={question.id} className="animate-rise">
              <p className="text-xs font-bold text-muted-foreground tabular-nums">
                Pergunta {current + 1} de {questions.length}
              </p>
              <h3 className="mt-2 text-lg sm:text-xl font-bold leading-snug text-ink">{question.question}</h3>

              <div className="mt-6 grid gap-3">
                {question.options.map((option, i) => {
                  const selected = answers[question.id] === i

                  return (
                    <button
                      key={i}
                      type="button"
                      disabled={phase === "submitting"}
                      onClick={() => setAnswers((prev) => ({ ...prev, [question.id]: i }))}
                      className={cn(
                        "cursor-pointer group flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                        selected
                          ? "border-brand bg-brand-soft/60 ring-4 ring-brand/10"
                          : "border-border bg-white hover:border-brand/40 hover:bg-sky"
                      )}
                    >
                      <span
                        className={cn(
                          "grid place-items-center size-8 shrink-0 rounded-lg text-sm font-bold transition-colors",
                          selected ? "bg-brand text-white" : "bg-muted text-muted-foreground group-hover:text-ink"
                        )}
                      >
                        {LETTERS[i]}
                      </span>
                      <span className="pt-1 text-[15px] leading-relaxed text-ink">{option}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {phase === "result" && result && (
            <div className="animate-rise">
              <div className={cn(
                "flex flex-col items-center gap-3 rounded-2xl p-6 text-center",
                result.passed ? "bg-gold-soft" : "bg-sky"
              )}>
                <span className={cn(
                  "grid place-items-center size-16 rounded-2xl animate-pop",
                  result.passed ? "bg-gold text-white" : "bg-white text-ink border border-border"
                )}>
                  {result.passed ? <Trophy className="size-7" /> : <RotateCcw className="size-7" />}
                </span>
                <p className="font-display text-5xl text-ink tabular-nums">
                  {result.score}<span className="text-muted-foreground/60">/{result.total}</span>
                </p>
                <div>
                  <p className="font-bold text-ink">
                    {result.passed
                      ? isLastLevel ? "Trilha concluída!" : "Nível concluído!"
                      : "Quase lá!"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {result.passed
                      ? `Você ganhou até ${(result.score ?? 0) * XP_PER_CORRECT_ANSWER} XP neste nível.`
                      : `Revise o conteúdo: são necessários ${QUIZ_MIN_CORRECT_TO_PASS} acertos para avançar.`}
                  </p>
                </div>
              </div>

              <p className="eyebrow text-muted-foreground mt-7 mb-3">Revisão das respostas</p>
              <div className="flex flex-col gap-3">
                {questions.map((q, i) => {
                  const r = result.results?.find((x) => x.questionId === q.id)
                  if (!r) return null

                  return (
                    <div key={q.id} className={cn("rounded-xl border p-4", r.correct ? "border-success/25 bg-success-soft/40" : "border-danger/20 bg-danger-soft/40")}>
                      <div className="flex items-start gap-3">
                        <span className={cn("grid place-items-center size-6 shrink-0 rounded-full text-white", r.correct ? "bg-success" : "bg-danger")}>
                          {r.correct ? <Check className="size-3.5" strokeWidth={3} /> : <X className="size-3.5" strokeWidth={3} />}
                        </span>
                        <div className="min-w-0 text-sm">
                          <p className="font-semibold text-ink">{i + 1}. {q.question}</p>
                          {!r.correct && (
                            <p className="mt-2 text-danger">
                              Sua resposta: {r.selectedIndex !== null ? `${LETTERS[r.selectedIndex]}) ${q.options[r.selectedIndex]}` : "não respondida"}
                            </p>
                          )}
                          <p className="mt-1 text-success font-medium">
                            Correta: {LETTERS[r.answerIndex]}) {q.options[r.answerIndex]}
                          </p>
                          <p className="mt-2 text-muted-foreground leading-relaxed">{r.explanation}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Rodapé */}
        {(phase === "answering" || phase === "submitting") && (
          <div className="flex items-center justify-between gap-3 border-t border-border bg-sky/60 px-6 sm:px-8 py-4">
            <Button
              variant="ghost"
              onClick={() => setCurrent((c) => Math.max(c - 1, 0))}
              disabled={current === 0 || phase === "submitting"}
            >
              <ArrowLeft /> Anterior
            </Button>

            <span className="hidden sm:block text-xs font-semibold text-muted-foreground tabular-nums">
              {answeredCount}/{questions.length} respondidas
            </span>

            {isLast ? (
              <Button
                variant="create"
                onClick={handleSubmit}
                disabled={answeredCount < questions.length || phase === "submitting"}
              >
                {phase === "submitting" ? <Loader2 className="animate-spin" /> : <Check />}
                Enviar respostas
              </Button>
            ) : (
              <Button
                variant="create"
                onClick={() => setCurrent((c) => Math.min(c + 1, questions.length - 1))}
                disabled={answers[question?.id] === undefined}
              >
                Próxima <ArrowRight />
              </Button>
            )}
          </div>
        )}

        {phase === "result" && result && (
          <div className="flex flex-col-reverse gap-3 border-t border-border bg-sky/60 px-6 sm:px-8 py-4 sm:flex-row sm:justify-end">
            {result.passed ? (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Fechar
                </Button>
                {!isLastLevel && (
                  <Button variant="gold" onClick={onGoNext}>
                    Ir para o nível {levelNumber + 1} <ArrowRight />
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Revisar conteúdo
                </Button>
                <Button variant="create" onClick={loadQuiz}>
                  <RotateCcw /> Tentar novamente
                </Button>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
