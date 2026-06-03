import type { AiRdoResult, DailyReport, RdoActivity, RdoItem } from "@/lib/types";
import { todayISO, uid } from "@/lib/utils";

export type RdoDraft = Omit<DailyReport, "id" | "companyId" | "number" | "createdAt" | "updatedAt">;

export function emptyDraft(projectId: string, supervisor: string, mode: RdoDraft["createMode"]): RdoDraft {
  return {
    projectId,
    date: todayISO(),
    responsible: supervisor,
    supervisor,
    arrival: "",
    departure: "",
    weather: "",
    siteCondition: "",
    team: [],
    activities: [],
    materials: [],
    materialsRequested: [],
    equipment: [],
    equipmentRequested: [],
    occurrences: [],
    risks: [],
    impediments: [],
    clientRequests: [],
    pending: [],
    nextDayPlan: [],
    executiveSummary: "",
    notes: "",
    media: [],
    expenses: [],
    signatures: [],
    status: "rascunho",
    createMode: mode,
    rawInput: "",
  };
}

function items(names: string[]): RdoItem[] {
  return names.map((name) => ({ id: uid("it"), name }));
}

function activities(descs: string[]): RdoActivity[] {
  return descs.map((description) => ({ id: uid("act"), description, status: "concluida" as const }));
}

/** Mescla o resultado da IA no rascunho, sem sobrescrever dados já preenchidos manualmente. */
export function applyAiResult(draft: RdoDraft, ai: AiRdoResult, rawInput: string): RdoDraft {
  return {
    ...draft,
    rawInput,
    arrival: draft.arrival || ai.horarios.chegada || "",
    departure: draft.departure || ai.horarios.saida || "",
    weather: draft.weather || ai.clima || "",
    team: ai.equipe_presente.length
      ? ai.equipe_presente.map((t) => ({ name: t.name, role: t.role, present: true }))
      : draft.team,
    activities: ai.atividades_executadas.length ? activities(ai.atividades_executadas) : draft.activities,
    materials: ai.materiais_utilizados.length ? items(ai.materiais_utilizados) : draft.materials,
    equipment: ai.equipamentos_utilizados.length ? items(ai.equipamentos_utilizados) : draft.equipment,
    occurrences: ai.ocorrencias.length ? ai.ocorrencias : draft.occurrences,
    risks: ai.riscos.length ? ai.riscos : draft.risks,
    clientRequests: ai.solicitacoes.length ? ai.solicitacoes : draft.clientRequests,
    pending: ai.pendencias.length ? ai.pendencias : draft.pending,
    executiveSummary: draft.executiveSummary || ai.resumo_executivo,
  };
}
