import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { analyzeResume } from "@/lib/services/resume";
import { uploadUserResume } from "@/lib/services/userResume";

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

    // Se o usuário marcou a opção, o mesmo PDF fica salvo no bucket e visível para recrutadores
    if (res.status && formData.get("shareWithRecruiters") === "true") {
      try {
        const saved = await uploadUserResume(session.user.id, file, true);
        return NextResponse.json({ ...res, resumeSaved: saved.status }, { status: 200 });
      } catch (e) {
        console.error("Erro ao salvar o currículo no bucket:", e);
        return NextResponse.json({ ...res, resumeSaved: false }, { status: 200 });
      }
    }

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, analysis: null, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
