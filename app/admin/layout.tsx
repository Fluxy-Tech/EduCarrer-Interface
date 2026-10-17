import { AppShell } from "@/components/app-shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      eyebrow="Administração"
      title="Painel administrativo"
      description="Gerencie as vagas cadastradas e acompanhe a qualidade das recomendações."
    >
      {children}
    </AppShell>
  )
}
