"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { Card, CardHeader, Stat, Button, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/brand";
import { ProjectStatusBadge, RdoStatusBadge } from "@/components/status";
import { formatBRL, formatDateBR, todayISO } from "@/lib/utils";
import {
  Building2, FileText, PenLine, ListChecks, Wallet, AlertTriangle, Images,
  Mic, MessageSquareText, FileCheck2, Sparkles, ArrowRight, Users, Clock,
} from "lucide-react";

export default function DashboardPage() {
  const user = useStore((s) => s.user);
  const projects = useStore((s) => s.projects);
  const reports = useStore((s) => s.reports);
  const tasks = useStore((s) => s.tasks);
  const expenses = useStore((s) => s.expenses);
  const incidents = useStore((s) => s.incidents);
  const timeCards = useStore((s) => s.timeCards);

  const activeProjects = projects.filter((p) => !["concluida", "entregue", "cancelada"].includes(p.status));
  const month = todayISO().slice(0, 7);
  const rdosMonth = reports.filter((r) => r.date.slice(0, 7) === month);
  const pendingSignature = reports.filter((r) => ["pronto_revisao", "enviado", "incompleto"].includes(r.status));
  const tasksPending = tasks.filter((t) => !["concluido", "cancelado"].includes(t.status));
  const tasksDone = tasks.filter((t) => t.status === "concluido");
  const expensesMonth = expenses.filter((e) => e.date.slice(0, 7) === month).reduce((a, e) => a + e.amount, 0);
  const openIncidents = incidents.filter((i) => i.status !== "resolvida");
  const presentToday = timeCards.filter((t) => t.date === todayISO()).length;
  const totalPhotos = reports.reduce((a, r) => a + r.media.filter((m) => m.kind === "photo").length, 0);
  const totalVideos = reports.reduce((a, r) => a + r.media.filter((m) => m.kind === "video").length, 0);

  const recentReports = [...reports].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5);
  const firstName = user.name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Olá, {firstName} 👋</h1>
        <p className="text-muted">Aqui está o resumo das suas obras hoje.</p>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <QuickAction href="/app/rdo/novo?modo=voz" icon={<Mic size={20} />} title="Criar RDO por voz" desc="Fale o que aconteceu" />
        <QuickAction href="/app/rdo/novo?modo=perguntas" icon={<MessageSquareText size={20} />} title="Criar por perguntas" desc="Responda passo a passo" />
        <QuickAction href="/app/relatorios" icon={<FileCheck2 size={20} />} title="Relatório final" desc="Consolide a obra" />
      </div>

      {/* Indicadores */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Obras ativas" value={activeProjects.length} icon={<Building2 size={16} />} tone="brand" hint={`${projects.length} no total`} />
        <Stat label="RDOs no mês" value={rdosMonth.length} icon={<FileText size={16} />} tone="info" />
        <Stat label="Pendentes de assinatura" value={pendingSignature.length} icon={<PenLine size={16} />} tone="warning" />
        <Stat label="Tarefas pendentes" value={tasksPending.length} icon={<ListChecks size={16} />} tone="neutral" hint={`${tasksDone.length} concluídas`} />
        <Stat label="Gastos do mês" value={formatBRL(expensesMonth)} icon={<Wallet size={16} />} tone="success" />
        <Stat label="Ocorrências abertas" value={openIncidents.length} icon={<AlertTriangle size={16} />} tone="danger" />
        <Stat label="Presentes hoje" value={presentToday} icon={<Users size={16} />} tone="info" />
        <Stat label="Fotos / Vídeos" value={`${totalPhotos} / ${totalVideos}`} icon={<Images size={16} />} tone="brand" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Obras ativas */}
        <div className="lg:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Obras em andamento" icon={<Building2 size={18} />}
              action={<Link href="/app/obras"><Button variant="ghost" size="sm">Ver todas</Button></Link>} />
            <div className="divide-y divide-border">
              {activeProjects.length === 0 ? (
                <EmptyState icon={<Building2 size={32} />} title="Nenhuma obra ativa"
                  description="Crie sua primeira obra para começar a registrar RDOs."
                  action={<Link href="/app/obras/nova"><Button>Criar obra</Button></Link>} />
              ) : activeProjects.map((p) => {
                const count = reports.filter((r) => r.projectId === p.id).length;
                return (
                  <Link key={p.id} href={`/app/obras/${p.id}`} className="flex items-center gap-3 p-4 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                    <div className="h-10 w-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ background: p.coverColor }}>
                      <Building2 size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{p.name}</p>
                      <p className="text-sm text-muted truncate">{p.client} • {count} RDOs</p>
                    </div>
                    <ProjectStatusBadge status={p.status} />
                  </Link>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Atividades recentes */}
        <Card>
          <CardHeader title="Últimas atividades" icon={<Clock size={18} />} />
          <div className="divide-y divide-border">
            {recentReports.length === 0 ? (
              <EmptyState title="Sem atividades ainda" description="Seus RDOs recentes aparecerão aqui." />
            ) : recentReports.map((r) => {
              const proj = projects.find((p) => p.id === r.projectId);
              return (
                <Link key={r.id} href={`/app/rdo/${r.id}`} className="flex items-start gap-3 p-3.5 hover:bg-black/5 dark:hover:bg-white/5">
                  <Avatar name={r.responsible} size={32} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">RDO #{r.number} — {proj?.name.split("—")[0]}</p>
                    <p className="text-xs text-muted">{formatDateBR(r.date)} • {r.responsible}</p>
                    <div className="mt-1"><RdoStatusBadge status={r.status} /></div>
                  </div>
                </Link>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Banner IA */}
      <Card className="p-5 bg-gradient-to-r from-brand to-brand-dark text-white border-0">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center"><Sparkles size={24} /></div>
          <div className="flex-1 min-w-[200px]">
            <h3 className="font-bold text-lg">Assistente RDO IA</h3>
            <p className="text-white/90 text-sm">Fale o que aconteceu na obra e a IA monta o relatório profissional para você.</p>
          </div>
          <Link href="/app/rdo/novo">
            <button className="bg-white text-brand-dark font-semibold rounded-xl px-4 py-2.5 inline-flex items-center gap-2 hover:bg-white/90">
              Criar RDO agora <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </Card>
    </div>
  );
}

function QuickAction({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="p-4 hover:border-brand transition-colors h-full">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center shrink-0">{icon}</div>
          <div>
            <p className="font-semibold leading-tight">{title}</p>
            <p className="text-sm text-muted">{desc}</p>
          </div>
        </div>
      </Card>
    </Link>
  );
}
