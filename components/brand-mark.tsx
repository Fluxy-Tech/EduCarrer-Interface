import { BrainCircuit } from "lucide-react"
import { cn } from "@/lib/utils"

interface BrandMarkProps {
  tone?: "light" | "dark"
  className?: string
}

// Marca em código para fundos escuros, onde o logo em PNG perde contraste
export function BrandMark({ tone = "light", className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="relative grid place-items-center size-10 rounded-xl bg-brand text-white shadow-[0_10px_24px_-10px_rgba(31,86,240,0.9)]">
        <BrainCircuit className="size-5" strokeWidth={1.8} />
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-gold ring-2 ring-ink" />
      </span>
      <span className={cn("leading-none", tone === "light" ? "text-white" : "text-ink")}>
        <span className="font-display text-[26px]">EduCarrer</span>
        <span className="ml-1 text-[11px] font-bold tracking-[0.2em] text-gold align-top">AI</span>
      </span>
    </div>
  )
}
