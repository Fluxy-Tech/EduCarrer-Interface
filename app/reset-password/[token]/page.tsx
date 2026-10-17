"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { CircleCheck, CircleX } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { AuthError, AuthShell, PasswordInput } from "@/components/auth-shell"

const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve conter no mínimo 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
  })

type TokenStatus = "checking" | "valid" | "invalid"

export default function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()

  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // O better-auth redireciona com ?error=INVALID_TOKEN quando o token expirou
    if (searchParams.get("error") || !token) {
      setTokenStatus("invalid")
      return
    }

    const checkToken = async () => {
      try {
        const res = await fetch(`/api/reset/get/${token}`)
        const data = await res.json()

        setTokenStatus(data.status === true ? "valid" : "invalid")
      } catch (err) {
        setTokenStatus("invalid")
      }
    }

    checkToken()
  }, [token, searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validation = passwordSchema.safeParse({
      password,
      confirmPassword,
    })

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Dados inválidos")
      return
    }

    setIsLoading(true)

    try {
      const res = await fetch("/api/reset/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, token }),
      })

      const data = await res.json()

      if (data.status) {
        setSuccess(true)
      } else {
        setError(data.message || "Erro ao atualizar senha")
      }
    } catch (err) {
      setError("Erro ao atualizar senha. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  const renderContent = () => {
    if (tokenStatus === "checking") {
      return (
        <div className="flex items-center gap-3 rounded-xl border border-border bg-sky p-4">
          <span className="size-5 rounded-full border-2 border-brand border-r-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Validando link...</p>
        </div>
      )
    }

    if (tokenStatus === "invalid") {
      return (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-danger/20 bg-danger-soft p-4 text-sm text-danger animate-rise">
            <CircleX className="size-5 shrink-0" />
            <span>
              Este link de redefinição é inválido, expirou ou já foi utilizado. Solicite um novo link.
            </span>
          </div>

          <Button
            onClick={() => router.push("/reset-password")}
            className="w-full h-12"
            variant="create"
          >
            Solicitar novo link
          </Button>

          <Button
            onClick={() => router.push("/singin")}
            variant="link"
            className="h-12"
          >
            Voltar para o login
          </Button>
        </div>
      )
    }

    if (success) {
      return (
        <div className="space-y-6">
          <div className="flex items-start gap-3 rounded-xl border border-success/20 bg-success-soft p-4 text-sm text-success animate-rise">
            <CircleCheck className="size-5 shrink-0" />
            <span>Senha atualizada com sucesso! Agora você já pode acessar sua conta.</span>
          </div>

          <Button
            onClick={() => router.push("/singin")}
            className="w-full h-12"
            variant="create"
          >
            Ir para o login
          </Button>
        </div>
      )
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthError message={error} />

        <div className="space-y-2">
          <Label className="text-ink font-semibold" htmlFor="password">
            Nova senha
          </Label>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-ink font-semibold" htmlFor="confirmPassword">
            Confirmar nova senha
          </Label>
          <PasswordInput
            id="confirmPassword"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
          {isLoading ? "Salvando..." : "Redefinir senha"}
        </Button>
      </form>
    )
  }

  return (
    <AuthShell
      eyebrow="Recuperação de senha"
      title="Crie uma nova senha"
      description="Sua nova senha deve conter no mínimo 8 caracteres."
    >
      {renderContent()}
    </AuthShell>
  )
}
