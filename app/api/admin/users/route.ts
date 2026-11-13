import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { listUsersAdmin } from "@/lib/services/adminUsers";

// Usuários da plataforma com o perfil de cada um
export async function GET(req: Request) {
  const { error } = await requireRole(req, ["admin"]);
  if (error) return error;

  try {
    const params = new URL(req.url).searchParams;
    const users = await listUsersAdmin(params.get("search") ?? "", params.get("role"));

    return NextResponse.json({ status: true, users, message: "Sucesso na consulta" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, users: [], message: "Erro interno no servidor" }, { status: 500 });
  }
}
