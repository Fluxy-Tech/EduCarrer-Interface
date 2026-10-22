import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { analyzeResume } from "@/lib/services/resume";

// Recebe o PDF do currículo e devolve as experiências e habilidades encontradas para o usuário revisar
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, analysis: null, message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { status: false, analysis: null, message: "Envie o arquivo do currículo" },
        { status: 400 }
      );
    }

    const res = await analyzeResume(session.user.id, file);

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, analysis: null, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
