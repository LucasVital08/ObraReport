import { NextResponse } from "next/server";
import { isMercadoPagoEnabled, MP_ACCESS_TOKEN, MP_API, APP_URL } from "@/lib/billing/config";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { createServerSupabase } from "@/lib/supabase/server";
import { planById } from "@/lib/plans";
import type { PlanId } from "@/lib/types";

// Cria uma assinatura (preapproval) no Mercado Pago e devolve a URL de checkout.
// Sem MP configurado, devolve { demo: true } e o cliente ativa o plano localmente
// — mantendo a demonstração funcional.
export const runtime = "nodejs";

export async function POST(req: Request) {
  let body: { plan?: PlanId; cycle?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }); }

  const plan = body.plan as PlanId;
  const cycle = body.cycle === "anual" ? "anual" : "mensal";
  const info = planById(plan);
  if (!info || plan === "free") return NextResponse.json({ error: "Plano inválido" }, { status: 400 });

  // Sem Mercado Pago configurado → modo demonstração.
  if (!isMercadoPagoEnabled) return NextResponse.json({ demo: true });

  const amount = cycle === "anual" ? info.priceAnnual : info.priceMonthly;
  if (!amount) return NextResponse.json({ error: "Preço indisponível para este ciclo" }, { status: 400 });

  // Identifica empresa/usuário pela sessão real (produção).
  let companyId = "";
  let email = "";
  if (isSupabaseEnabled) {
    const sb = await createServerSupabase();
    if (!sb) return NextResponse.json({ error: "Backend indisponível" }, { status: 500 });
    const { data: auth } = await sb.auth.getUser();
    if (!auth?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    email = auth.user.email || "";
    const { data: prof } = await sb.from("profiles").select("company_id").eq("id", auth.user.id).single();
    companyId = prof?.company_id || "";
  }

  const origin = APP_URL || new URL(req.url).origin;
  const resp = await fetch(`${MP_API}/preapproval`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
    body: JSON.stringify({
      reason: `ObraReport IA — Plano ${info.name} (${cycle})`,
      external_reference: JSON.stringify({ companyId, plan, cycle }),
      payer_email: email || undefined,
      back_url: `${origin}/app/planos?status=sucesso`,
      auto_recurring: {
        frequency: cycle === "anual" ? 12 : 1,
        frequency_type: "months",
        transaction_amount: amount,
        currency_id: "BRL",
      },
      status: "pending",
    }),
  });

  const data = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    console.error("[mp checkout]", resp.status, data);
    return NextResponse.json({ error: "Falha ao criar assinatura no Mercado Pago" }, { status: 502 });
  }
  return NextResponse.json({ url: data.init_point || data.sandbox_init_point });
}
