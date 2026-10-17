"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { z } from "zod"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth/auth-client"
import { AuthDivider, AuthError, AuthShell, PasswordInput } from "@/components/auth-shell"
import { cn } from "@/lib/utils"

// Validação dos dados do step 1 (nome e email)
const step1Schema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Nome é obrigatório")
    .min(3, "O nome deve ter pelo menos 3 caracteres"),
  email: z
    .string()
    .trim()
    .min(1, "Email é obrigatório")
    .email("Email inválido"),
})

// Validação dos dados do step 2 (senha e confirmação)
const step2Schema = z
  .object({
    password: z
      .string()
      .min(8, "A senha deve ter pelo menos 8 caracteres")
      .regex(
        /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/,
        "A senha deve conter pelo menos 1 caractere especial"
      ),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [step, setStep] = useState(1)

  const nextStep = async () => {
    setError("")

    const result = step1Schema.safeParse({ name, email })

    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setStep(2)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    // Enter no step 1 avança para a senha em vez de tentar criar a conta
    if (step == 1) {
      nextStep()
      return
    }

    const result = step2Schema.safeParse({ password, confirmPassword })

    if (!result.success) {
      setError(result.error.issues[0].message)
      return
    }

    setIsLoading(true)

    try {
      const signUpResult = await authClient.signUp.email({
        email,
        password,
        name,
      })

      if (signUpResult.error) {
        setError(signUpResult.error.message || "Erro ao criar conta")
      } else {
        router.push("/jobs")
      }
    } catch (err) {
      setError("Erro ao criar conta. Tente novamente.")
      console.log(err)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthShell
      eyebrow={`Nova conta · etapa ${step} de 2`}
      title={step == 1 ? "Crie sua conta" : "Já está quase lá"}
      description={step == 1 ? "Preencha seus dados para começar." : "Defina uma senha para finalizar o cadastro."}
    >
      <div className="mb-7 grid grid-cols-2 gap-2">
        {[1, 2].map((s) => (
          <span key={s} className={cn("h-1.5 rounded-full transition-colors duration-500", s <= step ? "bg-brand" : "bg-muted")} />
        ))}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <AuthError message={error} />

        {step == 1 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="name" className="text-ink font-semibold">
                Nome completo
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-ink font-semibold">
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
              type="button"
              onClick={() => nextStep()}
              variant={"create"}
              disabled={isLoading}
              className="w-full h-12"
            >
              Próximo <ArrowRight />
            </Button>
          </>
        )}

        {step == 2 && (
          <>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-ink font-semibold">
                Senha
              </Label>
              <PasswordInput
                id="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Mínimo de 8 caracteres e 1 caractere especial (ex: ! @ # $ %)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-ink font-semibold">
                Confirmar senha
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

            <div className="grid grid-cols-[auto_1fr] gap-3">
              <Button
                type="button"
                onClick={() => {
                  setStep(1)
                  setPassword("")
                  setConfirmPassword("")
                  setError("")
                }}
                disabled={isLoading}
                variant="outline"
                className="h-12"
              >
                <ArrowLeft /> Voltar
              </Button>

              <Button
                type="submit"
                variant={"create"}
                disabled={isLoading}
                className="h-12"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Criando conta...
                  </span>
                ) : (
                  "Criar conta"
                )}
              </Button>
            </div>
          </>
        )}
      </form>

      <AuthDivider label="Já tem uma conta?" />

      <Button
        type="button"
        onClick={() => router.push("/singin")}
        variant={"link"}
        className="h-12"
      >
        Fazer login
      </Button>
    </AuthShell>
  )
}
