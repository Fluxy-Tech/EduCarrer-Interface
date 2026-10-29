import Link from "next/link";
import { ArrowUpRight, Building2, CalendarDays, Sparkles, Trophy } from "lucide-react";
import { StudyDTO } from "@/app/services/study.swr"
import { LevelDots, ProgressRing } from "@/components/study/level-progress";
import { getStudyLevels, getStudyProgress } from "@/lib/utils/studyLevels";
import { cn } from "@/lib/utils";

interface CardStudyProps {
    study: StudyDTO
}

export default function CadsStudy({ study }: CardStudyProps) {
    const levels = getStudyLevels(study.sections ?? []);
    const progress = getStudyProgress(levels);

    const formattedDate = study.createdAt
        ? new Date(study.createdAt).toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        : "";

    const cta = progress.finished
        ? "Revisar trilha"
        : progress.completed > 0
            ? "Continuar trilha"
            : "Começar trilha";

    return (
        <Link
            href={`/learning/${study.id}`}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:border-brand/30 hover:shadow-lift"
        >
            {/* Faixa superior com a vaga */}
            <div className="relative overflow-hidden bg-ink-gradient px-6 pt-5 pb-14 text-white">
                <div className="relative flex items-start justify-between gap-4">
                    <div className="min-w-0">
                        <p className="eyebrow text-white/45 flex items-center gap-1.5">
                            <Building2 className="size-3" />
                            <span className="truncate">{study.vacancy?.company || "Vaga"}</span>
                        </p>
                        <p className="mt-1 truncate text-sm font-semibold text-white/85">
                            {study.vacancy?.title ?? "Vaga não identificada"}
                        </p>
                    </div>
                    <span
                        className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
                            progress.finished ? "bg-gold text-ink" : "bg-white/10 text-white/80"
                        )}
                    >
                        {progress.rank}
                    </span>
                </div>
            </div>

            <div className="relative -mt-9 flex flex-1 flex-col px-6 pb-6">
                <div className="flex items-end justify-between gap-4">
                    <div className="rounded-2xl bg-white p-1.5 shadow-soft">
                        <ProgressRing percent={progress.percent} size={64} stroke={5}>
                            <span className="text-sm font-extrabold text-ink tabular-nums">{progress.percent}%</span>
                        </ProgressRing>
                    </div>
                    <div className="mb-1 flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-xs font-bold text-gold">
                        <Sparkles className="size-3.5" />
                        <span className="tabular-nums">{progress.xp} XP</span>
                    </div>
                </div>

                <h3 className="mt-4 font-display text-[22px] leading-tight text-ink line-clamp-2">
                    {study.title}
                </h3>

                <div className="mt-5">
                    <div className="mb-2 flex items-center justify-between text-xs">
                        <span className="font-semibold text-ink">
                            Nível {Math.min(progress.completed + 1, Math.max(progress.total, 1))} de {progress.total}
                        </span>
                        <span className="text-muted-foreground">
                            {progress.completed} concluído{progress.completed === 1 ? "" : "s"}
                        </span>
                    </div>
                    <LevelDots levels={levels} />
                    {!progress.finished && levels[progress.completed] && (
                        <p className="mt-2.5 truncate text-xs text-muted-foreground">
                            Estudando agora: <span className="font-semibold text-ink">{levels[progress.completed].skill}</span>
                        </p>
                    )}
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        {progress.finished ? <Trophy className="size-3.5 text-gold" /> : <CalendarDays className="size-3.5" />}
                        {progress.finished ? "Trilha concluída" : formattedDate}
                    </span>
                    <span className="flex items-center gap-1 text-sm font-bold text-brand">
                        {cta}
                        <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                </div>
            </div>
        </Link>
    )
}
