import { prisma } from "@/lib/prisma";
import { UserRole, getRoleLabel, isRole } from "@/lib/users/roles";

// Lista de usuários para o admin definir o perfil (usuário, recrutador ou admin)
export async function listUsersAdmin(search: string, role: string | null) {
    const term = search.trim();

    return await prisma.user.findMany({
        where: {
            ...(role && isRole(role) ? { role } : {}),
            ...(term
                ? { OR: [{ name: { contains: term, mode: "insensitive" } }, { email: { contains: term, mode: "insensitive" } }] }
                : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 200,
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            areaOfInterest: true,
            createdAt: true,
            _count: { select: { study: true, createdVacancies: true } },
        },
    });
}

export async function setUserRole(adminId: string, userId: string, role: string) {
    if (!isRole(role)) return { status: false, message: "Perfil inválido" };

    // Evita que o admin perca o próprio acesso ao painel por engano
    if (adminId === userId && role !== "admin") {
        return { status: false, message: "Você não pode remover o seu próprio perfil de administrador" };
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return { status: false, message: "Usuário não encontrado" };

    await prisma.user.update({ where: { id: userId }, data: { role: role as UserRole } });

    return { status: true, message: `Perfil alterado para ${getRoleLabel(role)}` };
}
