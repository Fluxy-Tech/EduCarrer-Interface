"use client";

import { useEffect, useState } from "react";
import { useVacancys } from "@/app/services/vacancys.swr";
import { Search, BrainCircuit, MapPinHouse, BriefcaseBusiness, Building2, Heart, BookOpenCheck, Target } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DialogAvaliationsVacancys } from "@/components/dialog/dialog-avaliations-vacancys";
import { getAvaliationVancancyByUserId } from "@/app/services/avaliationsVacancy.swr";
import CadsVacancy from "@/components/cards/card-vacancy";
import { useMetrics } from "@/app/services/metrics.swr";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface Vacancy {
  id: string;
  title: string;
  description: string;
  company: string;
  modality: string;
  level: string;
  technologies: string[];
  link: string;
  origin: string;
  location: string;
  salary: string | null;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function DashboardPage() {
  const { vacancys, isLoading } = useVacancys();
  const { metrics } = useMetrics();

  const [nomeFiltro, setNomeFiltro] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("todos");
  const [modalidadeFiltro, setModalidadeFiltro] = useState("todos");
  const [needAvaliation, setNeedAvaliation] = useState<boolean>(false);

  const vagasFiltradas = vacancys?.filter((vaga) => {
    const matchNome =
      vaga.title.toLowerCase().includes(nomeFiltro.toLowerCase()) ||
      vaga.company.toLowerCase().includes(nomeFiltro.toLowerCase()) ||
      vaga.technologies.some((tech) =>
        tech.toLowerCase().includes(nomeFiltro.toLowerCase())
      );

    const matchNivel =
      nivelFiltro === "todos" || vaga.level === nivelFiltro;

    const matchModalidade =
      modalidadeFiltro === "todos" || vaga.modality === modalidadeFiltro;

    return matchNome && matchNivel && matchModalidade;
  });

  const handleGetNeedAvaliation = async () => {
    try {
      const res = await getAvaliationVancancyByUserId();
      if (res.solicited) {
        setNeedAvaliation(res.solicited);
      }
    } catch (error) {
      console.error("Erro ao verificar necessidade de avaliação:", error);
    }
  };

  const handleClosedDialogAvaliation = () => {
    setNeedAvaliation(false);
    handleGetNeedAvaliation();
  };

  useEffect(() => {
    handleGetNeedAvaliation();
  }, []);

  const stats = [
    { icon: BriefcaseBusiness, label: "Vagas disponíveis", value: `+${metrics?.totalVacancys ?? 0}` },
    { icon: Building2, label: "Empresas parceiras", value: `+${metrics?.totalBussines ?? 0}` },
    { icon: BookOpenCheck, label: "Estudos construídos", value: metrics?.totalStudiesCreateds ?? 0 },
    { icon: Heart, label: "Satisfação", value: `${metrics?.totalSatisfation ?? 0}%` },
  ];

  return (
    <div className="flex flex-col gap-8">
      <DialogAvaliationsVacancys
        active={needAvaliation}
        closeDialog={handleClosedDialogAvaliation}
      />

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-gradient p-6 sm:p-8 lg:p-10 text-white animate-rise">
        <div className="relative grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:items-end">
          <div>
            <p className="eyebrow text-gold">Recomendação inteligente</p>
            <h2 className="mt-3 font-display text-4xl sm:text-5xl leading-[1.05]">
              Oportunidades que <em className="text-gold-gradient">combinam</em> com você.
            </h2>
            <p className="mt-4 max-w-lg text-white/60 leading-relaxed">
              Cruzamos suas habilidades e experiências com vagas reais. Gere um estudo para qualquer vaga e transforme-a em uma trilha de níveis.
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

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px] xl:items-start">
        <div className="flex flex-col gap-6 min-w-0">

          {/* Filtros */}
          <div className="surface p-3 flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Buscar por vaga, empresa ou tecnologia..."
                value={nomeFiltro}
                onChange={(e) => setNomeFiltro(e.target.value)}
                className="h-11 pl-11"
              />
            </div>

            <Select value={nivelFiltro} onValueChange={(value) => setNivelFiltro(value)}>
              <SelectTrigger className="w-full lg:w-52 h-11! rounded-xl border-input bg-white text-sm text-ink">
                <div className="flex items-center gap-2">
                  <BrainCircuit className="size-4 text-brand shrink-0" />
                  <SelectValue placeholder="Todos os níveis" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="h-10!" value="todos">Todos os níveis</SelectItem>
                <SelectItem className="h-10!" value="Junior">Júnior</SelectItem>
                <SelectItem className="h-10!" value="Pleno">Pleno</SelectItem>
                <SelectItem className="h-10!" value="Sênior">Sênior</SelectItem>
              </SelectContent>
            </Select>

            <Select value={modalidadeFiltro} onValueChange={(value) => setModalidadeFiltro(value)}>
              <SelectTrigger className="w-full lg:w-56 h-11! rounded-xl border-input bg-white text-sm text-ink">
                <div className="flex items-center gap-2">
                  <MapPinHouse className="size-4 text-brand shrink-0" />
                  <SelectValue placeholder="Todas as modalidades" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem className="h-10!" value="todos">Todas as modalidades</SelectItem>
                <SelectItem className="h-10!" value="Remoto">Remoto</SelectItem>
                <SelectItem className="h-10!" value="Híbrido">Híbrido</SelectItem>
                <SelectItem className="h-10!" value="Presencial">Presencial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end justify-between gap-4">
            <div>
              <h2 className="font-display text-3xl text-ink">Recomendadas para você</h2>
              <p className="text-sm text-muted-foreground">Baseadas no seu perfil e preferências</p>
            </div>
            {!isLoading && (
              <span className="shrink-0 rounded-full bg-brand-soft px-3 py-1 text-xs font-bold text-brand tabular-nums">
                {vagasFiltradas?.length ?? 0} vagas
              </span>
            )}
          </div>

          {/* Lista de vagas */}
          {isLoading ? (
            <div className="surface flex items-center gap-4 p-6">
              <span className="relative grid place-items-center size-12 shrink-0">
                <span className="absolute inset-0 rounded-full border-4 border-brand-soft" />
                <span className="absolute inset-0 rounded-full border-4 border-brand border-r-transparent animate-spin" />
              </span>
              <p className="text-sm text-muted-foreground">
                Estamos analisando seu perfil e encontrando as vagas mais compatíveis com você. Aguarde um instante.
              </p>
            </div>
          ) : vagasFiltradas && vagasFiltradas.length > 0 ? (
            <div className="flex flex-col gap-4 stagger">
              {vagasFiltradas.map((vaga) => (
                <CadsVacancy key={vaga.id} vacancy={vaga} />
              ))}
            </div>
          ) : (
            <div className="surface flex flex-col items-center gap-4 px-6 py-14 text-center">
              <span className="grid place-items-center size-14 rounded-2xl bg-brand-soft text-brand">
                <Target className="size-6" />
              </span>
              <p className="max-w-md text-sm text-muted-foreground">
                Ainda não encontramos vagas compatíveis com o seu perfil. Atualize suas habilidades e experiências para receber recomendações mais alinhadas às suas qualificações.
              </p>
            </div>
          )}
        </div>

        {/* Lateral */}
        <aside className="surface p-6 xl:sticky xl:top-28">
          <p className="eyebrow text-brand">Ranking</p>
          <h3 className="mt-1 font-display text-2xl text-ink">Empresas com mais vagas</h3>

          <ol className="mt-5 flex flex-col gap-2">
            {metrics && metrics.bussinesMoreWithVacancys.length > 0 ? (
              metrics.bussinesMoreWithVacancys.map((v, i) => (
                <li key={v.company} className="flex items-center gap-3 rounded-xl p-2 hover:bg-sky transition-colors">
                  <span className={`grid place-items-center size-11 shrink-0 rounded-xl text-lg font-bold ${i == 0 ? "bg-gold text-white" : i == 1 ? "bg-ink text-white" : "bg-brand-soft text-brand"}`}>
                    {v.company.replace(" ", "").slice(0, 1)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">{v.company}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.countVacancies == 1 ? `${v.countVacancies} vaga disponível` : `${v.countVacancies} vagas disponíveis`}
                    </p>
                  </div>
                  <span className="font-display text-2xl text-muted-foreground/40 tabular-nums">{i + 1}</span>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sem dados no momento.</p>
            )}
          </ol>
        </aside>
      </div>
    </div>
  );
}
