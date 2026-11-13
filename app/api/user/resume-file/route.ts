import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getResumeFile, pdfResponseHeaders, removeUserResume, uploadUserResume } from "@/lib/services/userResume";

// Anexa (ou substitui) o currículo do usuário no bucket
export async function POST(req: Request) {
  const { session, error } = await requireRole(req, ["user", "admin"]);
  if (error) return error;

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ status: false, message: "Envie o arquivo do currículo" }, { status: 400 });
    }

    const res = await uploadUserResume(session.user.id, file, formData.get("visible") === "true");

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, message: "Não conseguimos salvar o currículo agora" }, { status: 500 });
  }
}

// Baixa o próprio currículo
export async function GET(req: Request) {
  const { session, error } = await requireRole(req, ["user", "admin"]);
  if (error) return error;

  try {
    const file = await getResumeFile(session.user.id, false);

    if (!file) {
      return NextResponse.json({ status: false, message: "Currículo não encontrado" }, { status: 404 });
    }

    return new NextResponse(Buffer.from(file.bytes), { headers: pdfResponseHeaders(file.fileName) });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { session, error } = await requireRole(req, ["user", "admin"]);
  if (error) return error;

  try {
    const res = await removeUserResume(session.user.id);
    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
