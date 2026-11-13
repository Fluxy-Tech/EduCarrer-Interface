import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { deleteVacancy, getVacancyByIdAdmin, updateVacancy } from "@/lib/services/vacancy";

// Exclusão de vaga pelo admin (inclusive as cadastradas por recrutadores)
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { status: false, message: "Não encontramos a sessão do usuário ou usuário não é administrador" },
        { status: 401 }
      );
    }

    const res = await deleteVacancy(id);

    return NextResponse.json(res, { status: res.status ? 200 : 404 });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

// Vaga pelo id para a tela de edição do admin
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user || session.user.role !== "admin") {
      return NextResponse.json(
        { status: false, vacancy: null, message: "Não encontramos a sessão do usuário ou usuário não é administrador" },
        { status: 401 }
      );
    }

    const vacancy = await getVacancyByIdAdmin(id);

    if (!vacancy) {
      return NextResponse.json(
        { status: false, vacancy: null, message: "Vaga não encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({ status: true, vacancy, message: "Sucesso na consulta da vaga" });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      { status: false, vacancy: null, message: "Erro interno no servidor" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      {
        status: false,
        vacancy: null,
        message: "ID da vaga não fornecido"
      },
      { status: 400 }
    );
  }
  
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

  try {

    const vacancy = await updateVacancy(
      id,
      { title, description, company, modality, level, technologies, link, origin, location, salary, active }
    );

    return NextResponse.json({
      status: true,
      vacancy: vacancy,
      message: "Sucesso na atualização da vaga"
    });
  } catch (e: any) {
    console.error(e);

    return NextResponse.json(
      {
        status: false,
        vacancy: null,
        message: "Erro interno no servidor da vaga"
      },
      { status: 500 }
    );
  }
}