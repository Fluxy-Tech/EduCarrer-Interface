"use client";

import { format } from "date-fns";
import { BookOpenCheck, BriefcaseBusiness, Download, ExternalLink, Globe, Linkedin, Loader2, WandSparkles } from "lucide-react";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { candidateResumeUrl, useCandidateDetails } from "@/app/services/recruiter.swr";

const formatMonth = (value: string | null) => (value ? format(new Date(value), "MM/yyyy") : null);

// Perfil completo do candidato desbloqueado: links, currículo, habilidades, experiências e estudos concluídos
export function CandidateSheet({ userId, onClose }: { userId: string | null; onClose: () => void }) {
    const { candidate, message, isLoading } = useCandidateDetails(userId);

    return (
        <Sheet open={!!userId} onOpenChange={(open) => !open && onClose()}>
            <SheetContent className="w-full overflow-y-auto sm:max-w-xl">
                <SheetHeader>
                    <p className="eyebrow text-brand">{candidate?.areaOfInterest ?? "Candidato"}</p>
                    <SheetTitle className="font-display text-3xl font-normal text-ink">{candidate?.name ?? "Carregando..."}</SheetTitle>
                    <SheetDescription>
                        {candidate?.unlockExpiresAt
                            ? `Acesso liberado até ${format(new Date(candidate.unlockExpiresAt), "dd/MM/yyyy")}.`
                            : "Dados do candidato na plataforma."}
                    </SheetDescription>
                </SheetHeader>

                {isLoading ? (
                    <div className="flex items-center gap-3 px-4 py-6 text-sm text-muted-foreground">
                        <Loader2 className="animate-spin text-brand" /> Carregando os dados do candidato...
                    </div>
                ) : !candidate ? (
                    <p className="px-4 py-6 text-sm text-muted-foreground">{message ?? "Não conseguimos carregar o candidato."}</p>
                ) : (
                    <div className="flex flex-col gap-6 px-4 pb-8">
                        {/* Contato */}
                        <div className="flex flex-wrap gap-2">
                            {candidate.linkedinUrl && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={candidate.linkedinUrl} target="_blank" rel="noopener noreferrer"><Linkedin /> LinkedIn <ExternalLink className="size-3" /></a>
                                </Button>
                            )}
                            {candidate.portfolioUrl && (
                                <Button asChild variant="outline" size="sm">
                                    <a href={candidate.portfolioUrl} target="_blank" rel="noopener noreferrer"><Globe /> Portfólio <ExternalLink className="size-3" /></a>
                                </Button>
                            )}
                            {candidate.resumeAvailable && (
                                <Button asChild variant="create" size="sm">
                                    <a href={candidateResumeUrl(candidate.id)} download><Download /> Baixar currículo</a>
                                </Button>
                            )}
                            {!candidate.linkedinUrl && !candidate.portfolioUrl && !candidate.resumeAvailable && (
                                <p className="text-xs text-muted-foreground">O candidato ainda não cadastrou links nem liberou o currículo.</p>
                            )}
                        </div>

                        {/* Estudos concluídos */}
                        <section>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                                <BookOpenCheck className="size-4 text-brand" />
                                Estudos concluídos ({candidate.completedStudies.length} de {candidate.totalStudies})
                            </h3>
                            {candidate.completedStudies.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Nenhum estudo concluído ainda.</p>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {candidate.completedStudies.map((s) => (
                                        <li key={s.id} className="rounded-xl border border-border bg-sky p-3">
                                            <p className="text-sm font-semibold text-ink">{s.vacancy?.title ?? s.title}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {[s.vacancy?.company, s.vacancy?.level].filter(Boolean).join(" · ")}
                                                {s.completedAt && ` · concluído em ${format(new Date(s.completedAt), "dd/MM/yyyy")}`}
                                            </p>
                                            <p className="mt-1 text-xs text-ink/70">
                                                {s.levels} níveis · {s.xp} XP
                                            </p>
                                            <div className="mt-2 flex flex-wrap gap-1">
                                                {s.skills.map((skill) => (
                                                    <span key={skill} className="rounded-md bg-white px-2 py-0.5 text-[11px] font-semibold text-ink/80">{skill}</span>
                                                ))}
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* Habilidades */}
                        <section>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                                <WandSparkles className="size-4 text-brand" /> Habilidades ({candidate.skills.length})
                            </h3>
                            {candidate.skills.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Nenhuma habilidade cadastrada.</p>
                            ) : (
                                <ul className="flex flex-col gap-2">
                                    {candidate.skills.map((s) => (
                                        <li key={s.id} className="flex items-center gap-3">
                                            <span className="w-36 shrink-0 truncate text-sm font-semibold text-ink">{s.name}</span>
                                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                                                <div className="h-full rounded-full bg-brand" style={{ width: `${Math.min(s.level, 10) * 10}%` }} />
                                            </div>
                                            <span className="w-10 text-right text-xs font-bold text-ink tabular-nums">{s.level}/10</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>

                        {/* Experiências */}
                        <section>
                            <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                                <BriefcaseBusiness className="size-4 text-brand" /> Experiências ({candidate.experiences.length})
                            </h3>
                            {candidate.experiences.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Nenhuma experiência cadastrada.</p>
                            ) : (
                                <ul className="flex flex-col gap-3">
                                    {candidate.experiences.map((e) => (
                                        <li key={e.id} className="border-l-2 border-brand/30 pl-3">
                                            <p className="text-sm font-semibold text-ink">{e.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {e.seniority}
                                                {formatMonth(e.startDate) && ` · ${formatMonth(e.startDate)} – ${e.currentJob ? "atual" : formatMonth(e.endDate) ?? "?"}`}
                                            </p>
                                            {e.about && <p className="mt-1 whitespace-pre-line text-xs leading-relaxed text-ink/75">{e.about}</p>}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
}
