import { AppShell } from "@/components/app-shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      eyebrow="Seu perfil"
      title="Perfil profissional"
      description="Mantenha suas habilidades e experiências atualizadas para receber estudos e vagas mais precisos."
    >
      {children}
    </AppShell>
  )
}
