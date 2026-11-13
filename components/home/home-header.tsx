"use client"

import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BrandMark } from "@/components/brand-mark"
import { useSession } from "@/lib/auth/auth-client"

const links = [
  { href: "#funcionalidades", label: "Funcionalidades" },
  { href: "#ensino", label: "Como ensinamos" },
  { href: "#planos", label: "Planos" },
  { href: "#creditos", label: "Créditos" },
]

// Cabeçalho da apresentação: quem já está logado vai direto para a plataforma
export function HomeHeader() {
  const { data: session, isPending } = useSession()

  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-ink/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-4 py-3 sm:px-6">
        <Link href="/" aria-label="EduCarrer AI">
          <BrandMark className="h-11 ml-0" />
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-7 lg:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-white/60 transition-colors hover:text-white">
              {l.label}
            </a>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {!isPending && session ? (
            <Button asChild variant="gold" size="sm">
              <Link href="/jobs">Ir para a plataforma <ArrowRight /></Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="sidebar" size="sm" className="hidden sm:inline-flex">
                <Link href="/singin">Entrar</Link>
              </Button>
              <Button asChild variant="gold" size="sm">
                <Link href="/singup">Criar conta grátis</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
