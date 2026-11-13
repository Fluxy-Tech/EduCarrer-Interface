"use client";

import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Check, Download, Eye, EyeOff, FileText, Globe, Linkedin, Loader2, Save, Target, Trash2, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
import { OWN_RESUME_URL, removeResumeFile, updateCareer, uploadResumeFile, useCareer } from "@/app/services/career.swr";
import { AREAS_OF_INTEREST, RANK_BONUS_LINKS, RANK_BONUS_RESUME } from "@/lib/users/roles";
import { cn } from "@/lib/utils";

const MAX_SIZE = 5 * 1024 * 1024;

// Área de interesse (filtro do ranking) e currículo disponível para recrutadores
export function CareerCard() {
    const { career, isLoading } = useCareer();
    const inputRef = useRef<HTMLInputElement>(null);
    const [visibleOnUpload, setVisibleOnUpload] = useState(true);
    const [busy, setBusy] = useState<"area" | "upload" | "visibility" | "remove" | "links" | null>(null);
    const [linkedin, setLinkedin] = useState("");
    const [portfolio, setPortfolio] = useState("");

    // Preenche os campos com o que já está salvo
    useEffect(() => {
        setLinkedin(career?.linkedinUrl ?? "");
        setPortfolio(career?.portfolioUrl ?? "");
    }, [career?.linkedinUrl, career?.portfolioUrl]);

    const linksChanged = linkedin.trim() !== (career?.linkedinUrl ?? "") || portfolio.trim() !== (career?.portfolioUrl ?? "");
    const hasLinksBonus = !!(career?.linkedinUrl || career?.portfolioUrl);
    const hasResumeBonus = !!career?.resume?.visible;

    const run = async (kind: NonNullable<typeof busy>, action: () => Promise<{ status: boolean; message: string }>) => {
        try {
            setBusy(kind);
            const res = await action();
            ToastPersonalizado({ mensagem: res.message });
        } catch (e) {
            console.error(e);
            ToastPersonalizado({ mensagem: "Não conseguimos salvar agora, tente novamente." });
        } finally {
            setBusy(null);
        }
    };

    const handleFile = (file: File | undefined) => {
        if (inputRef.current) inputRef.current.value = "";
        if (!file) return;

        if (!file.name.toLowerCase().endsWith(".pdf")) {
            ToastPersonalizado({ mensagem: "Envie o currículo em PDF" });
            return;
        }
        if (file.size > MAX_SIZE) {
            ToastPersonalizado({ mensagem: "O currículo deve ter no máximo 5 MB" });
            return;
        }

        const visible = career?.resume ? career.resume.visible : visibleOnUpload;
        run("upload", () => uploadResumeFile(file, visible));
    };

    const resume = career?.resume;

    return (
        <section className="surface overflow-hidden">
            <div className="flex items-start gap-4 border-b border-border p-6">
                <span className="grid place-items-center size-12 shrink-0 rounded-2xl bg-brand-soft text-brand">
                    <Target className="size-5" />
                </span>
                <div>
                    <p className="eyebrow text-brand">Visibilidade para recrutadores</p>
                    <h2 className="mt-0.5 font-display text-3xl leading-tight text-ink">Área e currículo</h2>
                    <p className="text-sm text-muted-foreground">
                        Recrutadores veem um ranking pelo desempenho nas trilhas. Links e currículo liberado somam pontos extras.
                    </p>
                </div>
            </div>

            {/* Pontos extras no ranking */}
            <div className="grid gap-3 border-b border-border bg-sky/60 p-4 sm:grid-cols-2 sm:px-6">
                {[
                    { done: hasLinksBonus, points: RANK_BONUS_LINKS, label: "LinkedIn ou portfólio cadastrado" },
                    { done: hasResumeBonus, points: RANK_BONUS_RESUME, label: "Currículo liberado para recrutadores" },
                ].map((b) => (
                    <div key={b.label}>
                        <p className="text-sm text-ink">
                            <strong>+{b.points} pontos</strong> · {b.label}
                            <span className={cn("ml-1 text-xs", b.done ? "text-success" : "text-muted-foreground")}>
                                {b.done ? "(conquistado)" : "(pendente)"}
                            </span>
                        </p>
                    </div>
                ))}
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-[320px_1fr]">
                <div className="flex flex-col gap-5">
                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-bold text-ink">Áreas de interesse</p>
                        <p className="text-xs text-muted-foreground">Selecione quantas quiser. Usadas no filtro do ranking de recrutadores.</p>
                        <div role="group" aria-label="Áreas de interesse" className="mt-1 flex flex-wrap gap-2">
                            {AREAS_OF_INTEREST.map((a) => {
                                const selected = career?.areasOfInterest.includes(a) ?? false;
                                return (
                                    <button
                                        key={a}
                                        type="button"
                                        aria-pressed={selected}
                                        disabled={isLoading || busy === "area"}
                                        onClick={() => {
                                            const current = career?.areasOfInterest ?? [];
                                            const next = selected ? current.filter((x) => x !== a) : [...current, a];
                                            run("area", () => updateCareer({ areasOfInterest: next }));
                                        }}
                                        className={cn(
                                            "inline-flex cursor-pointer items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-semibold text-ink transition-colors disabled:cursor-not-allowed disabled:opacity-60",
                                            selected
                                                ? "border-brand bg-brand/10"
                                                : "border-border bg-white hover:border-brand/50"
                                        )}
                                    >
                                        {selected && <Check className="size-3.5 text-brand" />}
                                        {a}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <p className="text-sm font-bold text-ink">Links profissionais</p>
                        <p className="text-xs text-muted-foreground">Recrutadores veem depois de desbloquear seu perfil.</p>
                        <div className="relative">
                            <Linkedin className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                className="h-11 pl-10"
                                placeholder="linkedin.com/in/seu-perfil"
                                value={linkedin}
                                onChange={(e) => setLinkedin(e.target.value)}
                            />
                        </div>
                        <div className="relative">
                            <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                            <Input
                                className="h-11 pl-10"
                                placeholder="Portfólio, GitHub ou site"
                                value={portfolio}
                                onChange={(e) => setPortfolio(e.target.value)}
                            />
                        </div>
                        <Button
                            variant="create"
                            size="sm"
                            className="w-fit"
                            disabled={!linksChanged || busy === "links"}
                            onClick={() => run("links", () => updateCareer({ linkedinUrl: linkedin.trim() || null, portfolioUrl: portfolio.trim() || null }))}
                        >
                            {busy === "links" ? <Loader2 className="animate-spin" /> : <Save />} Salvar links
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <p className="text-sm font-bold text-ink">Currículo</p>

                    <input
                        ref={inputRef}
                        type="file"
                        accept="application/pdf,.pdf"
                        className="hidden"
                        onChange={(e) => handleFile(e.target.files?.[0])}
                    />

                    {resume ? (
                        <div className="flex flex-col gap-4 rounded-2xl border border-border bg-sky p-4">
                            <div className="flex items-center gap-3">
                                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-brand">
                                    <FileText className="size-4" />
                                </span>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-ink">{resume.fileName}</p>
                                    {resume.uploadedAt && (
                                        <p className="text-xs text-muted-foreground">Enviado em {format(new Date(resume.uploadedAt), "dd/MM/yyyy")}</p>
                                    )}
                                </div>
                            </div>

                            <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-white p-3">
                                <span className="flex items-center gap-2 text-sm">
                                    {resume.visible ? <Eye className="size-4 text-success" /> : <EyeOff className="size-4 text-muted-foreground" />}
                                    <span>
                                        <span className="block font-semibold text-ink">
                                            {resume.visible ? "Visível para recrutadores" : "Oculto dos recrutadores"}
                                        </span>
                                        <span className="block text-xs text-muted-foreground">
                                            {resume.visible ? "Recrutadores que desbloquearem seu perfil podem baixar o currículo." : "Só você tem acesso ao arquivo."}
                                        </span>
                                    </span>
                                </span>
                                <Switch
                                    checked={resume.visible}
                                    disabled={busy === "visibility"}
                                    onCheckedChange={(value) => run("visibility", () => updateCareer({ resumeVisible: value }))}
                                />
                            </label>

                            <div className="flex flex-wrap gap-2">
                                <Button asChild variant="outline" size="sm">
                                    <a href={OWN_RESUME_URL} download><Download /> Baixar</a>
                                </Button>
                                <Button variant="outline" size="sm" disabled={busy === "upload"} onClick={() => inputRef.current?.click()}>
                                    {busy === "upload" ? <Loader2 className="animate-spin" /> : <Upload />} Substituir
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="destructive" size="sm" disabled={busy === "remove"}>
                                            <Trash2 /> Remover
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Remover o currículo?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                O arquivo é apagado e recrutadores deixam de ter acesso. Suas habilidades e experiências continuam no perfil.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => run("remove", removeResumeFile)}>Remover</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-3 rounded-2xl border border-dashed border-input bg-sky/50 p-4">
                            <p className="text-sm text-muted-foreground">
                                Anexe seu currículo em PDF (até 5 MB). Você escolhe se ele fica visível para recrutadores.
                            </p>
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-ink">
                                <input
                                    type="checkbox"
                                    checked={visibleOnUpload}
                                    onChange={(e) => setVisibleOnUpload(e.target.checked)}
                                    className="size-4 accent-[var(--brand)]"
                                />
                                Deixar visível para recrutadores
                            </label>
                            <Button variant="create" className="w-fit" disabled={busy === "upload"} onClick={() => inputRef.current?.click()}>
                                {busy === "upload" ? <Loader2 className="animate-spin" /> : <Upload />} Anexar currículo
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
