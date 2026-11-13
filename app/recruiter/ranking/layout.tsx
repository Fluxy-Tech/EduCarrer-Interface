import { AppShell } from "@/components/app-shell"

export default function RankingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      allowedRoles={["recruiter", "admin"]}
      eyebrow="Recrutamento"
      title="Ranking de candidatos"
      description="Candidatos ordenados pelo desempenho nas trilhas de estudo. Filtre pela área de interesse."
    >
      {children}
    </AppShell>
  )
}
