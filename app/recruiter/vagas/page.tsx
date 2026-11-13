"use client";

import Link from "next/link";
import { format } from "date-fns";
import { BookOpenCheck, BriefcaseBusiness, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRecruiterVacancies } from "@/app/services/recruiter.swr";
import { cn } from "@/lib/utils";

export default function RecruiterVacanciesPage() {
  const { vacancies, isLoading } = useRecruiterVacancies();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-3xl text-ink">Vagas cadastradas</h2>
          <p className="text-sm text-muted-foreground">As vagas que você cadastra entram nas recomendações dos candidatos compatíveis.</p>
        </div>
        <Button asChild variant="create">
          <Link href="/recruiter/vagas/create"><Plus /> Cadastrar vaga</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="surface flex items-center gap-4 p-6">
          <span className="relative grid place-items-center size-12 shrink-0">
            <span className="absolute inset-0 rounded-full border-4 border-brand-soft" />
            <span className="absolute inset-0 rounded-full border-4 border-brand border-r-transparent animate-spin" />
          </span>
          <p className="text-sm text-muted-foreground">Carregando suas vagas...</p>
        </div>
      ) : vacancies.length === 0 ? (
        <div className="surface flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="grid place-items-center size-14 rounded-2xl bg-brand-soft text-brand">
            <BriefcaseBusiness className="size-6" />
          </span>
          <p className="max-w-md text-sm text-muted-foreground">Você ainda não cadastrou vagas. Cadastre a primeira para ela aparecer para os candidatos.</p>
          <Button asChild variant="create"><Link href="/recruiter/vagas/create"><Plus /> Cadastrar vaga</Link></Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 stagger">
          {vacancies.map((v) => (
            <article key={v.id} className="surface flex flex-col gap-4 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="eyebrow text-brand">{v.company}</p>
                  <h3 className="mt-1 truncate text-lg font-bold text-ink">{v.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <MapPin className="size-3.5" /> {[v.modality, v.location, v.level].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold",
                  v.active ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
                )}>
                  {v.active ? "Ativa" : "Inativa"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {v.technologies.slice(0, 8).map((t) => (
                  <span key={t} className="rounded-lg border border-border bg-sky px-2 py-0.5 text-xs font-semibold text-ink">{t}</span>
                ))}
                {v.technologies.length > 8 && <span className="text-xs text-muted-foreground">+{v.technologies.length - 8}</span>}
              </div>

              <div className="mt-auto flex items-center justify-between border-t border-border pt-3 text-xs text-muted-foreground">
                <span>Cadastrada em {format(new Date(v.createdAt), "dd/MM/yyyy")}</span>
                <span className="flex items-center gap-1.5 font-semibold text-ink">
                  <BookOpenCheck className="size-4 text-brand" /> {v._count.study} estudo(s) gerado(s)
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
