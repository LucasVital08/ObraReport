import type { ClientVisibility, Company } from "@/lib/types";

// Padrão seguro de fábrica: o contratante NÃO vê equipe/presença, pendências/
// observações internas nem gastos/materiais faltantes. Ocorrências ficam
// visíveis por padrão (decisão do produto), mas tudo é configurável na empresa.
export const DEFAULT_CLIENT_VISIBILITY: ClientVisibility = {
  equipe: false,
  ocorrencias: true,
  pendencias: false,
  gastos: false,
};

// Política efetiva da empresa (merge do padrão com o que estiver salvo).
export function getClientVisibility(company?: Pick<Company, "clientVisibility"> | null): ClientVisibility {
  return { ...DEFAULT_CLIENT_VISIBILITY, ...(company?.clientVisibility ?? {}) };
}

// Metadados das seções para a tela de configuração.
export interface VisibilitySection {
  key: keyof ClientVisibility;
  label: string;
  description: string;
}

export const CLIENT_VISIBILITY_SECTIONS: VisibilitySection[] = [
  { key: "equipe", label: "Equipe e presença", description: "Quem esteve presente, faltou ou chegou atrasado." },
  { key: "ocorrencias", label: "Ocorrências, impedimentos e riscos", description: "Problemas, atrasos e impedimentos da obra." },
  { key: "pendencias", label: "Pendências e observações internas", description: "O que ficou pendente e anotações internas da equipe." },
  { key: "gastos", label: "Gastos e materiais faltantes", description: "Custos do dia e materiais/equipamentos solicitados (em falta)." },
];
