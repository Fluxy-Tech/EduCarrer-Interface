import { AppShell } from "@/components/app-shell"

export default function RecruiterVacanciesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      allowedRoles={["recruiter", "admin"]}
      eyebrow="Recrutamento"
      title="Vagas da empresa"
      description="Cadastre as vagas da sua empresa. Elas aparecem para os candidatos compatíveis."
    >
      {children}
    </AppShell>
  )
}
