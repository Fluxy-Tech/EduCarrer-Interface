import { getUserByEmail } from "@/lib/services/user";
import { ResetPasswordRepository } from "@/lib/repositories/resetPassWord";
import { ResetPassWordDTO } from "@/lib/interfaces/resetPassWord.interface";
import { checkIfTheDateTimeHasPassedACertainNumberOfDays } from "@/lib/utils/checkIfTheDateTimeHasPassedACertainNumberOfDays";
import { hundleResetPasswordByEmailUser } from "@/lib/services/user";
import { UserRepository } from "@/lib/repositories/user";

interface ResCheck {
    isValid: boolean
    listResetPassword: ResetPassWordDTO[]
}

interface ResSendEmailResetPassword {
    status: boolean
    message: string
}

export class ResetPassword {

    private baseUrlSystem = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8051";

    async resetPasswordByUserEmail(email: string): Promise<ResSendEmailResetPassword> {

        const user = await getUserByEmail(email);

        if (!user) {
            return {
                status: false,
                message: "Este E-mail não foi encontrado!"
            }
        }

        const resCheck = await this.checkIfUserHaveSolicitationOpend(user.id);

        if (resCheck.isValid == false) {
            return {
                status: resCheck.isValid,
                message: "Este E-mail possui solicitações de reset em aberto, verifique a caixa de entrada ou spam"
            }
        }

        // O better-auth redireciona para `${redirectTo}/${token}?token=...` (ver link montado em sendEmailUser)
        const resSendEmail = await hundleResetPasswordByEmailUser(user.email, `${this.baseUrlSystem}/reset-password`);

        return {
            status: resSendEmail.status,
            message: resSendEmail.key
        }
    }

    async checkIfUserHaveSolicitationOpend(userId: string): Promise<ResCheck> {
        const resetPasswordRepository = new ResetPasswordRepository();

        const resGetResetPasswordRepository = await resetPasswordRepository.getAllResetPassWordOpened(userId);

        console.log("resGetResetPasswordRepository", resGetResetPasswordRepository);

        if (resGetResetPasswordRepository.length == 0) {
            return {
                isValid: true,
                listResetPassword: []
            };
        }

        const resetsOpened: ResetPassWordDTO[] = [];

        for (const reset of resGetResetPasswordRepository) {

            const dateTimeOpend = reset.createdAt;

            // 1/24 dia = 1 hora, mesmo tempo de expiração do token (resetPasswordTokenExpiresIn em auth.ts)
            if (checkIfTheDateTimeHasPassedACertainNumberOfDays(dateTimeOpend, 1 / 24)) {

                // Atualizando na base o reset como concluido por conta do token expirado
                resetPasswordRepository.updateResetPassWord({ completed: true }, reset.id);
            } else {
                resetsOpened.push(reset);
            }
        }

        console.log("resetsOpened", resetsOpened);

        return {
            isValid: resetsOpened.length == 0, // Verifica se na lista resetsOpened
            listResetPassword: resetsOpened
        };
    }

    async getResetPasswordByTokenToReset(tokenToReset: string): Promise<boolean> {
        const resetPasswordRepository = new ResetPasswordRepository();

        const resFilterFirstResetPasswordByToken = await resetPasswordRepository.getResetPassWordByTokenToReset(tokenToReset);

        if( !resFilterFirstResetPasswordByToken ) {
            return false;
        }
        
        const completed = resFilterFirstResetPasswordByToken.completed;                   
        return completed == false ? true : false;
    }

    async createResetPasswordByTokenAndEmailUser(tokenToReset: string, email: string): Promise<ResetPassWordDTO | null> {
        const resetPasswordRepository = new ResetPasswordRepository();
        const userRepository = new UserRepository();

        const user = await userRepository.getUserByEmail(email);

        if (!user) {
            return null;
        }

        const resCreateResetPassword = await resetPasswordRepository.createResetPassWord({
            tokenToReset,
            userId: user.id
        });

        return resCreateResetPassword;
    }

    async updateResetPasswordByTokenAndEmailUser(tokenToReset: string): Promise<boolean> {
        const resetPasswordRepository = new ResetPasswordRepository();

        const resFilterFirstResetPasswordByToken = await resetPasswordRepository.getResetPassWordByTokenToReset(tokenToReset);

        if (!resFilterFirstResetPasswordByToken) {
            return false;
        }
        
        const updateResetPassword = await resetPasswordRepository.updateResetPassWord({ completed: true }, resFilterFirstResetPasswordByToken.id);

        return updateResetPassword ? true : false;
    }
}


