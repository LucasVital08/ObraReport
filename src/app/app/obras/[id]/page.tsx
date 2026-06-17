"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Badge, Tabs, EmptyState, Stat, Select, Modal, useToast } from "@/components/ui";
import {
  RdoStatusBadge, TaskStatusBadge, MaterialStatusBadge,
  EquipmentStatusBadge, IncidentStatusBadge,
} from "@/components/status";
import { Avatar } from "@/components/brand";
import { Timeline } from "@/components/timeline";
import { ProjectFormFields, projectToForm, formToProject, type ProjectFormState } from "@/components/project-form";
import { buildFinalReport } from "@/lib/ai/engine";
import { uploadFile } from "@/lib/data/storage";
import { formatBRL, formatDateBR, diffDays } from "@/lib/utils";
import { PROJECT_STATUS_LABELS, type ProjectStatus, type ProjectDocument } from "@/lib/types";
import {
  Building2, Plus, FileText, MapPin, User, Calendar, Wallet, Camera,
  AlertTriangle, ListChecks, FileCheck2, Clock, Eye, Download, Trash2, ShieldCheck,
  Pencil, ChevronDown, UserPlus,
} from "lucide-react";

export default function ObraDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // IMPORTANTE: no zustand v5 o seletor deve retornar referência estável.
  // Selecionamos os arrays inteiros (estáveis) e filtramos no corpo — fazer
  // .filter() dentro do seletor cria um array novo a cada render e causa
  // loop infinito (React #185 "Maximum update depth exceeded").
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const updateProject = useStore((s) => s.updateProject);
  const deleteProject = useStore((s) => s.deleteProject);
  const allReports = useStore((s) => s.reports);
  const allTasks = useStore((s) => s.tasks);
  const allTeam = useStore((s) => s.team);
  const allMaterials = useStore((s) => s.materials);
  const allEquipment = useStore((s) => s.equipment);
  const allExpenses = useStore((s) => s.expenses);
  const allChecklists = useStore((s) => s.checklists);
  const allIncidents = useStore((s) => s.incidents);
  const allDocuments = useStore((s) => s.documents);
  const isClient = useStore((s) => s.user.role === "client");
  const isManager = useStore((s) => s.user.role === "owner" || s.user.role === "admin");
  const { show, node } = useToast();
  const [tab, setTab] = React.useState("visao");
  const [editOpen, setEditOpen] = React.useState(false);
  const [form, setForm] = React.useState<ProjectFormState | null>(null);

  if (!project) return <EmptyState title="Obra não encontrada" action={<Button onClick={() => router.push("/app/obras")}>Voltar</Button>} />;

  function openEdit() { if (project) { setForm(projectToForm(project)); setEditOpen(true); } }
  function saveEdit() { if (project && form) { updateProject(project.id, formToProject(form)); setEditOpen(false); show("Obra atualizada!"); } }
  function handleDelete() {
    if (!project) return;
    if (!isManager) { show("Apenas o dono ou um administrador da empresa pode excluir obras."); return; }
    const ok = confirm(`Excluir a obra "${project.name}"?\n\nTodos os RDOs, fotos, documentos e registros desta obra serão removidos. Esta ação não pode ser desfeita.`);
    if (!ok) return;
    deleteProject(project.id);
    show("Obra excluída.");
    router.push("/app/obras");
  }
  function setF<K extends keyof ProjectFormState>(k: K, v: ProjectFormState[K]) { setForm((f) => (f ? { ...f, [k]: v } : f)); }

  const reports = allReports.filter((r) => r.projectId === id);
  const tasks = allTasks.filter((t) => t.projectId === id);
  const team = allTeam.filter((t) => t.projectId === id);
  const materials = allMaterials.filter((m) => m.projectId === id);
  const equipment = allEquipment.filter((e) => e.projectId === id);
  const expenses = allExpenses.filter((e) => e.projectId === id);
  const checklists = allChecklists.filter((c) => c.projectId === id);
  const incidents = allIncidents.filter((i) => i.projectId === id);
  const documents = (allDocuments ?? []).filter((d) => d.projectId === id);

  const allMedia = reports.flatMap((r) => r.media);
  const totalExpenses = expenses.reduce((a, e) => a + e.amount, 0);
  const pendingApproval = reports.filter((r) => r.status !== "aprovado").length;

  // O contratante (cliente) vê uma versão de acompanhamento: RDOs, linha do
  // tempo, fotos e ocorrências — sem os módulos operacionais internos.
  const allTabs = [
    { id: "visao", label: "Visão geral" },
    { id: "rdos", label: "RDOs", count: reports.length },
    { id: "timeline", label: "Linha do tempo" },
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
  const clientTabIds = ["visao", "rdos", "timeline", "fotos", "ocorrencias", "final"];
  const tabs = isClient ? allTabs.filter((t) => clientTabIds.includes(t.id)) : allTabs;
  let timelineItems: { date: string; resumo: string }[] = [];
  try { timelineItems = buildFinalReport(project, reports).linha_do_tempo; } catch { timelineItems = []; }

  return (
    <div>
      <PageHeader title={project.name} description={`${project.client}`} backHref="/app/obras"
        action={isClient ? undefined : <Link href={`/app/rdo/novo?obra=${project.id}`}><Button><Plus size={16} /> Criar RDO</Button></Link>} />

      {node}
      {/* Header card */}
      <Card className="overflow-hidden mb-5">
        <div className="relative px-5 py-5" style={{ background: `linear-gradient(135deg, ${project.coverColor}, ${project.coverColor}cc)` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 to-transparent" />
          <div className="relative flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-14 w-14 rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur flex items-center justify-center text-white shrink-0"><Building2 size={26} /></div>
              <div className="min-w-0">
                <p className="text-white/75 text-[11px] font-semibold uppercase tracking-wide">Status da obra</p>
                <p className="text-white text-lg font-bold leading-tight">{PROJECT_STATUS_LABELS[project.status]}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {isClient ? (
                <Badge className="bg-white/90 text-graphite">{PROJECT_STATUS_LABELS[project.status]}</Badge>
              ) : (
                <>
                  <Button size="sm" onClick={openEdit} className="bg-white/20 text-white border-0 hover:bg-white/30 shadow-none"><Pencil size={15} /> Editar</Button>
                  <Button size="sm" onClick={() => router.push(`/app/acessos?obra=${project.id}`)} className="bg-white/20 text-white border-0 hover:bg-white/30 shadow-none"><UserPlus size={15} /> Membros</Button>
                  {isManager && <Button size="sm" onClick={handleDelete} className="bg-white/20 text-white border-0 hover:bg-danger hover:text-white shadow-none"><Trash2 size={15} /> Excluir</Button>}
                  <div className="relative w-full sm:w-48">
                    <Select value={project.status} onChange={(e) => updateProject(project.id, { status: e.target.value as ProjectStatus })}
                      className="rounded-full bg-white/95 text-graphite border-0 shadow-sm font-semibold h-9 pr-9 text-sm">
                      {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </Select>
                    <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-graphite/60" />
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
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

      {/* Modal de edição da obra */}
      {form && (
        <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Editar obra" wide
          footer={
            <div className="flex items-center justify-between w-full gap-2">
              {isManager ? <Button variant="ghost" className="text-danger" onClick={handleDelete}><Trash2 size={15} /> Excluir obra</Button> : <span />}
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setEditOpen(false)}>Cancelar</Button>
                <Button onClick={saveEdit}>Salvar alterações</Button>
              </div>
            </div>
          }>
          <ProjectFormFields form={form} set={setF} />
        </Modal>
      )}

      <div className="mb-5"><Tabs tabs={tabs} active={tab} onChange={setTab} /></div>

      {tab === "visao" && (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Stat label="RDOs" value={reports.length} icon={<FileText size={16} />} tone="brand" />
            <Stat label="Gastos totais" value={formatBRL(totalExpenses)} icon={<Wallet size={16} />} tone="success" />
            <Stat label="Tarefas abertas" value={tasks.filter((t) => !["concluido", "cancelado"].includes(t.status)).length} icon={<ListChecks size={16} />} tone="warning" />
            <Stat label="Ocorrências abertas" value={incidents.filter((i) => i.status !== "resolvida").length} icon={<AlertTriangle size={16} />} tone="danger" />
          </div>
          {isClient ? (
            <Card className="p-5 bg-gradient-to-r from-brand to-brand-dark text-white border-0">
              <div className="flex items-center gap-4 flex-wrap">
                <ShieldCheck size={28} />
                <div className="flex-1 min-w-[200px]">
                  <h3 className="font-bold">Acompanhamento do contratante</h3>
                  <p className="text-white/85 text-sm">
                    Você está acompanhando esta obra. {pendingApproval > 0
                      ? `${pendingApproval} RDO(s) aguardam sua análise/aprovação.`
                      : "Todos os RDOs já foram aprovados."}
                  </p>
                </div>
                <Button variant="primary" onClick={() => setTab("rdos")}>Ver RDOs</Button>
              </div>
            </Card>
          ) : (
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
          )}
          {!isClient && (
            <Card className="p-4 flex items-start gap-3">
              <span className="text-brand mt-0.5"><ShieldCheck size={18} /></span>
              <div className="text-sm">
                <p className="font-semibold">Acesso do contratante</p>
                <p className="text-muted">O contratante <strong>{project.client}</strong> pode acompanhar esta obra com login próprio: visualiza os RDOs, comenta e aprova/assina, além de ver a linha do tempo gerada por IA — sem acesso aos módulos internos.</p>
              </div>
            </Card>
          )}
          <RdoList reports={reports} />
        </div>
      )}

      {tab === "rdos" && <RdoList reports={reports} showCreate={!isClient} projectId={project.id} />}

      {tab === "timeline" && (
        <Card>
          <CardHeader title="Linha do tempo da obra" icon={<Calendar size={18} />} subtitle="Evolução da execução consolidada por IA a partir dos RDOs" />
          <Timeline items={timelineItems} empty="Ainda não há RDOs para montar a linha do tempo." />
        </Card>
      )}

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
  const companyId = useStore((s) => s.user.companyId);
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  // Sobe cada documento para o Storage (modo produção) ou gera data URL (demo).
  async function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setError("");
    setBusy(true);
    try {
      for (const file of files) {
        const dataUrl = await uploadFile("documents", file, companyId);
        const res = addDocument({
          projectId, name: file.name, mimeType: file.type || "application/octet-stream",
          size: file.size, dataUrl, uploadedAt: new Date().toISOString(),
        });
        if (!res.ok) { setError(res.error || "Erro ao importar."); break; }
      }
    } catch {
      setError("Falha ao enviar o arquivo.");
    } finally {
      setBusy(false);
    }
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
    <div className="flex items-center gap-2.5">
      <span className="h-8 w-8 rounded-lg bg-brand-soft text-brand-dark flex items-center justify-center shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] text-muted">{label}</p>
        <p className="font-semibold truncate">{value}</p>
      </div>
    </div>
  );
}

function RdoList({ reports, showCreate, projectId }: { reports: ReturnType<typeof useStore.getState>["reports"]; showCreate?: boolean; projectId?: string }) {
  // Ordem cronológica: pelo número do RDO (1, 2, 3, 4…), data como desempate.
  const sorted = [...reports].sort((a, b) => (a.number - b.number) || a.date.localeCompare(b.date));
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
