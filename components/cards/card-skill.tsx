import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2, SquarePen, CalendarClock } from "lucide-react";
import { DialogSkillUpdate } from "@/components/dialog/dialog-skill.update";
import { useState } from "react";
import { ToastPersonalizado } from "@/components/toast";
import { Skill, deleteSkill, useSkills } from "@/app/services/skills.swr"
import TooltipPerso from "@/components/tooltip";
import { cn } from "@/lib/utils";

interface DialogSkillProps {
    skill: Skill
}

export default function CadsSkill({ skill }: DialogSkillProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const { refresh } = useSkills();

    const handleDelete = async () => {
        try {
            setIsLoading(true)
            const result = await deleteSkill(skill.id);
            ToastPersonalizado({ mensagem: result.message || "Habilidade deletada com sucesso!" });
        } catch (error: any) {
            console.error(error);
            ToastPersonalizado({ mensagem: "Erro ao deletar habilidade tente novamente." });
        } finally {
            await refresh();
            setIsLoading(false);
        }
    }

    return (
        <div className="group grid gap-4 p-5 sm:px-6 transition-colors hover:bg-sky/60 lg:grid-cols-[minmax(160px,220px)_170px_minmax(0,1fr)_auto] lg:items-center">

            {/* Nome da tecnologia */}
            <div className="flex items-center gap-3 min-w-0">
                <span className="grid place-items-center size-10 shrink-0 rounded-xl bg-ink text-sm font-bold text-white">
                    {skill.name.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                    <span className="block truncate font-bold text-ink">{skill.name}</span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <CalendarClock className="size-3" />
                        {skill.updatedAt ? formatDateTime(skill.updatedAt) : "Sem data"}
                    </span>
                </span>
            </div>

            {/* Nível */}
            <div>
                <div className="flex items-center justify-between text-xs">
                    <span className={cn("font-bold", getLevelColor(skill.level))}>{getLevelAvaliation(skill.level)}</span>
                    <span className="font-semibold text-muted-foreground tabular-nums">{skill.level}/10</span>
                </div>
                <div className="mt-1.5 grid grid-cols-10 gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <span key={i} className={cn("h-1.5 rounded-full", i < skill.level ? (skill.level >= 9 ? "bg-gold" : "bg-brand") : "bg-muted")} />
                    ))}
                </div>
            </div>

            {/* Descrição */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="cursor-pointer text-left text-sm leading-relaxed text-muted-foreground hover:text-brand transition-colors"
            >
                <span className="line-clamp-2">{skill.about || "Sem informações"}</span>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl">
                    <div>
                        <p className="eyebrow text-brand">Descrição da habilidade</p>
                        <DialogTitle className="mt-1 font-display text-3xl font-normal text-ink">{skill.name}</DialogTitle>
                        <DialogDescription className="sr-only">Descrição completa da habilidade</DialogDescription>
                    </div>
                    <p className="max-h-[60vh] overflow-y-auto pr-2 text-sm leading-relaxed text-ink/80">
                        {skill.about}
                    </p>
                </DialogContent>
            </Dialog>

            <div className="flex gap-2">
                <TooltipPerso message="Editar habilidade">
                    <Button className="flex-1 w-auto px-3 lg:flex-none lg:w-10 lg:px-0" variant="outline" size="icon" onClick={() => setOpenUpdate(true)}>
                        <SquarePen />
                        <span className="lg:hidden">Editar</span>
                    </Button>
                </TooltipPerso>
                <TooltipPerso message="Excluir habilidade">
                    <Button
                        className="flex-1 w-auto px-3 lg:flex-none lg:w-10 lg:px-0"
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete()}
                        disabled={isLoading}
                    >
                        {isLoading ? <Loader2 className="animate-spin" /> : <Trash2 />}
                        <span className="lg:hidden">Excluir</span>
                    </Button>
                </TooltipPerso>
            </div>

            <DialogSkillUpdate
                skill={skill}
                open={openUpdate}
                onOpenChange={setOpenUpdate}
            />
        </div>
    )
}

// Formata data: dd/MM/yyyy
function formatDateTime(date: null | Date): string {

    if (!date) return "Sem data"

    const d = new Date(date);

    if (isNaN(d.getTime())) return "Data inválida";

    return d.toLocaleDateString("pt-BR");
}

function getLevelColor(level: number): string {
    if (level >= 9) return "text-gold";
    if (level >= 7) return "text-brand";
    if (level >= 4) return "text-ink-3";
    return "text-muted-foreground";
}

function getLevelAvaliation(level: number): string {
    const map: Record<string, string> = {
        1: "Iniciante",
        2: "Iniciante",
        3: "Iniciante",
        4: "Intermediário",
        5: "Intermediário",
        6: "Intermediário",
        7: "Profissional",
        8: "Profissional",
        9: "Especialista",
        10: "Especialista",
        "default": "Não identificado"
    };
    return map[level] || map["default"];
}
