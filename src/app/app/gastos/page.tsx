"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Modal, Field, Input, Select, Badge, EmptyState, Stat } from "@/components/ui";
import { formatBRL, formatDateBR, todayISO } from "@/lib/utils";
import { EXPENSE_CATEGORIES, type Expense } from "@/lib/types";
import { Plus, Wallet, Trash2, Download, Receipt, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis } from "recharts";

const COLORS = ["#f4720b", "#2563eb", "#16a34a", "#7c3aed", "#dc2626", "#0891b2", "#ca8a04", "#db2777"];

const brlTip = (v: unknown) => formatBRL(Number(v));

export default function GastosPage() {
  const expenses = useStore((s) => s.expenses);
  const projects = useStore((s) => s.projects);
  const addExpense = useStore((s) => s.addExpense);
  const deleteExpense = useStore((s) => s.deleteExpense);
  const [open, setOpen] = React.useState(false);
  const [filter, setFilter] = React.useState("");

  const filtered = filter ? expenses.filter((e) => e.projectId === filter) : expenses;
  const total = filtered.reduce((a, e) => a + e.amount, 0);
  const withReceipt = filtered.filter((e) => e.hasReceipt).length;

  const byCategory = Object.entries(filtered.reduce<Record<string, number>>((acc, e) => { acc[e.category] = (acc[e.category] || 0) + e.amount; return acc; }, {}))
    .map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);

  const byResponsible = Object.entries(filtered.reduce<Record<string, number>>((acc, e) => { acc[e.responsible] = (acc[e.responsible] || 0) + e.amount; return acc; }, {}))
    .map(([name, value]) => ({ name: name.split(" ")[0], value })).sort((a, b) => b.value - a.value).slice(0, 6);

  function exportCsv() {
    const rows = [["Data", "Obra", "Categoria", "Descrição", "Valor", "Responsável", "Comprovante"]];
    filtered.forEach((e) => { const p = projects.find((x) => x.id === e.projectId); rows.push([e.date, p?.name || "", e.category, e.description, e.amount.toFixed(2), e.responsible, e.hasReceipt ? "Sim" : "Não"]); });
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = "gastos.csv"; a.click();
  }

  return (
    <div>
      <PageHeader title="Gastos" description="Controle financeiro da obra"
        action={<div className="flex gap-2"><Button variant="outline" onClick={exportCsv}><Download size={16} /> CSV</Button><Button onClick={() => setOpen(true)}><Plus size={16} /> Gasto</Button></div>} />

      <Card className="p-3 mb-4"><Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs"><option value="">Todas as obras</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Card>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat label="Total gasto" value={formatBRL(total)} icon={<Wallet size={16} />} tone="success" />
        <Stat label="Lançamentos" value={filtered.length} icon={<TrendingUp size={16} />} tone="brand" />
        <Stat label="Com comprovante" value={`${withReceipt}/${filtered.length}`} icon={<Receipt size={16} />} tone="info" />
        <Stat label="Categorias" value={byCategory.length} tone="neutral" />
      </div>

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Gastos por categoria</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e) => e.name}>
                    {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={brlTip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-4">
            <h3 className="font-semibold mb-2">Gastos por responsável</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byResponsible}>
                  <XAxis dataKey="name" fontSize={12} /><YAxis fontSize={12} />
                  <Tooltip formatter={brlTip} />
                  <Bar dataKey="value" fill="#f4720b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader title="Lançamentos" icon={<Wallet size={18} />} />
        {filtered.length === 0 ? <EmptyState icon={<Wallet size={40} />} title="Nenhum gasto" action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Adicionar</Button>} /> : (
          <div className="divide-y divide-border">
            {[...filtered].sort((a, b) => b.date.localeCompare(a.date)).map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3.5 gap-3 group">
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{e.description}</p>
                  <p className="text-xs text-muted">{formatDateBR(e.date)} • {e.responsible} • {e.paymentMethod}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge>{e.category}</Badge>
                  {e.hasReceipt && <Receipt size={14} className="text-success" />}
                  <span className="font-semibold w-24 text-right">{formatBRL(e.amount)}</span>
                  <button onClick={() => deleteExpense(e.id)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <ExpenseModal open={open} onClose={() => setOpen(false)} projects={projects} onSave={(e) => { addExpense(e); setOpen(false); }} />
    </div>
  );
}

function ExpenseModal({ open, onClose, onSave, projects }: {
  open: boolean; onClose: () => void; onSave: (e: Omit<Expense, "id" | "companyId">) => void; projects: { id: string; name: string }[];
}) {
  const [f, setF] = React.useState({ description: "", amount: "", category: "material", paymentMethod: "PIX", responsible: "", date: todayISO(), projectId: projects[0]?.id || "", hasReceipt: false, note: "" });
  return (
    <Modal open={open} onClose={onClose} title="Novo gasto" wide
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button disabled={!f.description || !f.amount} onClick={() => onSave({ ...f, amount: Number(f.amount) })}>Salvar</Button></>}>
      <div className="space-y-4">
        <Field label="Descrição"><Input value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Valor (R$)"><Input type="number" value={f.amount} onChange={(e) => setF({ ...f, amount: e.target.value })} /></Field>
          <Field label="Categoria"><Select value={f.category} onChange={(e) => setF({ ...f, category: e.target.value })}>{EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}</Select></Field>
          <Field label="Forma de pagamento"><Select value={f.paymentMethod} onChange={(e) => setF({ ...f, paymentMethod: e.target.value })}><option>PIX</option><option>Dinheiro</option><option>Cartão</option><option>Boleto</option><option>Transferência</option></Select></Field>
          <Field label="Responsável"><Input value={f.responsible} onChange={(e) => setF({ ...f, responsible: e.target.value })} /></Field>
          <Field label="Data"><Input type="date" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} /></Field>
          <Field label="Obra"><Select value={f.projectId} onChange={(e) => setF({ ...f, projectId: e.target.value })}>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.hasReceipt} onChange={(e) => setF({ ...f, hasReceipt: e.target.checked })} /> Possui comprovante</label>
      </div>
    </Modal>
  );
}
