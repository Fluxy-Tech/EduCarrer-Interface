import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getResumeFile, pdfResponseHeaders } from "@/lib/services/userResume";

// Download do currículo de um candidato. Só funciona se o candidato autorizou a visibilidade
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireRole(req, ["recruiter", "admin"]);
  if (error) return error;

  try {
    const { id } = await params;
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
