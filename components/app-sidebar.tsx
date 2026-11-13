"use client"

import * as React from "react"
import {
  BriefcaseBusiness,
  BookMarked,
  UserCog,
  LogOut,
  ShieldUser,
  ChevronsUpDown,
  Coins,
  Crown,
  ChevronDown,
  ChartNoAxesCombined,
  Trophy,
  Users,
} from "lucide-react"
import { getRoleLabel } from "@/lib/users/roles"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useCredits } from "@/app/services/credits.swr"
import { formatCredits } from "@/lib/credits/config"
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
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
  {
    title: "Planos",
    description: "Créditos e assinatura",
    url: "/plans",
    icon: Crown,
  },
]

// Recrutador vê somente o ranking de candidatos e as vagas que cadastrou
const recruiterItems = [
  {
    title: "Ranking",
    description: "Candidatos com mais desempenho",
    url: "/recruiter/ranking",
    icon: Trophy,
  },
  {
    title: "Minhas vagas",
    description: "Cadastre vagas da empresa",
    url: "/recruiter/vagas",
    icon: BriefcaseBusiness,
  },
]

const adminItems = [
  { title: "Vagas", url: "/admin/vagas", icon: BriefcaseBusiness },
  { title: "Métricas", url: "/admin/metricas", icon: ChartNoAxesCombined },
  { title: "Usuários", url: "/admin/usuarios", icon: Users },
  { title: "Ranking", url: "/recruiter/ranking", icon: Trophy },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: session } = useSession()
  const { credits } = useCredits()

  const handleLogout = async () => {
    await authClient.signOut()
    router.push("/singin")
  }

  const role = session?.user?.role ?? "user"
  const isAdmin = role === "admin"
  const isRecruiter = role === "recruiter"
  const items = isRecruiter ? recruiterItems : menuItems
  const adminActive = adminItems.some((a) => pathname === a.url || pathname.startsWith(`${a.url}/`)) || pathname === "/admin"

  // O grupo Admin abre sozinho quando o usuário está em uma tela do admin
  const [adminOpen, setAdminOpen] = React.useState(adminActive)

  React.useEffect(() => {
    if (adminActive) setAdminOpen(true)
  }, [adminActive])

  const initials = (session?.user?.name || "U")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("")

  return (
    <Sidebar className="border-r-0">

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

              {isAdmin && (
                <Collapsible open={adminOpen} onOpenChange={setAdminOpen} asChild>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={adminActive}
                        className={
                          adminActive
                            ? "cursor-pointer relative h-14 px-3 rounded-xl bg-white/[0.07]! text-white! hover:bg-white/10!"
                            : "cursor-pointer relative h-14 px-3 rounded-xl text-white/60 hover:bg-white/5! hover:text-white!"
                        }
                      >
                        {adminActive && (
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 h-7 w-[3px] rounded-r-full bg-gold" />
                        )}
                        <span className={`grid place-items-center size-9 rounded-lg transition-colors ${adminActive ? "bg-brand text-white" : "bg-white/5 text-white/70"}`}>
                          <ShieldUser className="size-4!" />
                        </span>
                        <span className="flex flex-col leading-tight pl-1">
                          <span className="text-sm font-semibold">Admin</span>
                          <span className="text-[11px] text-white/40">Gestão da plataforma</span>
                        </span>
                        <ChevronDown className={`ml-auto size-4 text-white/40 transition-transform duration-200 ${adminOpen ? "rotate-180" : ""}`} />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <SidebarMenuSub className="mx-0 ml-7 mt-1.5 gap-1 border-white/10 px-2">
                        {adminItems.map((sub) => {
                          const subActive = pathname === sub.url || pathname.startsWith(`${sub.url}/`)

                          return (
                            <SidebarMenuSubItem key={sub.url}>
                              <SidebarMenuSubButton
                                asChild
                                isActive={subActive}
                                className={
                                  subActive
                                    ? "h-10 rounded-lg bg-white/[0.07]! text-white! font-semibold"
                                    : "h-10 rounded-lg text-white/55 hover:bg-white/5! hover:text-white!"
                                }
                              >
                                <Link href={sub.url}>
                                  <sub.icon className={`size-4! ${subActive ? "text-gold!" : "text-white/50!"}`} />
                                  <span className="text-sm">{sub.title}</span>
                                </Link>
                              </SidebarMenuSubButton>
                            </SidebarMenuSubItem>
                          )
                        })}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="relative p-3">
        {isRecruiter ? (
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 mb-2">
            <p className="eyebrow text-gold mb-1">Perfil recrutador</p>
            <p className="text-xs leading-relaxed text-white/60">
              Encontre candidatos pelo desempenho nas trilhas e baixe os currículos que eles autorizaram.
            </p>
          </div>
        ) : (
        <Link
          href="/plans"
          className="group block rounded-2xl border border-white/10 bg-white/[0.04] p-4 mb-2 transition-colors hover:bg-white/[0.07]"
        >
          <div className="flex items-center justify-between">
            <p className="eyebrow text-gold">Créditos de IA</p>
            <Coins className="size-4 text-gold" />
          </div>
          <p className="mt-1 text-2xl font-extrabold text-white tabular-nums">
            {credits ? formatCredits(credits.total) : "—"}
          </p>
          <p className="text-[11px] text-white/45">
            {credits?.planName ? `Plano ${credits.planName}` : "Sem plano ativo"}
            <span className="ml-1 text-gold group-hover:underline">· {credits && credits.total < 2000 ? "Recarregar" : "Ver planos"}</span>
          </p>
        </Link>
        )}

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
                  {role !== "user" ? `${getRoleLabel(role)} · ` : ""}{session?.user?.email}
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
