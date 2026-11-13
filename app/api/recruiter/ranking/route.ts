import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getUsersRanking } from "@/lib/services/ranking";
import { isAreaOfInterest } from "@/lib/users/roles";

// Ranking de desempenho dos usuários, com filtro por área de interesse
export async function GET(req: Request) {
  const { error } = await requireRole(req, ["recruiter", "admin"]);
  if (error) return error;

  try {
    const area = new URL(req.url).searchParams.get("area");
    const ranking = await getUsersRanking(area && isAreaOfInterest(area) ? area : null);

    return NextResponse.json({ status: true, ranking, message: "Sucesso na consulta" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, ranking: [], message: "Erro interno no servidor" }, { status: 500 });
  }
}
