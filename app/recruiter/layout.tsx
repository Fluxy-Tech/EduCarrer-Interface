import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth/auth"

// Bloqueio no servidor: telas de recrutador só para recrutadores e administradores
export default async function RecruiterLayout({
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

  if (session.user.role !== "recruiter" && session.user.role !== "admin") {
    redirect("/jobs")
  }

  return children
}
