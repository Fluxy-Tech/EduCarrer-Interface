"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToastPersonalizado } from "@/components/toast";
import { buyCredits, refreshCredits, subscribePlan, useCredits } from "@/app/services/credits.swr";
import { formatCredits, formatPrice, getCreditPackage, getPlan } from "@/lib/credits/config";
import { formatCpfCnpj, isValidCpfCnpj } from "@/lib/utils/document";

export type CheckoutItem = { kind: "plan" | "package"; id: string };

interface CheckoutDialogProps {
    item: CheckoutItem | null;
    onClose: () => void;
}

// Confirma a compra, pede CPF/CNPJ na primeira vez e entrega o link da fatura do Asaas
export function CheckoutDialog({ item, onClose }: CheckoutDialogProps) {
    const { credits } = useCredits();
    const [document, setDocument] = useState("");
    const [loading, setLoading] = useState(false);
    const [invoiceUrl, setInvoiceUrl] = useState<string | null>(null);
    const [resultMessage, setResultMessage] = useState<string | null>(null);
    const [askDocument, setAskDocument] = useState(false);

    useEffect(() => {
        if (item) {
            setInvoiceUrl(null);
            setResultMessage(null);
            setAskDocument(credits ? !credits.hasDocument : false);
        }
    }, [item]); // eslint-disable-line react-hooks/exhaustive-deps

    if (!item) return null;

    const plan = item.kind === "plan" ? getPlan(item.id) : undefined;
    const pack = item.kind === "package" ? getCreditPackage(item.id) : undefined;
    const title = plan ? `Plano ${plan.name}` : `${formatCredits(pack?.credits ?? 0)} créditos avulsos`;
    const price = plan ? `${formatPrice(plan.price)}/mês` : formatPrice(pack?.price ?? 0);
    const amount = plan?.credits ?? pack?.credits ?? 0;

    const handleConfirm = async () => {
        if (askDocument && !isValidCpfCnpj(document)) {
            ToastPersonalizado({ mensagem: "Informe um CPF ou CNPJ válido" });
            return;
        }

        try {
            setLoading(true);
            const cpf = askDocument ? document : undefined;
            const res = item.kind === "plan" ? await subscribePlan(item.id, cpf) : await buyCredits(item.id, cpf);

            if (!res.status) {
                if (res.code === "DOCUMENT_REQUIRED") setAskDocument(true);
                ToastPersonalizado({ mensagem: res.message });
                return;
            }

            setResultMessage(res.message);
            setInvoiceUrl(res.invoiceUrl ?? null);
            refreshCredits();
        } catch (e) {
            console.error(e);
            ToastPersonalizado({ mensagem: "Não conseguimos gerar a cobrança, tente novamente em instantes." });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={!!item} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <p className="eyebrow text-brand">{plan ? "Assinatura mensal" : "Compra avulsa"}</p>
                    <DialogTitle className="font-display text-3xl text-ink">{title}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                        {plan
                            ? `${formatCredits(amount)} créditos renovados a cada mês pago. Cancele quando quiser.`
                            : `${formatCredits(amount)} créditos que não expiram e são usados depois dos créditos do plano.`}
                    </DialogDescription>
                </DialogHeader>

                {resultMessage ? (
                    <div className="flex flex-col items-center gap-4 rounded-2xl bg-success-soft p-6 text-center">
                        <CheckCircle2 className="size-10 text-success" />
                        <p className="text-sm font-semibold text-ink">{resultMessage}</p>
                        {invoiceUrl ? (
                            <Button asChild variant="create" className="w-full">
                                <a href={invoiceUrl} target="_blank" rel="noopener noreferrer">
                                    Pagar agora (PIX, cartão ou boleto) <ExternalLink />
                                </a>
                            </Button>
                        ) : (
                            <p className="text-xs text-muted-foreground">Enviamos a cobrança para o seu e-mail.</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Os créditos entram automaticamente assim que o pagamento for confirmado.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between rounded-2xl border border-border bg-sky p-4">
                            <div>
                                <p className="text-sm font-bold text-ink">{formatCredits(amount)} créditos</p>
                                <p className="text-xs text-muted-foreground">{plan ? "por mês" : "pagamento único"}</p>
                            </div>
                            <p className="font-display text-3xl text-ink tabular-nums">{price}</p>
                        </div>

                        {askDocument && (
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="cpfCnpj" className="text-sm text-ink">CPF ou CNPJ do pagador</Label>
                                <Input
                                    id="cpfCnpj"
                                    inputMode="numeric"
                                    placeholder="000.000.000-00"
                                    value={document}
                                    onChange={(e) => setDocument(formatCpfCnpj(e.target.value))}
                                    className="h-11"
                                />
                                <p className="text-xs text-muted-foreground">Exigido pelo Asaas para emitir a cobrança. Pedimos só uma vez.</p>
                            </div>
                        )}

                        <p className="flex items-center gap-2 text-xs text-muted-foreground">
                            <ShieldCheck className="size-4 text-success" /> Pagamento processado com segurança pelo Asaas.
                        </p>
                    </div>
                )}

                <DialogFooter>
                    {resultMessage ? (
                        <Button variant="close" onClick={onClose}>Fechar</Button>
                    ) : (
                        <>
                            <Button variant="close" onClick={onClose} disabled={loading}>Cancelar</Button>
                            <Button variant="create" onClick={handleConfirm} disabled={loading}>
                                {loading && <Loader2 className="animate-spin" />}
                                {plan ? "Assinar plano" : "Gerar cobrança"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
