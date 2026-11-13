import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getUsersRanking } from "@/lib/services/ranking";
import { isAreaOfInterest } from "@/lib/users/roles";

// Ranking de candidatos com filtro por área de interesse e por stack (habilidade)
export async function GET(req: Request) {
  const { session, error } = await requireRole(req, ["recruiter", "admin"]);
  if (error) return error;

  try {
    const params = new URL(req.url).searchParams;
    const area = params.get("area");
    const stack = (params.get("stack") ?? "").trim().slice(0, 60);

    const ranking = await getUsersRanking({
      area: area && isAreaOfInterest(area) ? area : null,
      stack: stack || null,
      viewerId: session.user.id,
      viewerIsAdmin: session.user.role === "admin",
    });

    return NextResponse.json({ status: true, ranking, message: "Sucesso na consulta" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, ranking: [], message: "Erro interno no servidor" }, { status: 500 });
  }
}
