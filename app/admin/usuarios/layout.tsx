import { AppShell } from "@/components/app-shell"

export default function AdminUsersLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AppShell
      eyebrow="Administração · Usuários"
      title="Perfis de acesso"
      description="Defina quem é usuário, recrutador ou administrador da plataforma."
    >
      {children}
    </AppShell>
  )
}
