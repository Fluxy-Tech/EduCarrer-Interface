"use client";

import Link from "next/link";
import { Coins, Crown } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CREDIT_PACKAGES, formatCredits, formatPrice, getPlansForRole } from "@/lib/credits/config";
import { useSession } from "@/lib/auth/auth-client";
import { useCredits } from "@/app/services/credits.swr";
import { CheckoutItem } from "@/components/credits/checkout-dialog";

interface BuyCreditsDialogProps {
    open: boolean;
    reason: string | null;
    onClose: () => void;
    onSelect: (item: CheckoutItem) => void;
}

// Oferta exibida quando o usuário tenta usar a IA sem créditos suficientes
export function BuyCreditsDialog({ open, reason, onClose, onSelect }: BuyCreditsDialogProps) {
    const { credits } = useCredits();
    const { data: session } = useSession();
    // Recrutador vê o plano de recrutador; usuário vê os planos de estudo
    const plans = getPlansForRole(session?.user?.role === "recruiter" ? "recruiter" : "user");

    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <p className="eyebrow text-gold">Créditos esgotados</p>
                    <DialogTitle className="font-display text-3xl text-ink">Recarregue para continuar</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {reason ?? "Você não tem créditos suficientes para essa ação."}
                        {credits && <> Saldo atual: <strong className="text-ink">{formatCredits(credits.total)} créditos</strong>.</>}
                    </DialogDescription>
                </DialogHeader>

                <div>
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                        <Coins className="size-4 text-gold" /> Créditos avulsos (não expiram)
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                        {CREDIT_PACKAGES.map((pack) => (
                            <button
                                key={pack.id}
                                onClick={() => onSelect({ kind: "package", id: pack.id })}
                                className="cursor-pointer rounded-2xl border border-border bg-white p-4 text-left transition-all hover:border-brand/50 hover:shadow-soft"
                            >
                                <p className="text-2xl font-extrabold text-ink tabular-nums">{formatCredits(pack.credits)}</p>
                                <p className="text-xs text-muted-foreground">créditos</p>
                                <p className="mt-3 font-display text-2xl text-brand">{formatPrice(pack.price)}</p>
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="mb-3 flex items-center gap-2 text-sm font-bold text-ink">
                        <Crown className="size-4 text-brand" /> Ou assine um plano mensal
                    </p>
                    <div className="grid gap-2">
                        {plans.map((plan) => (
                            <button
                                key={plan.id}
                                onClick={() => onSelect({ kind: "plan", id: plan.id })}
                                className="cursor-pointer flex items-center justify-between rounded-xl border border-border bg-sky px-4 py-3 text-left transition-colors hover:border-brand/50"
                            >
                                <span>
                                    <span className="text-sm font-bold text-ink">{plan.name}</span>
                                    <span className="ml-2 text-xs text-muted-foreground">{formatCredits(plan.credits)} créditos/mês</span>
                                </span>
                                <span className="text-sm font-bold text-brand">{formatPrice(plan.price)}/mês</span>
                            </button>
                        ))}
                    </div>
                </div>

                <Button asChild variant="link" onClick={onClose}>
                    <Link href="/plans">Ver detalhes dos planos e extrato</Link>
                </Button>
            </DialogContent>
        </Dialog>
    );
}
