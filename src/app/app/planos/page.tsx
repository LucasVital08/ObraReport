"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, Button, Badge, useToast } from "@/components/ui";
import { type PlanId } from "@/lib/types";
import { CheckCircle2, Sparkles, Crown, Building2 } from "lucide-react";

const PLANS: { id: PlanId; name: string; price: string; icon: React.ElementType; features: string[]; highlight?: boolean }[] = [
  { id: "basico", name: "Básico", price: "R$ 197", icon: Building2, features: ["1 obra ativa", "Até 5 RDOs/mês", "PDF básico", "Fotos limitadas", "1 usuário administrador"] },
  { id: "profissional", name: "Profissional", price: "R$ 497", icon: Sparkles, highlight: true, features: ["Até 5 obras ativas", "RDOs ilimitados", "RDO por voz e IA", "Fotos e vídeos", "Gastos, equipe e tarefas", "PDF profissional", "Assinatura simples", "Relatório final da obra", "Até 10 usuários"] },
  { id: "empresa", name: "Empresa", price: "R$ 997", icon: Crown, features: ["Obras ilimitadas", "Usuários ilimitados", "Múltiplos modelos de relatório", "Dashboard completo", "Checklists personalizados", "Links para o cliente", "Marca da empresa nos PDFs", "Suporte prioritário", "Uso ampliado de IA"] },
];

export default function PlanosPage() {
  const company = useStore((s) => s.company);
  const setPlan = useStore((s) => s.setPlan);
  const { show, node } = useToast();

  return (
    <div>
      {node}
      <PageHeader title="Planos e assinatura" description="Escolha o plano ideal para sua operação" />

      <Card className="p-4 mb-5 flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-sm text-muted">Plano atual</p>
          <p className="text-lg font-semibold capitalize">{PLANS.find((p) => p.id === company.plan)?.name}</p>
        </div>
        <Badge tone="success"><CheckCircle2 size={12} /> Assinatura ativa</Badge>
      </Card>

      <div className="grid md:grid-cols-3 gap-5">
        {PLANS.map((p) => {
          const Icon = p.icon;
          const current = company.plan === p.id;
          return (
            <Card key={p.id} className={p.highlight ? "p-6 border-brand ring-2 ring-brand/30 relative" : "p-6 relative"}>
              {p.highlight && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand text-white text-xs font-semibold px-3 py-1">Mais popular</span>}
              <div className={`h-11 w-11 rounded-xl flex items-center justify-center mb-3 ${p.highlight ? "bg-brand text-white" : "bg-brand-soft text-brand-dark"}`}><Icon size={22} /></div>
              <h3 className="font-bold text-lg">{p.name}</h3>
              <p className="mt-1"><span className="text-3xl font-extrabold">{p.price}</span><span className="text-muted">/mês</span></p>
              <ul className="mt-4 space-y-2">{p.features.map((f) => <li key={f} className="flex items-start gap-2 text-sm"><CheckCircle2 size={16} className="text-success shrink-0 mt-0.5" /> {f}</li>)}</ul>
              <Button className="w-full mt-5" variant={current ? "outline" : p.highlight ? "primary" : "secondary"} disabled={current}
                onClick={() => { setPlan(p.id); show(`Plano ${p.name} ativado!`); }}>
                {current ? "Plano atual" : "Assinar agora"}
              </Button>
            </Card>
          );
        })}
      </div>

      <p className="text-center text-sm text-muted mt-6">
        Pagamento processado de forma segura. Integração preparada para Mercado Pago, Stripe e Asaas.
      </p>
    </div>
  );
}
