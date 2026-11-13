import { AppShell } from "@/components/app-shell"

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      eyebrow="Planos e créditos"
      title="Seus créditos de IA"
      description="Acompanhe seu saldo, assine um plano mensal ou compre créditos avulsos quando precisar."
    >
      {children}
    </AppShell>
  )
}
