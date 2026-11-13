import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { createRecruiterVacancy, getVacanciesByRecruiter } from "@/lib/services/vacancy";

// Vagas cadastradas pelo recrutador logado
export async function GET(req: Request) {
  const { session, error } = await requireRole(req, ["recruiter", "admin"]);
  if (error) return error;

  try {
    const vacancies = await getVacanciesByRecruiter(session.user.id);
    return NextResponse.json({ status: true, vacancies, message: "Sucesso na consulta" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, vacancies: [], message: "Erro interno no servidor" }, { status: 500 });
  }
}

// Cadastro de vaga pelo recrutador (fica visível para os usuários e para o admin)
export async function POST(req: Request) {
  const { session, error } = await requireRole(req, ["recruiter", "admin"]);
  if (error) return error;

  try {
    const { title, description, company, modality, level, technologies, link, origin, location, salary, active } = await req.json();

    if (!title || !company || !Array.isArray(technologies) || technologies.length === 0) {
      return NextResponse.json({ status: false, vacancy: null, message: "Preencha título, empresa e tecnologias" }, { status: 400 });
    }

    const vacancy = await createRecruiterVacancy(session.user.id, {
      title, description, company, modality, level, technologies, link, origin, location, salary, active: active ?? true,
    });

    return NextResponse.json({ status: true, vacancy, message: "Vaga cadastrada com sucesso" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, vacancy: null, message: "Erro interno no servidor" }, { status: 500 });
  }
}
