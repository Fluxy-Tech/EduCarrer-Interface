"use client"

import { useState } from "react"
import { BotMessageSquare, Eye, EyeOff, Lock, Trophy, Workflow } from "lucide-react"
import { BrandMark } from "@/components/brand-mark"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const features = [
  {
    icon: BotMessageSquare,
    title: "Agentes de IA",
    description: "Estudos montados a partir da vaga e do seu perfil.",
  },
  {
    icon: Workflow,
    title: "Recomendações sob medida",
    description: "Vagas filtradas pelas suas habilidades reais.",
  },
  {
    icon: Trophy,
    title: "Evolução gamificada",
    description: "Avance nível a nível e acumule XP.",
  },
]

interface AuthShellProps {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

// Estrutura das telas de autenticação: painel da marca + formulário
export function AuthShell({ eyebrow, title, description, children }: AuthShellProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-[1.05fr_1fr] bg-white">
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-ink-gradient p-12 xl:p-16 text-white">
        <div className="pointer-events-none absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_at_top_right,black,transparent_75%)]" />

        <BrandMark className="relative" />

        <div className="relative max-w-xl stagger">
          <p className="eyebrow text-gold mb-5">Carreira guiada por dados</p>
          <h2 className="font-display text-5xl xl:text-6xl leading-[1.02]">
            Sua próxima vaga começa com o <em className="text-gold-gradient">estudo certo</em>.
          </h2>
          <p className="mt-6 text-base leading-relaxed text-white/65 max-w-md">
            A EduCarrer cruza o seu perfil com vagas reais do mercado e transforma as lacunas em uma trilha de estudos com níveis, quizzes e conquistas.
          </p>

          <ul className="mt-10 grid gap-4">
            {features.map((f) => (
              <li key={f.title} className="flex items-start gap-4">
                <span className="grid place-items-center size-10 shrink-0 rounded-xl border border-white/10 bg-white/5">
                  <f.icon className="size-5 text-white/85" strokeWidth={1.6} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{f.title}</span>
                  <span className="block text-sm text-white/50">{f.description}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Prévia da trilha de níveis */}
        <div className="relative flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm max-w-md">
          <div className="flex items-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <div key={n} className="flex items-center">
                <span
                  className={cn(
                    "grid place-items-center size-8 rounded-full text-xs font-bold",
                    n <= 2 && "bg-gold text-ink",
                    n === 3 && "bg-brand text-white animate-pulse-ring",
                    n > 3 && "bg-white/10 text-white/40"
                  )}
                >
                  {n > 3 ? <Lock className="size-3.5" /> : n}
                </span>
                {n < 5 && <span className={cn("h-[2px] w-4", n < 3 ? "bg-gold" : "bg-white/15")} />}
              </div>
            ))}
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Nível 3 · Lacunas</p>
            <p className="text-xs text-white/50">+240 XP acumulados</p>
          </div>
        </div>
      </aside>

      <main className="relative flex flex-col items-center justify-center px-5 py-10 sm:px-10">
        <div className="pointer-events-none absolute inset-0 bg-grid-light [mask-image:radial-gradient(ellipse_at_top,black,transparent_65%)] lg:hidden" />

        <div className="relative w-full max-w-[420px] animate-rise">
          <BrandMark tone="dark" className="mb-10 lg:hidden" />

          <p className="eyebrow text-brand mb-3">{eyebrow}</p>
          <h1 className="font-display text-4xl sm:text-[44px] leading-[1.05] text-ink">{title}</h1>
          <p className="mt-3 mb-8 text-muted-foreground">{description}</p>

          {children}
        </div>

        <p className="relative mt-12 text-center text-xs text-muted-foreground">
          © 2026 EduCarrer AI. Todos os direitos reservados.
        </p>
      </main>
    </div>
  )
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null

  return (
    <div className="flex items-start gap-2 rounded-xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm text-danger animate-rise">
      {message}
    </div>
  )
}

export function AuthDivider({ label }: { label: string }) {
  return (
    <div className="relative my-7">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-border" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs font-medium text-muted-foreground">{label}</span>
      </div>
    </div>
  )
}

type PasswordInputProps = Omit<React.ComponentProps<typeof Input>, "type">

export function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative w-full">
      <Input
        {...props}
        type={show ? "text" : "password"}
        className={cn("pr-12", className)}
      />
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        aria-label={show ? "Ocultar senha" : "Mostrar senha"}
        className="cursor-pointer absolute right-2 top-1/2 -translate-y-1/2 grid place-items-center size-9 rounded-lg text-muted-foreground hover:bg-muted hover:text-ink transition-colors"
      >
        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  )
}
