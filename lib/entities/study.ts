import { VacancyDTO } from "@/lib/interfaces/vacancy.interface";

export class Study {
  constructor(
    public id: string,
    public title: string,
    public sections: StudySection[],
    public createdAt: Date | null,
    public updatedAt: Date | null,
    public vacancy: VacancyDTO | null,
    public userId: string
  ) {}
}

export class StudySection {
  constructor(
    public id: string,
    public studyId: string,
    public section: string,
    public type: string,
    public content: string | null,
    public strengths: StudyStrength[],
    public gaps: StudyGap[],
    public plans: StudyPlan[],
    public createdAt: Date | null
  ) {}
}

export class StudyStrength {
  constructor(
    public id: string,
    public sectionId: string,
    public skill: string,
    public importance: string,
    public advice: string
  ) {}
}

export class StudyGap {
  constructor(
    public id: string,
    public sectionId: string,
    public skill: string,
    public explanation: string,
    public priority: string,
    public estimatedTime: string,
    public topics: string[],
    public resources: string[],
    public completed: boolean = false,
    public completedAt: Date | null = null,
    public bestScore: number = 0,
    public attempts: number = 0
  ) {}
}

export class StudyPlan {
  constructor(
    public id: string,
    public sectionId: string,
    public week: number,
    public focus: string,
    public goals: string
  ) {}
}