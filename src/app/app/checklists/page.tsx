"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Modal, Field, Input, Select, Badge, EmptyState, Progress } from "@/components/ui";
import { formatDateBR, todayISO, uid } from "@/lib/utils";
import { type Checklist } from "@/lib/types";
import { Plus, ClipboardCheck, Trash2, CheckCircle2, Circle } from "lucide-react";

const TEMPLATES: Record<string, string[]> = {
  "segurança": ["EPIs disponíveis", "Área isolada e sinalizada", "Extintor próximo", "Ventilação adequada", "Andaimes travados"],
  "início de obra": ["Materiais conferidos", "Equipamentos testados", "Equipe instruída", "Ponto de energia liberado", "Acesso garantido"],
  "finalização": ["Serviço concluído", "Área limpa", "Equipamentos recolhidos", "Vistoria interna feita", "Fotos do resultado"],
  "limpeza": ["Resíduos removidos", "Piso limpo", "Vidros limpos", "Mobiliário protegido", "Descarte correto"],
  "entrega": ["Acabamento revisado", "Limpeza final", "Sistemas testados", "Cliente vistoriou", "Termo assinado"],
  "pintura": ["Superfície preparada", "Selador aplicado", "Demãos aplicadas", "Acabamento uniforme", "Sem respingos"],
  "elétrica": ["Disjuntores testados", "Tomadas funcionando", "Aterramento ok", "Quadro identificado", "Sem fios expostos"],
  "drywall": ["Estrutura nivelada", "Placas fixadas", "Juntas tratadas", "Pontos elétricos ok", "Acabamento lixado"],
  "energia solar": ["Estrutura fixada", "Módulos instalados", "Inversor conectado", "Aterramento ok", "Comissionamento"],
  "manutenção predial": ["Inspeção realizada", "Reparos feitos", "Testes ok", "Limpeza", "Relatório registrado"],
  "estrutura metálica": ["Peças conferidas", "Soldas inspecionadas", "Alinhamento ok", "Torque aplicado", "Pintura anticorrosiva"],
  "hidráulica": ["Tubulação testada", "Sem vazamentos", "Pressão ok", "Registros funcionando", "Conexões vedadas"],
  "climatização": ["Equipamento fixado", "Gás carregado", "Dreno ok", "Teste de funcionamento", "Limpeza de filtros"],
};

export default function ChecklistsPage() {
  const checklists = useStore((s) => s.checklists);
  const projects = useStore((s) => s.projects);
  const addChecklist = useStore((s) => s.addChecklist);
  const updateChecklist = useStore((s) => s.updateChecklist);
  const deleteChecklist = useStore((s) => s.deleteChecklist);
  const [open, setOpen] = React.useState(false);

  function toggleItem(c: Checklist, itemId: string) {
    const items = c.items.map((i) => i.id === itemId ? { ...i, checked: !i.checked } : i);
    updateChecklist(c.id, { items, status: items.every((i) => i.checked) ? "concluido" : "aberto" });
  }

  return (
    <div>
      <PageHeader title="Checklists" description="Listas de verificação personalizáveis"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Checklist</Button>} />
      {checklists.length === 0 ? (
        <Card><EmptyState icon={<ClipboardCheck size={40} />} title="Nenhum checklist" action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Criar</Button>} /></Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {checklists.map((c) => {
            const done = c.items.filter((i) => i.checked).length;
            const pct = c.items.length ? Math.round((done / c.items.length) * 100) : 0;
            const proj = projects.find((p) => p.id === c.projectId);
            return (
              <Card key={c.id}>
                <CardHeader title={c.title} subtitle={`${proj?.name.slice(0, 28) || ""} • ${formatDateBR(c.date)}`}
                  action={<button onClick={() => deleteChecklist(c.id)} className="text-muted hover:text-danger p-1"><Trash2 size={15} /></button>} />
                <div className="px-4 pt-3">
                  <div className="flex items-center justify-between mb-2"><Badge tone={pct === 100 ? "success" : "warning"}>{done}/{c.items.length}</Badge><span className="text-sm text-muted">{pct}%</span></div>
                  <Progress value={pct} tone={pct === 100 ? "success" : "brand"} />
                </div>
                <div className="p-4 space-y-1">
                  {c.items.map((i) => (
                    <button key={i.id} onClick={() => toggleItem(c, i.id)} className="w-full flex items-center gap-2 text-left py-1.5 text-sm">
                      {i.checked ? <CheckCircle2 size={18} className="text-success shrink-0" /> : <Circle size={18} className="text-muted shrink-0" />}
                      <span className={i.checked ? "line-through text-muted" : ""}>{i.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            );
          })}
        </div>
      )}
      <ChecklistModal open={open} onClose={() => setOpen(false)} projects={projects}
        onSave={(c) => { addChecklist(c); setOpen(false); }} />
    </div>
  );
}

function ChecklistModal({ open, onClose, onSave, projects }: {
  open: boolean; onClose: () => void; onSave: (c: Omit<Checklist, "id" | "companyId">) => void; projects: { id: string; name: string }[];
}) {
  const [title, setTitle] = React.useState("");
  const [template, setTemplate] = React.useState("segurança");
  const [responsible, setResponsible] = React.useState("");
  const [projectId, setProjectId] = React.useState(projects[0]?.id || "");

  return (
    <Modal open={open} onClose={onClose} title="Novo checklist"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button onClick={() => onSave({ title: title || `Checklist de ${template}`, template, responsible, projectId, date: todayISO(), status: "aberto", items: TEMPLATES[template].map((label) => ({ id: uid("cki"), label, checked: false })) })}>Criar</Button></>}>
      <div className="space-y-4">
        <Field label="Modelo"><Select value={template} onChange={(e) => setTemplate(e.target.value)}>{Object.keys(TEMPLATES).map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}</Select></Field>
        <Field label="Título (opcional)"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={`Checklist de ${template}`} /></Field>
        <Field label="Responsável"><Input value={responsible} onChange={(e) => setResponsible(e.target.value)} /></Field>
        <Field label="Obra"><Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <div className="rounded-xl bg-black/5 dark:bg-white/5 p-3 text-sm text-muted">
          <p className="font-medium text-foreground mb-1">Itens do modelo:</p>
          {TEMPLATES[template].map((i) => <p key={i}>• {i}</p>)}
        </div>
      </div>
    </Modal>
  );
}
