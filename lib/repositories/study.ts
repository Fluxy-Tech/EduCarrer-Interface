import { prisma } from "@/lib/prisma";
import {
    Study,
    StudyGap,
    StudyPlan,
    StudySection,
    StudyStrength
} from "@/lib/entities/study";

import {
    CreateStudyDTO,
    CreateStudyGapDTO,
    CreateStudyPlanDTO,
    CreateStudySectionDTO,
    CreateStudyStrengthDTO,
    StudyDTO,
    StudyGapDTO,
    StudyPlanDTO,
    StudySectionDTO,
    StudyStrengthDTO,
    StudyQuestionDTO,
    CreateStudyQuestionDTO,
    UpdateStudySectionProgressDTO
} from "@/lib/interfaces/study.interface";

export class StudyRepository {

    private mapToEntity(study: any): Study {
        
        const sectionOrder: Record<string, number> = {
            resume: 1,
            strengths: 2,
            lacunasaDevelop: 3,
            studyPlans: 4,
            finalTip: 5,
        };

        return new Study(
            study.id,
            study.title,
            study.sections
                .sort(
                    (a: any, b: any) =>
                        (sectionOrder[a.type] ?? 999) -
                        (sectionOrder[b.type] ?? 999)
                )
                .map(
                    (section: any) =>
                        new StudySection(
                            section.id,
                            section.studyId,
                            section.section,
                            section.type,
                            section.content,

                            section.strengths.map(
                                (strength: any) =>
                                    new StudyStrength(
                                        strength.id,
                                        strength.sectionId,
                                        strength.skill,
                                        strength.importance,
                                        strength.advice
                                    )
                            ),

                            section.gaps.map(
                                (gap: any) =>
                                    new StudyGap(
                                        gap.id,
                                        gap.sectionId,
                                        gap.skill,
                                        gap.explanation,
                                        gap.priority,
                                        gap.estimatedTime,
                                        gap.topics,
                                        gap.resources
                                    )
                            ),

                            section.plans.map(
                                (plan: any) =>
                                    new StudyPlan(
                                        plan.id,
                                        plan.sectionId,
                                        plan.week,
                                        plan.focus,
                                        plan.goals
                                    )
                            ),

                            section.createdAt,
                            section.completed ?? false,
                            section.completedAt ?? null,
                            section.bestScore ?? 0,
                            section.attempts ?? 0
                        )
                ),

            study.createdAt,
            study.updatedAt,
            study.vacancy ?? null,
            study.userId
        );
    }

    private mapToEntityEmpty(study: any): Study {
        return new Study(
            study.id,
            study.title,
            [],
            study.createdAt,
            study.updatedAt,
            study.vacancy ?? null,
            study.userId
        );
    }

    // Coletar todos estudos com todos os dados de um usuario
    async getStudyByUserId(userId: string): Promise<StudyDTO[]> {
        const studies = await prisma.study.findMany({
            where: {
                userId,
            },
            orderBy: {
                createdAt: "desc"
            },
            include: {
                vacancy: true,
                sections: {
                    include: {
                        strengths: true,
                        gaps: true,
                        plans: true,
                    }
                },
            },
        });

        return studies.map((study) => this.mapToEntity(study));
    }

    // Coletar estudo de um usurio atraves do id de uma vaga
    async getStudyByUserIdAndVancacyId(userId: string, vacancyId: string) {
        const study = await prisma.study.findFirst({
            where: {
                userId,
                vacancyId
            },
            include: {
                sections: {
                    include: {
                        strengths: true,
                        gaps: true,
                        plans: true,
                    }
                },
            },
        });

        return study;
    }

    // Coletar estudo de um usuario
    async getStudyById(id: string): Promise<StudyDTO | null> {
        const study = await prisma.study.findUnique({
            where: {
                id
            },
            include: {
                vacancy: true,
                sections: {
                    include: {
                        strengths: true,
                        gaps: true,
                        plans: true,
                    }
                }
            },

        });

        if (!study) {
            return null;
        }

        return this.mapToEntity(study);
    }

    async getAllStudy(): Promise<StudyDTO[]> {
        const studies = await prisma.study.findMany({
            include: {
                sections: {
                    include: {
                        gaps: true,
                        plans: true,
                        strengths: true
                    }
                }
            }
        });

        return studies.map((study) => this.mapToEntity(study));
    }

    // Criar um estudo vazio somente com titulo, id de usuario e id da vaga
    async createStudyEmpty(data: CreateStudyDTO): Promise<StudyDTO> {
        const study = await prisma.study.create({
            data: {
                title: data.title,
                userId: data.userId,
                vacancyId: data.vacancyId
            }
        });

        return this.mapToEntityEmpty(study);
    }

    // Criar sessões de um estudo
    async createSectionStudy(data: CreateStudySectionDTO): Promise<StudySectionDTO> {
        const study = await prisma.studySection.create({
            data: {
                studyId: data.studyId,
                type: data.type,
                content: data.content,
                section: data.section
            }
        });

        return new StudySection(
            study.id,
            study.studyId,
            study.section,
            study.type,
            study.content,
            [],
            [],
            [],
            study.createdAt,
        );
    }

    // Criar sessão de pontos fortes do candidato
    async createSectionStrength(data: CreateStudyStrengthDTO): Promise<StudyStrengthDTO> {
        const study = await prisma.studyStrength.create({
            data: {
                skill: data.skill,
                advice: data.advice,
                importance: data.importance,
                sectionId: data.sectionId
            }
        });

        return new StudyStrength(
            study.id,
            study.skill,
            study.advice,
            study.importance,
            study.sectionId
        );
    }

    // Criar sessão de estudos
    async createSectionGap(data: CreateStudyGapDTO): Promise<StudyGapDTO> {
        const study = await prisma.studyGap.create({
            data: {
                skill: data.skill,
                explanation: data.explanation,
                priority: data.priority,
                topics: data.topics,
                resources: data.resources,
                estimatedTime: data.estimatedTime,
                sectionId: data.sectionId
            }
        });

        return new StudyGap(
            study.id,
            study.sectionId,
            study.skill,
            study.explanation,
            study.priority,
            study.estimatedTime,
            study.topics,
            study.resources
        );
    }

    // Cirar plano de estudos
    async createSectionPlan(data: CreateStudyPlanDTO): Promise<StudyPlanDTO> {
        const study = await prisma.studyPlan.create({
            data: {
                week: data.week,
                focus: data.focus,
                goals: data.goals,
                sectionId: data.sectionId
            }
        });

        return new StudyPlan(
            study.id,
            study.sectionId,
            study.week,
            study.focus,
            study.goals
        );
    }

    // Coletar a quantidade de estudos que temos cadastrado na base
    async getCountStudyes(): Promise<number> {
        return await prisma.study.count();
    }

    // Coletar as seções (níveis) de um estudo com o dono, usado para validar acesso e desbloqueio
    async getStudySectionsProgress(studyId: string) {
        return await prisma.study.findUnique({
            where: {
                id: studyId
            },
            select: {
                id: true,
                title: true,
                userId: true,
                sections: {
                    include: {
                        strengths: true,
                        gaps: true,
                        plans: true,
                    }
                }
            }
        });
    }

    // Coletar as perguntas do quiz de uma seção
    async getQuestionsBySectionId(sectionId: string): Promise<StudyQuestionDTO[]> {
        return await prisma.studyQuestion.findMany({
            where: {
                sectionId
            },
            orderBy: {
                position: "asc"
            }
        });
    }

    // Criar as perguntas do quiz de uma seção
    async createQuestions(questions: CreateStudyQuestionDTO[]): Promise<StudyQuestionDTO[]> {
        await prisma.studyQuestion.createMany({
            data: questions
        });

        return await this.getQuestionsBySectionId(questions[0].sectionId);
    }

    // Atualizar o progresso (nível) de uma seção
    async updateSectionProgress(sectionId: string, data: UpdateStudySectionProgressDTO) {
        return await prisma.studySection.update({
            where: {
                id: sectionId
            },
            data
        });
    }
}