"use client"

import { useSkills } from "@/app/services/skills.swr";
import { useExperiences } from "@/app/services/experiences.swr";
import { useSession } from "@/lib/auth/auth-client";

import { Loader2, WandSparkles, BriefcaseBusiness, FileText } from "lucide-react";

import { DialogSkillCreate } from "@/components/dialog/dialog-skill.create";
import { DialogResumeImport } from "@/components/dialog/dialog-resume-import";
import { DialogExperienceCreate } from "@/components/dialog/dialog-experience.create";

import CadsSkill from "@/components/cards/card-skill";
import CadsExperience from "@/components/cards/card-experience";
import { ProgressRing } from "@/components/study/level-progress";
import { AgentChat } from "@/components/agent/agent-chat";

function SectionHeader({ icon: Icon, eyebrow, title, description, action }: {
  icon: React.ElementType
  eyebrow: string
  title: string
  description: string
  action: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-border p-6 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <span className="grid place-items-center size-12 shrink-0 rounded-2xl bg-brand-soft text-brand">
          <Icon className="size-5" />
        </span>
        <div>
          <p className="eyebrow text-brand">{eyebrow}</p>
          <h2 className="mt-0.5 font-display text-3xl leading-tight text-ink">{title}</h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  )
}

export default function DashboardPage() {
  const { skills } = useSkills();
  const { experiences } = useExperiences();
  const { data: session } = useSession();

  // Força do perfil: quanto mais dados, melhores os estudos e as recomendações
  const strength = Math.min(100, Math.round(
    Math.min(skills?.length ?? 0, 6) / 6 * 60 + Math.min(experiences?.length ?? 0, 2) / 2 * 40
  ));

  const initials = (session?.user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div className="w-full flex flex-col gap-8">

      {/* Resumo do perfil */}
      <section className="relative overflow-hidden rounded-3xl bg-ink-gradient p-6 sm:p-8 text-white animate-rise">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:linear-gradient(to_left,black,transparent_80%)]" />
        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-5">
            <span className="grid place-items-center size-20 shrink-0 rounded-3xl bg-gradient-to-br from-brand to-ink-3 text-2xl font-bold ring-4 ring-white/10">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="eyebrow text-gold">Perfil profissional</p>
              <h2 className="mt-1 font-display text-4xl leading-tight truncate">{session?.user?.name || "Usuário"}</h2>
              <p className="text-sm text-white/55 truncate">{session?.user?.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-5 rounded-2xl border border-white/10 bg-white/[0.05] p-4 backdrop-blur-sm">
            <ProgressRing percent={strength} size={72} stroke={6} tone="light">
              <span className="text-base font-extrabold tabular-nums">{strength}%</span>
            </ProgressRing>
            <div className="max-w-[220px]">
              <p className="text-sm font-bold">Força do perfil</p>
              <p className="text-xs leading-relaxed text-white/55">
                {skills?.length ?? 0} habilidades e {experiences?.length ?? 0} experiências. Perfis completos geram estudos mais precisos.
              </p>
            </div>
          </div>
        </div>

        {/* Importação do currículo com IA */}
        <div className="relative mt-6 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <FileText className="mt-0.5 size-5 shrink-0 text-gold" />
            <div>
              <p className="text-sm font-bold">Preencha o perfil com o seu currículo</p>
              <p className="text-xs leading-relaxed text-white/55">
                A IA lê o PDF, encontra suas experiências e habilidades e você confirma antes de salvar.
              </p>
            </div>
          </div>
          <DialogResumeImport />
        </div>
      </section>

      <section className="surface overflow-hidden">
        <SectionHeader
          icon={WandSparkles}
          eyebrow="Competências"
          title="Habilidades"
          description="Gerencie suas principais habilidades técnicas e comportamentais"
          action={<DialogSkillCreate />}
        />
        <div className="flex flex-col divide-y divide-border">
          {skills ? (
            skills.length > 0 ? (
              skills.map((skill) => (
                <CadsSkill key={skill.id} skill={skill} />
              ))
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma habilidade cadastrada ainda.</p>
            )
          ) : (
            <div className="w-full p-8 flex items-center justify-center">
              <Loader2 className="animate-spin text-brand" />
            </div>
          )}
        </div>
      </section>

      <section className="surface overflow-hidden">
        <SectionHeader
          icon={BriefcaseBusiness}
          eyebrow="Carreira"
          title="Experiências profissionais"
          description="Gerencie seu histórico profissional"
          action={<DialogExperienceCreate />}
        />
        <div className="flex flex-col divide-y divide-border">
          {experiences ? (
            experiences.length > 0 ? (
              experiences.map((experience) => (
                <CadsExperience key={experience.id} experience={experience} />
              ))
            ) : (
              <p className="p-8 text-center text-sm text-muted-foreground">Nenhuma experiência cadastrada ainda.</p>
            )
          ) : (
            <div className="w-full p-8 flex items-center justify-center">
              <Loader2 className="animate-spin text-brand" />
            </div>
          )}
        </div>
      </section>

      <AgentChat
        eyebrow="Assistente"
        title="Tire suas dúvidas sobre a plataforma"
        description="Pergunte como funcionam o perfil, as vagas e as trilhas de estudo"
        suggestions={[
          "Como funciona a trilha de estudos?",
          "Como gerar um estudo para uma vaga?",
          "Como melhorar a força do meu perfil?",
        ]}
      />

    </div>
  )
}
