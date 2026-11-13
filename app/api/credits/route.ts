import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getCreditsSummary } from "@/lib/services/credits";

// Saldo de créditos, plano, assinatura, cobranças em aberto e extrato do usuário
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, credits: null, message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const credits = await getCreditsSummary(session.user.id);

    return NextResponse.json({ status: true, credits, message: "Sucesso na consulta dos créditos" });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, credits: null, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
