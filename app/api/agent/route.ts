import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { AGENT_MAX_MESSAGE_LENGTH, getCurrentHistory, sendMessageToAgent } from "@/lib/services/agent";

// Sem studyId é o agente da plataforma (perfil), com studyId é o tutor do estudo
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, history: null, message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const studyId = new URL(req.url).searchParams.get("studyId") || null;

    const res = await getCurrentHistory(session.user.id, studyId);

    return NextResponse.json(res, { status: res.status ? 200 : 404 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, history: null, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { text, studyId } = await req.json();

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, messages: [], message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const message = typeof text == "string" ? text.trim() : "";

    if (!message || message.length > AGENT_MAX_MESSAGE_LENGTH) {
      return NextResponse.json(
        { status: false, messages: [], message: `Envie uma mensagem de até ${AGENT_MAX_MESSAGE_LENGTH} caracteres` },
        { status: 400 }
      );
    }

    const res = await sendMessageToAgent(session.user.id, message, studyId || null);

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, messages: [], message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
