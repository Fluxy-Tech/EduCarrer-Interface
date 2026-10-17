"use client"

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AuthProvider } from "@/components/auth-provider"

interface AppShellProps {
  eyebrow: string
  title: string
  description: string
  children: React.ReactNode
}

// Estrutura padrão das telas logadas: sidebar + cabeçalho fixo + conteúdo
export function AppShell({ eyebrow, title, description, children }: AppShellProps) {
  return (
    <AuthProvider>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-sky">
          <AppSidebar />
          <main className="flex-1 flex flex-col min-h-screen min-w-0">

            <header className="sticky top-0 z-20 border-b border-border bg-white/80 backdrop-blur-xl">
              <div className="mx-auto w-full max-w-[1400px] flex items-center gap-4 px-4 sm:px-6 lg:px-10 py-4">
                <SidebarTrigger className="size-10 rounded-xl border border-border bg-white text-ink hover:bg-muted md:hidden" />
                <div className="min-w-0">
                  <p className="eyebrow text-brand">{eyebrow}</p>
                  <h1 className="font-display text-2xl sm:text-[28px] leading-tight text-ink truncate">{title}</h1>
                </div>
                <p className="ml-auto hidden xl:block max-w-sm text-right text-sm text-muted-foreground leading-snug">
                  {description}
                </p>
              </div>
            </header>

            <div className="flex-1 w-full mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-6 lg:py-10">
              {children}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AuthProvider>
  )
}
