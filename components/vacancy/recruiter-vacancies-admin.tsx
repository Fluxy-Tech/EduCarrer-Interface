"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Loader2, Trash2, UserSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ToastPersonalizado } from "@/components/toast";
import { deleteVacancyAdmin, useRecruiterVacanciesAdmin } from "@/app/services/recruiter.swr";
import { cn } from "@/lib/utils";

// Vagas cadastradas por recrutadores, com exclusão pelo admin
export function RecruiterVacanciesAdmin() {
    const { vacancies, isLoading } = useRecruiterVacanciesAdmin();
    const [deleting, setDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        try {
            setDeleting(id);
            const res = await deleteVacancyAdmin(id);
            ToastPersonalizado({ mensagem: res.message });
        } catch (e) {
            console.error(e);
            ToastPersonalizado({ mensagem: "Não conseguimos excluir a vaga agora." });
        } finally {
            setDeleting(null);
        }
    };

    return (
        <section className="surface overflow-hidden">
            <div className="flex items-start gap-3 border-b border-border p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-gold-soft text-gold">
                    <UserSearch className="size-4" />
                </span>
                <div>
                    <h2 className="text-base font-bold text-ink">Vagas de recrutadores</h2>
                    <p className="text-xs text-muted-foreground">Vagas cadastradas pelos recrutadores das empresas. Você pode excluí-las.</p>
                </div>
                <span className="ml-auto rounded-full bg-sky px-3 py-1 text-xs font-bold text-ink tabular-nums">{vacancies.length}</span>
            </div>

            {isLoading ? (
                <p className="p-5 text-sm text-muted-foreground">Carregando...</p>
            ) : vacancies.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">Nenhuma vaga cadastrada por recrutadores ainda.</p>
            ) : (
                <ul className="divide-y divide-border">
                    {vacancies.map((v) => (
                        <li key={v.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-ink">
                                    {v.title} <span className="font-semibold text-muted-foreground">· {v.company}</span>
                                </p>
                                <p className="truncate text-xs text-muted-foreground">
                                    Por {v.createdBy?.name || v.createdBy?.email} em {format(new Date(v.createdAt), "dd/MM/yyyy")} · {v._count.study} estudo(s)
                                </p>
                            </div>
                            <span className={cn(
                                "w-fit rounded-full px-2.5 py-1 text-[11px] font-bold",
                                v.active ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
                            )}>
                                {v.active ? "Ativa" : "Inativa"}
                            </span>

                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="destructive" size="sm" disabled={deleting === v.id}>
                                        {deleting === v.id ? <Loader2 className="animate-spin" /> : <Trash2 />} Excluir
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Excluir a vaga “{v.title}”?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            A vaga deixa de aparecer para todos os usuários.
                                            {v._count.study > 0
                                                ? ` Os ${v._count.study} estudo(s) que usuários geraram para ela também serão excluídos.`
                                                : ""}{" "}
                                            Essa ação não pode ser desfeita.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleDelete(v.id)}>Excluir vaga</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    );
}
