import { Bot, CalendarRange, Flag, LucideIcon, Medal, ScanSearch, Target } from "lucide-react"

export const SECTION_ICONS: Record<string, LucideIcon> = {
  resume: ScanSearch,
  strengths: Medal,
  lacunasaDevelop: Target,
  studyPlans: CalendarRange,
  finalTip: Flag,
  agent: Bot,
}

export function getSectionIcon(type: string): LucideIcon {
  return SECTION_ICONS[type] ?? Flag
}
