import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"

// Bloqueio no servidor: quem não é administrador é redirecionado antes de qualquer tela do admin ser enviada.
// Cada tela (Vagas e Métricas) define seu próprio cabeçalho no layout da rota.
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user) {
    redirect("/singin")
  }

  if (session.user.role !== "admin") {
    redirect("/jobs")
  }

  return children
}
