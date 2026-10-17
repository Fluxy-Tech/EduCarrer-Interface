import { VacancyDTO } from "@/lib/interfaces/vacancy.interface";
import { ExperienceDTO } from "@/lib/interfaces/experience.interface";
import { SkillDTO } from "@/lib/interfaces/skill.interface";

import type { SkillsAndExperienceComparisonResponse, GeneratedQuiz } from "@/lib/interfaces/openai.interface";
import { QUIZ_QUESTIONS_PER_LEVEL } from "@/lib/utils/studyLevels";

import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export class HundleStudyWithOpenAi {
    async getImportantSkills(skills: SkillDTO[], experiences: ExperienceDTO[], vacancy: VacancyDTO): Promise<SkillsAndExperienceComparisonResponse | null> {
        try {

            const data = {
                skills,
                experiences,
                vacancy
            }

            const response = await openai.responses.create({
                prompt: {
                    "id": "pmpt_69fa7f7173088190a697894bf8c62fc70af22ad626ad94d2",
                    "version": "2"
                },
                input: [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": JSON.stringify(data)
                            }
                        ]
                    }
                ],
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
                reasoning: {},
                max_output_tokens: 2048,
                store: true,
                include: ["web_search_call.action.sources"]
            });

            const raw = ((response.output as any)?.[0]?.content?.[0]?.text) ?? null;

            if (!raw) return null;

            const parsed: SkillsAndExperienceComparisonResponse = JSON.parse(raw);
            return parsed;

        } catch (error: any) {
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
                prompt: {
                    "id": "pmpt_6a0a63b732e4819398cd1c5d96c6e9940abad56442d1f780",
                    "version": "1"
                },
                input: [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": JSON.stringify(data)
                            }
                        ]
                    }
                ],
                text: {
                    "format": {
                        "type": "text"
                    }
                },
                reasoning: {},
                max_output_tokens: 2048,
                store: true,
                include: ["web_search_call.action.sources"]
            });

            const raw = ((response.output as any)?.[0]?.content?.[0]?.text) ?? null;

            if (!raw) return null;

            const parsed: string = raw;
            return parsed;

        } catch (error: any) {
            return null;
        }
    }

    async createRoadMapCandidate(vacancy: VacancyDTO, profile: any): Promise<string | null> {
        try {

            const data = {
                vacancy,
                profile
            }

            const response = await openai.responses.create({
                prompt: {
                    "id": "pmpt_6a0ceb3ed4e08196a7b2e1452e0407f800520187412e4817",
                    "version": "3"
                },
                input: [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": JSON.stringify(data)
                            }
                        ]
                    }
                ],
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
                reasoning: {},
                max_output_tokens: 5700,
                store: true,
                include: ["web_search_call.action.sources"]
            });

            const raw = ((response.output as any)?.[0]?.content?.[0]?.text) ?? null;

            if (!raw) return null;

            const parsed: string = raw;
            return parsed;

        } catch (error: any) {
            return null;
        }
    }

    // Gera as 5 perguntas de múltipla escolha que liberam o próximo nível do estudo
    async createQuizSection(studyTitle: string, sectionTitle: string, sectionContent: string): Promise<GeneratedQuiz | null> {
        try {
            const response = await openai.responses.create({
                model: process.env.OPENAI_QUIZ_MODEL ?? "gpt-4.1-mini",
                instructions: [
                    "Você é um avaliador técnico que cria quizzes de fixação para uma plataforma de estudos de carreira.",
                    `Crie exatamente ${QUIZ_QUESTIONS_PER_LEVEL} perguntas de múltipla escolha em português do Brasil sobre o conteúdo informado.`,
                    "Cada pergunta deve ter exatamente 4 alternativas, apenas uma correta, e cobrir um ponto diferente do conteúdo.",
                    "As perguntas devem verificar compreensão e aplicação prática, não apenas memorização de frases.",
                    "Varie a posição da alternativa correta entre as perguntas.",
                    "A explicação deve dizer em 1 ou 2 frases por que a alternativa correta está certa."
                ].join(" "),
                input: JSON.stringify({
                    estudo: studyTitle,
                    secao: sectionTitle,
                    conteudo: sectionContent
                }),
                text: {
                    format: {
                        type: "json_schema",
                        name: "quiz_secao_estudo",
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
            console.error("Erro ao gerar quiz da seção:", error);
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
                prompt: {
                    "id": "pmpt_6a3866e3b58c81948a6038fea67d93bf0c4d07681b003881",
                    "version": "2"
                },
                input: [
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "input_text",
                                "text": JSON.stringify(data)
                            }
                        ]
                    }
                ],
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
                    },
                    "verbosity": "medium"
                },
                reasoning: {
                    "summary": "auto"
                },
                store: false,
                include: [
                    "web_search_call.action.sources"
                ]
            });

            const output = response.output;
            let res;
            for (const out of output) {
                if (out.type == "message" && out.status == "completed") {
                    if(out.content?.[0].type == "output_text"){
                        res = out.content?.[0]?.text;
                    }
                }
            }

            if (!res) return null;

            const parsed: string = res;
            return parsed;

        } catch (error: any) {
            return null;
        }
    }
}



