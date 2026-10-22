import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { confirmResume } from "@/lib/services/resume";

const resumeSchema = z.object({
  skills: z.array(z.object({
    name: z.string().min(1).max(120),
    level: z.number(),
    about: z.string().max(2000).default(""),
  })).max(100),
  experiences: z.array(z.object({
    name: z.string().min(1).max(200),
    seniority: z.string().max(40),
    about: z.string().max(5000).default(""),
    startDate: z.string().nullable(),
    endDate: z.string().nullable(),
    currentJob: z.boolean(),
  })).max(50),
});

// Aplica no perfil as experiências e habilidades que o usuário confirmou
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const parsed = resumeSchema.safeParse(await req.json());

    if (!parsed.success) {
      return NextResponse.json(
        { status: false, message: "Dados do currículo inválidos" },
        { status: 400 }
      );
    }

    const res = await confirmResume(session.user.id, { isResume: true, ...parsed.data });

    return NextResponse.json(res);
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
