import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getCandidateDetails } from "@/lib/services/candidates";

// Habilidades, experiências, estudos concluídos e links do candidato. Exige desbloqueio ativo (admin vê direto)
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(req, ["recruiter", "admin"]);
  if (error) return error;

  try {
    const { id } = await params;
    const res = await getCandidateDetails({ id: session.user.id, isAdmin: session.user.role === "admin" }, id);

    if (!res.status) {
      return NextResponse.json(res, { status: res.locked ? 403 : 404 });
    }

    return NextResponse.json(res);
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
