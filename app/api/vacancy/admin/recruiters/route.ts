import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getRecruiterVacanciesAdmin } from "@/lib/services/vacancy";

// Vagas cadastradas por recrutadores, para o admin acompanhar e excluir
export async function GET(req: Request) {
  const { error } = await requireRole(req, ["admin"]);
  if (error) return error;

  try {
    const vacancies = await getRecruiterVacanciesAdmin();
    return NextResponse.json({ status: true, vacancies, message: "Sucesso na consulta" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, vacancies: [], message: "Erro interno no servidor" }, { status: 500 });
  }
}
