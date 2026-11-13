import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Cliente S3 do SeaweedFS (bucket privado; arquivos só saem pelo servidor depois da checagem de permissão)

let client: S3Client | null = null;

function getClient() {
    if (!client) {
        const endpoint = process.env.SEAWEEDFS_S3_ENDPOINT;
        const accessKeyId = process.env.SEAWEEDFS_S3_ACCESS_KEY;
        const secretAccessKey = process.env.SEAWEEDFS_S3_SECRET_KEY;

        if (!endpoint || !accessKeyId || !secretAccessKey) {
            throw new Error("Variáveis SEAWEEDFS_S3_* não configuradas");
        }

        client = new S3Client({
            endpoint,
            region: process.env.SEAWEEDFS_S3_REGION || "us-east-1",
            credentials: { accessKeyId, secretAccessKey },
            // SeaweedFS usa o bucket no caminho da URL, não no subdomínio
            forcePathStyle: true,
        });
    }

    return client;
}

function getBucket() {
    const bucket = process.env.SEAWEEDFS_S3_BUCKET;
    if (!bucket) throw new Error("SEAWEEDFS_S3_BUCKET não configurado");
    return bucket;
}

// Prefixo dos currículos, separado dos demais arquivos do bucket
export function resumeKeyFor(userId: string) {
    const prefix = (process.env.SEAWEEDFS_S3_RESUME_PREFIX || "curriculos").replace(/^\/+|\/+$/g, "");
    return `${prefix}/${userId}/${Date.now()}.pdf`;
}

export async function putObject(key: string, body: Uint8Array, contentType: string) {
    await getClient().send(new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: body,
        ContentType: contentType,
    }));
}

export async function getObjectBytes(key: string): Promise<Uint8Array | null> {
    try {
        const res = await getClient().send(new GetObjectCommand({ Bucket: getBucket(), Key: key }));
        return res.Body ? await res.Body.transformToByteArray() : null;
    } catch (e: any) {
        if (e?.name === "NoSuchKey" || e?.$metadata?.httpStatusCode === 404) return null;
        throw e;
    }
}

export async function deleteObject(key: string) {
    try {
        await getClient().send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
    } catch (e) {
        console.error("Erro ao remover arquivo do bucket:", e);
    }
}
