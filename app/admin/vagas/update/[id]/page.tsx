"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ToastPersonalizado } from "@/components/toast";
import { VacancyForm, VacancyFormData } from "@/components/vacancy/vacancy-form";
import { refreshVacancysAdmin, updateVacancy, useVacancyAdmin } from "@/app/services/vacancys.swr";

// Tela de edição de vaga: /admin/vagas/update/{id}
export default function UpdateVacancyPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { vacancy, isLoading, refresh } = useVacancyAdmin(id);

  const handleSubmit = async (data: VacancyFormData) => {
    try {
      const res = await updateVacancy(id, data);
      ToastPersonalizado({ mensagem: res.message });

      if (res.status) {
        await Promise.all([refreshVacancysAdmin(), refresh()]);
        router.push("/admin/vagas");
      }
    } catch (error) {
      console.error(error);
      ToastPersonalizado({ mensagem: "Erro ao atualizar a vaga. Tente novamente." });
    }
  };

  const back = (
    <Link href="/admin/vagas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-brand">
      <ArrowLeft className="size-4" /> Voltar para vagas
    </Link>
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <div className="surface flex items-center gap-4 p-6">
          <span className="relative grid place-items-center size-12 shrink-0">
            <span className="absolute inset-0 rounded-full border-4 border-brand-soft" />
            <span className="absolute inset-0 rounded-full border-4 border-brand border-r-transparent animate-spin" />
          </span>
          <p className="text-sm text-muted-foreground">Carregando os dados da vaga...</p>
        </div>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="flex flex-col gap-6">
        {back}
        <div className="surface flex flex-col items-center gap-4 px-6 py-14 text-center">
          <span className="grid place-items-center size-14 rounded-2xl bg-brand-soft text-brand">
            <SearchX className="size-6" />
          </span>
          <p className="text-sm text-muted-foreground">Não encontramos essa vaga. Ela pode ter sido removida.</p>
          <Button asChild variant="create"><Link href="/admin/vagas">Ver todas as vagas</Link></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        {back}
        <p className="mt-3 eyebrow text-brand">{vacancy.company}</p>
        <h2 className="mt-1 font-display text-4xl text-ink">Editar vaga</h2>
        <p className="text-sm text-muted-foreground">{vacancy.title}</p>
      </div>

      <VacancyForm
        key={vacancy.id}
        defaultValues={{
          title: vacancy.title ?? "",
          description: vacancy.description ?? "",
          company: vacancy.company ?? "",
          modality: vacancy.modality ?? "",
          level: vacancy.level ?? "",
          technologies: vacancy.technologies ?? [],
          link: vacancy.link ?? "",
          origin: vacancy.origin ?? "",
          location: vacancy.location ?? "",
          salary: vacancy.salary ?? null,
          active: vacancy.active ?? true,
        }}
        submitLabel="Salvar alterações"
        submittingLabel="Salvando..."
        onSubmit={handleSubmit}
      />
    </div>
  );
}
