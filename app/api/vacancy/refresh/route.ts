import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { refreshVacancys } from "@/lib/services/vacancy";
import { insufficientCreditsResponse } from "@/lib/services/credits";

// Refaz a filtragem de vagas antes do prazo gratuito, cobrando créditos
export async function POST(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, vacancys: [], message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const res = await refreshVacancys(session.user.id);

    if (!res.status && "insufficient" in res && res.insufficient) {
      return insufficientCreditsResponse(res.insufficient, { vacancys: [] });
    }

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, vacancys: [], message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
