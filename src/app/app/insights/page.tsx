"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { evaluateCompleteness } from "@/lib/ai/engine";
import { PageHeader } from "@/components/page";
import { Card, Stat, EmptyState } from "@/components/ui";
import { formatBRL } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line,
  PieChart, Pie, Cell,
} from "recharts";
import { FileText, CheckCircle2, Wallet, Camera, AlertTriangle, Building2, TrendingUp } from "lucide-react";

const COLORS = ["#f4720b", "#2563eb", "#16a34a", "#7c3aed", "#dc2626", "#0891b2"];

export default function InsightsPage() {
  const reports = useStore((s) => s.reports);
  const projects = useStore((s) => s.projects);
  const tasks = useStore((s) => s.tasks);
  const expenses = useStore((s) => s.expenses);
  const incidents = useStore((s) => s.incidents);

  const completeReports = reports.filter((r) => evaluateCompleteness(r).score >= 80).length;
  const pctComplete = reports.length ? Math.round((completeReports / reports.length) * 100) : 0;
  const totalPhotos = reports.reduce((a, r) => a + r.media.filter((m) => m.kind === "photo").length, 0);
  const totalVideos = reports.reduce((a, r) => a + r.media.filter((m) => m.kind === "video").length, 0);
  const avgPhotos = reports.length ? (totalPhotos / reports.length).toFixed(1) : "0";

  const rdosByProject = projects.map((p) => ({ name: p.name.split("—")[0].slice(0, 14), value: reports.filter((r) => r.projectId === p.id).length }));
  const expensesByProject = projects.map((p) => ({ name: p.name.split("—")[0].slice(0, 14), value: expenses.filter((e) => e.projectId === p.id).reduce((a, e) => a + e.amount, 0) }));

  // evolução semanal (RDOs por dia, últimos registros)
  const byDate = reports.reduce<Record<string, number>>((acc, r) => { acc[r.date] = (acc[r.date] || 0) + 1; return acc; }, {});
  const weekly = Object.entries(byDate).sort((a, b) => a[0].localeCompare(b[0])).slice(-10).map(([date, value]) => ({ date: date.slice(5), value }));

  // ocorrências por categoria
  const incByCat = Object.entries(incidents.reduce<Record<string, number>>((acc, i) => { acc[i.category] = (acc[i.category] || 0) + 1; return acc; }, {})).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5);

  if (reports.length === 0 && projects.length === 0) {
    return <div><PageHeader title="Insights" /><Card><EmptyState icon={<TrendingUp size={40} />} title="Sem dados ainda" description="Crie obras e RDOs para ver indicadores." /></Card></div>;
  }

  return (
    <div>
      <PageHeader title="Insights e indicadores" description="Visão analítica das suas obras" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat label="Total de RDOs" value={reports.length} icon={<FileText size={16} />} tone="brand" />
        <Stat label="RDOs completos" value={`${pctComplete}%`} icon={<CheckCircle2 size={16} />} tone="success" />
        <Stat label="Custo acumulado" value={formatBRL(expenses.reduce((a, e) => a + e.amount, 0))} icon={<Wallet size={16} />} tone="info" />
        <Stat label="Média fotos/RDO" value={avgPhotos} icon={<Camera size={16} />} tone="neutral" hint={`${totalPhotos} fotos, ${totalVideos} vídeos`} />
        <Stat label="Obras ativas" value={projects.filter((p) => !["concluida", "entregue", "cancelada"].includes(p.status)).length} icon={<Building2 size={16} />} tone="brand" />
        <Stat label="Tarefas concluídas" value={tasks.filter((t) => t.status === "concluido").length} icon={<CheckCircle2 size={16} />} tone="success" />
        <Stat label="Tarefas atrasadas" value={tasks.filter((t) => t.dueDate && t.dueDate < new Date().toISOString().slice(0, 10) && t.status !== "concluido").length} icon={<AlertTriangle size={16} />} tone="warning" />
        <Stat label="Ocorrências abertas" value={incidents.filter((i) => i.status !== "resolvida").length} icon={<AlertTriangle size={16} />} tone="danger" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="p-4">
          <h3 className="font-semibold mb-3">RDOs por obra</h3>
          <div className="h-60"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={rdosByProject}><XAxis dataKey="name" fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Bar dataKey="value" fill="#f4720b" radius={[6, 6, 0, 0]} /></BarChart>
          </ResponsiveContainer></div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Evolução de RDOs (por dia)</h3>
          <div className="h-60"><ResponsiveContainer width="100%" height="100%">
            <LineChart data={weekly}><XAxis dataKey="date" fontSize={11} /><YAxis fontSize={11} allowDecimals={false} /><Tooltip /><Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} /></LineChart>
          </ResponsiveContainer></div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Custo por obra</h3>
          <div className="h-60"><ResponsiveContainer width="100%" height="100%">
            <BarChart data={expensesByProject} layout="vertical"><XAxis type="number" fontSize={11} /><YAxis type="category" dataKey="name" fontSize={11} width={90} /><Tooltip formatter={(v: unknown) => formatBRL(Number(v))} /><Bar dataKey="value" fill="#16a34a" radius={[0, 6, 6, 0]} /></BarChart>
          </ResponsiveContainer></div>
        </Card>
        <Card className="p-4">
          <h3 className="font-semibold mb-3">Ocorrências mais comuns</h3>
          {incByCat.length === 0 ? <EmptyState title="Sem ocorrências" /> : (
            <div className="h-60"><ResponsiveContainer width="100%" height="100%">
              <PieChart><Pie data={incByCat} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={(e) => e.name}>{incByCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /></PieChart>
            </ResponsiveContainer></div>
          )}
        </Card>
      </div>
    </div>
  );
}
