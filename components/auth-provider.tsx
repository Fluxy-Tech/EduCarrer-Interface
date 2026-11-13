"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth/auth-client"
import { BrandMark } from "@/components/brand-mark"
import { UserRole, getHomeForRole } from "@/lib/users/roles"

// Telas de usuário por padrão; recrutadores só acessam as telas próprias (ranking e vagas)
const DEFAULT_ROLES: UserRole[] = ["user", "admin"]

export function AuthProvider({ children, allowedRoles = DEFAULT_ROLES }: { children: React.ReactNode; allowedRoles?: UserRole[] }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  const role = (session?.user?.role ?? "user") as UserRole
  const allowed = !!session && allowedRoles.includes(role)

  useEffect(() => {
    if (isPending) return

    if (!session) {
      router.push("/singin")
    } else if (!allowedRoles.includes(role)) {
      router.replace(getHomeForRole(role))
    }
  }, [session, isPending, router, role, allowedRoles])

  if (isPending || (session && !allowed)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink-gradient">
        <div className="flex flex-col items-center gap-6 animate-pop">
          <BrandMark className="self-center ml-0" />
          <div className="h-1 w-40 overflow-hidden rounded-full bg-white/10">
            <div className="h-full w-full shimmer" />
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return <>{children}</>
}
