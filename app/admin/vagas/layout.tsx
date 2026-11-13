import { AppShell } from "@/components/app-shell"

export default function AdminVacanciesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      eyebrow="Administração · Vagas"
      title="Gerenciamento de vagas"
      description="Gerencie as vagas cadastradas e acompanhe a qualidade das recomendações."
    >
      {children}
    </AppShell>
  )
}
