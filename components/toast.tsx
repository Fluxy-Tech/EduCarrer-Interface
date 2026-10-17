"use client"

import { toast } from "sonner"

interface ToastProps {
    mensagem: string
}

export function ToastPersonalizado({ mensagem }: ToastProps) {
    toast(mensagem, {
        position: "top-center",
        className: "bg-ink! border-none! text-white! text-sm! font-semibold! p-4! rounded-xl! shadow-lift! flex! justify-center! items-center! text-center!",
    })
}
