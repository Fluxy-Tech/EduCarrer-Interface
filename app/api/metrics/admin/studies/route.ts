import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getStudyEvolutionMetrics } from "@/lib/services/metricsStudies";

// Métricas de evolução dos estudos (funil, distribuição e evolução mensal). Apenas administradores
export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user || session.user.role != "admin") {
      return NextResponse.json(
        { status: false, metrics: null, message: "Não encontramos a sessão do usuário ou usuário não é administrador" },
        { status: 401 }
      );
    }

    const months = Number(new URL(req.url).searchParams.get("months"));
    const metrics = await getStudyEvolutionMetrics([3, 6, 12].includes(months) ? months : 6);

    return NextResponse.json({ status: true, metrics, message: "Sucesso na consulta" });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, metrics: null, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}
