"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, Button, Modal, Field, Input, Select, Badge, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/brand";
import { type TeamMember } from "@/lib/types";
import { Plus, Users, Phone, Mail, Trash2 } from "lucide-react";

export default function EquipePage() {
  const team = useStore((s) => s.team);
  const projects = useStore((s) => s.projects);
  const addTeamMember = useStore((s) => s.addTeamMember);
  const deleteTeamMember = useStore((s) => s.deleteTeamMember);
  const [open, setOpen] = React.useState(false);

  return (
    <div>
      <PageHeader title="Equipe" description="Colaboradores e funções"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Adicionar</Button>} />
      {team.length === 0 ? (
        <Card><EmptyState icon={<Users size={40} />} title="Nenhum colaborador" action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Adicionar membro</Button>} /></Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {team.map((m) => {
            const proj = projects.find((p) => p.id === m.projectId);
            return (
              <Card key={m.id} className="p-4 group">
                <div className="flex items-start gap-3">
                  <Avatar name={m.name} size={44} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold truncate">{m.name}</p>
                      <button onClick={() => deleteTeamMember(m.id)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                    </div>
                    <p className="text-sm text-muted">{m.role}</p>
                    <div className="mt-2 space-y-1 text-xs text-muted">
                      {m.phone && <p className="flex items-center gap-1.5"><Phone size={12} /> {m.phone}</p>}
                      {m.email && <p className="flex items-center gap-1.5"><Mail size={12} /> {m.email}</p>}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone={m.active ? "success" : "neutral"}>{m.active ? "Ativo" : "Inativo"}</Badge>
                      {proj && <span className="text-[10px] text-muted truncate">{proj.name}</span>}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <MemberModal open={open} onClose={() => setOpen(false)} projects={projects}
        onSave={(m) => { addTeamMember(m); setOpen(false); }} />
    </div>
  );
}

function MemberModal({ open, onClose, onSave, projects }: {
  open: boolean; onClose: () => void; onSave: (m: Omit<TeamMember, "id" | "companyId">) => void; projects: { id: string; name: string }[];
}) {
  const [f, setF] = React.useState({ name: "", role: "", phone: "", email: "", document: "", projectId: "" });
  return (
    <Modal open={open} onClose={onClose} title="Adicionar membro"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button disabled={!f.name} onClick={() => onSave({ ...f, active: true, projectId: f.projectId || undefined })}>Adicionar</Button></>}>
      <div className="space-y-4">
        <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Função"><Input value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })} placeholder="Pintor, eletricista…" /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Telefone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></Field>
          <Field label="CPF (opcional)"><Input value={f.document} onChange={(e) => setF({ ...f, document: e.target.value })} /></Field>
        </div>
        <Field label="E-mail"><Input type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Obra"><Select value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })}><option value="">Sem obra</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
      </div>
    </Modal>
  );
}
