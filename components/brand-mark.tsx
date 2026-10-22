import Image from "next/image"
import { cn } from "@/lib/utils"

interface BrandMarkProps {
  tone?: "light" | "dark"
  className?: string
}

// Logotipo branco; em fundos claros (tone="dark") é invertido para continuar visível
export function BrandMark({ tone = "light", className }: BrandMarkProps) {
  return (
    <Image
      src="/brand-logo.png"
      alt="EduCarrer AI"
      width={2172}
      height={724}
      className={cn("h-14 w-auto shrink-0 self-start object-contain -ml-2", tone === "dark" && "invert", className)}
      priority
    />
  )
}
