"use client"

import * as React from "react"
import {
  BriefcaseBusiness,
  BookMarked,
  UserCog,
  LogOut,
  ShieldUser,
  ChevronsUpDown,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { authClient, useSession } from "@/lib/auth/auth-client"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { BrandMark } from "@/components/brand-mark"

const menuItems = [
  {
    title: "Vagas",
    description: "Oportunidades para você",
    url: "/jobs",
    icon: BriefcaseBusiness,
  },
  {
    title: "Estudos",
    description: "Trilhas e níveis",
    url: "/learning",
    icon: BookMarked,
  },
  {
    title: "Perfil",
    description: "Habilidades e experiências",
    url: "/profile",
    icon: UserCog,
  },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/singin")
  }

  const items = React.useMemo(() => {
    const baseItems = [...menuItems]

    if (session?.user?.role === "admin") {
      baseItems.push({
        title: "Admin",
        description: "Gestão da plataforma",
        url: "/admin",
        icon: ShieldUser,
      })
    }

    return baseItems
  }, [session?.user?.role])

  const initials = (session?.user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")

  return (
    <Sidebar className="border-r-0">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent_70%)]" />

      <SidebarHeader className="relative px-5 pt-7 pb-6">
        <BrandMark className="h-[72px]" />
      </SidebarHeader>

      <SidebarContent className="relative flex-1 px-3">
        <SidebarGroup>
          <SidebarGroupLabel className="eyebrow text-white/35 px-3 mb-2">Navegação</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-1.5">
              {items.map((item) => {
                const active = pathname === item.url || pathname.startsWith(`${item.url}/`)

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      className={
                        active
                          ? "relative h-14 px-3 rounded-xl bg-white/[0.07]! text-white! hover:bg-white/10!"
                          : "relative h-14 px-3 rounded-xl text-white/60 hover:bg-white/5! hover:text-white!"
                      }
                    >
                      <Link href={item.url}>
                        {active && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-gold" />
                        )}
                        <span className={`grid place-items-center size-9 rounded-lg transition-colors ${active ? "bg-brand text-white" : "bg-white/5 text-white/70"}`}>
                          <item.icon className="size-4!" />
                        </span>
                        <span className="flex flex-col leading-tight pl-1">
                          <span className="text-sm font-semibold">{item.title}</span>
                          <span className="text-[11px] text-white/40">{item.description}</span>
                        </span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="relative p-3">
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 mb-2">
          <p className="eyebrow text-gold mb-1">Dica</p>
          <p className="text-xs leading-relaxed text-white/60">
            Complete os níveis dos seus estudos para acumular XP e subir de patente.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="cursor-pointer w-full flex items-center gap-3 rounded-xl p-2.5 text-left hover:bg-white/5 transition-colors">
              <span className="grid place-items-center size-10 shrink-0 rounded-xl bg-gradient-to-br from-brand to-ink-3 text-sm font-bold text-white">
                {initials}
              </span>
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-semibold text-white">
                  {session?.user?.name || "Usuário"}
                </span>
                <span className="truncate text-xs text-white/45">
                  {session?.user?.email}
                </span>
              </span>
              <ChevronsUpDown className="ml-auto size-4 shrink-0 text-white/40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" side="top" className="w-60 rounded-xl p-1.5">
            <DropdownMenuLabel className="text-muted-foreground text-xs font-semibold">Minha conta</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer h-10 rounded-lg text-danger focus:bg-danger-soft focus:text-danger" onClick={handleLogout}>
              <LogOut className="mr-1 size-4 text-danger" />
              <span>Sair da conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
