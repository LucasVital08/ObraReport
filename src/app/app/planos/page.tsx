"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, Button, Badge, useToast } from "@/components/ui";
import { PLANS, planById, formatPlanPrice } from "@/lib/plans";
import { type PlanId } from "@/lib/types";
import { CheckCircle2, Sparkles, Crown, Building2, Gift } from "lucide-react";

const ICONS: Record<PlanId, React.ElementType> = {
  free: Gift,
  basico: Building2,
  profissional: Sparkles,
  empresa: Crown,
};

export default function PlanosPage() {
  const company = useStore((s) => s.company);
  const setPlan = useStore((s) => s.setPlan);
  const { show, node } = useToast();
  const [cycle, setCycle] = React.useState<"mensal" | "anual">("mensal");
  const [busyPlan, setBusyPlan] = React.useState<PlanId | null>(null);

  // Retorno do checkout do Mercado Pago (?status=sucesso).
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (new URLSearchParams(window.location.search).get("status") === "sucesso") {
      show("Pagamento recebido! Sua assinatura será ativada em instantes.");
      window.history.replaceState(null, "", "/app/planos");
    }
  }, [show]);

  // Inicia a assinatura: chama o checkout; com Mercado Pago configurado,
  // redireciona para o pagamento; sem ele, ativa o plano localmente (demo).
  async function subscribe(plan: PlanId, name: string) {
    setBusyPlan(plan);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, cycle }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.url) { window.location.assign(data.url); return; }
      if (data?.demo) { setPlan(plan); show(`Plano ${name} ativado!`); return; }
      show(data?.error || "Não foi possível iniciar a assinatura.");
    } catch {
      show("Falha de conexão ao iniciar a assinatura.");
    } finally {
      setBusyPlan(null);
    }
  }

  return (
    <div>
      {node}
      <PageHeader title="Planos e assinatura" description="Escolha o plano ideal para sua operação" />

      <Card className="p-4 mb-5 flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-sm text-muted">Plano atual</p>
          <p className="text-lg font-semibold">{planById(company.plan)?.name ?? company.plan}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Toggle Mensal / Anual */}
          <div className="inline-flex rounded-xl border border-border p-1 text-sm">
            <button onClick={() => setCycle("mensal")}
              className={`px-3 py-1.5 rounded-lg font-medium ${cycle === "mensal" ? "bg-brand text-white" : "text-muted"}`}>Mensal</button>
            <button onClick={() => setCycle("anual")}
              className={`px-3 py-1.5 rounded-lg font-medium ${cycle === "anual" ? "bg-brand text-white" : "text-muted"}`}>Anual <span className="text-xs opacity-90">−25%</span></button>
          </div>
          <Badge tone="success"><CheckCircle2 size={12} /> Assinatura ativa</Badge>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {PLANS.map((p) => {
          const Icon = ICONS[p.id];
          const current = company.plan === p.id;
          const isFree = p.priceMonthly === null;
          const price = cycle === "anual" && p.priceAnnual !== null ? p.priceAnnual : p.priceMonthly;
          const suffix = isFree ? "" : cycle === "anual" ? "/ano" : "/mês";
          return (
            <Card key={p.id} className={p.highlight ? "p-6 border-brand ring-2 ring-brand/30 relative" : "p-6 relative"}>
              {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand text-white text-xs font-semibold px-3 py-1">Mais popular</span>}
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-3 ${p.highlight ? "bg-brand text-white" : "bg-brand-soft text-brand-dark"}`}><Icon size={22} /></div>
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="text-xs text-muted">{p.tagline}</p>
              <p className="mt-2">
                <span className="text-3xl font-extrabold">{formatPlanPrice(price)}</span>
                <span className="text-muted">{suffix}</span>
              </p>
              {cycle === "anual" && !isFree && p.priceMonthly !== null && (
                <p className="text-xs text-muted">equivale a R$ {Math.round((p.priceAnnual as number) / 12)}/mês</p>
              )}
              <ul className="mt-4 space-y-2">{p.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm"><CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" /> {f}</li>)}</ul>
              <Button className="w-full mt-5" variant={current ? "outline" : p.highlight ? "primary" : "secondary"}
                disabled={current || busyPlan !== null}
                onClick={() => {
                  if (isFree) { setPlan(p.id); show(`Plano ${p.name} ativado!`); return; }
                  subscribe(p.id, p.name);
                }}>
                {current ? "Plano atual" : busyPlan === p.id ? "Processando…" : isFree ? "Começar grátis" : "Assinar agora"}
              </Button>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted mt-6">
        Pagamento processado de forma segura pelo Mercado Pago (Pix, cartão e boleto).
        Cancele quando quiser.
      </p>
    </div>
  );
}
