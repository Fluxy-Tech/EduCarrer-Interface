import { Check, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProgressRingProps {
  percent: number
  size?: number
  stroke?: number
  tone?: "light" | "dark"
  children?: React.ReactNode
}

export function ProgressRing({ percent, size = 72, stroke = 6, tone = "dark", children }: ProgressRingProps) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (Math.min(Math.max(percent, 0), 100) / 100) * circumference

  return (
    <div className="relative grid place-items-center shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className={tone === "light" ? "stroke-white/10" : "stroke-muted"}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={cn("transition-[stroke-dashoffset] duration-1000 ease-out", percent >= 100 ? "stroke-gold" : "stroke-brand")}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">{children}</div>
    </div>
  )
}

interface LevelDotsProps {
  levels: { completed?: boolean }[]
  tone?: "light" | "dark"
}

// Versão compacta da trilha, usada nos cards da listagem
export function LevelDots({ levels, tone = "dark" }: LevelDotsProps) {
  const currentIndex = levels.findIndex((l) => !l.completed)

  return (
    <div className="flex items-center">
      {levels.map((level, i) => {
        const state = level.completed ? "done" : i === currentIndex ? "current" : "locked"

        return (
          <div key={i} className="flex items-center">
            <span
              className={cn(
                "grid place-items-center size-7 rounded-full text-[11px] font-bold transition-colors",
                state === "done" && "bg-gold text-white",
                state === "current" && "bg-brand text-white ring-4 ring-brand/15",
                state === "locked" && (tone === "light" ? "bg-white/10 text-white/40" : "bg-muted text-muted-foreground/70")
              )}
            >
              {state === "done" ? <Check className="size-3.5" strokeWidth={3} /> : state === "locked" ? <Lock className="size-3" /> : i + 1}
            </span>
            {i < levels.length - 1 && (
              <span
                className={cn(
                  "h-[2px] w-3 sm:w-5",
                  level.completed ? "bg-gold" : tone === "light" ? "bg-white/15" : "bg-border"
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
