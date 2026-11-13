"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ToastPersonalizado } from "@/components/toast";
import { EMPTY_VACANCY, VacancyForm, VacancyFormData } from "@/components/vacancy/vacancy-form";
import { createVacancy, refreshVacancysAdmin } from "@/app/services/vacancys.swr";

// Tela de cadastro de vaga
export default function CreateVacancyPage() {
  const router = useRouter();

  const handleSubmit = async (data: VacancyFormData) => {
    try {
      const res = await createVacancy(data);
      ToastPersonalizado({ mensagem: res.message });

      if (res.status) {
        await refreshVacancysAdmin();
        router.push("/admin/vagas");
      }
    } catch (error) {
      console.error(error);
      ToastPersonalizado({ mensagem: "Erro ao criar a vaga. Tente novamente." });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/admin/vagas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-brand">
          <ArrowLeft className="size-4" /> Voltar para vagas
        </Link>
        <h2 className="mt-3 font-display text-4xl text-ink">Nova vaga</h2>
        <p className="text-sm text-muted-foreground">Preencha os dados para cadastrar uma nova oportunidade na plataforma.</p>
      </div>

      <VacancyForm
        defaultValues={EMPTY_VACANCY}
        submitLabel="Cadastrar vaga"
        submittingLabel="Cadastrando..."
        onSubmit={handleSubmit}
      />
    </div>
  );
}
