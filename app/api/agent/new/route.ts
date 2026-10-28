import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { startNewHistory } from "@/lib/services/agent";

// Encerra a conversa atual com o agente e cria um novo histórico
export async function POST(req: Request) {
  try {
    const { studyId } = await req.json().catch(() => ({}));

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, history: null, message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const res = await startNewHistory(session.user.id, studyId || null);

    return NextResponse.json(res, { status: res.status ? 200 : 404 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, history: null, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
