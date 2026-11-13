import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getResumeFile, pdfResponseHeaders } from "@/lib/services/userResume";
import { canViewCandidate } from "@/lib/services/candidates";

// Download do currículo de um candidato: exige desbloqueio ativo e que o candidato tenha liberado o currículo
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(req, ["recruiter", "admin"]);
  if (error) return error;

  try {
    const { id } = await params;

    const allowed = await canViewCandidate({ id: session.user.id, isAdmin: session.user.role === "admin" }, id);
    if (!allowed) {
      return NextResponse.json(
        { status: false, message: "Desbloqueie o candidato para baixar o currículo" },
        { status: 403 }
      );
    }

    const file = await getResumeFile(id, true);

    if (!file) {
      return NextResponse.json(
        { status: false, message: "Este candidato não disponibilizou o currículo" },
        { status: 404 }
      );
    }

    return new NextResponse(Buffer.from(file.bytes), { headers: pdfResponseHeaders(file.fileName) });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
