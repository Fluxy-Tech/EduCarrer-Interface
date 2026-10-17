import { BookMarked, Clock3, Flame, Lightbulb, Quote } from "lucide-react"
import { StudySectionDTO } from "@/app/services/study.swr"
import { cn } from "@/lib/utils"

// Prioridade vem em texto livre da IA, então normalizamos para escolher a cor
function priorityTone(priority: string) {
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

export function LevelContent({ section }: { section: StudySectionDTO }) {
  if (section.type == "resume") {
    return (
      <div className="relative rounded-2xl border border-border bg-sky/60 p-6 sm:p-8">
        <Quote className="absolute right-6 top-6 size-10 text-brand/10" />
        <Prose text={section.content} />
      </div>
    )
  }

  if (section.type == "finalTip") {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-ink-gradient p-6 sm:p-8 text-white">
        <div className="pointer-events-none absolute inset-0 bg-grid opacity-60" />
        <div className="relative flex gap-4">
          <span className="grid place-items-center size-11 shrink-0 rounded-xl bg-gold text-ink">
            <Lightbulb className="size-5" />
          </span>
          <p className="text-[15px] leading-[1.8] text-white/85">{section.content}</p>
        </div>
      </div>
    )
  }

  if (section.type == "strengths") {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        {section.strengths.map((s, i) => (
          <article key={s.id} className="group flex flex-col rounded-2xl border border-border bg-white p-6 transition-colors hover:border-gold/40">
            <div className="flex items-center justify-between">
              <span className="font-display text-4xl text-gold/60 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
              <span className="rounded-full bg-success-soft px-2.5 py-1 text-[11px] font-bold text-success">Domínio</span>
            </div>
            <h4 className="mt-3 text-lg font-bold text-ink">{s.skill}</h4>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.importance}</p>
            <div className="mt-auto pt-5">
              <div className="rounded-xl bg-gold-soft/70 p-4">
                <p className="eyebrow text-gold mb-1.5">Conselho</p>
                <p className="text-sm leading-relaxed text-ink/80">{s.advice}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (section.type == "lacunasaDevelop") {
    return (
      <div className="flex flex-col gap-4">
        {section.gaps.map((g) => (
          <article key={g.id} className="rounded-2xl border border-border bg-white p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <h4 className="text-lg font-bold text-ink">{g.skill}</h4>
              <div className="flex flex-wrap gap-2">
                <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold", priorityTone(g.priority))}>
                  <Flame className="size-3.5" /> {g.priority}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-sky px-2.5 py-1 text-xs font-semibold text-ink">
                  <Clock3 className="size-3.5 text-brand" /> {g.estimatedTime}
                </span>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{g.explanation}</p>

            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="eyebrow text-muted-foreground mb-2.5">Tópicos</p>
                <div className="flex flex-wrap gap-2">
                  {g.topics.map((t, i) => (
                    <span key={i} className="rounded-lg bg-brand-soft px-3 py-1.5 text-xs font-semibold text-brand-strong">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="eyebrow text-muted-foreground mb-2.5">Recursos</p>
                <ul className="space-y-2">
                  {g.resources.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-ink/80">
                      <BookMarked className="mt-0.5 size-4 shrink-0 text-gold" />
                      <span className="break-words">{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </article>
        ))}
      </div>
    )
  }

  if (section.type == "studyPlans") {
    return (
      <ol className="relative flex flex-col gap-4 pl-6 before:absolute before:left-[11px] before:top-3 before:bottom-3 before:w-[2px] before:bg-border">
        {[...section.plans]
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

  return <Prose text={section.content} />
}
