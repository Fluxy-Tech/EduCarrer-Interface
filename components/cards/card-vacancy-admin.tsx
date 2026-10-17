import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

import { Building2, MapPin, HandCoins, Blocks, PenBox, Clock3 } from "lucide-react";

import { useState } from "react";

import { DialogVacancyUpdate } from "@/components/dialog/dialog-vacancy.update";
import { getTimeAgo, getVacancyLabel } from "@/components/cards/card-vacancy";
import { cn } from "@/lib/utils";

export interface Vacancy {
    id: string;
    title: string;
    description: string;
    company: string;
    modality: string;
    level: string;
    technologies: string[];
    link: string;
    origin: string;
    location: string;
    salary: string | null;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface DialogVagasProps {
    vacancy: Vacancy
}
export default function CadsVacancyAdmin({ vacancy }: DialogVagasProps) {
    const [open, setOpen] = useState(false);
    const [openEdit, setOpenEdit] = useState(false);

    const descriptionParts = (vacancy.description ?? "").split("[QB]");

    const details = [
        { icon: Building2, value: vacancy.company },
        { icon: MapPin, value: vacancy.location },
        { icon: HandCoins, value: vacancy.salary },
        { icon: Blocks, value: vacancy.level },
    ];

    return (
        <article className="surface p-5 sm:p-6 transition-colors hover:border-brand/30">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <h3 className="text-lg font-bold leading-snug text-ink break-words">{vacancy.title}</h3>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold", getModalityColor(vacancy.modality))}>
                            {vacancy.modality}
                        </span>
                        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-bold capitalize text-muted-foreground">
                            {getVacancyLabel(vacancy.createdAt)}
                        </span>
                        <span className={cn(
                            "rounded-full px-2.5 py-0.5 text-xs font-bold",
                            vacancy.active ? "bg-success-soft text-success" : "bg-danger-soft text-danger"
                        )}>
                            {vacancy.active ? "Ativa" : "Inativa"}
                        </span>
                    </div>
                </div>
                <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock3 className="size-3.5" />
                    {getTimeAgo(vacancy.createdAt)}
                </span>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                {details.map((d, i) => (
                    <div key={i} className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                        <d.icon className="size-4 shrink-0 text-brand/70" strokeWidth={1.8} />
                        <span className="truncate">{d.value || "Não identificado"}</span>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={() => setOpen(true)}
                className="cursor-pointer mt-4 block text-left text-sm leading-relaxed text-ink/70 hover:text-brand transition-colors"
            >
                <span className="line-clamp-2">{descriptionParts[0]}</span>
                <span className="mt-1 inline-block font-semibold text-brand">Ler descrição completa</span>
            </button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
                    <div>
                        <p className="eyebrow text-brand">{vacancy.company}</p>
                        <DialogTitle className="mt-1 font-display text-3xl font-normal text-ink">{vacancy.title}</DialogTitle>
                        <DialogDescription className="sr-only">Descrição completa da vaga</DialogDescription>
                    </div>
                    <div className="overflow-y-auto pr-2 text-sm leading-relaxed text-ink/80 space-y-3">
                        {descriptionParts.map((parte, index) => (
                            <p key={index}>{parte}</p>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

            <div className="mt-5 flex flex-col gap-4 border-t border-border pt-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-wrap gap-1.5">
                    {vacancy.technologies.map((tech) => (
                        <span key={tech} className="rounded-lg border border-border bg-sky px-2.5 py-1 text-xs font-semibold text-ink">
                            {tech}
                        </span>
                    ))}
                </div>

                <DialogVacancyUpdate vacancy={vacancy} open={openEdit} onOpenChange={setOpenEdit} />

                <Button
                    variant="create"
                    className="w-full sm:w-auto shrink-0"
                    onClick={() => setOpenEdit(true)}
                >
                    <PenBox /> Editar vaga
                </Button>
            </div>
        </article>
    )
}

function getModalityColor(modality: string): string {
    const map: Record<string, string> = {
        "Presencial": "bg-success-soft text-success border-success/20",
        "Híbrido": "bg-gold-soft text-gold border-gold/25",
        "Remoto": "bg-brand-soft text-brand border-brand/20",
        "default": "bg-muted text-muted-foreground border-border"
    };

    return map[modality] || map["default"];
}
