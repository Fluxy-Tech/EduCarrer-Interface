export interface GeneratedStudy {
  study_name: string;
  studies: GeneratedStudySection[];
}

export interface GeneratedStudySection {
  section: string;
  type: string;
  content: any
}

export interface GeneratedStrength {
  skill: string;
  importance: string;
  advice: string;
}

export interface GeneratedGap {
  skill: string;
  explanation: string;
  priority: string;
  topics: string[];
  resources: string[];
  estimated_time: string;
}

export interface GeneratedStudyPlan {
  week: number;
  focus: string;
  goals: string;
}

export interface SkillsAndExperienceComparisonResponse {
    missing: string[];
    strong: string[];
    matchPercentage: number;
}
export interface GeneratedQuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface GeneratedQuiz {
  questions: GeneratedQuizQuestion[];
}
