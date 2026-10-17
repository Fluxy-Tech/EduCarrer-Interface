import { StudyRepository } from "@/lib/repositories/study";
import { GeneratedStudy, GeneratedStrength, GeneratedGap, GeneratedStudyPlan } from "@/lib/interfaces/openai.interface";
import { getSkillByUserId } from "@/lib/services/skill";
import { getExperienceByUserId } from "@/lib/services/experience";
import { getVacancysById } from "@/lib/services/vacancy";
import { HundleStudyWithOpenAi } from "@/lib/services/hundleStudyWithOpenAi";
import { StudyRedis } from "@/lib/redis/study";
import { redis } from "@/lib/redis/conection";

const studyRepository = new StudyRepository();
const studyRedis = new StudyRedis();
const hundleStudyWithOpenAi = new HundleStudyWithOpenAi();

// Coletar todos estudos de um usuario com o progresso dos níveis
export async function getStudyWithoutSessionByUserId(userId: string) {
    return await getAllStudies(userId);
}

// Criar um estudo para usuario
export async function createStudy(idVacancy: string, userId: string) {
    await redis.del(`studys:${userId}`);
    const skills = await getSkillByUserId(userId);

    if (skills.length == 0) {
        return {
            status: false,
            message: "E necessario que cadastre ao menos 1 habilidade no seu perfil para a criação de estudos personalizados!"
        }
    }

    const experiences = await getExperienceByUserId(userId);

    const vacancy = await getVacancysById(idVacancy);

    if (!vacancy) {
        return {
            status: false,
            message: "Vaga não encontrada"
        }
    }

    const searchStudyByUserId = await studyRepository.getStudyByUserIdAndVancacyId(userId, idVacancy);
    console.log("Passou")
    if (searchStudyByUserId) {
        return {
            status: false,
            message: "Verificamos que você ja tem um estudo para essa vaga. Vá para tela de estudos e verifique!"
        }
    }

    const techStackComparison = await hundleStudyWithOpenAi.getImportantSkills(skills, experiences, vacancy);
    const resumeCandidate = await hundleStudyWithOpenAi.createResumeCandidate(skills, experiences);

    const profile = {
        "missing": techStackComparison?.missing ?? [], // Skills que esta ausente no perfil do usuario 
        "strong": techStackComparison?.strong ?? [], // Skills fortes no perfil do usuario
        "matchPercentage": techStackComparison?.matchPercentage ?? 0, // Porcentagem de match com o perfil do usuario
        "resume": resumeCandidate || ""
    }

    const roadMapCandidate = await hundleStudyWithOpenAi.createRoadMapCandidate(vacancy, profile);

    const listStudies: GeneratedStudy | null = roadMapCandidate ? JSON.parse(roadMapCandidate) : null

    try {
        if (listStudies) {
            const study = await studyRepository.createStudyEmpty({
                title: listStudies.study_name,
                userId,
                vacancyId: idVacancy
            });

            if (study) {
                for (const st of listStudies.studies) {
                    const section = await studyRepository.createSectionStudy(
                        {
                            section: st.section,
                            type: st.type,
                            content: ((st.type == "resume" || st.type == "finalTip") && typeof st.content == "string") ? st.content : null,
                            studyId: study.id
                        }
                    )
                    if (section) {
                        if (st.type == "strengths") {
                            for (const ct of st.content) {
                                const content = ct as GeneratedStrength;
                                await studyRepository.createSectionStrength(
                                    {
                                        sectionId: section.id,
                                        skill: content.skill,
                                        importance: content.importance,
                                        advice: content.advice
                                    }
                                )
                            }
                        } else if (st.type == "lacunasaDevelop") {
                            for (const ct of st.content) {
                                const content = ct as GeneratedGap;
                                await studyRepository.createSectionGap(
                                    {
                                        sectionId: section.id,
                                        skill: content.skill,
                                        estimatedTime: content.estimated_time,
                                        explanation: content.explanation,
                                        priority: content.priority,
                                        resources: Array.isArray(content.resources) ? content.resources : [],
                                        topics: Array.isArray(content.topics) ? content.topics : [],
                                    }
                                )
                            }
                        } else if (st.type == "studyPlans") {
                            let i = 0;
                            for (const ct of st.content) {
                                i++
                                const content = ct as GeneratedStudyPlan;
                                await studyRepository.createSectionPlan(
                                    {
                                        sectionId: section.id,
                                        week: typeof content.week == "number" ? content.week : i,
                                        focus: content.focus,
                                        goals: content.goals,
                                    }
                                )
                            }
                        }
                    }

                }
            }
        }

        return {
            status: true,
            message: "Sucesso na criação da study"
        }
    } catch (e: any) {
        console.log(e);
        return {
            status: false,
            message: "Tivemos um erro na criação do estudo"
        }
    }
}

// Coletar todos os estudos com sessões de um usuario pelo id
export async function getAllStudies(userId: string) {
    const findStudyRedisInRedis = await studyRedis.getStudyByUserIdFromRedis(userId);

    // O redis devolve [] quando não tem cache, então só usamos quando houver estudos
    if (findStudyRedisInRedis.length > 0) return findStudyRedisInRedis;

    const findStudyRedisInDataBase = await studyRepository.getStudyByUserId(userId);
    if (findStudyRedisInDataBase.length > 0) {
        studyRedis.setStudyInRedis(userId, findStudyRedisInDataBase);
    }

    return findStudyRedisInDataBase;
}

// Coletar estudo pelo id do estudo
export async function getStudyById(userId: string, id: string) {
    const findStudyByUserIdAndIdRedisInRedis = await studyRedis.getStudyByUserIdAndIdFromRedis(userId, id);

    if(findStudyByUserIdAndIdRedisInRedis) return findStudyByUserIdAndIdRedisInRedis;

    const study = await studyRepository.getStudyById(id);

    // Impede que um usuário acesse o estudo de outro pelo id
    if (!study || study.userId != userId) return null;

    return study;
}

// Coletar numero de estudos tem para tela de admin
export async function getNumberTotalStudies() {
    return await studyRepository.getCountStudyes();
}