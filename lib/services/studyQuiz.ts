import { StudyRepository } from "@/lib/repositories/study";
import { HundleStudyWithOpenAi } from "@/lib/services/hundleStudyWithOpenAi";
import { redis } from "@/lib/redis/conection";
import {
    QUIZ_MIN_CORRECT_TO_PASS,
    QUIZ_QUESTIONS_PER_LEVEL,
    isLevelUnlocked,
} from "@/lib/utils/studyLevels";

const studyRepository = new StudyRepository();
const hundleStudyWithOpenAi = new HundleStudyWithOpenAi();

type StudyWithLevels = NonNullable<Awaited<ReturnType<StudyRepository["getStudyLevelsProgress"]>>>;
type GapLevel = StudyWithLevels["sections"][number]["gaps"][number];

interface ResLevelAccess {
    status: boolean
    message: string
    study?: StudyWithLevels
    gap?: GapLevel
}

// Transforma a lacuna em texto para a IA montar as perguntas sobre o conteúdo a ser estudado
function gapToText(gap: GapLevel): string {
    return [
        `Competência a estudar: ${gap.skill}`,
        `Por que estudar: ${gap.explanation}`,
        `Tópicos: ${gap.topics.join(", ")}`,
        `Recursos indicados: ${gap.resources.join(", ")}`
    ].join("\n");
}

// Valida se o estudo é do usuário e se o nível (lacuna) já foi liberado
async function getLevelAccess(userId: string, studyId: string, gapId: string): Promise<ResLevelAccess> {
    const study = await studyRepository.getStudyLevelsProgress(studyId);

    if (!study || study.userId != userId) {
        return { status: false, message: "Estudo não encontrado" };
    }

    const levels = study.sections.flatMap((s) => s.gaps);
    const index = levels.findIndex((g) => g.id == gapId);

    if (index == -1) {
        return { status: false, message: "Nível não encontrado neste estudo" };
    }

    if (!isLevelUnlocked(levels, index)) {
        return { status: false, message: "Conclua o nível anterior para liberar este nível" };
    }

    return { status: true, message: "Nível liberado", study, gap: levels[index] };
}

// Coletar o quiz de um nível, gerando as perguntas na primeira vez
export async function getQuizByGap(userId: string, studyId: string, gapId: string) {
    const access = await getLevelAccess(userId, studyId, gapId);

    if (!access.status || !access.study || !access.gap) {
        return { status: false, message: access.message, questions: [] };
    }

    // slice protege contra duas gerações simultâneas do mesmo quiz
    let questions = (await studyRepository.getQuestionsByGapId(gapId)).slice(0, QUIZ_QUESTIONS_PER_LEVEL);

    if (questions.length == 0) {
        const generated = await hundleStudyWithOpenAi.createQuizGap(
            access.study.title,
            access.gap.skill,
            gapToText(access.gap)
        );

        if (!generated) {
            return { status: false, message: "Não conseguimos gerar as perguntas agora, tente novamente em instantes", questions: [] };
        }

        questions = await studyRepository.createQuestions(
            generated.questions.map((q, i) => ({
                gapId,
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
export async function submitQuizByGap(userId: string, studyId: string, gapId: string, answers: Record<string, number>) {
    const access = await getLevelAccess(userId, studyId, gapId);

    if (!access.status || !access.gap) {
        return { status: false, message: access.message };
    }

    const questions = (await studyRepository.getQuestionsByGapId(gapId)).slice(0, QUIZ_QUESTIONS_PER_LEVEL);

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
    const alreadyCompleted = access.gap.completed;

    await studyRepository.updateGapProgress(gapId, {
        attempts: access.gap.attempts + 1,
        bestScore: Math.max(access.gap.bestScore, score),
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
