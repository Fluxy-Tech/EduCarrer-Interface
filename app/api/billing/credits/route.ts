import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { buyCreditPackage } from "@/lib/services/billing";

// Gera a cobrança de um pacote de créditos avulsos
export async function POST(req: Request) {
  try {
    const { packageId, cpfCnpj } = await req.json();

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, message: "Não encontramos a sessão do usuário" },
        { status: 401 }
      );
    }

    const res = await buyCreditPackage(session.user.id, String(packageId ?? ""), cpfCnpj ? String(cpfCnpj) : null);

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
