import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { setUserRole } from "@/lib/services/adminUsers";

// Define o perfil do usuário: user, recruiter ou admin
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireRole(req, ["admin"]);
  if (error) return error;

  try {
    const { id } = await params;
    const { role } = await req.json();

    const res = await setUserRole(session.user.id, id, String(role ?? ""));

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
