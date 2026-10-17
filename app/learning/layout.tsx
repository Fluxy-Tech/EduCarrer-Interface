import { AppShell } from "@/components/app-shell"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      eyebrow="Aprendizado"
      title="Trilhas de estudo"
      description="Avance nível por nível em estudos criados para as vagas que você quer conquistar."
    >
      {children}
    </AppShell>
  )
}
