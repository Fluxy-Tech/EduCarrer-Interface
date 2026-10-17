import { AppShell } from "@/components/app-shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      eyebrow="Oportunidades"
      title="Vagas para você"
      description="Vagas selecionadas a partir das suas habilidades e experiências."
    >
      {children}
    </AppShell>
  )
}
