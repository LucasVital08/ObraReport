"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, Button, Modal, Field, Input, Textarea, Select, EmptyState } from "@/components/ui";
import { IncidentStatusBadge, SeverityBadge } from "@/components/status";
import { formatDateBR } from "@/lib/utils";
import { type Incident, type IncidentSeverity, type IncidentStatus } from "@/lib/types";
import { Plus, AlertTriangle, Trash2 } from "lucide-react";

const CATEGORIES = [
  "acidente", "quase acidente", "atraso", "falta de material", "chuva",
  "impedimento técnico", "ausência de colaborador", "solicitação do contratante",
  "problema com equipamento", "retrabalho", "risco de segurança", "divergência de escopo",
  "dano no local", "problema elétrico", "problema hidráulico", "bloqueio de acesso", "interferência de terceiros",
];

export default function OcorrenciasPage() {
  const incidents = useStore((s) => s.incidents);
  const projects = useStore((s) => s.projects);
  const addIncident = useStore((s) => s.addIncident);
  const updateIncident = useStore((s) => s.updateIncident);
  const deleteIncident = useStore((s) => s.deleteIncident);
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  const filtered = filter ? incidents.filter((i) => i.projectId === filter) : incidents;

  return (
    <div>
      <PageHeader title="Ocorrências" description="Registro de problemas, riscos e impedimentos"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Ocorrência</Button>} />
      <Card className="p-3 mb-4"><Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs"><option value="">Todas as obras</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Card>
      {filtered.length === 0 ? (
        <Card><EmptyState icon={<AlertTriangle size={40} />} title="Nenhuma ocorrência" action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Registrar</Button>} /></Card>
      ) : (
        <div className="space-y-3">
          {[...filtered].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((i) => {
            const proj = projects.find((p) => p.id === i.projectId);
            return (
              <Card key={i.id} className="p-4 group">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold">{i.title}</p>
                      <SeverityBadge severity={i.severity} />
                    </div>
                    <p className="text-sm text-muted">{i.category} • {proj?.name.slice(0, 30)} • {formatDateBR(i.createdAt)}</p>
                    <p className="text-sm mt-2">{i.description}</p>
                    {i.proposedSolution && <p className="text-sm text-muted mt-1.5"><span className="font-medium text-foreground">Solução:</span> {i.proposedSolution}</p>}
                  </div>
                  <button onClick={() => deleteIncident(i.id)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100 shrink-0"><Trash2 size={15} /></button>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Select value={i.status} onChange={(e) => updateIncident(i.id, { status: e.target.value as IncidentStatus, resolvedAt: e.target.value === "resolvida" ? new Date().toISOString() : undefined })} className="h-8 text-xs w-40">
                    <option value="aberta">Aberta</option><option value="em_andamento">Em andamento</option><option value="resolvida">Resolvida</option>
                  </Select>
                  <IncidentStatusBadge status={i.status} />
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <IncidentModal open={open} onClose={() => setOpen(false)} projects={projects} onSave={(i) => { addIncident(i); setOpen(false); }} />
    </div>
  );
}

function IncidentModal({ open, onClose, onSave, projects }: {
  open: boolean; onClose: () => void; onSave: (i: Omit<Incident, "id" | "companyId" | "createdAt">) => void; projects: { id: string; name: string }[];
}) {
  const [f, setF] = React.useState({ title: "", category: CATEGORIES[0], severity: "media" as IncidentSeverity, description: "", responsible: "", proposedSolution: "", projectId: projects[0]?.id || "" });
  return (
    <Modal open={open} onClose={onClose} title="Nova ocorrência" wide
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={!f.title} onClick={() => onSave({ ...f, status: "aberta" })}>Registrar</Button></>}>
      <div className="space-y-4">
        <Field label="Título"><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Categoria"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
          <Field label="Gravidade"><Select value={f.severity} onChange={(e) => setF({ ...f, severity: e.target.value as IncidentSeverity })}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="critica">Crítica</option></Select></Field>
        </div>
        <Field label="Descrição"><Textarea value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <Field label="Solução proposta"><Textarea value={f.proposedSolution} onChange={(e) => setF({ ...f, proposedSolution: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Responsável"><Input value={f.responsible} onChange={(e) => setF({ ...f, responsible: e.target.value })} /></Field>
          <Field label="Obra"><Select value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        </div>
      </div>
    </Modal>
  );
}
