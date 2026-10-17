import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Trash2, SquarePen, CalendarDays } from "lucide-react";
import { useState } from "react";
import { ToastPersonalizado } from "@/components/toast";
import { DialogExperienceUpdate } from "@/components/dialog/dialog-experience.update";
import { deleteExperience, Experience, useExperiences } from "@/app/services/experiences.swr";
import TooltipPerso from "@/components/tooltip";

interface DialogSkillProps {
    experience: Experience
}

export default function CadsExperience({ experience }: DialogSkillProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [openUpdate, setOpenUpdate] = useState(false);
    const { refresh } = useExperiences();

    const handleDelete = async () => {
        try {
            setIsLoading(true)
            const result = await deleteExperience(experience.id);
            ToastPersonalizado({ mensagem: result.message || "Experiência deletada com sucesso!" });
        } catch (error: any) {
            console.error(error);
            ToastPersonalizado({ mensagem: "Erro ao deletar experiência tente novamente." });
        } finally {
            await refresh()
            setIsLoading(false);
        }
    }

    return (
        <div className="group grid gap-4 p-5 sm:px-6 transition-colors hover:bg-sky/60 lg:grid-cols-[minmax(220px,300px)_minmax(0,1fr)_auto] lg:items-center">

            {/* Empresa, cargo e período */}
            <div className="flex items-start gap-4 min-w-0">
                <span className="grid place-items-center size-12 shrink-0 rounded-2xl bg-gradient-to-br from-brand to-ink-3 text-lg font-bold text-white">
                    {experience.name?.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className="truncate font-bold text-ink">{experience.name}</h3>
                        {experience.currentJob && (
                            <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success">
                                Atual
                            </span>
                        )}
                    </div>
                    <p className="text-sm font-semibold text-brand">{experience.seniority}</p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                        <CalendarDays className="size-3.5" />
                        {formatPeriod(experience.startDate, experience.endDate, experience.currentJob)}
                    </p>
                </div>
            </div>

            {/* Descrição */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                className="cursor-pointer text-left text-sm leading-relaxed text-muted-foreground hover:text-brand transition-colors"
            >
                <span className="line-clamp-2">{experience.about || "Sem informações"}</span>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-xl">
                    <div>
                        <p className="eyebrow text-brand">{experience.seniority}</p>
                        <DialogTitle className="mt-1 font-display text-3xl font-normal text-ink">{experience.name}</DialogTitle>
                        <DialogDescription className="sr-only">Descrição completa da experiência</DialogDescription>
                    </div>
                    <p className="max-h-[60vh] overflow-y-auto pr-2 text-sm leading-relaxed text-ink/80">
                        {experience.about}
                    </p>
                </DialogContent>
            </Dialog>

            {/* Ações */}
            <div className="flex gap-2">
                <TooltipPerso message="Editar experiência">
                    <Button className="flex-1 w-auto px-3 lg:flex-none lg:w-10 lg:px-0" variant="outline" size="icon" onClick={() => setOpenUpdate(true)}>
                        <SquarePen />
                        <span className="lg:hidden">Editar</span>
                    </Button>
                </TooltipPerso>
                <TooltipPerso message="Excluir experiência">
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

            <DialogExperienceUpdate
                experience={experience}
                open={openUpdate}
                onOpenChange={setOpenUpdate}
            />
        </div>
    )
}

// Formata período: "Mês/Ano - Mês/Ano" ou "Mês/Ano - Presente"
function formatPeriod(startDate?: Date | null, endDate?: Date | null, currentJob?: boolean): string {
    const formatMonthYear = (date: Date) => {
        const meses = [
            "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
            "Jul", "Ago", "Set", "Out", "Nov", "Dez"
        ];
        const d = new Date(date);
        return `${meses[d.getMonth()]} ${d.getFullYear()}`;
    };

    if (!startDate) return "Data não informada";

    const start = formatMonthYear(startDate);

    if (currentJob) return `${start} - Presente`;

    if (!endDate) return start;

    return `${start} - ${formatMonthYear(endDate)}`;
}
