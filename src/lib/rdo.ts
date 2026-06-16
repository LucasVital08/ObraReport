import type { ActivityStatus, AiRdoResult, DailyReport, RdoActivity, RdoItem } from "@/lib/types";
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
  return (names || []).map((n) => String(n).trim()).filter(Boolean).map((name) => ({ id: uid("it"), name }));
}

const ACT_STATUS: Record<string, ActivityStatus> = {
  concluida: "concluida", concluído: "concluida", concluido: "concluida",
  parcial: "parcial", em_andamento: "parcial", andamento: "parcial",
  nao_executada: "nao_executada", "não_executada": "nao_executada", nao: "nao_executada",
};

// Aceita item como string (compat) ou objeto { descricao, status }.
function activities(list: AiRdoResult["atividades_executadas"]): RdoActivity[] {
  return (list || [])
    .map((a) => {
      const descricao = typeof a === "string" ? a : a?.descricao || "";
      const rawStatus = typeof a === "string" ? "" : (a?.status || "");
      const status = ACT_STATUS[String(rawStatus).toLowerCase()] || "concluida";
      return { id: uid("act"), description: String(descricao).trim(), status };
    })
    .filter((a) => a.description);
}

const strs = (a: unknown): string[] => (Array.isArray(a) ? a.map((x) => String(x).trim()).filter(Boolean) : []);
const joinNotes = (...parts: (string | undefined)[]) => parts.map((p) => (p || "").trim()).filter(Boolean).join("\n\n");

/** Mescla o resultado da IA no rascunho, sem sobrescrever dados já preenchidos manualmente. */
export function applyAiResult(draft: RdoDraft, ai: AiRdoResult, rawInput: string): RdoDraft {
  const acts = activities(ai.atividades_executadas);
  return {
    ...draft,
    rawInput,
    arrival: draft.arrival || ai.horarios?.chegada || "",
    departure: draft.departure || ai.horarios?.saida || "",
    weather: draft.weather || ai.clima || "",
    siteCondition: draft.siteCondition || ai.condicao_canteiro || "",
    team: ai.equipe_presente?.length
      ? ai.equipe_presente.filter((t) => t?.name?.trim()).map((t) => ({ name: t.name.trim(), role: t.role, present: true }))
      : draft.team,
    activities: acts.length ? acts : draft.activities,
    materials: ai.materiais_utilizados?.length ? items(ai.materiais_utilizados) : draft.materials,
    materialsRequested: ai.materiais_solicitados?.length ? items(ai.materiais_solicitados) : draft.materialsRequested,
    equipment: ai.equipamentos_utilizados?.length ? items(ai.equipamentos_utilizados) : draft.equipment,
    occurrences: strs(ai.ocorrencias).length ? strs(ai.ocorrencias) : draft.occurrences,
    impediments: strs(ai.impedimentos).length ? strs(ai.impedimentos) : draft.impediments,
    risks: strs(ai.riscos).length ? strs(ai.riscos) : draft.risks,
    clientRequests: strs(ai.solicitacoes).length ? strs(ai.solicitacoes) : draft.clientRequests,
    pending: strs(ai.pendencias).length ? strs(ai.pendencias) : draft.pending,
    nextDayPlan: strs(ai.plano_proximo_dia).length ? strs(ai.plano_proximo_dia) : draft.nextDayPlan,
    expenses: ai.gastos?.length
      ? ai.gastos
          .filter((g) => (g?.description || "").trim() || Number(g?.amount))
          .map((g) => ({
            id: uid("exp"), companyId: "", projectId: draft.projectId, date: draft.date,
            category: g.category || "outros", description: g.description || "Gasto",
            amount: Number(g.amount) || 0, paymentMethod: "", responsible: draft.supervisor, hasReceipt: false,
          }))
      : draft.expenses,
    executiveSummary: draft.executiveSummary || ai.resumo_executivo || "",
    notes: joinNotes(draft.notes, ai.observacoes_tecnicas),
  };
}
