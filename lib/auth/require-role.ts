import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { UserRole } from "@/lib/users/roles";

type Session = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

// Valida a sessão e o perfil nas rotas da API. Devolve a sessão ou a resposta de erro pronta
export async function requireRole(
    req: Request,
    roles: UserRole[]
): Promise<{ session: Session; error: null } | { session: null; error: NextResponse }> {
    const session = await auth.api.getSession({ headers: req.headers });

    if (!session?.user) {
        return {
            session: null,
            error: NextResponse.json({ status: false, message: "Não encontramos a sessão do usuário" }, { status: 401 }),
        };
    }

    if (!roles.includes((session.user.role ?? "user") as UserRole)) {
        return {
            session: null,
            error: NextResponse.json({ status: false, message: "Seu perfil não tem acesso a este recurso" }, { status: 403 }),
        };
    }

    return { session, error: null };
}
