"use client"

import { useRef, useState } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  FileText,
  FileUp,
  Info,
  Loader2,
  RefreshCw,
  ScanText,
  Sparkles,
  WandSparkles,
  X,
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ToastPersonalizado } from "@/components/toast"
import { useSkills } from "@/app/services/skills.swr"
import { useExperiences } from "@/app/services/experiences.swr"
import {
  ResumeAnalysis,
  ResumeItemAction,
  analyzeResume,
  confirmResume,
} from "@/app/services/resume.swr"
import { cn } from "@/lib/utils"

type Step = "upload" | "analyzing" | "review" | "saving" | "declined"

const MAX_SIZE = 5 * 1024 * 1024

const COMPLETENESS_TIP =
  "Para ter um resultado melhor e mais preciso, é preciso que todas as suas experiências profissionais e habilidades estejam no currículo."

function levelLabel(level: number) {
  if (level >= 9) return "Especialista"
  if (level >= 7) return "Profissional"
  if (level >= 4) return "Intermediário"
  return "Iniciante"
}

function formatMonth(value: string | null) {
  if (!value) return null
  return new Date(value).toLocaleDateString("pt-BR", { month: "short", year: "numeric", timeZone: "UTC" })
}

function ActionBadge({ action }: { action: ResumeItemAction }) {
  return (
    <span
      className={cn(
        "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold",
        action === "create" ? "bg-success-soft text-success" : "bg-brand-soft text-brand"
      )}
    >
      {action === "create" ? "Nova" : "Atualizar"}
    </span>
  )
}

export function DialogResumeImport() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("upload")
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState("")
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const { refresh: refreshSkills } = useSkills()
  const { refresh: refreshExperiences } = useExperiences()

  const reset = () => {
    setStep("upload")
    setFile(null)
    setError("")
    setAnalysis(null)
    if (inputRef.current) inputRef.current.value = ""
  }

  const handleOpenChange = (value: boolean) => {
    // Não fecha no meio da leitura ou da gravação
    if (!value && (step === "analyzing" || step === "saving")) return
    setOpen(value)
    if (!value) reset()
  }

  const pickFile = (selected?: File | null) => {
    setError("")
    if (!selected) return

    if (selected.type !== "application/pdf" && !selected.name.toLowerCase().endsWith(".pdf")) {
      setError("Envie o currículo em formato PDF.")
      return
    }

    if (selected.size > MAX_SIZE) {
      setError("O currículo precisa ter até 5 MB.")
      return
    }

    setFile(selected)
  }

  const handleAnalyze = async () => {
    if (!file) return

    try {
      setStep("analyzing")
      setError("")
      const res = await analyzeResume(file)

      if (!res.status || !res.analysis) {
        setError(res.message || "Não conseguimos ler o currículo.")
        setStep("upload")
        return
      }

      setAnalysis(res.analysis)
      setStep("review")
    } catch (e) {
      console.error(e)
      setError("Não conseguimos ler o currículo agora. Tente novamente em instantes.")
      setStep("upload")
    }
  }

  const handleConfirm = async () => {
    if (!analysis) return

    try {
      setStep("saving")
      const res = await confirmResume(analysis)

      if (!res.status) {
        ToastPersonalizado({ mensagem: res.message || "Não conseguimos atualizar o perfil." })
        setStep("review")
        return
      }

      await Promise.all([refreshSkills(), refreshExperiences()])
      ToastPersonalizado({
        mensagem: `Perfil atualizado: ${res.created ?? 0} ${res.created === 1 ? "item criado" : "itens criados"} e ${res.updated ?? 0} ${res.updated === 1 ? "atualizado" : "atualizados"}.`,
      })
      setOpen(false)
      reset()
    } catch (e) {
      console.error(e)
      ToastPersonalizado({ mensagem: "Erro ao atualizar o perfil, tente novamente." })
      setStep("review")
    }
  }

  const counts = analysis
    ? {
        create: analysis.skills.filter((s) => s.action === "create").length + analysis.experiences.filter((e) => e.action === "create").length,
        update: analysis.skills.filter((s) => s.action === "update").length + analysis.experiences.filter((e) => e.action === "update").length,
      }
    : { create: 0, update: 0 }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="gold" size="lg">
          <FileUp /> Importar currículo
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col gap-0 p-0 overflow-hidden">
        {/* Cabeçalho */}
        <div className="relative shrink-0 overflow-hidden bg-ink-gradient py-6 pl-6 pr-14 text-white">
          <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
          <div className="relative flex items-start gap-4">
            <span className="grid place-items-center size-11 shrink-0 rounded-xl bg-gold text-ink">
              <ScanText className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-gold">Leitura com IA</p>
              <DialogTitle className="mt-1 font-display text-3xl font-normal leading-tight text-white">
                {step === "review" || step === "saving" ? "Confira o que encontramos" : "Importar currículo"}
              </DialogTitle>
              <DialogDescription className="mt-1 text-sm text-white/60">
                {step === "review" || step === "saving"
                  ? "Revise as experiências e habilidades antes de atualizar o seu perfil."
                  : "Lemos o seu currículo e preenchemos suas experiências e habilidades."}
              </DialogDescription>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6">

          {/* ── Envio do arquivo ── */}
          {step === "upload" && (
            <div className="flex flex-col gap-5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragging(false)
                  pickFile(e.dataTransfer.files?.[0])
                }}
                className={cn(
                  "cursor-pointer flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
                  dragging ? "border-brand bg-brand-soft" : file ? "border-brand/40 bg-sky" : "border-input bg-sky/50 hover:border-brand/40 hover:bg-sky"
                )}
              >
                <span className={cn("grid place-items-center size-14 rounded-2xl", file ? "bg-brand text-white" : "bg-white text-brand shadow-soft")}>
                  {file ? <FileText className="size-6" /> : <FileUp className="size-6" />}
                </span>
                {file ? (
                  <span>
                    <span className="block max-w-[420px] truncate font-bold text-ink">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {(file.size / 1024 / 1024).toFixed(2)} MB · clique para trocar o arquivo
                    </span>
                  </span>
                ) : (
                  <span>
                    <span className="block font-bold text-ink">Arraste o PDF aqui ou clique para escolher</span>
                    <span className="text-xs text-muted-foreground">Somente PDF, até 5 MB</span>
                  </span>
                )}
              </button>
              <input
                ref={inputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="hidden"
                onChange={(e) => pickFile(e.target.files?.[0])}
              />

              {error && (
                <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger">
                  <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              <div className="flex items-start gap-3 rounded-xl bg-gold-soft/70 p-4">
                <Info className="mt-0.5 size-4 shrink-0 text-gold" />
                <p className="text-sm leading-relaxed text-ink/80">{COMPLETENESS_TIP}</p>
              </div>
            </div>
          )}

          {/* ── Lendo o currículo ── */}
          {step === "analyzing" && (
            <div className="flex flex-col items-center gap-4 py-12 text-center">
              <span className="relative grid place-items-center size-16 rounded-2xl bg-brand text-white animate-pulse-ring">
                <WandSparkles className="size-7" />
              </span>
              <div>
                <p className="font-bold text-ink">Lendo o seu currículo...</p>
                <p className="mt-1 text-sm text-muted-foreground">Estamos identificando experiências e habilidades. Isso leva alguns segundos.</p>
              </div>
              <Loader2 className="size-5 animate-spin text-brand" />
            </div>
          )}

          {/* ── Revisão ── */}
          {(step === "review" || step === "saving") && analysis && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-2xl font-extrabold text-success tabular-nums">{counts.create}</p>
                  <p className="text-xs text-muted-foreground">novos itens no perfil</p>
                </div>
                <div className="rounded-xl border border-border bg-white p-4">
                  <p className="text-2xl font-extrabold text-brand tabular-nums">{counts.update}</p>
                  <p className="text-xs text-muted-foreground">itens que serão atualizados</p>
                </div>
              </div>

              <section>
                <p className="eyebrow text-muted-foreground mb-3 flex items-center gap-2">
                  <BriefcaseBusiness className="size-3.5" /> Experiências profissionais · {analysis.experiences.length}
                </p>
                {analysis.experiences.length === 0 ? (
                  <p className="rounded-xl bg-sky p-4 text-sm text-muted-foreground">Nenhuma experiência encontrada no currículo.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {analysis.experiences.map((e, i) => (
                      <article key={i} className="rounded-xl border border-border bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="font-bold text-ink break-words">{e.name}</h4>
                            <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                              <span className="font-semibold text-brand">{e.seniority}</span>
                              <span className="flex items-center gap-1">
                                <CalendarDays className="size-3" />
                                {formatMonth(e.startDate) ?? "Início não informado"} · {e.currentJob ? "Atual" : formatMonth(e.endDate) ?? "Fim não informado"}
                              </span>
                            </p>
                          </div>
                          <ActionBadge action={e.action} />
                        </div>
                        {e.about && <p className="mt-2 text-sm leading-relaxed text-ink/75 line-clamp-3">{e.about}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <section>
                <p className="eyebrow text-muted-foreground mb-3 flex items-center gap-2">
                  <Sparkles className="size-3.5" /> Habilidades · {analysis.skills.length}
                </p>
                {analysis.skills.length === 0 ? (
                  <p className="rounded-xl bg-sky p-4 text-sm text-muted-foreground">Nenhuma habilidade encontrada no currículo.</p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {analysis.skills.map((s, i) => (
                      <article key={i} className="rounded-xl border border-border bg-white p-4">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="min-w-0 truncate font-bold text-ink">{s.name}</h4>
                          <ActionBadge action={s.action} />
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                            <div className="h-full rounded-full bg-brand" style={{ width: `${s.level * 10}%` }} />
                          </div>
                          <span className="text-[11px] font-bold text-muted-foreground">{levelLabel(s.level)}</span>
                        </div>
                        {s.about && <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-2">{s.about}</p>}
                      </article>
                    ))}
                  </div>
                )}
              </section>

              <p className="text-xs leading-relaxed text-muted-foreground">
                Habilidades já cadastradas mantêm o maior nível entre o atual e o do currículo. Experiências já cadastradas são atualizadas com os dados do currículo.
              </p>
            </div>
          )}

          {/* ── Usuário respondeu que não ── */}
          {step === "declined" && (
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <span className="grid place-items-center size-14 rounded-2xl bg-gold-soft text-gold">
                <Info className="size-6" />
              </span>
              <div className="max-w-md">
                <p className="text-lg font-bold text-ink">Seu perfil não foi alterado</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {COMPLETENESS_TIP} Ajuste o seu currículo e envie novamente.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé com as ações */}
        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-border bg-sky/50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          {step === "upload" && (
            <>
              <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancelar</Button>
              <Button variant="create" disabled={!file} onClick={handleAnalyze}>
                <ScanText /> Ler currículo
              </Button>
            </>
          )}

          {step === "analyzing" && <p className="text-sm text-muted-foreground">Aguarde, não feche esta janela.</p>}

          {(step === "review" || step === "saving") && (
            <>
              <p className="order-last text-sm font-bold text-ink sm:order-none">Essas informações estão corretas?</p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="outline" disabled={step === "saving"} onClick={() => setStep("declined")}>
                  <X /> Não
                </Button>
                <Button variant="create" disabled={step === "saving"} onClick={handleConfirm}>
                  {step === "saving" ? <Loader2 className="animate-spin" /> : <Check />}
                  {step === "saving" ? "Atualizando..." : "Sim, atualizar perfil"}
                </Button>
              </div>
            </>
          )}

          {step === "declined" && (
            <>
              <Button variant="outline" onClick={() => setStep("review")}>
                <ArrowLeft /> Voltar à revisão
              </Button>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>Fechar</Button>
                <Button variant="create" onClick={reset}>
                  <RefreshCw /> Enviar outro currículo
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
