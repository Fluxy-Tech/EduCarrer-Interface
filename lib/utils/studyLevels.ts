// Regras da gamificação dos estudos, compartilhadas entre o front e o back

export const QUIZ_QUESTIONS_PER_LEVEL = 5;

// Acertos mínimos no quiz para concluir o nível e liberar o próximo
export const QUIZ_MIN_CORRECT_TO_PASS = 4;

// XP ganho por acerto no melhor resultado de cada nível
export const XP_PER_CORRECT_ANSWER = 20;

// Ordem em que os tipos de conteúdo viram níveis
export const LEVEL_ORDER: Record<string, number> = {
    resume: 1,
    strengths: 2,
    lacunasaDevelop: 3,
    studyPlans: 4,
    finalTip: 5,
};

export const LEVEL_META: Record<string, { title: string; subtitle: string }> = {
    resume: {
        title: "Diagnóstico",
        subtitle: "Resumo do seu perfil frente à vaga",
    },
    strengths: {
        title: "Pontos fortes",
        subtitle: "O que você já domina e como valorizar",
    },
    lacunasaDevelop: {
        title: "Lacunas",
        subtitle: "Competências que precisam ser desenvolvidas",
    },
    studyPlans: {
        title: "Plano semanal",
        subtitle: "A rota de estudos semana a semana",
    },
    finalTip: {
        title: "Reta final",
        subtitle: "A dica para fechar o estudo com chave de ouro",
    },
};

// Títulos de carreira conforme a quantidade de níveis concluídos
const RANKS = ["Recruta", "Aprendiz", "Analista", "Especialista", "Estrategista", "Mestre"];

export function getRank(completedLevels: number): string {
    return RANKS[Math.min(Math.max(completedLevels, 0), RANKS.length - 1)];
}

interface LevelLike {
    type: string;
    completed?: boolean;
    bestScore?: number;
}

export function sortByLevel<T extends LevelLike>(sections: T[]): T[] {
    return [...sections].sort(
        (a, b) => (LEVEL_ORDER[a.type] ?? 999) - (LEVEL_ORDER[b.type] ?? 999)
    );
}

// Um nível está liberado quando todos os anteriores foram concluídos
export function isLevelUnlocked<T extends LevelLike>(sortedSections: T[], index: number): boolean {
    return sortedSections.slice(0, index).every((s) => s.completed);
}

export function getStudyProgress<T extends LevelLike>(sections: T[]) {
    const total = sections.length;
    const completed = sections.filter((s) => s.completed).length;
    const xp = sections.reduce((acc, s) => acc + (s.bestScore ?? 0) * XP_PER_CORRECT_ANSWER, 0);
    const maxXp = total * QUIZ_QUESTIONS_PER_LEVEL * XP_PER_CORRECT_ANSWER;

    return {
        total,
        completed,
        percent: total > 0 ? Math.round((completed / total) * 100) : 0,
        xp,
        maxXp,
        rank: getRank(completed),
        finished: total > 0 && completed === total,
    };
}
