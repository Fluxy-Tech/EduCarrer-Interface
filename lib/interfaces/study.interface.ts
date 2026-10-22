import { Prisma } from "@prisma/client";
import { VacancyDTO } from "@/lib/interfaces/vacancy.interface";
// GET
export interface StudyDTO {
  id: string;
  title: string;
  sections: StudySectionDTO[];
  createdAt?: Date | null;
  updatedAt?: Date | null;
  vacancy?: VacancyDTO | null;
  userId: string;
}

export interface StudySectionDTO {
  id: string;
  studyId: string;
  section: string;
  type: string;
  content?: string | null;
  strengths: StudyStrengthDTO[];
  gaps: StudyGapDTO[];
  plans: StudyPlanDTO[];
  createdAt?: Date | null;
}

export interface StudyStrengthDTO {
  id: string;
  sectionId: string;
  skill: string;
  importance: string;
  advice: string;
}


export interface StudyPlanDTO {
  id: string;
  sectionId: string;
  week: number;
  focus: string;
  goals: string;
}

export interface StudyGapDTO {
  id: string;
  sectionId: string;
  skill: string;
  explanation: string;
  priority: string;
  estimatedTime: string;
  topics: string[];
  resources: string[];
  completed: boolean;
  completedAt?: Date | null;
  bestScore: number;
  attempts: number;
}

// POST
export interface CreateStudyDTO {
  title: string;
  userId: string;
  vacancyId: string;
}

export interface CreateStudySectionDTO {
  section: string;
  type: string;
  content?: string | null;

  studyId: string;

  strengths?: CreateStudyStrengthDTO[];
  gaps?: CreateStudyGapDTO[];
  plans?: CreateStudyPlanDTO[];
}

export interface CreateStudyStrengthDTO {
  sectionId: string
  skill: string;
  importance: string;
  advice: string;
}

export interface CreateStudyGapDTO {
  skill: string;
  explanation: string;
  priority: string;
  estimatedTime: string;
  sectionId: string;
  topics: string[];
  resources: string[];
}

export interface CreateStudyPlanDTO {
  sectionId: string;
  week: number;
  focus: string;
  goals: string;
}

// QUIZ (gamificação dos níveis)
export interface StudyQuestionDTO {
  id: string;
  gapId: string;
  position: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface CreateStudyQuestionDTO {
  gapId: string;
  position: number;
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface UpdateStudyGapProgressDTO {
  completed?: boolean;
  completedAt?: Date | null;
  bestScore?: number;
  attempts?: number;
}
