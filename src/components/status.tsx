"use client";

import { Badge } from "@/components/ui";
import {
  PROJECT_STATUS_LABELS, RDO_STATUS_LABELS, TASK_STATUS_LABELS,
  type ProjectStatus, type RdoStatus, type TaskStatus,
  type IncidentStatus, type IncidentSeverity, type MaterialStatus,
  type EquipmentStatus, type Priority,
} from "@/lib/types";

type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";

const projectTone: Record<ProjectStatus, Tone> = {
  planejamento: "info", em_andamento: "brand", pausada: "warning",
  aguardando_material: "warning", aguardando_cliente: "warning",
  em_vistoria: "info", concluida: "success", entregue: "success", cancelada: "danger",
};

const rdoTone: Record<RdoStatus, Tone> = {
  rascunho: "neutral", incompleto: "warning", pronto_revisao: "info",
  enviado: "info", assinado: "success", aprovado: "success",
  rejeitado: "danger", arquivado: "neutral",
};

const taskTone: Record<TaskStatus, Tone> = {
  a_fazer: "neutral", em_andamento: "brand", aguardando_material: "warning",
  aguardando_aprovacao: "info", concluido: "success", cancelado: "danger",
};

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Badge tone={projectTone[status]}>{PROJECT_STATUS_LABELS[status]}</Badge>;
}
export function RdoStatusBadge({ status }: { status: RdoStatus }) {
  return <Badge tone={rdoTone[status]}>{RDO_STATUS_LABELS[status]}</Badge>;
}
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={taskTone[status]}>{TASK_STATUS_LABELS[status]}</Badge>;
}

const incidentTone: Record<IncidentStatus, Tone> = {
  aberta: "danger", em_andamento: "warning", resolvida: "success",
};
const incidentLabel: Record<IncidentStatus, string> = {
  aberta: "Aberta", em_andamento: "Em andamento", resolvida: "Resolvida",
};
export function IncidentStatusBadge({ status }: { status: IncidentStatus }) {
  return <Badge tone={incidentTone[status]}>{incidentLabel[status]}</Badge>;
}

const severityTone: Record<IncidentSeverity, Tone> = {
  baixa: "neutral", media: "info", alta: "warning", critica: "danger",
};
export function SeverityBadge({ severity }: { severity: IncidentSeverity }) {
  const labels = { baixa: "Baixa", media: "Média", alta: "Alta", critica: "Crítica" };
  return <Badge tone={severityTone[severity]}>{labels[severity]}</Badge>;
}

const priorityTone: Record<Priority, Tone> = {
  baixa: "neutral", media: "info", alta: "warning", urgente: "danger",
};
export function PriorityBadge({ priority }: { priority: Priority }) {
  const labels = { baixa: "Baixa", media: "Média", alta: "Alta", urgente: "Urgente" };
  return <Badge tone={priorityTone[priority]}>{labels[priority]}</Badge>;
}

const materialTone: Record<MaterialStatus, Tone> = {
  solicitado: "warning", comprado: "info", entregue: "info",
  usado: "success", devolvido: "neutral", pendente: "danger",
};
export function MaterialStatusBadge({ status }: { status: MaterialStatus }) {
  const l: Record<MaterialStatus, string> = {
    solicitado: "Solicitado", comprado: "Comprado", entregue: "Entregue",
    usado: "Usado", devolvido: "Devolvido", pendente: "Pendente",
  };
  return <Badge tone={materialTone[status]}>{l[status]}</Badge>;
}

const equipTone: Record<EquipmentStatus, Tone> = {
  disponivel: "success", em_uso: "brand", manutencao: "warning",
  devolvido: "neutral", perdido: "danger", danificado: "danger",
};
export function EquipmentStatusBadge({ status }: { status: EquipmentStatus }) {
  const l: Record<EquipmentStatus, string> = {
    disponivel: "Disponível", em_uso: "Em uso", manutencao: "Manutenção",
    devolvido: "Devolvido", perdido: "Perdido", danificado: "Danificado",
  };
  return <Badge tone={equipTone[status]}>{l[status]}</Badge>;
}
