"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Search, Briefcase, MapPin, Link2, Code2, AlertCircle, Loader2, Rocket } from "lucide-react";
import { ToastPersonalizado } from "@/components/toast";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { updateVacancy, useVacancysAdmin } from "@/app/services/vacancys.swr";
import skillsTI from "@/components/dialog/skills.json";

const vacancySchema = z.object({
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

type VacancyFormData = z.infer<typeof vacancySchema>;

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
}

interface DialogVacancyUpdateProps {
    vacancy: Vacancy;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

const Field = ({
    label,
    error,
    children,
}: {
    label?: string;
    error?: string;
    children: React.ReactNode;
}) => (
    <div className="flex flex-col gap-1.5 w-full">
        {label && <Label className="text-xs font-semibold text-zinc-600!">{label}</Label>}
        {children}
        {error && (
            <span className="text-danger! text-[11px] flex items-center gap-1 mt-0.5">
                <AlertCircle size={12} /> {error}
            </span>
        )}
    </div>
);

const SectionLabel = ({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="flex items-center gap-2 mb-3 pb-1 border-b border-zinc-100!">
        <span className="text-zinc-500!">{icon}</span>
        <span className="text-[11px] font-bold text-zinc-500! uppercase tracking-wider">{children}</span>
    </div>
);

export function DialogVacancyUpdate({
    vacancy,
    open,
    onOpenChange,
}: DialogVacancyUpdateProps) {
    const { refresh } = useVacancysAdmin();
    const [techSearch, setTechSearch] = useState("");

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<VacancyFormData>({
        resolver: zodResolver(vacancySchema),
    });

    useEffect(() => {
        if (vacancy) {
            reset({
                title: vacancy.title,
                description: vacancy.description,
                company: vacancy.company,
                modality: vacancy.modality,
                level: vacancy.level,
                technologies: vacancy.technologies ?? [],
                link: vacancy.link ?? "",
                origin: vacancy.origin ?? "",
                location: vacancy.location ?? "",
                salary: vacancy.salary ?? null,
                active: vacancy.active ?? true,
            });
        }
    }, [vacancy, reset]);

    const selectedTechs = watch("technologies") ?? [];

    const toggleTech = (tech: string) => {
        const updated = selectedTechs.includes(tech)
            ? selectedTechs.filter((t) => t !== tech)
            : [...selectedTechs, tech];
        setValue("technologies", updated, { shouldValidate: true });
    };

    const filteredGroups = Object.entries(skillsTI as Record<string, string[]>)
        .map(([group, skills]) => [
            group,
            skills.filter((nameSkill) =>
                nameSkill.toLowerCase().includes(techSearch.trim().toLowerCase())
            ),
        ] as [string, string[]])
        .filter(([, skills]) => skills.length > 0);

    const onSubmit = async (data: VacancyFormData) => {
        try {
            const res = await updateVacancy(vacancy.id, data);
            ToastPersonalizado({ mensagem: res.message });
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            ToastPersonalizado({ mensagem: "Erro ao atualizar vaga. Tente novamente." });
        } finally {
            await refresh();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {/* REMOVIDO o overflow daqui para evitar o espaço em branco no fim da modal */}
            <DialogContent className="max-w-2xl h-[90vh] flex flex-col p-0 overflow-hidden bg-white!">

                {/* Header Fixo */}
                <DialogHeader className="px-6 py-4 border-b border-zinc-100! shrink-0">
                    <DialogTitle className="text-zinc-900! text-lg font-semibold">
                        Atualizar Vaga
                    </DialogTitle>
                    <DialogDescription className="text-zinc-500! text-xs mt-0.5">
                        Gerencie e edite as informações detalhadas desta oportunidade.
                    </DialogDescription>
                </DialogHeader>

                {/* Form com scroll interno apenas na área de campos */}
                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">

                    <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-6">

                        {/* Seção: Informações da vaga */}
                        <div>
                            <SectionLabel icon={<Briefcase size={14} />}>
                                Informações da Vaga
                            </SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2 sm:col-span-1">
                                    <Field label="Título da Vaga" error={errors.title?.message}>
                                        <Input className="h-9 placeholder:text-zinc-400 text-zinc-900! bg-zinc-50! border-zinc-200! focus:border-zinc-400! text-sm" placeholder="Ex: Desenvolvedor Fullstack" {...register("title")} />
                                    </Field>
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <Field label="Empresa" error={errors.company?.message}>
                                        <Input className="h-9 placeholder:text-zinc-400 text-zinc-900! bg-zinc-50! border-zinc-200! focus:border-zinc-400! text-sm" placeholder="Nome da empresa" {...register("company")} />
                                    </Field>
                                </div>
                                <div className="col-span-2">
                                    <Field label="Descrição das Responsabilidades" error={errors.description?.message}>
                                        <Textarea
                                            placeholder="Descreva detalhadamente os requisitos, ferramentas e responsabilidades do cargo..."
                                            className="min-h-[100px] max-h-[160px] bg-zinc-50! text-zinc-900! border-zinc-200! placeholder:text-zinc-400 p-3 text-sm rounded-md"
                                            {...register("description")}
                                        />
                                    </Field>
                                </div>
                            </div>
                        </div>

                        {/* Seção: Localização e contrato */}
                        <div>
                            <SectionLabel icon={<MapPin size={14} />}>
                                Localização e Contrato
                            </SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Modalidade" error={errors.modality?.message}>
                                    <Controller
                                        control={control}
                                        name="modality"
                                        render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                <SelectTrigger className="h-9 border-zinc-200! bg-zinc-50! text-zinc-900! text-sm">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Remoto">Remoto</SelectItem>
                                                    <SelectItem value="Híbrido">Híbrido</SelectItem>
                                                    <SelectItem value="Presencial">Presencial</SelectItem>
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
                                            <Select onValueChange={field.onChange} value={field.value ?? ""}>
                                                <SelectTrigger className="h-9 border-zinc-200! bg-zinc-50! text-zinc-900! text-sm">
                                                    <SelectValue placeholder="Selecione" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Estágio">Estágio</SelectItem>
                                                    <SelectItem value="Junior">Junior</SelectItem>
                                                    <SelectItem value="Pleno">Pleno</SelectItem>
                                                    <SelectItem value="Sênior">Sênior</SelectItem>
                                                    <SelectItem value="Especialista">Especialista</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                    />
                                </Field>
                                <Field label="Localização" error={errors.location?.message}>
                                    <Input className="h-9 bg-zinc-50! text-zinc-900! border-zinc-200! placeholder:text-zinc-400 text-sm" placeholder="Ex: Uberlândia, MG" {...register("location")} />
                                </Field>
                                <Field label="Salário Proposto (Opcional)" error={errors.salary?.message}>
                                    <Input className="h-9 bg-zinc-50! text-zinc-900! border-zinc-200! placeholder:text-zinc-400 text-sm" placeholder="Ex: R$ 5.000,00" {...register("salary")} />
                                </Field>
                            </div>
                        </div>

                        {/* Seção: Origem e link */}
                        <div>
                            <SectionLabel icon={<Link2 size={14} />}>
                                Origem e Links de Candidatura
                            </SectionLabel>
                            <div className="grid grid-cols-2 gap-4">
                                <Field label="Link de Inscrição" error={errors.link?.message}>
                                    <Input className="h-9 bg-zinc-50! text-blue-600! border-zinc-200! placeholder:text-zinc-400 text-sm font-medium" placeholder="https://exemplo.com/vaga" {...register("link")} />
                                </Field>
                                <Field label="Canal de Origem" error={errors.origin?.message}>
                                    <Input className="h-9 bg-zinc-50! text-zinc-900! border-zinc-200! placeholder:text-zinc-400 text-sm" placeholder="Ex: LinkedIn, Gupy, Interno" {...register("origin")} />
                                </Field>
                            </div>
                        </div>

                        {/* Seção: Tecnologias */}
                        <div>
                            <SectionLabel icon={<Code2 size={14} />}>
                                Stack Tecnológica Requisitada
                            </SectionLabel>

                            {errors.technologies?.message && (
                                <p className="text-danger! text-xs mb-2 flex items-center gap-1">
                                    <AlertCircle size={12} /> {errors.technologies.message}
                                </p>
                            )}

                            {selectedTechs.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-zinc-50! border border-dashed border-zinc-200! rounded-lg">
                                    {selectedTechs.map((t) => (
                                        <span
                                            key={t}
                                            onClick={() => toggleTech(t)}
                                            className="cursor-pointer text-xs bg-amber-50! border border-amber-200! text-amber-800! font-medium px-2.5 py-0.5 rounded-full hover:bg-amber-100! transition-colors flex items-center gap-1.5 dynamics-tags"
                                        >
                                            {t}
                                            <span className="text-amber-500! font-bold text-[11px] leading-none">×</span>
                                        </span>
                                    ))}
                                </div>
                            )}

                            <div className="border border-zinc-200! rounded-lg overflow-hidden shadow-sm">
                                <div className="flex items-center gap-2 px-3 py-2 border-b border-zinc-100! bg-zinc-50!">
                                    <Search size={14} className="text-zinc-400!" />
                                    <input
                                        type="text"
                                        placeholder="Pesquise linguagens, frameworks ou ferramentas..."
                                        value={techSearch}
                                        onChange={(e) => setTechSearch(e.target.value)}
                                        className="w-full text-sm outline-none bg-transparent text-zinc-900! placeholder:text-zinc-400"
                                    />
                                </div>
                                <div className="max-h-100 overflow-y-auto grid grid-cols-2 gap-x-2 p-2 bg-white!">
                                    {filteredGroups.map(([group, items]) => (
                                        <span key={group} className="col-span-2 sm:col-span-1">
                                            <Label className="text-gray-400 my-2">{group}</Label>
                                            {
                                                items.map((v) => (
                                                    <label
                                                        key={v}
                                                        className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-zinc-50! transition-colors select-none"
                                                    >
                                                        <Checkbox
                                                            checked={selectedTechs?.includes(v) ?? false}
                                                            onCheckedChange={() => toggleTech(v)}
                                                            className="shrink-0 bg-white! border-zinc-300! data-[state=checked]:bg-blue-600! data-[state=checked]:border-blue-600! focus:ring-0 h-4 w-4 rounded"
                                                        />
                                                        <span className="text-xs text-zinc-700! font-medium">{v}</span>
                                                    </label>
                                                ))
                                            }
                                        </span>
                                    ))}
                                    {filteredGroups.length === 0 && (
                                        <p className="col-span-2 text-center text-xs text-zinc-400! py-4">
                                            Nenhuma tecnologia encontrada.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Vaga ativa */}
                        <div className="flex items-center gap-2.5 pt-1 pb-2">
                            <Controller
                                control={control}
                                name="active"
                                render={({ field }) => (
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        id="active"
                                        className="shrink-0 bg-white! border-zinc-300! data-[state=checked]:bg-brand! data-[state=checked]:border-brand! focus:ring-0 h-4 w-4 rounded"
                                    />
                                )}
                            />
                            <div className="grid gap-0.5 leading-none">
                                <Label htmlFor="active" className="text-sm font-medium text-zinc-800! cursor-pointer">
                                    Vaga ativa e visível para candidatos
                                </Label>
                            </div>
                        </div>

                    </div>

                    {/* Footer Fixo e colado no fundo correto */}
                    <div className="w-full flex justify-end! items-center px-6 py-3.5 border-t border-zinc-100! bg-zinc-50! shrink-0">
                        <Button type="submit" variant="create" disabled={isSubmitting} className="h-9 px-4 text-sm font-medium flex items-center gap-2">
                            {isSubmitting ?
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" /> Atualizando...
                                </span> :
                                <span className="flex items-center justify-center gap-2">
                                    <Rocket /> Atualizar
                                </span>
                            }
                        </Button>
                    </div>
                </form>

            </DialogContent>
        </Dialog>
    );
}