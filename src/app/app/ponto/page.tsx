"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Modal, Field, Input, Select, EmptyState, Badge } from "@/components/ui";
import { formatDateBR, todayISO } from "@/lib/utils";
import { type TimeCard } from "@/lib/types";
import { Plus, Clock, Trash2, Download } from "lucide-react";

function hoursWorked(t: TimeCard): number {
  const [ih, im] = t.checkIn.split(":").map(Number);
  const [oh, om] = t.checkOut.split(":").map(Number);
  const mins = (oh * 60 + om) - (ih * 60 + im) - t.breakMinutes;
  return Math.max(0, mins) / 60;
}

export default function PontoPage() {
  const timeCards = useStore((s) => s.timeCards);
  const projects = useStore((s) => s.projects);
  const team = useStore((s) => s.team);
  const addTimeCard = useStore((s) => s.addTimeCard);
  const deleteTimeCard = useStore((s) => s.deleteTimeCard);
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  const filtered = filter ? timeCards.filter((t) => t.projectId === filter) : timeCards;
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  const totalHours = filtered.reduce((a, t) => a + hoursWorked(t), 0);

  function exportCsv() {
    const rows = [["Colaborador", "Obra", "Data", "Entrada", "Saída", "Intervalo (min)", "Horas"]];
    sorted.forEach((t) => {
      const proj = projects.find((p) => p.id === t.projectId);
      rows.push([t.memberName, proj?.name || "", t.date, t.checkIn, t.checkOut, String(t.breakMinutes), hoursWorked(t).toFixed(2)]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "cartao-ponto.csv"; a.click();
  }

  return (
    <div>
      <PageHeader title="Cartão de ponto" description="Controle de presença e horas"
        action={<div className="flex gap-2"><Button variant="outline" onClick={exportCsv}><Download size={16} /> CSV</Button><Button onClick={() => setOpen(true)}><Plus size={16} /> Registrar</Button></div>} />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <Card className="p-4"><p className="text-sm text-muted">Registros</p><p className="text-2xl font-bold">{filtered.length}</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Horas totais</p><p className="text-2xl font-bold">{totalHours.toFixed(1)}h</p></Card>
        <Card className="p-4"><p className="text-sm text-muted">Média/registro</p><p className="text-2xl font-bold">{filtered.length ? (totalHours / filtered.length).toFixed(1) : 0}h</p></Card>
      </div>

      <Card className="p-3 mb-4">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs"><option value="">Todas as obras</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
      </Card>

      <Card>
        <CardHeader title="Registros de ponto" icon={<Clock size={18} />} />
        {sorted.length === 0 ? <EmptyState title="Nenhum registro" /> : (
          <div className="divide-y divide-border">
            {sorted.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3.5 group">
                <div>
                  <p className="font-medium text-sm">{t.memberName}</p>
                  <p className="text-xs text-muted">{formatDateBR(t.date)} • {t.checkIn}–{t.checkOut} • intervalo {t.breakMinutes}min</p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone="info">{hoursWorked(t).toFixed(1)}h</Badge>
                  <button onClick={() => deleteTimeCard(t.id)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <PontoModal open={open} onClose={() => setOpen(false)} projects={projects} team={team}
        onSave={(t) => { addTimeCard(t); setOpen(false); }} />
    </div>
  );
}

function PontoModal({ open, onClose, onSave, projects, team }: {
  open: boolean; onClose: () => void; onSave: (t: Omit<TimeCard, "id" | "companyId">) => void;
  projects: { id: string; name: string }[]; team: { name: string }[];
}) {
  const [f, setF] = React.useState({ memberName: "", projectId: projects[0]?.id || "", date: todayISO(), checkIn: "07:30", checkOut: "17:00", breakMinutes: 60, note: "" });
  return (
    <Modal open={open} onClose={onClose} title="Registrar ponto"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={!f.memberName} onClick={() => onSave(f)}>Salvar</Button></>}>
      <div className="space-y-4">
        <Field label="Colaborador">
          <Input list="team-list" value={f.memberName} onChange={(e) => setF({ ...f, memberName: e.target.value })} />
          <datalist id="team-list">{team.map((m) => <option key={m.name} value={m.name} />)}</datalist>
        </Field>
        <Field label="Obra"><Select value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Data"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Intervalo (min)"><Input type="number" value={f.breakMinutes} onChange={(e) => setF({ ...f, breakMinutes: Number(e.target.value) })} /></Field>
          <Field label="Entrada"><Input type="time" value={f.checkIn} onChange={(e) => setF({ ...f, checkIn: e.target.value })} /></Field>
          <Field label="Saída"><Input type="time" value={f.checkOut} onChange={(e) => setF({ ...f, checkOut: e.target.value })} /></Field>
        </div>
      </div>
    </Modal>
  );
}
