"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { generateRdoPdf, embedReportImages } from "@/lib/pdf";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Select, EmptyState, Badge, useToast } from "@/components/ui";
import { RdoStatusBadge } from "@/components/status";
import { formatDateBR, formatDateTimeBR } from "@/lib/utils";
import { FileText, FileDown, FileCheck2, Building2 } from "lucide-react";

export default function RelatoriosPage() {
  const reports = useStore((s) => s.reports);
  const projects = useStore((s) => s.projects);
  const company = useStore((s) => s.company);
  const finalReports = useStore((s) => s.finalReports);
  const { show, node } = useToast();
  const [filter, setFilter] = React.useState("");

  const filtered = filter ? reports.filter((r) => r.projectId === filter) : reports;
  const sorted = [...filtered].sort((a, b) => b.date.localeCompare(a.date));

  async function pdf(rid: string) {
    const r = reports.find((x) => x.id === rid)!;
    const p = projects.find((x) => x.id === r.projectId);
    if (!p) return;
    show("Gerando PDF…");
    const rForPdf = await embedReportImages(r);
    generateRdoPdf(rForPdf, p, company).save(`RDO-${r.number}.pdf`);
    show("PDF gerado!");
  }

  return (
    <div>
      {node}
      <PageHeader title="Relatórios" description="Todos os RDOs e relatórios finais" />

      {/* Relatórios finais */}
      <Card className="mb-5">
        <CardHeader title="Relatórios finais gerados" icon={<FileCheck2 size={18} />} />
        {finalReports.length === 0 ? (
          <div className="p-4 text-sm text-muted">Nenhum relatório final gerado ainda. Abra uma obra e gere o relatório consolidado.</div>
        ) : (
          <div className="divide-y divide-border">
            {finalReports.map((f) => {
              const p = projects.find((x) => x.id === f.projectId);
              return (
                <Link key={f.id} href={`/app/obras/${f.projectId}/relatorio-final`} className="flex items-center gap-3 p-3.5 hover:bg-black/5 dark:hover:bg-white/5">
                  <div className="h-10 w-10 rounded-xl bg-graphite text-white flex items-center justify-center shrink-0"><FileCheck2 size={18} /></div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-sm truncate">{p?.name}</p><p className="text-xs text-muted">Gerado em {formatDateTimeBR(f.generatedAt)}</p></div>
                  <Badge tone="success">Final</Badge>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      <Card className="p-3 mb-4"><Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs"><option value="">Todas as obras</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Card>

      <Card>
        <CardHeader title="Diários de obra (RDO)" icon={<FileText size={18} />} subtitle={`${sorted.length} relatório(s)`} />
        {sorted.length === 0 ? <EmptyState icon={<FileText size={40} />} title="Nenhum RDO" description="Crie diários de obra para vê-los aqui." /> : (
          <div className="divide-y divide-border">
            {sorted.map((r) => {
              const p = projects.find((x) => x.id === r.projectId);
              return (
                <div key={r.id} className="flex items-center gap-3 p-3.5">
                  <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center font-bold text-sm shrink-0">#{r.number}</div>
                  <Link href={`/app/rdo/${r.id}`} className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p?.name}</p>
                    <p className="text-xs text-muted flex items-center gap-1"><Building2 size={11} /> {formatDateBR(r.date)} • {r.responsible}</p>
                  </Link>
                  <RdoStatusBadge status={r.status} />
                  <Button size="sm" variant="outline" onClick={() => pdf(r.id)}><FileDown size={14} /> PDF</Button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
