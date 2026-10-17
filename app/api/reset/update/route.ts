import { NextResponse } from "next/server";
import { APIError } from "better-auth/api";
import { auth } from "@/lib/auth/auth";
import { ResetPassword } from "@/lib/services/resetPassword";

export async function POST(req: Request) {
  try {
    const { password, token } = await req.json();

    const { status } = await auth.api.resetPassword({
      body: {
        token,
        newPassword: password
      }
    });

    const resetPassword = new ResetPassword();
    await resetPassword.updateResetPasswordByTokenAndEmailUser(token);

    return NextResponse.json({
      status,
      message: status == true ? "Senha atualizada com sucesso" : "Erro ao atualizar senha"
    },
    { status: status ? 200 : 400 }
    );
  } catch (e: any) {
    // O better-auth lança APIError para token inválido/expirado ou senha fora do tamanho permitido
    if (e instanceof APIError) {
      return NextResponse.json(
        {
          status: false,
          message: e.body?.code === "INVALID_TOKEN"
            ? "Este link de redefinição é inválido ou expirou. Solicite um novo link."
            : e.body?.message ?? "Erro ao atualizar senha"
        },
        { status: 400 }
      );
    }

    console.error(e);

    return NextResponse.json(
      {
        status: false,
        message: "Erro interno no servidor"
      },
      { status: 500 }
    );
  }
}
