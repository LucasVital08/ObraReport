"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, Button, Modal, Field, Input, Textarea, Select, Badge, EmptyState } from "@/components/ui";
import { PriorityBadge } from "@/components/status";
import { formatDateBR, todayISO } from "@/lib/utils";
import { TASK_STATUS_LABELS, type Priority, type Task, type TaskStatus } from "@/lib/types";
import { Plus, ListChecks, Calendar, User, Trash2 } from "lucide-react";

const COLUMNS: TaskStatus[] = ["a_fazer", "em_andamento", "aguardando_material", "aguardando_aprovacao", "concluido"];

export default function TarefasPage() {
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const addTask = useStore((s) => s.addTask);
  const updateTask = useStore((s) => s.updateTask);
  const deleteTask = useStore((s) => s.deleteTask);
  const [filter, setFilter] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const filtered = filter ? tasks.filter((t) => t.projectId === filter) : tasks;

  return (
    <div>
      <PageHeader title="Tarefas" description="Quadro Kanban das atividades"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Nova tarefa</Button>} />

      <Card className="p-3 mb-4">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs">
          <option value="">Todas as obras</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<ListChecks size={40} />} title="Nenhuma tarefa" action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Criar tarefa</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {COLUMNS.map((col) => {
            const colTasks = filtered.filter((t) => t.status === col);
            return (
              <div key={col} className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-sm font-semibold">{TASK_STATUS_LABELS[col]}</h3>
                  <Badge>{colTasks.length}</Badge>
                </div>
                <div className="space-y-2 min-h-12">
                  {colTasks.map((t) => {
                    const proj = projects.find((p) => p.id === t.projectId);
                    return (
                      <Card key={t.id} className="p-3 group">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-sm leading-snug">{t.title}</p>
                          <button onClick={() => deleteTask(t.id)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                        </div>
                        {t.description && <p className="text-xs text-muted mt-1">{t.description}</p>}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <PriorityBadge priority={t.priority} />
                          {t.dueDate && <span className="text-xs text-muted flex items-center gap-1"><Calendar size={11} /> {formatDateBR(t.dueDate)}</span>}
                        </div>
                        {t.assignee && <p className="text-xs text-muted mt-1.5 flex items-center gap-1"><User size={11} /> {t.assignee}</p>}
                        {proj && <p className="text-[10px] text-muted mt-1 truncate">{proj.name}</p>}
                        <Select value={t.status} onChange={(e) => updateTask(t.id, { status: e.target.value as TaskStatus })} className="mt-2 h-8 text-xs">
                          {Object.entries(TASK_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </Select>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TaskModal open={open} onClose={() => setOpen(false)} projects={projects} defaultProject={filter}
        onSave={(t) => { addTask(t); setOpen(false); }} />
    </div>
  );
}

function TaskModal({ open, onClose, onSave, projects, defaultProject }: {
  open: boolean; onClose: () => void; onSave: (t: Omit<Task, "id" | "companyId" | "createdAt">) => void;
  projects: { id: string; name: string }[]; defaultProject: string;
}) {
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [assignee, setAssignee] = React.useState("");
  const [priority, setPriority] = React.useState<Priority>("media");
  const [projectId, setProjectId] = React.useState(defaultProject || projects[0]?.id || "");
  const [dueDate, setDueDate] = React.useState(todayISO());

  React.useEffect(() => { if (defaultProject) setProjectId(defaultProject); }, [defaultProject]);

  return (
    <Modal open={open} onClose={onClose} title="Nova tarefa" wide
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button disabled={!title} onClick={() => onSave({ title, description, assignee, priority, projectId, dueDate, status: "a_fazer" })}>Criar tarefa</Button></>}>
      <div className="space-y-4">
        <Field label="Título"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="O que precisa ser feito" /></Field>
        <Field label="Descrição"><Textarea value={description} onChange={(e) => setDescription(e.target.value)} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Obra"><Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
          <Field label="Responsável"><Input value={assignee} onChange={(e) => setAssignee(e.target.value)} /></Field>
          <Field label="Prioridade"><Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}><option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option><option value="urgente">Urgente</option></Select></Field>
          <Field label="Prazo"><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></Field>
        </div>
      </div>
    </Modal>
  );
}
