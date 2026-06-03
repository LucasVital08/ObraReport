"use client";

import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Stat, Badge } from "@/components/ui";
import { formatDateTimeBR } from "@/lib/utils";
import {
  Building2, Users, FileText, FileDown, Images, Film, HardDrive, Sparkles,
  Mic, Shield,
} from "lucide-react";

export default function AdminPage() {
  const company = useStore((s) => s.company);
  const projects = useStore((s) => s.projects);
  const reports = useStore((s) => s.reports);
  const team = useStore((s) => s.team);
  const finalReports = useStore((s) => s.finalReports);

  const photos = reports.reduce((a, r) => a + r.media.filter((m) => m.kind === "photo").length, 0);
  const videos = reports.reduce((a, r) => a + r.media.filter((m) => m.kind === "video").length, 0);
  const aiSessions = reports.filter((r) => r.createMode !== "manual").length;
  const voiceSessions = reports.filter((r) => r.createMode === "voz").length;
  const storageMb = (photos * 1.8 + videos * 24).toFixed(1);

  const logs = [
    { action: "RDO criado por voz", time: reports[0]?.createdAt, user: company.name },
    { action: "Relatório final gerado", time: finalReports[0]?.generatedAt, user: company.name },
    { action: "Nova obra cadastrada", time: projects[0]?.createdAt, user: company.name },
  ].filter((l) => l.time);

  return (
    <div>
      <PageHeader title="Painel administrativo" description="Visão interna do SaaS (dono do sistema)" />

      <div className="rounded-xl bg-info-soft text-info p-3 mb-5 text-sm flex items-center gap-2">
        <Shield size={16} /> Ambiente de demonstração — exibindo métricas da empresa atual ({company.name}).
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Stat label="Empresas" value={1} icon={<Building2 size={16} />} tone="brand" />
        <Stat label="Usuários" value={team.length + 1} icon={<Users size={16} />} tone="info" />
        <Stat label="Obras criadas" value={projects.length} icon={<Building2 size={16} />} tone="neutral" />
        <Stat label="RDOs gerados" value={reports.length} icon={<FileText size={16} />} tone="success" />
        <Stat label="PDFs gerados" value={reports.length + finalReports.length} icon={<FileDown size={16} />} tone="brand" />
        <Stat label="Fotos / Vídeos" value={`${photos} / ${videos}`} icon={<Images size={16} />} tone="info" />
        <Stat label="Storage estimado" value={`${storageMb} MB`} icon={<HardDrive size={16} />} tone="warning" />
        <Stat label="Sessões de IA" value={aiSessions} icon={<Sparkles size={16} />} tone="brand" hint={`${voiceSessions} por voz`} />
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Assinatura e plano" icon={<Building2 size={18} />} />
          <div className="p-4 space-y-3">
            <Row label="Empresa" value={company.name} />
            <Row label="Plano" value={<Badge tone="brand" className="capitalize">{company.plan}</Badge>} />
            <Row label="Status" value={<Badge tone="success">Ativa</Badge>} />
            <Row label="Tipo" value="Cliente pagante (demo)" />
            <Row label="Transcrições de voz" value={`${voiceSessions} registradas`} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Logs recentes" icon={<Mic size={18} />} />
          <div className="divide-y divide-border">
            {logs.length === 0 ? <p className="p-4 text-sm text-muted">Sem atividade.</p> :
              logs.map((l, i) => (
                <div key={i} className="flex items-center justify-between p-3.5 text-sm">
                  <div className="flex items-center gap-2"><Film size={14} className="text-muted" /> {l.action}</div>
                  <span className="text-xs text-muted">{formatDateTimeBR(l.time)}</span>
                </div>
              ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex items-center justify-between text-sm"><span className="text-muted">{label}</span><span className="font-medium">{value}</span></div>;
}
