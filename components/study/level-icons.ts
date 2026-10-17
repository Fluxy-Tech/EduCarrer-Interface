import { CalendarRange, Flag, LucideIcon, Medal, ScanSearch, Target } from "lucide-react"

export const LEVEL_ICONS: Record<string, LucideIcon> = {
  resume: ScanSearch,
  strengths: Medal,
  lacunasaDevelop: Target,
  studyPlans: CalendarRange,
  finalTip: Flag,
}

export function getLevelIcon(type: string): LucideIcon {
  return LEVEL_ICONS[type] ?? Flag
}
