// Definição central dos planos do ObraReport IA.
// Fonte única consumida pela página de planos (/app/planos) e pela landing,
// evitando que preços/benefícios fiquem dessincronizados entre as telas.

import type { PlanId } from "@/lib/types";

export interface PlanInfo {
  id: PlanId;
  name: string;
  tagline: string;
  priceMonthly: number | null; // null = grátis
  priceAnnual: number | null; // null = não há cobrança anual
  highlight?: boolean;
  features: string[];
  shortFeatures: string[]; // versão enxuta para a landing
}

export const PLANS: PlanInfo[] = [
  {
    id: "free",
    name: "Free",
    tagline: "Para experimentar sem custo",
    priceMonthly: null,
    priceAnnual: null,
    features: [
      "1 obra ativa",
      "2 RDOs por mês",
      "PDF básico do relatório",
      "Fotos no relatório",
      "1 usuário",
      "Sem inteligência artificial",
    ],
    shortFeatures: ["1 obra", "2 RDOs/mês", "PDF básico", "Sem IA"],
  },
  {
    id: "basico",
    name: "Básico",
    tagline: "Para o profissional autônomo",
    priceMonthly: 79,
    priceAnnual: 699,
    features: [
      "1 obra ativa",
      "30 RDOs por mês",
      "Inteligência artificial incluída (voz e texto)",
      "Fotos e vídeos no relatório",
      "PDF profissional",
      "Assinatura digital do cliente",
      "1 usuário",
    ],
    shortFeatures: ["1 obra", "30 RDOs/mês", "IA incluída", "PDF profissional"],
  },
  {
    id: "profissional",
    name: "Profissional",
    tagline: "Para equipes e múltiplas obras",
    priceMonthly: 199,
    priceAnnual: 1799,
    highlight: true,
    features: [
      "5 obras ativas",
      "RDOs ilimitados",
      "IA completa (voz, texto e perguntas)",
      "Gastos, equipe, tarefas e checklists",
      "Relatório final consolidado",
      "Acesso do contratante (camadas)",
      "Linha do tempo da obra por IA",
      "Assinatura e aprovação digital",
      "Até 10 usuários",
    ],
    shortFeatures: ["5 obras", "RDOs ilimitados", "Acesso do contratante", "Até 10 usuários"],
  },
  {
    id: "empresa",
    name: "Empresa",
    tagline: "Para construtoras e operações grandes",
    priceMonthly: 399,
    priceAnnual: 3599,
    features: [
      "Obras ilimitadas",
      "Usuários ilimitados",
      "Contratantes ilimitados",
      "Marca da empresa nos PDFs",
      "Dashboard e indicadores completos",
      "Múltiplos modelos de relatório",
      "Uso ampliado de IA",
      "Suporte prioritário",
    ],
    shortFeatures: ["Obras ilimitadas", "Usuários ilimitados", "Marca própria", "Suporte prioritário"],
  },
];

export function planById(id: PlanId): PlanInfo | undefined {
  return PLANS.find((p) => p.id === id);
}

// "R$ 79", "Grátis"
export function formatPlanPrice(value: number | null): string {
  return value === null ? "Grátis" : `R$ ${value.toLocaleString("pt-BR")}`;
}
