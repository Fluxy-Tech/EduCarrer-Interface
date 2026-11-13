import { timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { handleAsaasWebhook } from "@/lib/services/billing";

// O Asaas envia o token configurado no webhook no header asaas-access-token
function isAuthorized(req: Request) {
  const expected = process.env.ASAAS_WEBHOOK_TOKEN ?? "";
  const received = req.headers.get("asaas-access-token") ?? "";

  if (!expected || received.length !== expected.length) return false;

  return timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

// Webhook de pagamentos do Asaas: libera créditos quando a cobrança é paga
export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ received: false }, { status: 401 });
  }

  try {
    const body = await req.json();

    await handleAsaasWebhook(body);

    return NextResponse.json({ received: true });
  } catch (e: any) {
    // Erro 500 faz o Asaas reenviar o evento depois (o processamento é idempotente)
    console.error("Erro ao processar webhook do Asaas:", e);

    return NextResponse.json({ received: false }, { status: 500 });
  }
}
