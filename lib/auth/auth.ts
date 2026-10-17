import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { admin } from "better-auth/plugins";
import { prisma } from "../prisma";
import nodemailer from "nodemailer";
import { ResetPassword } from "@/lib/services/resetPassword";

const PORT = process.env.PORT ?? "5401"

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  session: {
    expiresIn: 60 * 60 * 24 * 30, // 30 dias
    updateAge: 60 * 60 * 24, // renova a cada 1 dia
  },

  emailAndPassword: {
    enabled: true,
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hora (mantenha em sincronia com checkIfUserHaveSolicitationOpend)
    sendResetPassword: async ({ user, url, token }) => {
      sendEmailUser(
        user.email,
        url,
        token
      );
    },
    onPasswordReset: async ({ user }, request) => {
      console.log(`Senha do usuario alterada com sucesso: ${user.email}`);
    },
    requireEmailVerification: false,
  },
  plugins: [
    admin({
      impersonationSessionDuration: 60 * 60 * 24, // 24 hours
    })
  ],
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? `http://localhost:${PORT}`],
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL ?? `http://localhost:${PORT}`,
})

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.PASSWORD_GOOGLE,
  },
});

export async function sendEmailUser(email: string, url: string, token: string) {
  const resetPassword = new ResetPassword();

  resetPassword.createResetPasswordByTokenAndEmailUser(token, email);

  try {
    const resetLink = `${url}/${token}`;
    await transporter.sendMail({
      from: `"EduCarrer AI" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Recuperação de senha",
      html: `
        <div style="font-family: Arial; padding: 20px;">
          <h2>Recuperação de senha</h2>
          <p>Você solicitou a alteração da sua senha.</p>
          <p>Clique no botão abaixo para redefinir:</p>

          <a href="${resetLink}" 
             style="display:inline-block;
                    padding:10px 20px;
                    background:#007bff;
                    color:#fff;
                    text-decoration:none;
                    border-radius:5px;">
            Redefinir senha
          </a>

          <p style="margin-top:20px;">
            Ou copie o link abaixo:<br/>
            ${resetLink}
          </p>
        </div>
      `,
    });

    return true;
  } catch (error) {
    console.error("Erro ao enviar email:", error);
    return false;
  }
}