import OpenAI from "openai";
import type { GeneratedResume } from "@/lib/interfaces/openai.interface";
import skillsCatalog from "@/components/dialog/skills.json";

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const RESUME_SENIORITIES = ["Junior", "Pleno", "Sênior"];

// Mesmos nomes do cadastro manual, assim a habilidade do currículo casa com a já cadastrada
const SKILL_NAMES = Object.values(skillsCatalog as Record<string, string[]>).flat();

export class HundleResumeWithOpenAi {

    // Lê o PDF do currículo e extrai as experiências profissionais e as habilidades
    async extractResume(fileName: string, fileBase64: string): Promise<GeneratedResume | null> {
        try {
            const response = await openai.responses.create({
                model: process.env.OPENAI_RESUME_MODEL ?? "gpt-4.1-mini",
                instructions: [
                    "Você é um recrutador técnico que lê currículos para preencher o perfil profissional de um candidato.",
                    "Extraia somente o que estiver escrito no currículo, sem inventar informações.",
                    "Se o documento não for um currículo, responda isResume como false e listas vazias.",
                    "Experiências: uma por cargo ocupado. O campo name deve seguir o formato 'Cargo - Empresa'.",
                    `A senioridade deve ser uma de: ${RESUME_SENIORITIES.join(", ")}. Deduza pelo cargo e pelo tempo de experiência quando não estiver explícita.`,
                    "O campo about deve resumir em português as atividades e resultados daquela experiência.",
                    "Datas no formato YYYY-MM; use null quando não houver. Se for o emprego atual, currentJob é true e endDate é null.",
                    "Habilidades: técnicas e comportamentais citadas ou claramente praticadas nas experiências, sem repetir.",
                    "Quando a habilidade existir no catálogo informado, use exatamente o nome do catálogo.",
                    "O level vai de 1 a 10 (1 a 3 iniciante, 4 a 6 intermediário, 7 a 8 profissional, 9 a 10 especialista), estimado pelo tempo e profundidade de uso descritos.",
                    "O about da habilidade deve dizer em 1 ou 2 frases onde e como ela foi usada."
                ].join(" "),
                input: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "input_file",
                                filename: fileName,
                                file_data: `data:application/pdf;base64,${fileBase64}`
                            },
                            {
                                type: "input_text",
                                text: JSON.stringify({ catalogoDeHabilidades: SKILL_NAMES })
                            }
                        ]
                    }
                ],
                text: {
                    format: {
                        type: "json_schema",
                        name: "leitura_curriculo",
                        strict: true,
                        schema: {
                            type: "object",
                            properties: {
                                isResume: { type: "boolean" },
                                skills: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            name: { type: "string" },
                                            level: { type: "integer" },
                                            about: { type: "string" }
                                        },
                                        required: ["name", "level", "about"],
                                        additionalProperties: false
                                    }
                                },
                                experiences: {
                                    type: "array",
                                    items: {
                                        type: "object",
                                        properties: {
                                            name: { type: "string" },
                                            seniority: { type: "string", enum: RESUME_SENIORITIES },
                                            about: { type: "string" },
                                            startDate: { type: ["string", "null"] },
                                            endDate: { type: ["string", "null"] },
                                            currentJob: { type: "boolean" }
                                        },
                                        required: ["name", "seniority", "about", "startDate", "endDate", "currentJob"],
                                        additionalProperties: false
                                    }
                                }
                            },
                            required: ["isResume", "skills", "experiences"],
                            additionalProperties: false
                        }
                    }
                },
                store: false
            });

            const raw = response.output_text;

            if (!raw) return null;

            return JSON.parse(raw) as GeneratedResume;

        } catch (error: any) {
            console.error("Erro ao ler currículo:", error);
            return null;
        }
    }
}
