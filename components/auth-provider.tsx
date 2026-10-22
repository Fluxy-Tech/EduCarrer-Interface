"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "@/lib/auth/auth-client"
import { BrandMark } from "@/components/brand-mark"

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (!isPending && !session) {
      router.push("/singin")
    }
  }, [session, isPending, router])

  if (isPending) {
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
