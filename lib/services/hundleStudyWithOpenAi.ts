import { VacancyDTO } from "@/lib/interfaces/vacancy.interface";
import { ExperienceDTO } from "@/lib/interfaces/experience.interface";
import { SkillDTO } from "@/lib/interfaces/skill.interface";

import type { SkillsAndExperienceComparisonResponse, GeneratedQuiz } from "@/lib/interfaces/openai.interface";
import { QUIZ_QUESTIONS_PER_LEVEL } from "@/lib/utils/studyLevels";

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const STUDY_MODEL = process.env.OPENAI_STUDY_MODEL ?? "gpt-4.1-mini";
const VACANCY_FILTER_MODEL = process.env.OPENAI_VACANCY_FILTER_MODEL ?? "gpt-4.1-mini";

// Prompt que compara o perfil do usuário com a stack da vaga
const SKILLS_COMPARISON_PROMPT = [
    "Você é um recrutador técnico especialista em vagas de tecnologia.",
    "Você recebe em JSON as habilidades do candidato (skills, com nível de 0 a 10), suas experiências profissionais (experiences) e uma vaga (vacancy).",
    "Compare o perfil do candidato com as tecnologias e requisitos da vaga e responda:",
    "- strong: tecnologias e competências exigidas pela vaga nas quais o candidato já tem boa proficiência, considerando o nível da habilidade e o uso comprovado nas experiências.",
    "- missing: tecnologias e competências exigidas pela vaga que o candidato não tem ou tem em nível baixo (abaixo de 5).",
    "- matchPercentage: percentual de 0 a 100 de aderência do candidato aos requisitos da vaga, dando mais peso aos requisitos principais da vaga.",
    "Use apenas tecnologias relacionadas à vaga, com o nome curto e usual de cada uma (ex: React, Node.js, Docker). Não repita a mesma tecnologia nas duas listas.",
    "Se o candidato não tiver habilidades nem experiências, retorne strong vazio, todos os requisitos da vaga em missing e matchPercentage 0."
].join("\n");

// Prompt que escreve o resumo profissional do candidato usado como contexto do estudo
const CANDIDATE_RESUME_PROMPT = [
    "Você é um especialista em carreira na área de tecnologia.",
    "Você recebe em JSON as habilidades do candidato (skills, com nível de 0 a 10) e suas experiências profissionais (experiences).",
    "Escreva em português do Brasil um resumo profissional do candidato em um único parágrafo de até 6 frases, em terceira pessoa.",
    "Destaque a senioridade aparente, o tempo e o tipo de experiência, as principais tecnologias dominadas e as áreas de atuação.",
    "Use apenas as informações recebidas, sem inventar empresas, cargos, tecnologias ou formações.",
    "Se não houver habilidades nem experiências, diga que o candidato ainda não possui histórico cadastrado na plataforma.",
    "Responda apenas com o texto do resumo, sem títulos, markdown ou aspas."
].join("\n");

// Prompt que monta o estudo completo do candidato para a vaga
const STUDY_ROADMAP_PROMPT = [
    "Você é um mentor de carreira e especialista técnico da EduCarrer AI, uma plataforma que prepara pessoas para conquistar vagas de tecnologia.",
    "Você recebe em JSON a vaga (vacancy) e o perfil do candidato (profile), com:",
    "- strong: tecnologias da vaga que o candidato já domina;",
    "- missing: tecnologias da vaga que faltam ao candidato;",
    "- matchPercentage: aderência do candidato à vaga (0 a 100);",
    "- resume: resumo profissional do candidato.",
    "",
    "Crie um estudo personalizado em português do Brasil para preparar o candidato para essa vaga.",
    "study_name: título curto do estudo citando o cargo da vaga (ex: \"Preparação para Desenvolvedor Front-end Pleno\").",
    "",
    "O array studies deve ter exatamente 5 seções, nesta ordem, uma de cada type:",
    "1. type \"resume\" (section \"Diagnóstico\"): content é um texto de 1 a 2 parágrafos com o diagnóstico do perfil frente à vaga, citando a aderência, o que já está bom e o que precisa evoluir.",
    "2. type \"strengths\" (section \"Pontos fortes\"): content é uma lista com os pontos fortes do candidato para a vaga, cada item com skill (nome da competência), importance (por que é importante para a vaga) e advice (como valorizar isso na entrevista). Entre 2 e 5 itens.",
    "3. type \"lacunasaDevelop\" (section \"Lacunas a desenvolver\"): content é uma lista com as lacunas que o candidato precisa estudar, da mais para a menos importante. Cada item tem:",
    "   - skill: nome da competência;",
    "   - explanation: explicação didática de 2 a 4 parágrafos do que é a competência, por que a vaga exige e como ela é usada na prática;",
    "   - priority: exatamente \"Alta\", \"Média\" ou \"Baixa\";",
    "   - topics: de 4 a 6 tópicos técnicos específicos que o candidato deve estudar;",
    "   - resources: de 2 a 4 recursos de estudo reais e conhecidos (documentação oficial, cursos ou livros), sem inventar links;",
    "   - estimated_time: tempo estimado de estudo (ex: \"2 semanas\").",
    "   Use as tecnologias de missing como base e inclua entre 3 e 6 lacunas. Se missing estiver vazio, use os requisitos da vaga em que o candidato pode se aprofundar.",
    "4. type \"studyPlans\" (section \"Plano de estudos\"): content é o plano semana a semana, cada item com week (número começando em 1), focus (foco da semana) e goals (metas concretas da semana). O plano deve cobrir as lacunas na ordem de prioridade, com entre 4 e 8 semanas.",
    "5. type \"finalTip\" (section \"Dica final\"): content é um texto curto com uma dica prática para a reta final da preparação e para a entrevista dessa vaga.",
    "",
    "Seja objetivo: os textos devem ser úteis e específicos para a vaga, sem frases genéricas."
].join("\n");

// Prompt que seleciona as vagas aderentes ao perfil do usuário
const VACANCY_FILTER_PROMPT = [
    "Você é um recrutador técnico que recomenda vagas de tecnologia para candidatos.",
    "Você recebe em JSON as habilidades do candidato (Habilidades, com nível de 0 a 10), suas experiências profissionais (Experiencias_profissionais) e uma lista de vagas (Vagas).",
    "Selecione as vagas em que o candidato tem boa chance de ser aprovado, considerando:",
    "- se o candidato domina as principais tecnologias exigidas pela vaga;",
    "- se a senioridade da vaga é compatível com o tempo e o tipo de experiência do candidato;",
    "- se a área de atuação da vaga tem relação com as experiências do candidato.",
    "Retorne em ids apenas os ids das vagas selecionadas, ordenados da mais para a menos aderente.",
    "Use somente ids que existem na lista de vagas recebida, copiados exatamente como estão, sem repetir.",
    "Se nenhuma vaga for aderente, ou se o candidato não tiver habilidades nem experiências, retorne ids vazio."
].join("\n");

export class HundleStudyWithOpenAi {
    async getImportantSkills(skills: SkillDTO[], experiences: ExperienceDTO[], vacancy: VacancyDTO): Promise<SkillsAndExperienceComparisonResponse | null> {
        try {

            const data = {
                skills,
                experiences,
                vacancy
            }

            const response = await openai.responses.create({
                model: STUDY_MODEL,
                instructions: SKILLS_COMPARISON_PROMPT,
                input: JSON.stringify(data),
                text: {
                    "format": {
                        "type": "json_schema",
                        "name": "tech_stack_comparison",
                        "strict": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "missing": {
                                    "type": "array",
                                    "description": "Lista de tecnologias que estão faltando na pilha.",
                                    "items": {
                                        "type": "string",
                                        "minLength": 1
                                    }
                                },
                                "strong": {
                                    "type": "array",
                                    "description": "Lista de tecnologias nas quais há proficiência.",
                                    "items": {
                                        "type": "string",
                                        "minLength": 1
                                    }
                                },
                                "matchPercentage": {
                                    "type": "number",
                                    "description": "Percentual de correspondência entre as tecnologias.",
                                    "minimum": 0,
                                    "maximum": 100
                                }
                            },
                            "required": [
                                "missing",
                                "strong",
                                "matchPercentage"
                            ],
                            "additionalProperties": false
                        }
                    }
                },
                max_output_tokens: 2048,
                store: false
            });

            const raw = response.output_text;

            if (!raw) return null;

            const parsed: SkillsAndExperienceComparisonResponse = JSON.parse(raw);
            return parsed;

        } catch (error: any) {
            console.error("Erro ao comparar habilidades com a vaga:", error);
            return null
        }
    }

    async createResumeCandidate(skills: SkillDTO[], experiences: ExperienceDTO[]): Promise<string | null> {
        try {

            const data = {
                skills,
                experiences
            }

            const response = await openai.responses.create({
                model: STUDY_MODEL,
                instructions: CANDIDATE_RESUME_PROMPT,
                input: JSON.stringify(data),
                text: {
                    "format": {
                        "type": "text"
                    }
                },
                max_output_tokens: 2048,
                store: false
            });

            const raw = response.output_text;

            if (!raw) return null;

            const parsed: string = raw;
            return parsed;

        } catch (error: any) {
            console.error("Erro ao gerar resumo do candidato:", error);
            return null;
        }
    }

    // O modelo às vezes corta a resposta no limite de tokens e devolve um JSON quebrado, então tentamos de novo
    async createRoadMapCandidate(vacancy: VacancyDTO, profile: any): Promise<string | null> {
        for (let attempt = 1; attempt <= 2; attempt++) {
            const raw = await this.requestRoadMapCandidate(vacancy, profile);

            if (!raw) continue;

            try {
                JSON.parse(raw);
                return raw;
            } catch {
                console.error(`Roadmap do estudo veio com JSON inválido (tentativa ${attempt})`);
            }
        }

        return null;
    }

    private async requestRoadMapCandidate(vacancy: VacancyDTO, profile: any): Promise<string | null> {
        try {

            const data = {
                vacancy,
                profile
            }

            const response = await openai.responses.create({
                model: STUDY_MODEL,
                instructions: STUDY_ROADMAP_PROMPT,
                input: JSON.stringify(data),
                text: {
                    "format": {
                        "type": "json_schema",
                        "name": "study_schema",
                        "strict": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "study_name": {
                                    "type": "string",
                                    "description": "The name or title of the overall study or plan."
                                },
                                "studies": {
                                    "type": "array",
                                    "description": "List of study sections, their type, and associated content.",
                                    "items": {
                                        "type": "object",
                                        "properties": {
                                            "section": {
                                                "type": "string",
                                                "description": "The label or name of this study section."
                                            },
                                            "content": {
                                                "anyOf": [
                                                    {
                                                        "type": "string",
                                                        "description": "Summary content for type 'resume'."
                                                    },
                                                    {
                                                        "type": "array",
                                                        "description": "List of strengths for type 'strengths'.",
                                                        "items": {
                                                            "type": "object",
                                                            "properties": {
                                                                "skill": {
                                                                    "type": "string",
                                                                    "description": "Name of the strength or skill."
                                                                },
                                                                "importance": {
                                                                    "type": "string",
                                                                    "description": "Description or level of importance."
                                                                },
                                                                "advice": {
                                                                    "type": "string",
                                                                    "description": "Suggested advice related to the skill."
                                                                }
                                                            },
                                                            "required": [
                                                                "skill",
                                                                "importance",
                                                                "advice"
                                                            ],
                                                            "additionalProperties": false
                                                        }
                                                    },
                                                    {
                                                        "type": "array",
                                                        "description": "Relevant lacunae to develop and their details for type 'lacunasaDevelop'.",
                                                        "items": {
                                                            "type": "object",
                                                            "properties": {
                                                                "skill": {
                                                                    "type": "string",
                                                                    "description": "The skill identified for development."
                                                                },
                                                                "explanation": {
                                                                    "type": "string",
                                                                    "description": "Explanation for needing development."
                                                                },
                                                                "priority": {
                                                                    "type": "string",
                                                                    "description": "Priority level for development."
                                                                },
                                                                "topics": {
                                                                    "type": "array",
                                                                    "description": "List of specific topics related to the skill.",
                                                                    "items": {
                                                                        "type": "string"
                                                                    }
                                                                },
                                                                "resources": {
                                                                    "type": "array",
                                                                    "description": "Recommended resources for learning.",
                                                                    "items": {
                                                                        "type": "string"
                                                                    }
                                                                },
                                                                "estimated_time": {
                                                                    "type": "string",
                                                                    "description": "Estimated time needed for development."
                                                                }
                                                            },
                                                            "required": [
                                                                "skill",
                                                                "explanation",
                                                                "priority",
                                                                "topics",
                                                                "resources",
                                                                "estimated_time"
                                                            ],
                                                            "additionalProperties": false
                                                        }
                                                    },
                                                    {
                                                        "type": "array",
                                                        "description": "Study plans for type 'studyPlans'.",
                                                        "items": {
                                                            "type": "object",
                                                            "properties": {
                                                                "week": {
                                                                    "type": "number",
                                                                    "description": "Week number in the study plan.",
                                                                    "minimum": 1
                                                                },
                                                                "focus": {
                                                                    "type": "string",
                                                                    "description": "Primary focus or highlights for this week."
                                                                },
                                                                "goals": {
                                                                    "type": "string",
                                                                    "description": "Goals set for this week."
                                                                }
                                                            },
                                                            "required": [
                                                                "week",
                                                                "focus",
                                                                "goals"
                                                            ],
                                                            "additionalProperties": false
                                                        }
                                                    }
                                                ]
                                            },
                                            "type": {
                                                "type": "string",
                                                "description": "The section type (resume, strengths, lacunasaDevelop, studyPlans, finalTip).",
                                                "enum": [
                                                    "resume",
                                                    "strengths",
                                                    "lacunasaDevelop",
                                                    "studyPlans",
                                                    "finalTip"
                                                ]
                                            }
                                        },
                                        "required": [
                                            "section",
                                            "content",
                                            "type"
                                        ],
                                        "additionalProperties": false
                                    }
                                }
                            },
                            "required": [
                                "study_name",
                                "studies"
                            ],
                            "additionalProperties": false
                        }
                    }
                },
                max_output_tokens: 5700,
                store: false
            });

            const raw = response.output_text;

            if (!raw) return null;

            const parsed: string = raw;
            return parsed;

        } catch (error: any) {
            console.error("Erro ao gerar roadmap do estudo:", error);
            return null;
        }
    }

    // Gera as 5 perguntas de múltipla escolha sobre a lacuna que o usuário precisa estudar
    async createQuizGap(studyTitle: string, gapSkill: string, gapContent: string): Promise<GeneratedQuiz | null> {
        try {
            const response = await openai.responses.create({
                model: process.env.OPENAI_QUIZ_MODEL ?? "gpt-4.1-mini",
                instructions: [
                    "Você é um avaliador técnico que cria quizzes para uma plataforma de estudos de carreira.",
                    `Crie exatamente ${QUIZ_QUESTIONS_PER_LEVEL} perguntas de múltipla escolha em português do Brasil que avaliem se o candidato aprendeu a competência informada.`,
                    "As perguntas devem cobrar o conhecimento técnico dos tópicos (conceitos, uso prático e boas práticas), como em uma entrevista técnica, e não o texto da descrição.",
                    "Cada pergunta deve ter exatamente 4 alternativas, apenas uma correta, e cobrir um tópico diferente sempre que possível.",
                    "Use um nível de dificuldade compatível com a vaga do estudo.",
                    "Varie a posição da alternativa correta entre as perguntas.",
                    "A explicação deve dizer em 1 ou 2 frases por que a alternativa correta está certa."
                ].join(" "),
                input: JSON.stringify({
                    estudo: studyTitle,
                    competencia: gapSkill,
                    conteudo: gapContent
                }),
                text: {
                    format: {
                        type: "json_schema",
                        name: "quiz_lacuna_estudo",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                questions: {
                                    type: "array",
                                    minItems: QUIZ_QUESTIONS_PER_LEVEL,
                                    maxItems: QUIZ_QUESTIONS_PER_LEVEL,
                                    items: {
                                        type: "object",
                                        properties: {
                                            question: { type: "string" },
                                            options: {
                                                type: "array",
                                                minItems: 4,
                                                maxItems: 4,
                                                items: { type: "string" }
                                            },
                                            answerIndex: {
                                                type: "integer",
                                                description: "Índice (0 a 3) da alternativa correta."
                                            },
                                            explanation: { type: "string" }
                                        },
                                        required: ["question", "options", "answerIndex", "explanation"],
                                        additionalProperties: false
                                    }
                                }
                            },
                            required: ["questions"],
                            additionalProperties: false
                        }
                    }
                },
                store: false
            });

            const raw = response.output_text;

            if (!raw) return null;

            const parsed: GeneratedQuiz = JSON.parse(raw);

            // Garante que o modelo respeitou o formato antes de salvar na base
            const valid = parsed.questions.filter((q) =>
                q.question &&
                Array.isArray(q.options) &&
                q.options.length == 4 &&
                Number.isInteger(q.answerIndex) &&
                q.answerIndex >= 0 &&
                q.answerIndex < 4
            );

            if (valid.length < QUIZ_QUESTIONS_PER_LEVEL) return null;

            return { questions: valid.slice(0, QUIZ_QUESTIONS_PER_LEVEL) };

        } catch (error: any) {
            console.error("Erro ao gerar quiz da lacuna:", error);
            return null;
        }
    }

    async filterVacancysToUser(skills: SkillDTO[], experiences: ExperienceDTO[], vacancys: VacancyDTO[]): Promise<string | null> {
        try {

            const data = {
                "Habilidades": skills,
                "Experiencias_profissionais": experiences,
                "Vagas": vacancys
            }

            const response = await openai.responses.create({
                model: VACANCY_FILTER_MODEL,
                instructions: VACANCY_FILTER_PROMPT,
                input: JSON.stringify(data),
                text: {
                    "format": {
                        "type": "json_schema",
                        "name": "array_de_ids",
                        "strict": true,
                        "schema": {
                            "type": "object",
                            "properties": {
                                "ids": {
                                    "type": "array",
                                    "description": "Array de IDs encontrados. Se nenhum for encontrado, retorna array vazio.",
                                    "items": {
                                        "type": "string",
                                        "description": "ID único no formato alfanumérico de 24 caracteres minúsculos."
                                    }
                                }
                            },
                            "required": [
                                "ids"
                            ],
                            "additionalProperties": false
                        }
                    }
                },
                store: false
            });

            const res = response.output_text;

            if (!res) return null;

            const parsed: string = res;
            return parsed;

        } catch (error: any) {
            console.error("Erro ao filtrar vagas do usuário:", error);
            return null;
        }
    }
}



