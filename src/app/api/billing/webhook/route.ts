import { NextResponse } from "next/server";
import { isMercadoPagoEnabled, MP_ACCESS_TOKEN, MP_API } from "@/lib/billing/config";
import { createAdminClient } from "@/lib/supabase/admin";

// Webhook do Mercado Pago: notificações de assinatura (preapproval).
// Atualiza a tabela subscriptions e o plano da empresa via service_role.
// Sempre responde 200 para o MP não reenviar indefinidamente.
export const runtime = "nodejs";

interface MpNotice { type?: string; topic?: string; action?: string; data?: { id?: string } }

export async function POST(req: Request) {
  if (!isMercadoPagoEnabled) return NextResponse.json({ ok: true });

  let body: MpNotice = {};
  try { body = await req.json(); } catch { /* MP às vezes manda só querystring */ }

  const url = new URL(req.url);
  const type = body.type || body.topic || url.searchParams.get("type") || url.searchParams.get("topic") || "";
  const id = body.data?.id || url.searchParams.get("id") || url.searchParams.get("data.id");

  // Só tratamos assinaturas (preapproval). Outros eventos são ignorados.
  if (!id || !String(type).includes("preapproval")) return NextResponse.json({ ok: true });

  const resp = await fetch(`${MP_API}/preapproval/${id}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!resp.ok) return NextResponse.json({ ok: true });
  const pa = await resp.json().catch(() => null);
  if (!pa) return NextResponse.json({ ok: true });

  let ref: { companyId?: string; plan?: string } = {};
  try { ref = JSON.parse(pa.external_reference || "{}"); } catch { /* ignore */ }
  if (!ref.companyId) return NextResponse.json({ ok: true });

  const sb = createAdminClient();
  if (!sb) return NextResponse.json({ ok: true });

  // authorized=ativa; cancelled=cancelada; paused=inadimplente; demais=trial.
  const status: string = pa.status || "pending";
  const active = status === "authorized";
  const subStatus = active ? "active" : status === "cancelled" ? "canceled" : status === "paused" ? "past_due" : "trialing";

  const row: Record<string, unknown> = {
    company_id: ref.companyId,
    status: subStatus,
    mp_preapproval_id: pa.id,
    current_period_end: pa.next_payment_date || null,
    updated_at: new Date().toISOString(),
  };
  if (active && ref.plan) row.plan = ref.plan;

  await sb.from("subscriptions").upsert(row, { onConflict: "company_id" });

  // Reflete o plano efetivo na empresa (libera/limita os recursos).
  if (ref.plan) {
    await sb.from("companies").update({ plan: active ? ref.plan : "free" }).eq("id", ref.companyId);
  }

  return NextResponse.json({ ok: true });
}

// O MP pode validar a URL com um GET.
export async function GET() {
  return NextResponse.json({ ok: true });
}
