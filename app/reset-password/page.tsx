"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, MailCheck } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AuthError, AuthShell } from "@/components/auth-shell"

const emailSchema = z.object({
  email: z.email("Email inválido"),
})

const filterMessage = (message: string) => {
  if (message === "SucessoNoProcessoDoEnvidoDoEmail") {
    return "Enviamos um link de redefinição para o seu e-mail. Verifique a caixa de entrada ou spam."
  } else if (message === "ErroInternoNoEnvioDeEmail") {
    return "Não foi possível enviar o e-mail. Tente novamente."
  } else {
    return message || "Erro ao solicitar redefinição de senha"
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    const validation = emailSchema.safeParse({ email })

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Dados inválidos")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/reset/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await res.json()

      if (data.status) {
        setSuccess(filterMessage(data.message))
      } else {
        setError(filterMessage(data.message))
      }
    } catch (err) {
      setError("Erro ao solicitar redefinição de senha. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Esqueceu sua senha?"
      title="Redefinir senha"
      description="Informe o e-mail da sua conta e enviaremos um link para criar uma nova senha."
    >
      {success ? (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success-soft p-4 text-sm text-success animate-rise">
            <MailCheck className="size-5 shrink-0" />
            <span>{success}</span>
          </div>

          <Button
            onClick={() => router.push("/singin")}
            className="w-full h-12"
            variant="create"
          >
            Voltar para o login
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <AuthError message={error} />

          <div className="space-y-2">
            <Label className="text-ink font-semibold" htmlFor="email">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12"
            variant="create"
          >
            {isLoading ? "Enviando..." : "Enviar link de redefinição"}
          </Button>

          <Button
            type="button"
            onClick={() => router.push("/singin")}
            variant="link"
            className="h-12"
          >
            <ArrowLeft /> Voltar para o login
          </Button>
        </form>
      )}
    </AuthShell>
  )
}
