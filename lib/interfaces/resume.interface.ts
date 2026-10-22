// Ação que será aplicada no perfil quando o usuário confirmar o currículo
export type ResumeItemAction = "create" | "update";

export interface ResumeSkillDTO {
  name: string;
  level: number;
  about: string;
  action: ResumeItemAction;
  existingId: string | null;
}

export interface ResumeExperienceDTO {
  name: string;
  seniority: string;
  about: string;
  startDate: string | null;
  endDate: string | null;
  currentJob: boolean;
  action: ResumeItemAction;
  existingId: string | null;
}

export interface ResumeAnalysisDTO {
  skills: ResumeSkillDTO[];
  experiences: ResumeExperienceDTO[];
}
