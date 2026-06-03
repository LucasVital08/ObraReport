"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Badge, Tabs, EmptyState, Stat, Select } from "@/components/ui";
import {
  RdoStatusBadge, TaskStatusBadge, MaterialStatusBadge,
  EquipmentStatusBadge, IncidentStatusBadge,
} from "@/components/status";
import { Avatar } from "@/components/brand";
import { formatBRL, formatDateBR, diffDays } from "@/lib/utils";
import { PROJECT_STATUS_LABELS, type ProjectStatus, type ProjectDocument } from "@/lib/types";
import {
  Building2, Plus, FileText, MapPin, User, Calendar, Wallet, Camera,
  AlertTriangle, ListChecks, FileCheck2, Clock, Eye, Download, Trash2,
} from "lucide-react";

export default function ObraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const updateProject = useStore((s) => s.updateProject);
  const reports = useStore((s) => s.reports.filter((r) => r.projectId === id));
  const tasks = useStore((s) => s.tasks.filter((t) => t.projectId === id));
  const team = useStore((s) => s.team.filter((t) => t.projectId === id));
  const materials = useStore((s) => s.materials.filter((m) => m.projectId === id));
  const equipment = useStore((s) => s.equipment.filter((e) => e.projectId === id));
  const expenses = useStore((s) => s.expenses.filter((e) => e.projectId === id));
  const checklists = useStore((s) => s.checklists.filter((c) => c.projectId === id));
  const incidents = useStore((s) => s.incidents.filter((i) => i.projectId === id));
  const documents = useStore((s) => s.documents.filter((d) => d.projectId === id));
  const [tab, setTab] = React.useState("visao");

  if (!project) return <EmptyState title="Obra não encontrada" action={<Button onClick={() => router.push("/app/obras")}>Voltar</Button>} />;

  const allMedia = reports.flatMap((r) => r.media);
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);

  const tabs = [
    { id: "visao", label: "Visão geral" },
    { id: "rdos", label: "RDOs", count: reports.length },
    { id: "tarefas", label: "Tarefas", count: tasks.length },
    { id: "equipe", label: "Equipe", count: team.length },
    { id: "fotos", label: "Fotos", count: allMedia.length },
    { id: "materiais", label: "Materiais", count: materials.length },
    { id: "equipamentos", label: "Equipamentos", count: equipment.length },
    { id: "gastos", label: "Gastos", count: expenses.length },
    { id: "checklists", label: "Checklists", count: checklists.length },
    { id: "ocorrencias", label: "Ocorrências", count: incidents.length },
    { id: "documentos", label: "Documentos", count: documents.length },
    { id: "final", label: "Relatório final" },
  ];

  return (
    <div>
      <PageHeader title={project.name} description={`${project.client}`} backHref="/app/obras"
        action={<Link href={`/app/rdo/novo?obra=${project.id}`}><Button><Plus size={16} /> Criar RDO</Button></Link>} />

      {/* Header card */}
      <Card className="overflow-hidden mb-5">
        <div className="h-24 flex items-end justify-between p-4" style={{ background: `linear-gradient(135deg, ${project.coverColor}, ${project.coverColor}cc)` }}>
          <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center text-white"><Building2 size={24} /></div>
          <Select value={project.status} onChange={(e) => updateProject(project.id, { status: e.target.value as ProjectStatus })}
            className="w-44 bg-white/90 text-graphite border-0">
            {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
          <Info icon={<User size={15} />} label="Cliente" value={project.client} />
          <Info icon={<MapPin size={15} />} label="Endereço" value={project.address || "—"} />
          <Info icon={<User size={15} />} label="Resp. técnico" value={project.technicalLead || "—"} />
          <Info icon={<User size={15} />} label="Supervisor" value={project.supervisor || "—"} />
          <Info icon={<Calendar size={15} />} label="Início" value={formatDateBR(project.startDate)} />
          <Info icon={<Calendar size={15} />} label="Previsão" value={formatDateBR(project.expectedEndDate)} />
          <Info icon={<Clock size={15} />} label="Duração" value={`${Math.abs(diffDays(project.startDate, project.realEndDate || project.expectedEndDate))} dias`} />
          <Info icon={<Wallet size={15} />} label="Orçamento" value={project.budget ? formatBRL(project.budget) : "—"} />
        </div>
        {project.description && <div className="px-4 pb-4 text-sm text-muted">{project.description}</div>}
      </Card>

      <div className="mb-5"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>

      {tab === "visao" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="RDOs" value={reports.length} icon={<FileText size={16} />} tone="brand" />
            <Stat label="Gastos totais" value={formatBRL(totalExpenses)} icon={<Wallet size={16} />} tone="success" />
            <Stat label="Tarefas abertas" value={tasks.filter((t) => !["concluido", "cancelado"].includes(t.status)).length} icon={<ListChecks size={16} />} tone="warning" />
            <Stat label="Ocorrências abertas" value={incidents.filter((i) => i.status !== "resolvida").length} icon={<AlertTriangle size={16} />} tone="danger" />
          </div>
          <Card className="p-5 bg-gradient-to-r from-graphite to-graphite/80 text-white border-0">
            <div className="flex items-center gap-4 flex-wrap">
              <FileCheck2 size={28} />
              <div className="flex-1 min-w-[200px]">
                <h3 className="font-bold">Relatório Final da Obra</h3>
                <p className="text-white/80 text-sm">Consolide todos os {reports.length} RDOs, fotos, gastos e ocorrências em um único documento.</p>
              </div>
              <Button variant="primary" onClick={() => setTab("final")}>Gerar agora</Button>
            </div>
          </Card>
          <RdoList reports={reports} />
        </div>
      )}

      {tab === "rdos" && <RdoList reports={reports} showCreate projectId={project.id} />}

      {tab === "tarefas" && (
        <ModuleList items={tasks} href="/app/tarefas" empty="Nenhuma tarefa nesta obra"
          render={(t) => (<div className="flex items-center justify-between p-3.5"><div><p className="font-medium text-sm">{t.title}</p><p className="text-xs text-muted">{t.assignee}</p></div><TaskStatusBadge status={t.status} /></div>)} />
      )}
      {tab === "equipe" && (
        <ModuleList items={team} href="/app/equipe" empty="Nenhum membro vinculado"
          render={(m) => (<div className="flex items-center gap-3 p-3.5"><Avatar name={m.name} size={36} /><div><p className="font-medium text-sm">{m.name}</p><p className="text-xs text-muted">{m.role}{m.phone ? ` • ${m.phone}` : ""}</p></div></div>)} />
      )}
      {tab === "fotos" && (
        allMedia.length === 0 ? <Card><EmptyState icon={<Camera size={32} />} title="Sem fotos" description="Adicione fotos nos RDOs desta obra." /></Card> :
        <Card className="p-4"><div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {allMedia.map((m) => (
            <div key={m.id} className="rounded-xl overflow-hidden aspect-square border border-border relative">
              {m.dataUrl ? <img src={m.dataUrl} alt={m.caption} className="w-full h-full object-cover" /> :
                <div className="w-full h-full flex items-center justify-center" style={{ background: m.color }}>{m.kind === "video" ? <span className="text-white text-2xl">▶</span> : <Camera size={16} className="text-white/80" />}</div>}
              <span className="absolute bottom-0 inset-x-0 text-[10px] bg-black/60 text-white px-1 truncate">{m.caption}</span>
            </div>
          ))}
        </div></Card>
      )}
      {tab === "materiais" && (
        <ModuleList items={materials} href="/app/materiais" empty="Nenhum material"
          render={(m) => (<div className="flex items-center justify-between p-3.5"><div><p className="font-medium text-sm">{m.name}</p><p className="text-xs text-muted">{m.quantityUsed ?? 0} {m.unit} • {m.supplier || "—"}</p></div><MaterialStatusBadge status={m.status} /></div>)} />
      )}
      {tab === "equipamentos" && (
        <ModuleList items={equipment} href="/app/equipamentos" empty="Nenhum equipamento"
          render={(e) => (<div className="flex items-center justify-between p-3.5"><div><p className="font-medium text-sm">{e.name}</p><p className="text-xs text-muted">{e.type} • {e.responsible || "—"}</p></div><EquipmentStatusBadge status={e.status} /></div>)} />
      )}
      {tab === "gastos" && (
        <div>
          <Card className="p-4 mb-3 flex items-center justify-between"><span className="text-muted">Total da obra</span><span className="text-xl font-bold">{formatBRL(totalExpenses)}</span></Card>
          <ModuleList items={expenses} href="/app/gastos" empty="Nenhum gasto"
            render={(e) => (<div className="flex items-center justify-between p-3.5"><div><p className="font-medium text-sm">{e.description}</p><p className="text-xs text-muted">{e.category} • {e.responsible} • {formatDateBR(e.date)}</p></div><span className="font-medium">{formatBRL(e.amount)}</span></div>)} />
        </div>
      )}
      {tab === "checklists" && (
        <ModuleList items={checklists} href="/app/checklists" empty="Nenhum checklist"
          render={(c) => (<div className="flex items-center justify-between p-3.5"><div><p className="font-medium text-sm">{c.title}</p><p className="text-xs text-muted">{c.items.filter((i) => i.checked).length}/{c.items.length} itens • {c.responsible}</p></div><Badge tone={c.status === "concluido" ? "success" : "warning"}>{c.status === "concluido" ? "Concluído" : "Aberto"}</Badge></div>)} />
      )}
      {tab === "ocorrencias" && (
        <ModuleList items={incidents} href="/app/ocorrencias" empty="Nenhuma ocorrência"
          render={(i) => (<div className="flex items-center justify-between p-3.5 gap-3"><div className="min-w-0"><p className="font-medium text-sm truncate">{i.title}</p><p className="text-xs text-muted">{i.category}</p></div><IncidentStatusBadge status={i.status} /></div>)} />
      )}
      {tab === "final" && (
        <Card className="p-6 text-center">
          <FileCheck2 size={40} className="mx-auto text-brand mb-3" />
          <h3 className="text-lg font-bold">Relatório Final Consolidado</h3>
          <p className="text-muted mt-1 max-w-md mx-auto">Gere um documento completo com todos os RDOs, linha do tempo, fotos, gastos e ocorrências da obra.</p>
          <Link href={`/app/obras/${project.id}/relatorio-final`} className="inline-block mt-4">
            <Button size="lg"><FileCheck2 size={18} /> Abrir gerador de relatório final</Button>
          </Link>
        </Card>
      )}
      {tab === "documentos" && <DocumentsTab projectId={project.id} documents={documents} />}
    </div>
  );
}

function DocumentsTab({ projectId, documents }: { projectId: string; documents: ProjectDocument[] }) {
  const addDocument = useStore((s) => s.addDocument);
  const deleteDocument = useStore((s) => s.deleteDocument);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    setError("");
    files.forEach((file) => {
      setBusy(true);
      const reader = new FileReader();
      reader.onload = () => {
        setBusy(false);
        const res = addDocument({
          projectId, name: file.name, mimeType: file.type || "application/octet-stream",
          size: file.size, dataUrl: String(reader.result), uploadedAt: new Date().toISOString(),
        });
        if (!res.ok) setError(res.error || "Erro ao importar.");
      };
      reader.onerror = () => { setBusy(false); setError("Falha ao ler o arquivo."); };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  return (
    <Card>
      <CardHeader title="Documentos da obra" icon={<FileText size={18} />} subtitle="Importe PDFs e arquivos prontos (contratos, projetos, comprovantes)"
        action={<Button size="sm" onClick={() => fileRef.current?.click()}><Plus size={14} /> Importar</Button>} />
      <input ref={fileRef} type="file" accept="application/pdf,image/*,.doc,.docx,.xls,.xlsx" multiple className="hidden" onChange={onFiles} />
      {error && <div className="mx-4 mt-3 rounded-lg bg-danger-soft text-danger text-sm px-3 py-2">{error}</div>}
      {busy && <div className="px-4 pt-3 text-sm text-muted">Importando…</div>}
      {documents.length === 0 ? (
        <EmptyState icon={<FileText size={32} />} title="Nenhum documento importado"
          description="Toque em Importar para anexar um PDF que você já tem."
          action={<Button onClick={() => fileRef.current?.click()}><Plus size={16} /> Importar PDF</Button>} />
      ) : (
        <div className="divide-y divide-border">
          {documents.map((d) => (
            <div key={d.id} className="flex items-center gap-3 p-3.5">
              <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center shrink-0"><FileText size={18} /></div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{d.name}</p>
                <p className="text-xs text-muted">{(d.size / 1024).toFixed(0)} KB • {formatDateBR(d.uploadedAt)}</p>
              </div>
              <a href={d.dataUrl} target="_blank" rel="noopener" className="text-muted hover:text-brand p-1.5"><Eye size={16} /></a>
              <a href={d.dataUrl} download={d.name} className="text-muted hover:text-brand p-1.5"><Download size={16} /></a>
              <button onClick={() => deleteDocument(d.id)} className="text-muted hover:text-danger p-1.5"><Trash2 size={16} /></button>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}

function Info({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-muted mt-0.5">{icon}</span>
      <div className="min-w-0"><p className="text-xs text-muted">{label}</p><p className="font-medium truncate">{value}</p></div>
    </div>
  );
}

function RdoList({ reports, showCreate, projectId }: { reports: ReturnType<typeof useStore.getState>["reports"]; showCreate?: boolean; projectId?: string }) {
  const sorted = [...reports].sort((a, b) => b.date.localeCompare(a.date));
  return (
    <Card>
      <CardHeader title="Diários de obra (RDO)" icon={<FileText size={18} />}
        action={showCreate && projectId ? <Link href={`/app/rdo/novo?obra=${projectId}`}><Button size="sm"><Plus size={14} /> Novo</Button></Link> : undefined} />
      <div className="divide-y divide-border">
        {sorted.length === 0 ? <EmptyState icon={<FileText size={32} />} title="Nenhum RDO" description="Crie o primeiro diário desta obra." /> :
          sorted.map((r) => (
            <Link key={r.id} href={`/app/rdo/${r.id}`} className="flex items-center gap-3 p-3.5 hover:bg-black/5 dark:hover:bg-white/5">
              <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center font-bold text-sm shrink-0">#{r.number}</div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{r.executiveSummary?.slice(0, 60) || `RDO de ${formatDateBR(r.date)}`}</p>
                <p className="text-xs text-muted">{formatDateBR(r.date)} • {r.responsible} • {r.media.length} mídias</p>
              </div>
              <RdoStatusBadge status={r.status} />
            </Link>
          ))}
      </div>
    </Card>
  );
}

function ModuleList<T extends { id: string }>({ items, render, empty, href }: {
  items: T[]; render: (item: T) => React.ReactNode; empty: string; href: string;
}) {
  return (
    <Card>
      {items.length === 0 ? <EmptyState title={empty} description="Gerencie este módulo na seção correspondente." action={<Link href={href}><Button variant="outline" size="sm">Abrir módulo</Button></Link>} /> :
        <div className="divide-y divide-border">{items.map((it) => <div key={it.id}>{render(it)}</div>)}</div>}
    </Card>
  );
}
