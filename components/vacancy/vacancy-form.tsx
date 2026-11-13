"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AlertCircle, Briefcase, Code2, Link2, Loader2, MapPin, Save, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import skillsTI from "@/components/dialog/skills.json";
import { cn } from "@/lib/utils";

export const vacancySchema = z.object({
    title: z.string().min(2, "Título deve ter pelo menos 2 caracteres"),
    description: z.string().min(10, "Descrição deve ter pelo menos 10 caracteres"),
    company: z.string().min(2, "Empresa deve ter pelo menos 2 caracteres"),
    modality: z.string().min(1, "Selecione uma modalidade"),
    level: z.string().min(1, "Selecione um nível"),
    technologies: z.array(z.string()).min(1, "Selecione pelo menos uma tecnologia"),
    link: z.string("Insira uma URL válida").or(z.literal("")),
    origin: z.string().min(1, "Origem é obrigatória"),
    location: z.string().min(2, "Localização deve ter pelo menos 2 caracteres"),
    salary: z.string().nullable(),
    active: z.boolean(),
});

export type VacancyFormData = z.infer<typeof vacancySchema>;

export const EMPTY_VACANCY: VacancyFormData = {
    title: "",
    description: "",
    company: "",
    modality: "",
    level: "",
    technologies: [],
    link: "",
    origin: "",
    location: "",
    salary: null,
    active: true,
};

const MODALITIES = ["Remoto", "Híbrido", "Presencial"];
const LEVELS = ["Estágio", "Junior", "Pleno", "Sênior", "Especialista"];

// Componentes fora do formulário para os inputs não perderem o foco a cada renderização
function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="flex w-full flex-col gap-1.5">
            <Label className="text-xs font-semibold text-ink/70">{label}</Label>
            {children}
            {hint && !error && <span className="text-[11px] text-muted-foreground">{hint}</span>}
            {error && (
                <span className="mt-0.5 flex items-center gap-1 text-[11px] text-danger">
                    <AlertCircle size={12} /> {error}
                </span>
            )}
        </div>
    );
}

function Section({ icon: Icon, title, description, children }: { icon: typeof Briefcase; title: string; description: string; children: React.ReactNode }) {
    return (
        <section className="surface p-5 sm:p-6">
            <div className="mb-5 flex items-start gap-3">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-4" />
                </span>
                <div>
                    <h2 className="text-base font-bold text-ink">{title}</h2>
                    <p className="text-xs text-muted-foreground">{description}</p>
                </div>
            </div>
            {children}
        </section>
    );
}

interface VacancyFormProps {
    defaultValues: VacancyFormData;
    submitLabel: string;
    submittingLabel: string;
    onSubmit: (data: VacancyFormData) => Promise<void>;
    // Para onde o botão Cancelar leva (admin ou recrutador)
    backHref?: string;
}

// Formulário de vaga usado nas telas de criação e de edição do admin
export function VacancyForm({ defaultValues, submitLabel, submittingLabel, onSubmit, backHref = "/admin/vagas" }: VacancyFormProps) {
    const [techSearch, setTechSearch] = useState("");

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<VacancyFormData>({
        resolver: zodResolver(vacancySchema),
        defaultValues,
        mode: "onSubmit",
        reValidateMode: "onChange",
    });

    const selectedTechs = watch("technologies") ?? [];
    const active = watch("active");

    const toggleTech = (tech: string) => {
        const updated = selectedTechs.includes(tech)
            ? selectedTechs.filter((t) => t !== tech)
            : [...selectedTechs, tech];
        setValue("technologies", updated, { shouldValidate: true, shouldDirty: true });
    };

    const filteredGroups = Object.entries(skillsTI as Record<string, string[]>)
        .map(([group, skills]) => [
            group,
            skills.filter((name) => name.toLowerCase().includes(techSearch.trim().toLowerCase())),
        ] as [string, string[]])
        .filter(([, skills]) => skills.length > 0);

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6 pb-24">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px] xl:items-start">
                <div className="flex min-w-0 flex-col gap-6">
                    <Section icon={Briefcase} title="Informações da vaga" description="Título, empresa e o que a pessoa vai fazer.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Título da vaga" error={errors.title?.message}>
                                <Input className="h-11" placeholder="Ex: Desenvolvedor(a) Backend" {...register("title")} />
                            </Field>
                            <Field label="Empresa" error={errors.company?.message}>
                                <Input className="h-11" placeholder="Nome da empresa" {...register("company")} />
                            </Field>
                            <div className="sm:col-span-2">
                                <Field
                                    label="Descrição e requisitos"
                                    error={errors.description?.message}
                                    hint="Use [QB] para quebrar a descrição em parágrafos na tela da vaga."
                                >
                                    <Textarea
                                        className="min-h-56 p-3 text-sm"
                                        placeholder="Descreva as responsabilidades, requisitos e diferenciais da vaga..."
                                        {...register("description")}
                                    />
                                </Field>
                            </div>
                        </div>
                    </Section>

                    <Section icon={MapPin} title="Localização e contrato" description="Modalidade, nível, cidade e salário.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Modalidade" error={errors.modality?.message}>
                                <Controller
                                    control={control}
                                    name="modality"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-11! w-full rounded-xl bg-white text-sm text-ink">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MODALITIES.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </Field>
                            <Field label="Nível" error={errors.level?.message}>
                                <Controller
                                    control={control}
                                    name="level"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger className="h-11! w-full rounded-xl bg-white text-sm text-ink">
                                                <SelectValue placeholder="Selecione" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                            </Field>
                            <Field label="Localização" error={errors.location?.message}>
                                <Input className="h-11" placeholder="Ex: Uberlândia, MG" {...register("location")} />
                            </Field>
                            <Field label="Salário (opcional)" error={errors.salary?.message}>
                                <Input className="h-11" placeholder="Ex: R$ 4.500,00" {...register("salary")} />
                            </Field>
                        </div>
                    </Section>

                    <Section icon={Link2} title="Origem e candidatura" description="Onde a vaga foi publicada e o link para se candidatar.">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field label="Link de inscrição" error={errors.link?.message}>
                                <Input className="h-11" placeholder="https://exemplo.com/vaga" {...register("link")} />
                            </Field>
                            <Field label="Canal de origem" error={errors.origin?.message}>
                                <Input className="h-11" placeholder="Ex: Gupy, LinkedIn" {...register("origin")} />
                            </Field>
                        </div>
                    </Section>
                </div>

                <div className="flex flex-col gap-6 xl:sticky xl:top-28">
                    <section className="surface flex items-center justify-between gap-4 p-5">
                        <div>
                            <p className="text-sm font-bold text-ink">Vaga ativa</p>
                            <p className="text-xs text-muted-foreground">
                                {active ? "Visível e recomendada para os usuários." : "Oculta das recomendações."}
                            </p>
                        </div>
                        <Controller
                            control={control}
                            name="active"
                            render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
                        />
                    </section>

                    <Section icon={Code2} title="Stack tecnológica" description="Usada pela IA para recomendar a vaga e gerar os estudos.">
                        {errors.technologies?.message && (
                            <p className="mb-3 flex items-center gap-1 text-xs text-danger">
                                <AlertCircle size={12} /> {errors.technologies.message}
                            </p>
                        )}

                        {selectedTechs.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1.5">
                                {selectedTechs.map((t) => (
                                    <button
                                        type="button"
                                        key={t}
                                        onClick={() => toggleTech(t)}
                                        className="cursor-pointer flex items-center gap-1 rounded-full border border-brand/20 bg-brand-soft px-2.5 py-1 text-xs font-semibold text-brand transition-colors hover:bg-brand hover:text-white"
                                    >
                                        {t} <X className="size-3" />
                                    </button>
                                ))}
                            </div>
                        )}

                        <div className="overflow-hidden rounded-xl border border-input">
                            <div className="flex items-center gap-2 border-b border-border bg-sky px-3 py-2.5">
                                <Search className="size-4 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Pesquisar tecnologias..."
                                    value={techSearch}
                                    onChange={(e) => setTechSearch(e.target.value)}
                                    className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-muted-foreground"
                                />
                            </div>
                            <div className="max-h-96 overflow-y-auto p-2">
                                {filteredGroups.map(([group, items]) => (
                                    <div key={group} className="mb-2">
                                        <p className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{group}</p>
                                        <div className="flex flex-wrap gap-1.5 px-2">
                                            {items.map((tech) => {
                                                const selected = selectedTechs.includes(tech);
                                                return (
                                                    <button
                                                        type="button"
                                                        key={tech}
                                                        onClick={() => toggleTech(tech)}
                                                        className={cn(
                                                            "cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                                                            selected
                                                                ? "border-brand bg-brand text-white"
                                                                : "border-border bg-white text-ink/80 hover:border-brand/40"
                                                        )}
                                                    >
                                                        {tech}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                                {filteredGroups.length === 0 && (
                                    <p className="py-4 text-center text-xs text-muted-foreground">Nenhuma tecnologia encontrada.</p>
                                )}
                            </div>
                        </div>
                    </Section>
                </div>
            </div>

            {/* Barra de ações fixa no rodapé */}
            <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-white/90 backdrop-blur-xl md:left-(--sidebar-width)">
                <div className="mx-auto flex max-w-[1400px] items-center justify-end gap-3 px-4 py-3 sm:px-6 lg:px-10">
                    {isDirty && <span className="mr-auto hidden text-xs text-muted-foreground sm:inline">Alterações não salvas</span>}
                    <Button asChild variant="close" type="button">
                        <Link href={backHref}>Cancelar</Link>
                    </Button>
                    <Button type="submit" variant="create" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin" /> : <Save />}
                        {isSubmitting ? submittingLabel : submitLabel}
                    </Button>
                </div>
            </div>
        </form>
    );
}
