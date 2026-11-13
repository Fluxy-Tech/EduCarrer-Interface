import { AppShell } from "@/components/app-shell"

export default function AdminMetricsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      eyebrow="Administração · Métricas"
      title="Evolução dos estudos"
      description="Acompanhe quantos usuários criam estudos, evoluem nas trilhas e concluem a preparação."
    >
      {children}
    </AppShell>
  )
}
