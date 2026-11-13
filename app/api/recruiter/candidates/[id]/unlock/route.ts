import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { unlockCandidate } from "@/lib/services/candidates";
import { insufficientCreditsResponse } from "@/lib/services/credits";

// Desbloqueia o candidato por 60 dias consumindo créditos do recrutador
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(req, ["recruiter"]);
  if (error) return error;

  try {
    const { id } = await params;
    const res = await unlockCandidate(session.user.id, id);

    if (!res.status && "insufficient" in res && res.insufficient) {
      return insufficientCreditsResponse(res.insufficient);
    }

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
