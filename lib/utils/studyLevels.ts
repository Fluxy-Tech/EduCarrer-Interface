// Regras da gamificação dos estudos, compartilhadas entre o front e o back

export const QUIZ_QUESTIONS_PER_LEVEL = 5;

// Acertos mínimos no quiz para concluir o nível e liberar o próximo
export const QUIZ_MIN_CORRECT_TO_PASS = 4;

// XP ganho por acerto no melhor resultado de cada nível
export const XP_PER_CORRECT_ANSWER = 20;

// Tipo da seção que guarda as lacunas, cada lacuna é um nível da trilha
export const GAPS_SECTION_TYPE = "lacunasaDevelop";

// Seções informativas do estudo, não possuem desafio
export const SECTION_META: Record<string, { title: string; subtitle: string }> = {
    resume: {
        title: "Diagnóstico",
        subtitle: "Resumo do seu perfil frente à vaga",
    },
    strengths: {
        title: "Pontos fortes",
        subtitle: "O que você já tem e como valorizar na entrevista",
    },
    lacunasaDevelop: {
        title: "Trilha de estudo",
        subtitle: "Os conteúdos que você precisa estudar, um nível por lacuna",
    },
    studyPlans: {
        title: "Plano semanal",
        subtitle: "O roteiro de estudo semana a semana",
    },
    finalTip: {
        title: "Reta final",
        subtitle: "A dica para fechar sua preparação",
    },
};

// Títulos de carreira conforme o percentual da trilha concluído
const RANKS = ["Recruta", "Aprendiz", "Analista", "Especialista", "Estrategista", "Mestre"];

export function getRank(percent: number): string {
    const index = Math.floor((Math.min(Math.max(percent, 0), 100) / 100) * (RANKS.length - 1));
    return RANKS[index];
}

interface LevelLike {
    completed?: boolean;
    bestScore?: number;
}

interface SectionLike<T> {
    type: string;
    gaps?: T[];
}

// Os níveis da trilha são as lacunas, na ordem em que a IA gerou
export function getStudyLevels<T extends LevelLike>(sections: SectionLike<T>[]): T[] {
    return sections
        .filter((s) => s.type == GAPS_SECTION_TYPE)
        .flatMap((s) => s.gaps ?? []);
}

// Um nível está liberado quando todos os anteriores foram concluídos
export function isLevelUnlocked<T extends LevelLike>(levels: T[], index: number): boolean {
    return levels.slice(0, index).every((l) => l.completed);
}

export function getStudyProgress<T extends LevelLike>(levels: T[]) {
    const total = levels.length;
    const completed = levels.filter((l) => l.completed).length;
    const xp = levels.reduce((acc, l) => acc + (l.bestScore ?? 0) * XP_PER_CORRECT_ANSWER, 0);
    const maxXp = total * QUIZ_QUESTIONS_PER_LEVEL * XP_PER_CORRECT_ANSWER;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
        total,
        completed,
        percent,
        xp,
        maxXp,
        rank: getRank(percent),
        finished: total > 0 && completed === total,
    };
}
