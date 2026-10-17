"use client";

import { Button } from "@/components/ui/button";
import { Plus, Rocket, Loader2, ArrowRight, CheckCircle2, XCircle, TriangleAlert, RotateCcw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";

import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z, ZodError } from "zod";
import { createSkill, useSkills } from "@/app/services/skills.swr";
import { useState } from "react";
import { ToastPersonalizado } from "@/components/toast";
import { Label } from "../ui/label";

import skillsTI from "@/components/dialog/skills.json";
import AsksData from "@/components/dialog/asks.json";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AskDTO {
    ask: string;
    options_answers: { a: string; b: string; c: string; d: string };
    answer_correct: string;
}

type AsksMap = Record<string, AskDTO[]>;

const asksMap = AsksData as AsksMap;

// ─── Schema ───────────────────────────────────────────────────────────────────

const skillSchema = z.object({
    nome: z.string().min(2, "Selecione uma opção de habilidade para continuar"),
    nivel: z.number().int().min(1).max(10).optional(),
    descricao: z.string().min(5, "Descreva ao menos um pouco sobre sua experiência"),
});

type SkillFormData = z.infer<typeof skillSchema>;

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ active, done }: { active: boolean; done: boolean }) {
    return (
        <span
            className={`inline-block w-2 h-2 rounded-full transition-all ${done ? "bg-success" : active ? "bg-brand scale-125" : "bg-zinc-300"
                }`}
        />
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function DialogSkillCreate() {
    const { refresh } = useSkills();
    const [open, setOpen] = useState(false);
    /** 1 = skill + descrição  |  2 = quiz  |  3 = revisão / submit */
    const [page, setPage] = useState<1 | 2 | 3>(1);
    const [count, setCount] = useState<number>(0);

    // quiz state
    const [quizQuestions, setQuizQuestions] = useState<AskDTO[]>([]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [quizIndex, setQuizIndex] = useState(0);
    const [quizScore, setQuizScore] = useState<number | null>(null);

    const {
        register,
        handleSubmit,
        control,
        watch,
        setValue,
        formState: { errors, isSubmitting },
        reset,
        trigger,
        setError,
        clearErrors
    } = useForm<SkillFormData>({
        resolver: zodResolver(skillSchema),
        mode: "onSubmit",
        reValidateMode: "onSubmit",
    });

    const selectedSkill = watch("nome");

    // ── helpers ───────────────────────────────────────────────────────────────

    function resetAll() {
        reset();
        setPage(1);
        setQuizQuestions([]);
        setAnswers({});
        setQuizIndex(0);
        setQuizScore(null);
    }

    function handleClose(v: boolean) {
        setOpen(v);
        if (!v) resetAll();
    }

    /** Move from step 1 → step 2: load questions for the chosen skill */
    async function handleContinueToQuiz() {
        const descricao = watch("descricao") ?? "";

        if (descricao.length < 5) {
            setError("descricao", {
                type: "manual",
                message: "Descreva ao menos um pouco sobre sua experiência",
            });
            return;
        }

        clearErrors("descricao");

        const qs = asksMap[selectedSkill] ?? [];

        if (qs.length === 0) {
            setValue("nivel", 5);
            setPage(3);
            return;
        }

        setQuizQuestions(qs);
        setAnswers({});
        setQuizIndex(0);
        setQuizScore(null);
        setPage(2);
        setCount(count + 1);
    }

    /** Record an answer for the current question */
    function handleAnswer(option: string) {
        setAnswers((prev) => ({ ...prev, [quizIndex]: option }));
    }

    /** Advance to next question or finish quiz */
    function handleNextQuestion() {
        if (quizIndex < quizQuestions.length - 1) {
            setQuizIndex((i) => i + 1);
        } else {
            // calculate score (0–100) for display
            const correct = quizQuestions.reduce(
                (acc, q, i) => acc + (answers[i] === q.answer_correct ? 1 : 0),
                0
            );
            const score = Math.round((correct / quizQuestions.length) * 100);
            setQuizScore(score);

            // convert to 1–10 scale (integer), minimum 1
            const nivel = Math.max(1, Math.round(score / 10));
            setValue("nivel", nivel);

            setPage(3);
        }
    }

    /** Final form submit */
    const onSubmit = async (data: SkillFormData) => {
        try {
            const result = await createSkill(data.nome, data.nivel ?? 1, data.descricao ?? "");
            ToastPersonalizado({ mensagem: result.message || "Habilidade cadastrada com sucesso!" });
            resetAll();
            setOpen(false);
        } catch (error: unknown) {
            if (error instanceof ZodError) {
                error.issues.forEach((err) => ToastPersonalizado({ mensagem: err.message }));
            } else {
                ToastPersonalizado({ mensagem: "Erro ao cadastrar habilidade" });
            }
        } finally {
            await refresh();
        }
    };

    // ── derived ───────────────────────────────────────────────────────────────

    const currentQuestion = quizQuestions[quizIndex];
    const currentAnswer = answers[quizIndex];
    const isLastQuestion = quizIndex === quizQuestions.length - 1;
    const optionLabels: Array<keyof AskDTO["options_answers"]> = ["a", "b", "c", "d"];

    // ── render ────────────────────────────────────────────────────────────────

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogTrigger asChild>
                <Button className="w-full" variant="dashed">
                    <Plus /> Adicionar habilidade
                </Button>
            </DialogTrigger>

            <DialogContent className="max-w-2xl">
                {/* ── Step dots ── */}
                <div className="flex items-center gap-2 mb-1">
                    <StepDot active={page === 1} done={page > 1} />
                    <StepDot active={page === 2} done={page > 2} />
                    <StepDot active={page === 3} done={false} />
                </div>

                {/* ══════════════════════════════════════════════════════════
                    PAGE 1 – Skill info
                ══════════════════════════════════════════════════════════ */}
                {page === 1 && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-black text-xl">
                                Adicionar uma nova habilidade
                            </DialogTitle>
                            <DialogDescription className="text-zinc-600 mt-2 text-sm">
                                Preencha a habilidade e conte um pouco sobre o que já praticou.
                                Depois vamos fazer algumas perguntas para medir seu nível.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="flex flex-col gap-4 mt-2">
                            {/* Nome */}
                            <div className="w-full flex flex-col gap-2">
                                <Label className="text-black!" htmlFor="nome">
                                    Qual o nome dessa habilidade?
                                </Label>
                                <Controller
                                    control={control}
                                    name="nome"
                                    render={({ field }) => (
                                        <Select
                                            onValueChange={(v) => field.onChange(v)}
                                            value={field.value ?? ""}
                                        >
                                            <SelectTrigger className="w-full h-12! border border-zinc-200 bg-white! text-black!">
                                                <SelectValue placeholder="Selecione uma habilidade" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {Object.entries(skillsTI).map(([group, items]) => (
                                                    <SelectGroup key={group}>
                                                        <SelectLabel className="text-gray-400">
                                                            {group}
                                                        </SelectLabel>
                                                        {(items as string[]).map((v, i) => (
                                                            <SelectItem key={v + i} value={v}>
                                                                {v}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectGroup>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.nome && (
                                    <span className="flex gap-2 justify-start items-center">
                                        <TriangleAlert className="text-danger bg-danger-soft p-1 w-8 h-8 rounded" />
                                        <p className="text-danger text-sm"> {errors.nome.message}</p>
                                    </span>
                                )}
                            </div>

                            {/* Descrição */}
                            <div className="w-full flex flex-col gap-2">
                                <Label className="text-black!" htmlFor="descricao">
                                    Descreva o que você já fez ou praticou com essa habilidade.
                                </Label>
                                <Textarea
                                    placeholder="Descrição da habilidade"
                                    {...register("descricao")}
                                />
                                {errors.descricao && (
                                    <span className="flex gap-2 justify-start items-center">
                                        <TriangleAlert className="text-danger bg-danger-soft p-1 w-8 h-8 rounded" />
                                        <p className="text-danger text-sm"> {errors.descricao.message}</p>
                                    </span>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button
                                type="button"
                                variant="create"
                                disabled={!selectedSkill}
                                onClick={() => handleContinueToQuiz()}
                            >
                                <ArrowRight className="w-4 h-4" />
                                Continuar
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PAGE 2 – Quiz
                ══════════════════════════════════════════════════════════ */}
                {page === 2 && currentQuestion && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center justify-between">
                                <DialogTitle className="text-black text-xl">
                                    Avaliação de conhecimento
                                </DialogTitle>
                                <span className="text-xs text-zinc-400 font-medium tabular-nums">
                                    {quizIndex + 1} / {quizQuestions.length}
                                </span>
                            </div>
                            <DialogDescription className="text-zinc-600 text-sm mt-1">
                                {selectedSkill} — responda com honestidade para um resultado preciso.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Progress bar */}
                        <div className="w-full h-1 bg-zinc-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-zinc-800 transition-all duration-300"
                                style={{
                                    width: `${((quizIndex + 1) / quizQuestions.length) * 100}%`,
                                }}
                            />
                        </div>

                        {/* Question */}
                        <p className="text-sm font-medium text-black leading-relaxed mt-1">
                            {currentQuestion.ask}
                        </p>

                        {/* Options */}
                        <div className="flex flex-col gap-2 mt-1">
                            {optionLabels.map((key) => {
                                const text = currentQuestion.options_answers[key];
                                const selected = currentAnswer === key;
                                return (
                                    <button
                                        key={key}
                                        type="button"
                                        onClick={() => handleAnswer(key)}
                                        className={`flex items-start gap-3 w-full text-left px-4 py-3 rounded-lg border text-sm transition-all
                                            ${selected
                                                ? "border-zinc-800 bg-zinc-50 font-medium text-zinc-900"
                                                : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50"
                                            }`}
                                    >
                                        <span
                                            className={`shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-center text-xl font-bold transition-all
                                                ${selected
                                                    ? "border-zinc-800 bg-zinc-800 text-white"
                                                    : "border-zinc-300 text-zinc-400"
                                                }`}
                                        >
                                            {key.toUpperCase()}
                                        </span>
                                        {text}
                                    </button>
                                );
                            })}
                        </div>

                        <DialogFooter className="mt-4">
                            <Button
                                type="button"
                                variant="create"
                                disabled={!currentAnswer}
                                onClick={handleNextQuestion}
                            >
                                {isLastQuestion ? (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" />
                                        Finalizar avaliação
                                    </>
                                ) : (
                                    <>
                                        <ArrowRight className="w-4 h-4" />
                                        Próxima pergunta
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}

                {/* ══════════════════════════════════════════════════════════
                    PAGE 3 – Result + Submit
                ══════════════════════════════════════════════════════════ */}
                {page === 3 && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-black text-xl">
                                Resumo da habilidade
                            </DialogTitle>
                            <DialogDescription className="text-zinc-600 text-sm mt-1 flex flex-col">
                                <span>⚠️ Confirme as informações antes de salvar.</span>
                                <span>{3 - count == 0 ? "☹️ Tente novamente do inicio para refazer o teste" : `😊 Lembrando que você so pode refazer ${3 - count} ${3 - count == 1 ? "vez" : "vezes"} o teste.`} </span>
                            </DialogDescription>
                        </DialogHeader>

                        {/* Score card */}
                        {quizScore !== null && (
                            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 flex items-center gap-5">
                                {/* gauge ring (CSS only) */}
                                <div className="relative flex-shrink-0 w-16 h-16">
                                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="15.9"
                                            fill="none"
                                            stroke="#e4e4e7"
                                            strokeWidth="3"
                                        />
                                        <circle
                                            cx="18"
                                            cy="18"
                                            r="15.9"
                                            fill="none"
                                            stroke={quizScore >= 70 ? "#22c55e" : quizScore >= 40 ? "#f59e0b" : "#ef4444"}
                                            strokeWidth="3"
                                            strokeDasharray={`${quizScore} ${100 - quizScore}`}
                                            strokeLinecap="round"
                                        />
                                    </svg>
                                    <span className="absolute inset-0 flex items-center justify-center text-sm font-bold text-zinc-800">
                                        {quizScore}%
                                    </span>
                                </div>

                                <div className="flex flex-col gap-0.5">
                                    <p className="font-semibold text-zinc-800 text-sm">
                                        {quizScore >= 70
                                            ? "Ótimo desempenho! 🎉"
                                            : quizScore >= 40
                                                ? "Conhecimento intermediário"
                                                : "Nível iniciante identificado"}
                                    </p>
                                    <p className="text-zinc-500 text-xs">
                                        {quizQuestions.reduce(
                                            (acc, q, i) =>
                                                acc + (answers[i] === q.answer_correct ? 1 : 0),
                                            0
                                        )}{" "}
                                        de {quizQuestions.length} acertos —{" "}
                                        <span className="font-medium">nível {Math.max(1, Math.round(quizScore / 10))} / 10</span>
                                    </p>

                                    {/* Per-question result pills */}
                                    <div className="flex gap-1 mt-2 flex-wrap">
                                        {quizQuestions.map((q, i) =>
                                            answers[i] === q.answer_correct ? (
                                                <CheckCircle2
                                                    key={i}
                                                    className="w-4 h-4 text-success"
                                                />
                                            ) : (
                                                <XCircle key={i} className="w-4 h-4 text-danger" />
                                            )
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Skill summary */}
                        <div className="rounded-xl border border-zinc-200 divide-y divide-zinc-100 text-sm overflow-hidden">
                            <div className="flex gap-3 px-4 py-3">
                                <span className="text-zinc-400 w-24 flex-shrink-0">Habilidade</span>
                                <span className="font-medium text-zinc-800">{selectedSkill}</span>
                            </div>
                            <div className="flex gap-3 px-4 py-3">
                                <span className="text-zinc-400 w-24 flex-shrink-0">Descrição</span>
                                <span className="text-zinc-700 line-clamp-3">{watch("descricao")}</span>
                            </div>
                        </div>

                        <DialogFooter className="mt-4 flex gap-2">
                            {quizQuestions.length > 0 && count < 3 && (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    onClick={() => {
                                        setPage(1);
                                        setQuizQuestions([]);
                                        setAnswers({});
                                        setQuizIndex(0);
                                        setQuizScore(null);
                                    }}
                                    disabled={isSubmitting}
                                >
                                    <RotateCcw /> Refazer
                                </Button>
                            )}
                            <Button
                                type="button"
                                variant="create"
                                disabled={isSubmitting}
                                onClick={handleSubmit(onSubmit)}
                            >
                                {isSubmitting ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 className="animate-spin w-4 h-4" /> Salvando...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        <Rocket className="w-4 h-4" /> Salvar habilidade
                                    </span>
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}