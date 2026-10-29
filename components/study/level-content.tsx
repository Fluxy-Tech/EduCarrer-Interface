import { BookMarked, Clock3, Flame, Lightbulb, Quote } from "lucide-react"
import { StudyGapDTO, StudyPlanDTO, StudyStrengthDTO } from "@/app/services/study.swr"
import { cn } from "@/lib/utils"

// Prioridade vem em texto livre da IA, então normalizamos para escolher a cor
export function priorityTone(priority: string) {
  const p = priority.toLowerCase()
  if (p.includes("alta") || p.includes("high") || p.includes("crít")) return "bg-danger-soft text-danger border-danger/20"
  if (p.includes("méd") || p.includes("med")) return "bg-gold-soft text-gold border-gold/25"
  return "bg-brand-soft text-brand border-brand/20"
}

function Prose({ text }: { text?: string | null }) {
  return (
    <div className="space-y-4 text-[15px] leading-[1.8] text-ink/85">
      {(text ?? "")
        .split(/\n+/)
        .filter((p) => p.trim())
        .map((p, i) => (
          <p key={i}>{p}</p>
        ))}
    </div>
  )
}

// Diagnóstico: resumo do perfil frente à vaga
export function DiagnosisContent({ content }: { content?: string | null }) {
  return (
    <div className="relative rounded-2xl border border-border bg-sky/60 p-6 sm:p-8">
      <Quote className="absolute right-6 top-6 size-10 text-brand/10" />
      <Prose text={content} />
    </div>
  )
}

// Pontos fortes: o que o usuário já tem
export function StrengthsContent({ strengths }: { strengths: StudyStrengthDTO[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {strengths.map((s, i) => (
        <article key={s.id} className="group flex flex-col rounded-2xl border border-border bg-white p-6 transition-colors hover:border-gold/40">
          <div className="flex items-center justify-between">
            <span className="font-display text-4xl text-gold/60 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">Você já tem</span>
          </div>
          <h4 className="mt-3 text-lg font-bold text-ink">{s.skill}</h4>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.importance}</p>
          <div className="mt-auto pt-5">
            <div className="rounded-xl bg-gold-soft/70 p-4">
              <p className="eyebrow text-gold mb-1.5">Como valorizar</p>
              <p className="text-sm leading-relaxed text-ink/80">{s.advice}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

// Conteúdo de um nível da trilha: uma lacuna para estudar
export function GapLevelContent({ gap }: { gap: StudyGapDTO }) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold", priorityTone(gap.priority))}>
          <Flame className="size-3.5" /> Prioridade {gap.priority.toLowerCase()}
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-sky px-2.5 py-1 text-xs font-semibold text-ink">
          <Clock3 className="size-3.5 text-brand" /> {gap.estimatedTime}
        </span>
      </div>

      <div className="rounded-2xl border border-border bg-sky/60 p-6">
        <p className="eyebrow text-brand mb-2">Por que estudar</p>
        <p className="text-[15px] leading-[1.8] text-ink/85">{gap.explanation}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="eyebrow text-muted-foreground mb-4">O que estudar</p>
          <ol className="flex flex-col gap-3">
            {gap.topics.map((t, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-ink">
                <span className="grid place-items-center size-6 shrink-0 rounded-lg bg-brand-soft text-[11px] font-bold text-brand tabular-nums">
                  {i + 1}
                </span>
                <span className="pt-0.5 font-semibold">{t}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className="rounded-2xl border border-border bg-white p-6">
          <p className="eyebrow text-muted-foreground mb-4">Onde estudar</p>
          <ul className="flex flex-col gap-3">
            {gap.resources.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-ink/80">
                <BookMarked className="mt-0.5 size-4 shrink-0 text-gold" />
                <span className="break-words">{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

// Plano semanal: roteiro de estudo
export function WeeklyPlanContent({ plans }: { plans: StudyPlanDTO[] }) {
  return (
    <ol className="relative flex flex-col gap-4 pl-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-border">
      {[...plans]
        .sort((a, b) => a.week - b.week)
        .map((p) => (
          <li key={p.id} className="relative">
            <span className="absolute -left-6 top-5 grid place-items-center size-6 rounded-full bg-brand text-[11px] font-bold text-white ring-4 ring-sky">
              {p.week}
            </span>
            <div className="ml-4 rounded-2xl border border-border bg-white p-5">
              <p className="eyebrow text-brand">Semana {p.week}</p>
              <h4 className="mt-1 text-base font-bold text-ink">{p.focus}</h4>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.goals}</p>
            </div>
          </li>
        ))}
    </ol>
  )
}

// Reta final: a dica para fechar a preparação
export function FinalTipContent({ content }: { content?: string | null }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-ink-gradient p-6 sm:p-8 text-white">
      <div className="relative flex gap-4">
        <span className="grid place-items-center size-11 shrink-0 rounded-xl bg-gold text-ink">
          <Lightbulb className="size-5" />
        </span>
        <div>
          <p className="eyebrow text-gold mb-2">Dica final</p>
          <p className="text-[15px] leading-[1.8] text-white/85">{content}</p>
        </div>
      </div>
    </div>
  )
}
