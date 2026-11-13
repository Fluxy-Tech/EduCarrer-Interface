"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Search, ShieldUser, UserRound, UserSearch } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ToastPersonalizado } from "@/components/toast";
import { setUserRole, useAdminUsers } from "@/app/services/adminUsers.swr";
import { useSession } from "@/lib/auth/auth-client";
import { USER_ROLES, getRoleLabel } from "@/lib/users/roles";
import { cn } from "@/lib/utils";

const ROLE_STYLE: Record<string, string> = {
  user: "bg-sky text-ink/70",
  recruiter: "bg-gold-soft text-gold",
  admin: "bg-ink text-white",
};

const ROLE_ICON: Record<string, typeof UserRound> = {
  user: UserRound,
  recruiter: UserSearch,
  admin: ShieldUser,
};

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("todos");
  const [saving, setSaving] = useState<string | null>(null);
  const { users, isLoading, refresh } = useAdminUsers(search, roleFilter);

  const handleRole = async (userId: string, role: string) => {
    try {
      setSaving(userId);
      const res = await setUserRole(userId, role);
      ToastPersonalizado({ mensagem: res.message });
      await refresh();
    } catch (e) {
      console.error(e);
      ToastPersonalizado({ mensagem: "Não conseguimos alterar o perfil agora." });
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-3 sm:grid-cols-3">
        {USER_ROLES.map((r) => {
          const Icon = ROLE_ICON[r.id];
          return (
            <div key={r.id} className="surface flex gap-3 p-4">
              <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", ROLE_STYLE[r.id])}>
                <Icon className="size-4" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">{r.label}</p>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="surface flex flex-col gap-3 p-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 pl-11"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full lg:w-56 h-11! rounded-xl bg-white text-sm text-ink">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os perfis</SelectItem>
            {USER_ROLES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="surface overflow-hidden">
        {isLoading && users.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Carregando usuários...</p>
        ) : users.length === 0 ? (
          <p className="p-6 text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
        ) : (
          <ul className="divide-y divide-border">
            {users.map((u) => {
              const isMe = u.id === session?.user?.id;
              return (
                <li key={u.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-ink">
                      {u.name || "Sem nome"} {isMe && <span className="text-xs font-semibold text-muted-foreground">(você)</span>}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Desde {format(new Date(u.createdAt), "dd/MM/yyyy")}
                      {u.role === "recruiter"
                        ? ` · ${u._count.createdVacancies} vaga(s) cadastrada(s)`
                        : ` · ${u._count.study} estudo(s)${u.areasOfInterest.length ? ` · ${u.areasOfInterest.join(", ")}` : ""}`}
                    </p>
                  </div>

                  <span className={cn("w-fit rounded-full px-2.5 py-1 text-[11px] font-bold", ROLE_STYLE[u.role] ?? ROLE_STYLE.user)}>
                    {getRoleLabel(u.role)}
                  </span>

                  <Select
                    value={u.role}
                    onValueChange={(value) => value !== u.role && handleRole(u.id, value)}
                    disabled={saving === u.id || isMe}
                  >
                    <SelectTrigger className="w-full sm:w-44 h-10! rounded-xl bg-white text-sm text-ink">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {USER_ROLES.map((r) => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
