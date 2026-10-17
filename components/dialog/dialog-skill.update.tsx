"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Rocket, Loader2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

import { Input } from "../ui/input";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
    SelectSeparator
} from "@/components/ui/select";

import { Skill, updateSkill, useSkills } from "@/app/services/skills.swr";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ToastPersonalizado } from "@/components/toast";
import { Label } from "../ui/label";
import skillsTI from "@/components/dialog/skills.json";

const skillSchema = z.object({
    nome: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
    nivel: z.number().min(0).max(10),
    descricao: z.string().min(5),
});

type SkillFormData = z.infer<typeof skillSchema>;

interface DialogSkillUpdateProps {
    skill: Skill;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function DialogSkillUpdate({
    skill,
    open,
    onOpenChange,
}: DialogSkillUpdateProps) {
    const { refresh } = useSkills();
    const {
        register,
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
        reset,
    } = useForm<SkillFormData>({
        resolver: zodResolver(skillSchema),
    });

    useEffect(() => {
        if (skill) {
            reset({
                nome: skill.name,
                nivel: skill.level,
                descricao: skill.about ?? "",
            });
        }
    }, [skill, reset]);

    const onSubmit = async (data: SkillFormData) => {
        try {
            const result = await updateSkill(skill.id, data.nome, data.nivel, data.descricao);
            ToastPersonalizado({ mensagem: result.message || "Habilidade atualizada com sucesso!" });
            reset();
            onOpenChange(false);
        } catch (error: any) {
            console.error(error);
            ToastPersonalizado({ mensagem: "Erro ao atualizar habilidade" });
        } finally {
            await refresh();
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-black text-xl">
                        Atualizando uma das minhas habilidades
                    </DialogTitle>

                    <DialogDescription className="text-zinc-600 mt-2 text-sm">
                        É possivel atualizar somente a descrição sobre oque você ja fez e tem de conhecimento com essa habilidade.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="flex flex-col gap-4"
                >

                    {/* Descrição */}
                    <div className="w-full flex flex-col gap-2">
                        <Label className="text-black!" htmlFor="descricao">Descreva e oque você ja fez ou praticou com essa habilidade</Label>
                        <Textarea
                            placeholder="Descrição"
                            className="min-h-30! max-h-150!"
                            {...register("descricao")}
                        />
                        {errors.descricao && (
                            <p className="text-danger text-sm">
                                {errors.descricao.message}
                            </p>
                        )}
                    </div>

                    {/* Footer */}
                    <DialogFooter className="flex justify-between mt-4">
                        <Button type="submit" variant={"create"}>
                            {isSubmitting ?
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="animate-spin" /> Atualizando...
                                </span> :
                                <span className="flex items-center justify-center gap-2">
                                    <Rocket /> Atualizar
                                </span>
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}