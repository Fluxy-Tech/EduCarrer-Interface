"use client";

import { useEffect } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "../ui/input";
import { Switch } from "@/components/ui/switch";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { Rocket, Loader2 } from "lucide-react";

import {
    updateExperience,
    useExperiences,
} from "@/app/services/experiences.swr";

import { ToastPersonalizado } from "@/components/toast";

type SkillFormData = {
    nome: string;
    senioridade: string;
    descricao: string;
    startDate?: string;
    endDate?: string;
    currentJob?: boolean;
};

interface DialogSkillUpdateProps {
    experience: Experience;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export interface Experience {
    id: string;
    name: string;
    seniority: string;
    about: string;
    startDate?: Date | null;
    endDate?: Date | null;
    currentJob?: boolean;
    userId: string;
}

const formatDateToInput = (date?: Date | null): string => {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
};

export function DialogExperienceUpdate({
    experience,
    open,
    onOpenChange,
}: DialogSkillUpdateProps) {
    const { refresh } = useExperiences();

    const {
        register,
        handleSubmit,
        control,
        setValue,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<SkillFormData>({
        defaultValues: {
            currentJob: false,
        },
    });

    const currentJob = useWatch({ control, name: "currentJob" });

    useEffect(() => {
        if (experience) {
            reset({
                nome: experience.name,
                senioridade: experience.seniority,
                descricao: experience.about ?? "",
                startDate: formatDateToInput(experience.startDate),
                endDate: formatDateToInput(experience.endDate),
                currentJob: experience.currentJob ?? false,
            });
        }
    }, [experience, reset]);

    const onSubmit = async (data: SkillFormData) => {
        try {
            const result = await updateExperience(
                experience.id,
                data.nome,
                data.senioridade,
                data.descricao,
                data.startDate ? new Date(data.startDate) : undefined,
                data.endDate ? new Date(data.endDate) : undefined,
                data.currentJob
            );

            ToastPersonalizado({
                mensagem: result.message || "Experiência atualizada com sucesso!",
            });

            reset();
            onOpenChange(false);
        } catch (error) {
            console.error(error);
            ToastPersonalizado({
                mensagem: "Erro ao atualizar experiência. Tente novamente.",
            });
        } finally {
            await refresh();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-xl text-black">
                        Atualizar experiência
                    </DialogTitle>
                    <DialogDescription className="mt-2 text-sm text-zinc-600">
                        Edite os dados da experiência.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
                    {/* Nome */}
                    <div>
                        <Label htmlFor="nome" className="text-black">
                            Nome da experiência
                        </Label>
                        <Input
                            id="nome"
                            placeholder="Nome da experiência"
                            {...register("nome", {
                                required: "Nome é obrigatório",
                                minLength: { value: 2, message: "Nome deve ter pelo menos 2 caracteres" },
                            })}
                        />
                        {errors.nome && (
                            <p className="text-sm text-danger">{errors.nome.message}</p>
                        )}
                    </div>

                    {/* Senioridade */}
                    <div>
                        <Label htmlFor="senioridade" className="text-black">
                            Senioridade
                        </Label>
                        <Controller
                            control={control}
                            name="senioridade"
                            rules={{ required: "Senioridade é obrigatória" }}
                            render={({ field }) => (
                                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                                    <SelectTrigger className="w-full bg-white! border border-zinc-200 rounded-md px-3 text-sm text-black focus:ring-0 focus:ring-offset-0 h-12!">
                                        <SelectValue placeholder="Selecione a senioridade" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Junior">Junior</SelectItem>
                                        <SelectItem value="Pleno">Pleno</SelectItem>
                                        <SelectItem value="Sênior">Sênior</SelectItem>
                                    </SelectContent>
                                </Select>
                            )}
                        />
                        {errors.senioridade && (
                            <p className="text-sm text-danger">{errors.senioridade.message}</p>
                        )}
                    </div>

                    {/* Descrição */}
                    <div>
                        <Label htmlFor="descricao" className="text-black">
                            Descrição
                        </Label>
                        <Input
                            id="descricao"
                            placeholder="Descrição da experiência"
                            {...register("descricao", {
                                required: "Descrição é obrigatória",
                                minLength: { value: 5, message: "Descrição deve ter pelo menos 5 caracteres" },
                            })}
                        />
                        {errors.descricao && (
                            <p className="text-sm text-danger">{errors.descricao.message}</p>
                        )}
                    </div>

                    {/* Datas */}
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div>
                                <Label htmlFor="startDate" className="text-black">
                                    Data de Início
                                </Label>
                                <Input type="date" id="startDate" {...register("startDate")} />
                            </div>

                            <div>
                                <Label htmlFor="endDate" className="text-black">
                                    Data de Término
                                </Label>
                                <Input
                                    type="date"
                                    id="endDate"
                                    disabled={currentJob}
                                    {...register("endDate")}
                                />
                            </div>
                        </div>

                        {/* Trabalho Atual */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="currentJob" className="text-black! font-bold!">Trabalho Atual</Label>
                                <p className="text-sm text-black!">
                                    Marque esta opção caso você ainda trabalhe nesta empresa.
                                </p>
                            </div>
                            <Controller
                                control={control}
                                name="currentJob"
                                render={({ field }) => (
                                    <Switch
                                        id="currentJob"
                                        checked={field.value ?? false}
                                        onCheckedChange={(checked) => {
                                            field.onChange(checked);
                                            if (checked) setValue("endDate", undefined);
                                        }}
                                    />
                                )}
                            />
                        </div>
                    </div>

                    <DialogFooter className="mt-4 flex justify-between">
                        <Button type="submit" variant="create" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" /> Atualizando...
                                </span>
                            ) : (
                                <span className="flex items-center justify-center gap-2">
                                    <Rocket /> Atualizar
                                </span>
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}