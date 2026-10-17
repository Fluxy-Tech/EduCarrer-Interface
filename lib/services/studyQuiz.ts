import { StudyRepository } from "@/lib/repositories/study";
import { HundleStudyWithOpenAi } from "@/lib/services/hundleStudyWithOpenAi";
import { redis } from "@/lib/redis/conection";
import {
    QUIZ_MIN_CORRECT_TO_PASS,
    QUIZ_QUESTIONS_PER_LEVEL,
    isLevelUnlocked,
    sortByLevel,
} from "@/lib/utils/studyLevels";

const studyRepository = new StudyRepository();
const hundleStudyWithOpenAi = new HundleStudyWithOpenAi();

type StudyWithSections = NonNullable<Awaited<ReturnType<StudyRepository["getStudySectionsProgress"]>>>;
type SectionWithContent = StudyWithSections["sections"][number];

interface ResLevelAccess {
    status: boolean
    message: string
    study?: StudyWithSections
    section?: SectionWithContent
}

// Transforma o conteúdo da seção em texto para a IA montar as perguntas
function sectionToText(section: SectionWithContent): string {
    if (section.type == "strengths") {
        return section.strengths
            .map((s) => `Habilidade: ${s.skill}. Importância: ${s.importance}. Conselho: ${s.advice}`)
            .join("\n");
    }

    if (section.type == "lacunasaDevelop") {
        return section.gaps
            .map((g) => `Lacuna: ${g.skill}. Explicação: ${g.explanation}. Prioridade: ${g.priority}. Tempo estimado: ${g.estimatedTime}. Tópicos: ${g.topics.join(", ")}. Recursos: ${g.resources.join(", ")}`)
            .join("\n");
    }

    if (section.type == "studyPlans") {
        return section.plans
            .sort((a, b) => a.week - b.week)
            .map((p) => `Semana ${p.week}. Foco: ${p.focus}. Objetivos: ${p.goals}`)
            .join("\n");
    }

    return section.content ?? "";
}

// Valida se o estudo é do usuário e se o nível já foi liberado
async function getLevelAccess(userId: string, studyId: string, sectionId: string): Promise<ResLevelAccess> {
    const study = await studyRepository.getStudySectionsProgress(studyId);

    if (!study || study.userId != userId) {
        return { status: false, message: "Estudo não encontrado" };
    }

    const sections = sortByLevel(study.sections);
    const index = sections.findIndex((s) => s.id == sectionId);

    if (index == -1) {
        return { status: false, message: "Nível não encontrado neste estudo" };
    }

    if (!isLevelUnlocked(sections, index)) {
        return { status: false, message: "Conclua o nível anterior para liberar este nível" };
    }

    return { status: true, message: "Nível liberado", study, section: sections[index] };
}

// Coletar o quiz de um nível, gerando as perguntas na primeira vez
export async function getQuizBySection(userId: string, studyId: string, sectionId: string) {
    const access = await getLevelAccess(userId, studyId, sectionId);

    if (!access.status || !access.study || !access.section) {
        return { status: false, message: access.message, questions: [] };
    }

    // slice protege contra duas gerações simultâneas do mesmo quiz
    let questions = (await studyRepository.getQuestionsBySectionId(sectionId)).slice(0, QUIZ_QUESTIONS_PER_LEVEL);

    if (questions.length == 0) {
        const generated = await hundleStudyWithOpenAi.createQuizSection(
            access.study.title,
            access.section.section,
            sectionToText(access.section)
        );

        if (!generated) {
            return { status: false, message: "Não conseguimos gerar as perguntas agora, tente novamente em instantes", questions: [] };
        }

        questions = await studyRepository.createQuestions(
            generated.questions.map((q, i) => ({
                sectionId,
                position: i + 1,
                question: q.question,
                options: q.options,
                answerIndex: q.answerIndex,
                explanation: q.explanation
            }))
        );
    }

    // A resposta correta só é enviada depois da correção
    return {
        status: true,
        message: "Quiz carregado com sucesso",
        questions: questions.map((q) => ({
            id: q.id,
            position: q.position,
            question: q.question,
            options: q.options
        }))
    };
}

// Corrigir o quiz de um nível e liberar o próximo quando aprovado
export async function submitQuizBySection(userId: string, studyId: string, sectionId: string, answers: Record<string, number>) {
    const access = await getLevelAccess(userId, studyId, sectionId);

    if (!access.status || !access.section) {
        return { status: false, message: access.message };
    }

    const questions = (await studyRepository.getQuestionsBySectionId(sectionId)).slice(0, QUIZ_QUESTIONS_PER_LEVEL);

    if (questions.length < QUIZ_QUESTIONS_PER_LEVEL) {
        return { status: false, message: "Quiz ainda não foi gerado para este nível" };
    }

    const results = questions.map((q) => ({
        questionId: q.id,
        selectedIndex: typeof answers?.[q.id] == "number" ? answers[q.id] : null,
        answerIndex: q.answerIndex,
        correct: answers?.[q.id] === q.answerIndex,
        explanation: q.explanation
    }));

    const score = results.filter((r) => r.correct).length;
    const passed = score >= QUIZ_MIN_CORRECT_TO_PASS;
    const alreadyCompleted = access.section.completed;

    await studyRepository.updateSectionProgress(sectionId, {
        attempts: access.section.attempts + 1,
        bestScore: Math.max(access.section.bestScore, score),
        ...(passed && !alreadyCompleted ? { completed: true, completedAt: new Date() } : {})
    });

    // O cache guarda os estudos com o progresso, então precisa ser renovado
    await redis.del(`studys:${userId}`);

    return {
        status: true,
        message: passed ? "Nível concluído! Próximo nível liberado" : `Você precisa de ${QUIZ_MIN_CORRECT_TO_PASS} acertos para avançar`,
        score,
        total: questions.length,
        passed,
        results
    };
}
