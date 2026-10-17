import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getQuizBySection, submitQuizBySection } from "@/lib/services/studyQuiz";

type Params = { params: Promise<{ id: string; sectionId: string }> };

export async function GET(req: Request, { params }: Params) {
  try {
    const { id, sectionId } = await params;

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, questions: [], message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const res = await getQuizBySection(session.user.id, id, sectionId);

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, questions: [], message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request, { params }: Params) {
  try {
    const { id, sectionId } = await params;
    const { answers } = await req.json();

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const res = await submitQuizBySection(session.user.id, id, sectionId, answers ?? {});

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
