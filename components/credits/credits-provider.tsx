"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { isInsufficientCredits, refreshCredits } from "@/app/services/credits.swr";
import { BuyCreditsDialog } from "@/components/credits/buy-credits-dialog";
import { CheckoutDialog, CheckoutItem } from "@/components/credits/checkout-dialog";

interface CreditsContextValue {
    openBuyCredits: (reason?: string | null) => void;
    openCheckout: (item: CheckoutItem) => void;
}

const CreditsContext = createContext<CreditsContextValue>({
    openBuyCredits: () => {},
    openCheckout: () => {},
});

export const useCreditsDialogs = () => useContext(CreditsContext);

// Rotas que consomem créditos: após a resposta, o saldo exibido é atualizado
const SPENDING_ROUTES = /\/api\/(study|agent|vacancy\/refresh)\/?(\?.*)?$/;

// Abre a oferta de compra sempre que qualquer chamada da API responder 402 (créditos insuficientes)
export function CreditsProvider({ children }: { children: React.ReactNode }) {
    const [buyOpen, setBuyOpen] = useState(false);
    const [reason, setReason] = useState<string | null>(null);
    const [checkoutItem, setCheckoutItem] = useState<CheckoutItem | null>(null);

    const openBuyCredits = useCallback((message?: string | null) => {
        setReason(message ?? null);
        setBuyOpen(true);
    }, []);

    const openCheckout = useCallback((item: CheckoutItem) => {
        setBuyOpen(false);
        setCheckoutItem(item);
    }, []);

    useEffect(() => {
        const handle = (status: number | undefined, data: any, config: any) => {
            if (status === 402 && isInsufficientCredits(data)) {
                openBuyCredits(data?.message);
                refreshCredits();
                return;
            }

            if (config?.method === "post" && SPENDING_ROUTES.test(config?.url ?? "")) {
                refreshCredits();
            }
        };

        const id = axios.interceptors.response.use(
            (response) => {
                handle(response.status, response.data, response.config);
                return response;
            },
            (error) => {
                handle(error?.response?.status, error?.response?.data, error?.config);
                return Promise.reject(error);
            }
        );

        return () => axios.interceptors.response.eject(id);
    }, [openBuyCredits]);

    return (
        <CreditsContext.Provider value={{ openBuyCredits, openCheckout }}>
            {children}
            <BuyCreditsDialog
                open={buyOpen}
                reason={reason}
                onClose={() => setBuyOpen(false)}
                onSelect={openCheckout}
            />
            <CheckoutDialog item={checkoutItem} onClose={() => setCheckoutItem(null)} />
        </CreditsContext.Provider>
    );
}
