"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Modal, Field, Input, Select, EmptyState } from "@/components/ui";
import { EquipmentStatusBadge } from "@/components/status";
import { type Equipment, type EquipmentStatus } from "@/lib/types";
import { Plus, Wrench, Trash2 } from "lucide-react";

const STATUSES: EquipmentStatus[] = ["disponivel", "em_uso", "manutencao", "devolvido", "perdido", "danificado"];

export default function EquipamentosPage() {
  const equipment = useStore((s) => s.equipment);
  const projects = useStore((s) => s.projects);
  const addEquipment = useStore((s) => s.addEquipment);
  const updateEquipment = useStore((s) => s.updateEquipment);
  const deleteEquipment = useStore((s) => s.deleteEquipment);
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  const filtered = filter ? equipment.filter((m) => m.projectId === filter) : equipment;

  return (
    <div>
      <PageHeader title="Equipamentos" description="Controle de equipamentos e ferramentas"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Equipamento</Button>} />
      <Card className="p-3 mb-4"><Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs"><option value="">Todas as obras</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Card>
      <Card>
        <CardHeader title="Equipamentos" icon={<Wrench size={18} />} />
        {filtered.length === 0 ? <EmptyState title="Nenhum equipamento" action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Adicionar</Button>} /> : (
          <div className="divide-y divide-border">
            {filtered.map((e) => {
              const proj = projects.find((p) => p.id === e.projectId);
              return (
                <div key={e.id} className="flex items-center justify-between p-3.5 gap-3 group">
                  <div className="min-w-0">
                    <p className="font-medium text-sm truncate">{e.name}</p>
                    <p className="text-xs text-muted">{e.type} • {e.responsible || "—"} • {proj?.name.slice(0, 24)}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Select value={e.status} onChange={(ev) => updateEquipment(e.id, { status: ev.target.value as EquipmentStatus })} className="h-8 text-xs w-32">
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                    <button onClick={() => deleteEquipment(e.id)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <EquipModal open={open} onClose={() => setOpen(false)} projects={projects} onSave={(e) => { addEquipment(e); setOpen(false); }} />
    </div>
  );
}

function EquipModal({ open, onClose, onSave, projects }: {
  open: boolean; onClose: () => void; onSave: (e: Omit<Equipment, "id" | "companyId">) => void; projects: { id: string; name: string }[];
}) {
  const [f, setF] = React.useState({ name: "", type: "", responsible: "", conditionOut: "", projectId: projects[0]?.id || "", status: "disponivel" as EquipmentStatus });
  return (
    <Modal open={open} onClose={onClose} title="Novo equipamento"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={!f.name} onClick={() => onSave(f)}>Salvar</Button></>}>
      <div className="space-y-4">
        <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo"><Input value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })} placeholder="Elétrica, hidráulica…" /></Field>
          <Field label="Responsável"><Input value={f.responsible} onChange={(e) => setF({ ...f, responsible: e.target.value })} /></Field>
          <Field label="Condição na retirada"><Input value={f.conditionOut} onChange={(e) => setF({ ...f, conditionOut: e.target.value })} /></Field>
          <Field label="Status"><Select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as EquipmentStatus })}>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}</Select></Field>
        </div>
        <Field label="Obra"><Select value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
      </div>
    </Modal>
  );
}
