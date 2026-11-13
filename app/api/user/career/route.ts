import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require-role";
import { getCareerProfile, updateCareerProfile } from "@/lib/services/userResume";

// Área de interesse e situação do currículo do usuário
export async function GET(req: Request) {
  const { session, error } = await requireRole(req, ["user", "admin"]);
  if (error) return error;

  try {
    const career = await getCareerProfile(session.user.id);
    return NextResponse.json({ status: true, career, message: "Sucesso na consulta" });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, career: null, message: "Erro interno no servidor" }, { status: 500 });
  }
}

// Atualiza a área de interesse e/ou a autorização de visibilidade do currículo
export async function PUT(req: Request) {
  const { session, error } = await requireRole(req, ["user", "admin"]);
  if (error) return error;

  try {
    const { areaOfInterest, resumeVisible, linkedinUrl, portfolioUrl } = await req.json();

    const res = await updateCareerProfile(session.user.id, {
      areaOfInterest: areaOfInterest === undefined ? undefined : (areaOfInterest || null),
      resumeVisible: typeof resumeVisible === "boolean" ? resumeVisible : undefined,
      linkedinUrl: typeof linkedinUrl === "string" || linkedinUrl === null ? linkedinUrl : undefined,
      portfolioUrl: typeof portfolioUrl === "string" || portfolioUrl === null ? portfolioUrl : undefined,
    });

    return NextResponse.json(res, { status: res.status ? 200 : 400 });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ status: false, message: "Erro interno no servidor" }, { status: 500 });
  }
}
