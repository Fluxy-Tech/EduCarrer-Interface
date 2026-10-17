import { createStudy } from "@/app/services/study.swr";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogTitle,
} from "@/components/ui/dialog";

import { Building2, MapPin, HandCoins, Blocks, Rocket, LoaderCircle, ArrowUpRight, Clock3 } from "lucide-react";

import { useState } from "react";

import TooltipPerso from "@/components/tooltip";

import Loading from "@/components/loading";

import { ToastPersonalizado } from "@/components/toast";
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
export default function CadsVacancy({ vacancy }: DialogVagasProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    async function handleCreateStudy(id: string) {
        try {
            setIsLoading(true);
            const res = await createStudy(id);
            ToastPersonalizado({ mensagem: res.message });
        } catch (e) {
            ToastPersonalizado({ mensagem: "Ocorreu um erro durante a criação do seu estudo, tente novamente mais tarde." });
        } finally {
            setIsLoading(false);
        }
    }

    const descriptionParts = (vacancy.description ?? "").split("[QB]");
    const label = getVacancyLabel(vacancy.createdAt);

    const details = [
        { icon: Building2, value: vacancy.company },
        { icon: MapPin, value: vacancy.location },
        { icon: HandCoins, value: vacancy.salary },
        { icon: Blocks, value: vacancy.level },
    ];

    return (
        <article className="group surface p-5 sm:p-6 transition-all duration-300 hover:border-brand/30 hover:shadow-lift">
            <Loading loading={isLoading} message="Aguarde um momento, estamos criando seu estudo..." />

            <div className="flex gap-4">
                <span className="hidden sm:grid place-items-center size-12 shrink-0 rounded-xl bg-ink text-lg font-bold text-white">
                    {(vacancy.company ?? "?").trim().slice(0, 1).toUpperCase()}
                </span>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <h3 className="text-lg font-bold leading-snug text-ink break-words">{vacancy.title}</h3>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className={cn("rounded-full border px-2.5 py-0.5 text-xs font-bold", getModalityColor(vacancy.modality))}>
                                    {vacancy.modality}
                                </span>
                                <span className={cn(
                                    "rounded-full px-2.5 py-0.5 text-xs font-bold capitalize",
                                    label == "Novo" ? "bg-gold-soft text-gold" : "bg-muted text-muted-foreground"
                                )}>
                                    {label}
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
                                <span
                                    key={tech}
                                    className="rounded-lg border border-border bg-sky px-2.5 py-1 text-xs font-semibold text-ink"
                                >
                                    {tech}
                                </span>
                            ))}
                        </div>

                        <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
                            <TooltipPerso message="Gera uma trilha de estudos com níveis para esta vaga">
                                <Button
                                    onClick={() => handleCreateStudy(vacancy.id)}
                                    variant="outline"
                                    disabled={isLoading}
                                    className="w-full sm:w-auto"
                                >
                                    {isLoading ? <LoaderCircle className="animate-spin" /> : <Rocket className="text-gold" />}
                                    {isLoading ? "Criando..." : "Criar estudo"}
                                </Button>
                            </TooltipPerso>

                            <a target="_blank" href={vacancy.link} className="w-full sm:w-auto">
                                <Button variant="create" className="w-full sm:w-auto">
                                    Ver vaga <ArrowUpRight />
                                </Button>
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </article>
    )
}

function getModalityColor(modality: string): string {
    const map: Record<string, string> = {
        "Presencial": "bg-success-soft text-success border-success/20",
        "Híbrido": "bg-gold-soft text-gold border-gold/25",
        "Remoto": "bg-brand-soft text-brand border-brand/20",

        // Default
        "default": "bg-muted text-muted-foreground border-border"
    };

    return map[modality] || map["default"];
}


export function getTimeAgo(createdAt: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - new Date(createdAt).getTime();

    const minutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (minutes < 1) {
        return "Agora";
    }

    if (minutes < 60) {
        return `${minutes} min atrás`;
    }

    if (hours < 24) {
        return `${hours}h atrás`;
    }

    return `${days} ${days == 1 ? "dia" : "dias"} atrás`;
}

export function getVacancyLabel(createdAt: Date): string {
    const now = new Date();
    const created = new Date(createdAt);

    const diffMs = now.getTime() - created.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Menos de 24 horas
    if (diffDays < 1) {
        return "Novo";
    }

    // Menos de 7 dias
    if (diffDays < 7) {
        return "Desta semana";
    }

    // Mais de 7 dias -> retorna o mês
    return created.toLocaleDateString("pt-BR", {
        month: "long",
    });
}
