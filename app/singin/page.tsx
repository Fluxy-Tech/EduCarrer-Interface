"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/auth-client"
import { AuthDivider, AuthError, AuthShell, PasswordInput } from "@/components/auth-shell"

const loginSchema = z.object({
  email: z.email("Email inválido"),
  password: z
    .string()
    .min(8, "A senha deve conter no mínimo 8 caracteres"),
})

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const router = useRouter()

  const filterErrorMessage = (message: string) => {
    if (message === "Invalid email or password") {
      return "Email ou senha inválidos"
    } else if (message === "User not found") {
      return "Usuário não encontrado"
    } else if (message === "Invalid email") {
      return "Email inválido"
    } else {
      return message || "Erro ao fazer login"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    const validation = loginSchema.safeParse({
      email,
      password,
    })

    if (!validation.success) {
      setError(validation.error.issues[0]?.message || "Dados inválidos")
      return
    }

    setIsLoading(true)

    try {
      const result = await authClient.signIn.email({
        email,
        password,
      })

      if (result.error) {
        setError(filterErrorMessage(result.error.message ?? ""))
      } else {
        router.push("/jobs")
      }
    } catch (err) {
      setError("Erro ao fazer login. Tente novamente.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Bem-vindo de volta"
      title="Acesse sua conta"
      description="Entre para continuar sua trilha de estudos."
    >
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-ink font-semibold" htmlFor="password">
              Senha
            </Label>
            <Link
              href="/reset-password"
              className="text-sm font-semibold text-brand hover:text-brand-strong"
            >
              Esqueceu sua senha?
            </Link>
          </div>
          <PasswordInput
            id="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {isLoading ? "Entrando..." : <>Entrar <ArrowRight /></>}
        </Button>
      </form>

      <AuthDivider label="Não tem uma conta?" />

      <Button
        onClick={() => router.push("/singup")}
        variant="link"
        className="h-12"
      >
        Criar nova conta
      </Button>
    </AuthShell>
  )
}
