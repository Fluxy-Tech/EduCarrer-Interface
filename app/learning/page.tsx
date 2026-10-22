"use client"

import Link from "next/link";
import { BookOpenCheck, CalendarIcon, Layers, Search, Sparkles, Trophy, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useStudies } from "@/app/services/study.swr";

import CadsStudy from "@/components/cards/card-study";
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { format } from "date-fns"
import { getRank, getStudyLevels, getStudyProgress } from "@/lib/utils/studyLevels";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

// Evita o bug de "yyyy-mm-dd" sendo interpretado como UTC e voltando 1 dia
function parseLocalDate(value: string) {
  if (!value) return undefined
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export default function DashboardPage() {
  const { studies, isLoading } = useStudies();

  const [search, setSearch] = useState("")
  const [dateFilter, setDateFilter] = useState("")

  const hasActiveFilters = Boolean(search || dateFilter)

  const clearFilters = () => {
    setSearch("")
    setDateFilter("")
  }

  const filteredStudies = useMemo(() => {
    if (!studies) return []

    return studies.filter((study) => {
      const term = search.toLowerCase()
      const matchesSearch =
        study.title.toLowerCase().includes(term) ||
        (study.vacancy?.title ?? "").toLowerCase().includes(term) ||
        (study.vacancy?.company ?? "").toLowerCase().includes(term)

      const studyDate = study.createdAt
        ? format(new Date(study.createdAt), "yyyy-MM-dd")
        : ""

      const matchesDate =
        !dateFilter || studyDate === dateFilter

      return matchesSearch && matchesDate
    })
  }, [studies, search, dateFilter])

  // Consolidado de todas as trilhas do usuário
  const summary = useMemo(() => {
    const all = studies.map((s) => getStudyProgress(getStudyLevels(s.sections ?? [])))
    const levels = all.reduce((acc, p) => acc + p.completed, 0)

    return {
      xp: all.reduce((acc, p) => acc + p.xp, 0),
      levels,
      finished: all.filter((p) => p.finished).length,
      rank: getRank(all.length ? all.reduce((acc, p) => acc + p.percent, 0) / all.length : 0),
    }
  }, [studies])

  const stats = [
    { icon: Sparkles, label: "XP acumulado", value: summary.xp.toLocaleString("pt-BR") },
    { icon: Layers, label: "Níveis concluídos", value: summary.levels },
    { icon: BookOpenCheck, label: "Trilhas ativas", value: studies.length },
    { icon: Trophy, label: "Trilhas finalizadas", value: summary.finished },
  ]

  return (
    <div className="w-full flex flex-col gap-8">

      {/* Painel de desempenho */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-gradient p-6 sm:p-8 lg:p-10 text-white animate-rise">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:linear-gradient(to_left,black,transparent_80%)]" />

        <div className="relative grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-gold">Seu desempenho</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl leading-[1.05]">
              Patente atual: <em className="text-gold-gradient">{summary.rank}</em>
            </h2>
            <p className="mt-4 max-w-lg text-white/60 leading-relaxed">
              Cada estudo é uma trilha com níveis. Cada lacuna é um nível: estude o conteúdo, responda 5 perguntas e libere a próxima até dominar a vaga.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {stats.map((s) => (
              <div key={s.label} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
                <s.icon className="size-4 text-gold" />
                <p className="mt-3 text-2xl font-extrabold tabular-nums">{s.value}</p>
                <p className="text-xs text-white/50">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-display text-3xl text-ink">Suas trilhas</h2>
            <p className="text-sm text-muted-foreground">
              {filteredStudies.length} de {studies.length} estudo{studies.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        <div className="surface flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
          <InputGroup className="h-11 rounded-xl border-input bg-white">
            <InputGroupInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por estudo, vaga ou empresa..."
              className="text-ink placeholder:text-muted-foreground/70" />
            <InputGroupAddon>
              <Search className="text-muted-foreground" />
            </InputGroupAddon>
          </InputGroup>

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full lg:w-56 justify-start font-medium"
              >
                <CalendarIcon className="text-brand" />
                {dateFilter
                  ? format(parseLocalDate(dateFilter)!, "dd/MM/yyyy")
                  : "Data de criação"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={parseLocalDate(dateFilter)}
                className="text-ink"
                onSelect={(date) =>
                  setDateFilter(date ? format(date, "yyyy-MM-dd") : "")
                }
              />
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            onClick={clearFilters}
            disabled={!hasActiveFilters}
            className="text-muted-foreground"
          >
            <X />
            Limpar filtros
          </Button>
        </div>
      </section>

      {/* Lista */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[340px] rounded-2xl border border-border bg-white overflow-hidden">
              <div className="h-24 bg-muted" />
              <div className="p-6 space-y-3">
                <div className="h-4 w-1/3 rounded bg-muted" />
                <div className="h-6 w-4/5 rounded bg-muted" />
                <div className="h-6 w-2/3 rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredStudies.length === 0 ? (
        <div className="surface flex flex-col items-center gap-4 px-6 py-16 text-center">
          <span className="grid place-items-center size-14 rounded-2xl bg-brand-soft text-brand">
            <BookOpenCheck className="size-6" />
          </span>
          <div>
            <h3 className="font-display text-2xl text-ink">
              {hasActiveFilters ? "Nenhum estudo encontrado" : "Você ainda não tem trilhas"}
            </h3>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">
              {hasActiveFilters
                ? "Ajuste a busca ou limpe os filtros para ver todos os seus estudos."
                : "Escolha uma vaga e gere um estudo personalizado para começar a subir de nível."}
            </p>
          </div>
          {!hasActiveFilters && (
            <Button asChild variant="create">
              <Link href="/jobs">Explorar vagas</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 stagger">
          {filteredStudies.map((study) => (
            <CadsStudy key={study.id} study={study} />
          ))}
        </div>
      )}
    </div>
  )
}
