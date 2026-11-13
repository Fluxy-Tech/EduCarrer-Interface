import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { cancelSubscription, subscribeToPlan } from "@/lib/services/billing";

// Assina ou troca o plano mensal. Retorna a URL da fatura do Asaas (PIX, cartão ou boleto)
export async function POST(req: Request) {
  try {
    const { plan, cpfCnpj } = await req.json();

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const res = await subscribeToPlan(session.user.id, String(plan ?? ""), cpfCnpj ? String(cpfCnpj) : null);

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

// Cancela a renovação da assinatura
export async function DELETE(req: Request) {
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

    const res = await cancelSubscription(session.user.id);

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
