import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { getVacancys, createVacancy } from "@/lib/services/vacancy";

export async function GET(req: Request) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      return NextResponse.json(
        { status: false, vacancys: [], message: "Não encontramos a sessão do usuario" },
        { status: 401 }
      );
    }

    const { vacancys, filteredAt, nextFreeRefreshAt } = await getVacancys(session.user.id);

    return NextResponse.json({
      status: vacancys.length > 0,
      vacancys,
      filteredAt,
      nextFreeRefreshAt,
      message: vacancys.length > 0  ? "Sucesso na consulta" : "Não encontramos uma vaga de acordo com seu perfil"
    });
  } catch (e: any) {
    return NextResponse.json({
      status: false,
      vacancys: [],
      message: "Erro interno no servidor"
    })
  }
}

export async function POST(req: Request) {
  try {
    const { title, description, company, modality, level, technologies, link, origin, location, salary, active } = await req.json();

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { status: false, vacancy: null, message: "Não encontramos a sessão do usuário ou usuário não é administrador" },
        { status: 401 }
      );
    }

    const vacancy = await createVacancy({ title, description, company, modality, level, technologies, link, origin, location, salary, active });

    return NextResponse.json(
      { status: true, vacancy: vacancy, message: "Sucesso na criação da vaga" },
      { status: 200 }
    );
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      {
        status: false,
        vacancy: null,
        message: "Erro interno no servidor"
      },
      { status: 500 }
    );
  }
}