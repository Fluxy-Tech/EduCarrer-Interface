"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ToastPersonalizado } from "@/components/toast";
import { EMPTY_VACANCY, VacancyForm, VacancyFormData } from "@/components/vacancy/vacancy-form";
import { createRecruiterVacancy } from "@/app/services/recruiter.swr";

// Cadastro de vaga pelo recrutador
export default function RecruiterCreateVacancyPage() {
  const router = useRouter();

  const handleSubmit = async (data: VacancyFormData) => {
    try {
      const res = await createRecruiterVacancy(data);
      ToastPersonalizado({ mensagem: res.message });

      if (res.status) router.push("/recruiter/vagas");
    } catch (error) {
      console.error(error);
      ToastPersonalizado({ mensagem: "Erro ao cadastrar a vaga. Tente novamente." });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/recruiter/vagas" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-brand">
          <ArrowLeft className="size-4" /> Voltar para minhas vagas
        </Link>
        <h2 className="mt-3 font-display text-4xl text-ink">Nova vaga</h2>
        <p className="text-sm text-muted-foreground">Preencha os dados da vaga da sua empresa.</p>
      </div>

      <VacancyForm
        defaultValues={EMPTY_VACANCY}
        submitLabel="Cadastrar vaga"
        submittingLabel="Cadastrando..."
        onSubmit={handleSubmit}
        backHref="/recruiter/vagas"
      />
    </div>
  );
}
