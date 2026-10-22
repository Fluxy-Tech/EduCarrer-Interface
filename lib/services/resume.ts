import { SkillRepository } from "@/lib/repositories/skill";
import { ExperienceRepository } from "@/lib/repositories/experience";
import { HundleResumeWithOpenAi, RESUME_SENIORITIES } from "@/lib/services/hundleResumeWithOpenAi";
import { redis } from "@/lib/redis/conection";
import { SkillDTO } from "@/lib/interfaces/skill.interface";
import { ExperienceDTO } from "@/lib/interfaces/experience.interface";
import { GeneratedResume } from "@/lib/interfaces/openai.interface";
import { ResumeAnalysisDTO } from "@/lib/interfaces/resume.interface";

const skillRepository = new SkillRepository();
const experienceRepository = new ExperienceRepository();
const hundleResumeWithOpenAi = new HundleResumeWithOpenAi();

export const RESUME_MAX_SIZE = 5 * 1024 * 1024;

// Compara nomes ignorando acento, caixa e pontuação ("Node.js" == "nodejs")
function normalize(value: string): string {
    return value
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9+#]/g, "");
}

function monthKey(date?: Date | string | null): string | null {
    if (!date) return null;
    const d = new Date(date);
    if (isNaN(d.getTime())) return null;
    return `${d.getUTCFullYear()}-${d.getUTCMonth()}`;
}

// "YYYY-MM" vindo da IA vira o primeiro dia do mês
function parseMonth(value: string | null): Date | null {
    if (!value) return null;
    const match = /^(\d{4})-(\d{2})/.exec(value);
    if (!match) return null;
    const month = Number(match[2]);
    if (month < 1 || month > 12) return null;
    return new Date(Date.UTC(Number(match[1]), month - 1, 1));
}

function clampLevel(level: number): number {
    return Math.min(Math.max(Math.round(Number(level) || 1), 1), 10);
}

function findSkill(skills: SkillDTO[], name: string) {
    return skills.find((s) => normalize(s.name) == normalize(name)) ?? null;
}

// Mesma experiência quando o nome bate ou quando começou no mesmo mês
function findExperience(experiences: ExperienceDTO[], name: string, startDate: string | null) {
    const start = monthKey(parseMonth(startDate));

    return experiences.find((e) =>
        normalize(e.name) == normalize(name) ||
        (start != null && monthKey(e.startDate) == start)
    ) ?? null;
}

// Limpa a resposta da IA e marca o que vai ser criado e o que vai ser atualizado no perfil
async function buildAnalysis(userId: string, resume: GeneratedResume): Promise<ResumeAnalysisDTO> {
    const [skills, experiences] = await Promise.all([
        skillRepository.getSkillByUserId(userId),
        experienceRepository.getExperienceByUserId(userId)
    ]);

    const seenSkills = new Set<string>();

    const resumeSkills = (resume.skills ?? [])
        .filter((s) => s.name?.trim())
        .filter((s) => {
            const key = normalize(s.name);
            if (seenSkills.has(key)) return false;
            seenSkills.add(key);
            return true;
        })
        .map((s) => {
            const existing = findSkill(skills, s.name);
            return {
                name: existing?.name ?? s.name.trim(),
                level: clampLevel(s.level),
                about: s.about?.trim() ?? "",
                action: existing ? "update" as const : "create" as const,
                existingId: existing?.id ?? null
            };
        });

    const usedExperiences = new Set<string>();

    const resumeExperiences = (resume.experiences ?? [])
        .filter((e) => e.name?.trim())
        .map((e) => {
            const existing = findExperience(
                experiences.filter((x) => !usedExperiences.has(x.id)),
                e.name,
                e.startDate
            );
            if (existing) usedExperiences.add(existing.id);

            const startDate = parseMonth(e.startDate);
            const endDate = e.currentJob ? null : parseMonth(e.endDate);

            return {
                name: e.name.trim(),
                seniority: RESUME_SENIORITIES.includes(e.seniority) ? e.seniority : "Junior",
                about: e.about?.trim() ?? "",
                startDate: startDate ? startDate.toISOString() : null,
                endDate: endDate ? endDate.toISOString() : null,
                currentJob: !!e.currentJob,
                action: existing ? "update" as const : "create" as const,
                existingId: existing?.id ?? null
            };
        });

    return { skills: resumeSkills, experiences: resumeExperiences };
}

interface ResAnalyzeResume {
    status: boolean
    message: string
    analysis: ResumeAnalysisDTO | null
}

// Ler o currículo e devolver o que foi encontrado, sem salvar nada ainda
export async function analyzeResume(userId: string, file: File): Promise<ResAnalyzeResume> {
    const isPdf = file.type == "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (!isPdf) {
        return { status: false, message: "Envie o currículo em formato PDF", analysis: null };
    }

    if (file.size == 0 || file.size > RESUME_MAX_SIZE) {
        return { status: false, message: "O currículo precisa ter até 5 MB", analysis: null };
    }

    const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
    const resume = await hundleResumeWithOpenAi.extractResume(file.name, base64);

    if (!resume) {
        return { status: false, message: "Não conseguimos ler o currículo agora, tente novamente em instantes", analysis: null };
    }

    if (!resume.isResume) {
        return { status: false, message: "O arquivo enviado não parece ser um currículo", analysis: null };
    }

    const analysis = await buildAnalysis(userId, resume);

    if (analysis.skills.length == 0 && analysis.experiences.length == 0) {
        return { status: false, message: "Não encontramos experiências nem habilidades no currículo", analysis: null };
    }

    return { status: true, message: "Currículo lido com sucesso", analysis };
}

// Aplicar no perfil o que o usuário confirmou, criando ou atualizando skills e experiências
export async function confirmResume(userId: string, data: GeneratedResume) {
    // O casamento com o perfil é refeito aqui para não confiar em ids vindos do front
    const analysis = await buildAnalysis(userId, { ...data, isResume: true });
    const skills = await skillRepository.getSkillByUserId(userId);

    let created = 0;
    let updated = 0;

    for (const skill of analysis.skills) {
        if (skill.existingId) {
            const current = skills.find((s) => s.id == skill.existingId);
            // Não rebaixa o nível que o usuário já conquistou no teste da habilidade
            await skillRepository.updateSkill(skill.existingId, {
                level: Math.max(current?.level ?? 0, skill.level),
                ...(skill.about ? { about: skill.about } : {})
            });
            updated++;
        } else {
            await skillRepository.createSkill({
                name: skill.name,
                level: skill.level,
                about: skill.about,
                userId
            });
            created++;
        }
    }

    for (const experience of analysis.experiences) {
        const fields = {
            name: experience.name,
            seniority: experience.seniority,
            about: experience.about,
            startDate: experience.startDate ? new Date(experience.startDate) : undefined,
            endDate: experience.endDate ? new Date(experience.endDate) : undefined,
            currentJob: experience.currentJob
        };

        if (experience.existingId) {
            // Emprego atual não tem data de término
            await experienceRepository.updateExperience(experience.existingId, {
                ...fields,
                endDate: experience.endDate ? new Date(experience.endDate) : null
            });
            updated++;
        } else {
            await experienceRepository.createExperience({ ...fields, userId });
            created++;
        }
    }

    await Promise.all([
        redis.del(`skill:${userId}`),
        redis.del(`experience:${userId}`)
    ]);

    return {
        status: true,
        message: "Perfil atualizado com o seu currículo",
        created,
        updated
    };
}
