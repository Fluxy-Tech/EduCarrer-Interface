import { prisma } from "@/lib/prisma";
import { deleteObject, getObjectBytes, putObject, resumeKeyFor } from "@/lib/storage/s3";
import { isAreaOfInterest } from "@/lib/users/roles";

export const USER_RESUME_MAX_SIZE = 5 * 1024 * 1024;

// Confere tamanho, extensão e assinatura do arquivo (todo PDF começa com "%PDF")
async function readPdf(file: File): Promise<{ ok: true; bytes: Uint8Array } | { ok: false; message: string }> {
    if (file.size > USER_RESUME_MAX_SIZE) return { ok: false, message: "O currículo deve ter no máximo 5 MB" };

    const isPdfName = file.name.toLowerCase().endsWith(".pdf") || file.type === "application/pdf";
    if (!isPdfName) return { ok: false, message: "Envie o currículo em PDF" };

    const bytes = new Uint8Array(await file.arrayBuffer());
    const signature = String.fromCharCode(...bytes.slice(0, 4));
    if (signature !== "%PDF") return { ok: false, message: "O arquivo enviado não é um PDF válido" };

    return { ok: true, bytes };
}

function safeFileName(name: string) {
    const clean = name.replace(/[^\w.\- ()À-ú]/g, "").trim().slice(0, 120);
    return clean.toLowerCase().endsWith(".pdf") ? clean : `${clean || "curriculo"}.pdf`;
}

export async function getCareerProfile(userId: string) {
    const user = await prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { areaOfInterest: true, resumeKey: true, resumeFileName: true, resumeVisible: true, resumeUploadedAt: true },
    });

    return {
        areaOfInterest: user.areaOfInterest,
        resume: user.resumeKey
            ? { fileName: user.resumeFileName, visible: user.resumeVisible, uploadedAt: user.resumeUploadedAt }
            : null,
    };
}

// Salva (ou substitui) o currículo do usuário no bucket
export async function uploadUserResume(userId: string, file: File, visible: boolean) {
    const pdf = await readPdf(file);
    if (!pdf.ok) return { status: false, message: pdf.message };

    const previous = await prisma.user.findUnique({ where: { id: userId }, select: { resumeKey: true } });
    const key = resumeKeyFor(userId);

    await putObject(key, pdf.bytes, "application/pdf");

    await prisma.user.update({
        where: { id: userId },
        data: {
            resumeKey: key,
            resumeFileName: safeFileName(file.name),
            resumeVisible: visible,
            resumeUploadedAt: new Date(),
        },
    });

    if (previous?.resumeKey && previous.resumeKey !== key) await deleteObject(previous.resumeKey);

    return {
        status: true,
        message: visible ? "Currículo salvo e visível para recrutadores" : "Currículo salvo. Ele só fica visível para recrutadores se você autorizar.",
    };
}

export async function updateCareerProfile(userId: string, data: { areaOfInterest?: string | null; resumeVisible?: boolean }) {
    const update: { areaOfInterest?: string | null; resumeVisible?: boolean } = {};

    if (data.areaOfInterest !== undefined) {
        if (data.areaOfInterest !== null && !isAreaOfInterest(data.areaOfInterest)) {
            return { status: false, message: "Área de interesse inválida" };
        }
        update.areaOfInterest = data.areaOfInterest;
    }

    if (data.resumeVisible !== undefined) {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { resumeKey: true } });
        if (data.resumeVisible && !user?.resumeKey) {
            return { status: false, message: "Anexe um currículo antes de deixá-lo visível" };
        }
        update.resumeVisible = data.resumeVisible;
    }

    await prisma.user.update({ where: { id: userId }, data: update });

    return { status: true, message: "Perfil atualizado" };
}

export async function removeUserResume(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { resumeKey: true } });

    if (!user?.resumeKey) return { status: false, message: "Você não tem currículo anexado" };

    await prisma.user.update({
        where: { id: userId },
        data: { resumeKey: null, resumeFileName: null, resumeVisible: false, resumeUploadedAt: null },
    });
    await deleteObject(user.resumeKey);

    return { status: true, message: "Currículo removido" };
}

// Arquivo do currículo. Para recrutadores, só quando o usuário autorizou (onlyVisible)
export async function getResumeFile(userId: string, onlyVisible: boolean) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true, resumeKey: true, resumeFileName: true, resumeVisible: true },
    });

    if (!user?.resumeKey || (onlyVisible && !user.resumeVisible)) return null;

    const bytes = await getObjectBytes(user.resumeKey);
    if (!bytes) return null;

    return { bytes, fileName: user.resumeFileName || `curriculo-${(user.name || "candidato").replace(/\s+/g, "-")}.pdf` };
}

export function pdfResponseHeaders(fileName: string) {
    return {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        "Cache-Control": "private, no-store",
    };
}
