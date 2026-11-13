import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getStudyWithoutSessionByUserId, createStudy } from "@/lib/services/study";
import { insufficientCreditsResponse } from "@/lib/services/credits";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, studies: [], message: "Não encontramos a sessão do usuario" },
        { status: 401 }
      );
    }

    const user = session.user;

    const studies = await getStudyWithoutSessionByUserId(user.id);

    return NextResponse.json({
      status: true,
      studies,
      message: "Sucesso na consulta dos estudos do usuário"
    });
  } catch (e: any) {
    return NextResponse.json({
      status: false,
      studies: [],
      message: "Erro interno no servidor"
    })
  }
}

export async function POST(req: Request) {
  try {
    const { idVacancy } = await req.json();

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const user = session.user;

    const studies = await createStudy(idVacancy, user.id);

    if ("insufficient" in studies && studies.insufficient && !studies.insufficient.ok) {
      return insufficientCreditsResponse(studies.insufficient);
    }

    return NextResponse.json(
      studies,
      { status: 200 }
    );
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      {
        status: false,
        message: "Erro interno no servidor"
      },
      { status: 500 }
    );
  }
}