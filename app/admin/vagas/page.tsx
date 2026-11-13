"use client";

import { useState } from "react";
import { useVacancysAdmin } from "@/app/services/vacancys.swr";
import { Loader2, Search, BrainCircuit, MapPinHouse, Users, Building2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import CadsVacancyAdmin from "@/components/cards/card-vacancy-admin";
import CharRecomedacaoDeVagas from "@/components/chart/acuracia-recomendacoes";
import CharGeracaoDeEstudo from "@/components/chart/acuracia-geracao-de-estudos";
import { DialogVacncyCreate } from "@/components/dialog/dialog-vacancy.create";
import { useMetricsAdmin } from "@/app/services/metrics.swr";

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
  const { vacancys } = useVacancysAdmin();
  const { metrics } = useMetricsAdmin();
  const [nomeFiltro, setNomeFiltro] = useState("");
  const [nivelFiltro, setNivelFiltro] = useState("todos");
  const [modalidadeFiltro, setModalidadeFiltro] = useState("todos");

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

  const stats = [
    { icon: Users, label: "Usuários cadastrados", value: `+${metrics?.totalUsers ?? 0}` },
    { icon: Building2, label: "Empresas parceiras", value: `+${metrics?.totalBussines ?? 0}` },
  ];

  return (
    <div className="flex flex-col gap-8">

      <div className="grid gap-4 sm:grid-cols-2 stagger">
        {stats.map((s) => (
          <div key={s.label} className="surface flex items-center gap-4 p-5">
            <span className="grid place-items-center size-12 shrink-0 rounded-2xl bg-ink text-white">
              <s.icon className="size-5" />
            </span>
            <div>
              <p className="text-3xl font-extrabold text-ink tabular-nums">{s.value}</p>
              <p className="text-sm text-muted-foreground">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px] xl:items-start">
        <div className="flex flex-col gap-6 min-w-0">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-display text-3xl text-ink">Vagas cadastradas</h2>
              <p className="text-sm text-muted-foreground">Edite, desative ou cadastre novas vagas na plataforma</p>
            </div>
            <DialogVacncyCreate />
          </div>

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

          {/* Lista de vagas */}
          {vacancys ? (
            vagasFiltradas && vagasFiltradas.length > 0 ? (
              <div className="flex flex-col gap-4">
                {vagasFiltradas.map((vaga) => (
                  <CadsVacancyAdmin key={vaga.id} vacancy={vaga} />
                ))}
              </div>
            ) : (
              <p className="surface p-8 text-center text-sm text-muted-foreground">
                Nenhuma vaga cadastrada.
              </p>
            )
          ) : (
            <div className="w-full p-8 flex items-center justify-center">
              <Loader2 className="animate-spin text-brand" />
            </div>
          )}
        </div>

        <aside className="flex flex-col gap-6 xl:sticky xl:top-28">
          <CharGeracaoDeEstudo />
          <CharRecomedacaoDeVagas />
        </aside>
      </div>
    </div>
  );
}
