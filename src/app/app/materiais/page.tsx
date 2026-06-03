"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Modal, Field, Input, Select, EmptyState } from "@/components/ui";
import { formatBRL } from "@/lib/utils";
import { type Material, type MaterialStatus } from "@/lib/types";
import { Plus, Package, Trash2 } from "lucide-react";

const STATUSES: MaterialStatus[] = ["solicitado", "comprado", "entregue", "usado", "devolvido", "pendente"];

export default function MateriaisPage() {
  const materials = useStore((s) => s.materials);
  const projects = useStore((s) => s.projects);
  const addMaterial = useStore((s) => s.addMaterial);
  const updateMaterial = useStore((s) => s.updateMaterial);
  const deleteMaterial = useStore((s) => s.deleteMaterial);
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  const filtered = filter ? materials.filter((m) => m.projectId === filter) : materials;

  return (
    <div>
      <PageHeader title="Materiais" description="Controle de materiais da obra"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Material</Button>} />
      <Card className="p-3 mb-4"><Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs"><option value="">Todas as obras</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Card>
      <Card>
        <CardHeader title="Materiais cadastrados" icon={<Package size={18} />} />
        {filtered.length === 0 ? <EmptyState title="Nenhum material" action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Adicionar</Button>} /> : (
          <div className="divide-y divide-border">
            {filtered.map((m) => {
              const proj = projects.find((p) => p.id === m.projectId);
              return (
                <div key={m.id} className="flex items-center justify-between p-3.5 gap-3 group">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{m.name}</p>
                    <p className="text-xs text-muted">{m.quantityUsed ?? 0}/{m.quantityRequested ?? 0} {m.unit} • {m.supplier || "—"} • {proj?.name.slice(0, 24)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {m.estimatedValue ? <span className="text-sm text-muted hidden sm:inline">{formatBRL(m.estimatedValue)}</span> : null}
                    <Select value={m.status} onChange={(e) => updateMaterial(m.id, { status: e.target.value as MaterialStatus })} className="h-8 text-xs w-32">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <button onClick={() => deleteMaterial(m.id)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <MaterialModal open={open} onClose={() => setOpen(false)} projects={projects} onSave={(m) => { addMaterial(m); setOpen(false); }} />
    </div>
  );
}

function MaterialModal({ open, onClose, onSave, projects }: {
  open: boolean; onClose: () => void; onSave: (m: Omit<Material, "id" | "companyId">) => void; projects: { id: string; name: string }[];
}) {
  const [f, setF] = React.useState({ name: "", unit: "un", quantityRequested: "", quantityUsed: "", supplier: "", estimatedValue: "", projectId: projects[0]?.id || "", status: "solicitado" as MaterialStatus });
  return (
    <Modal open={open} onClose={onClose} title="Novo material"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button disabled={!f.name} onClick={() => onSave({ name: f.name, unit: f.unit, quantityRequested: Number(f.quantityRequested) || 0, quantityUsed: Number(f.quantityUsed) || 0, supplier: f.supplier, estimatedValue: Number(f.estimatedValue) || undefined, projectId: f.projectId, status: f.status })}>Salvar</Button></>}>
      <div className="space-y-4">
        <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Unidade"><Input value={f.unit} onChange={(e) => setF({ ...f, unit: e.target.value })} /></Field>
          <Field label="Fornecedor"><Input value={f.supplier} onChange={(e) => setF({ ...f, supplier: e.target.value })} /></Field>
          <Field label="Qtd solicitada"><Input type="number" value={f.quantityRequested} onChange={(e) => setF({ ...f, quantityRequested: e.target.value })} /></Field>
          <Field label="Qtd usada"><Input type="number" value={f.quantityUsed} onChange={(e) => setF({ ...f, quantityUsed: e.target.value })} /></Field>
          <Field label="Valor estimado"><Input type="number" value={f.estimatedValue} onChange={(e) => setF({ ...f, estimatedValue: e.target.value })} /></Field>
          <Field label="Status"><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as MaterialStatus })}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
        </div>
        <Field label="Obra"><Select value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
      </div>
    </Modal>
  );
}
