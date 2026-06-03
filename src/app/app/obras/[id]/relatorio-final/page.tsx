"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { buildFinalReport } from "@/lib/ai/engine";
import { generateFinalPdf } from "@/lib/pdf";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Badge, EmptyState, useToast } from "@/components/ui";
import { formatBRL, formatDateBR } from "@/lib/utils";
import {
  FileCheck2, FileDown, Sparkles, Calendar, CheckCircle2, Circle, Wallet,
  AlertTriangle, Hammer, Link2, Camera, ListTodo,
} from "lucide-react";

export default function RelatorioFinalPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { show, node } = useToast();
  const project = useStore((s) => s.projects.find((p) => p.id === id));
  const company = useStore((s) => s.company);
  const reports = useStore((s) => s.reports.filter((r) => r.projectId === id));
  const saveFinalReport = useStore((s) => s.saveFinalReport);

  const [opts, setOpts] = React.useState({
    includeExpenses: true, includeVideos: true, includeInternalOccurrences: true, onlySelectedPhotos: false,
  });

  const ai = React.useMemo(
    () => (project ? buildFinalReport(project, reports) : null),
    [project, reports],
  );

  if (!project || !ai) return <EmptyState title="Obra não encontrada" action={<Button onClick={() => router.push("/app/obras")}>Voltar</Button>} />;

  const allPhotos = reports.flatMap((r) => r.media).filter((m) => m.kind === "photo");
  const totalExpenses = ai.gastos_resumidos.reduce((a, g) => a + g.total, 0);

  function generate() {
    if (!project || !ai) return;
    saveFinalReport({
      projectId: project!.id, generatedAt: new Date().toISOString(),
      executiveSummary: ai.resumo_geral_da_obra, technicalConclusion: ai.conclusao_tecnica,
      recommendations: ai.recomendacoes, options: opts,
    });
    const doc = generateFinalPdf(project!, company, ai, reports, opts);
    doc.save(`Relatorio-Final-${project!.name.slice(0, 25)}.pdf`);
    show("Relatório final gerado!");
  }

  function shareLink() {
    navigator.clipboard?.writeText(window.location.href);
    show("Link compartilhável copiado!");
  }

  if (reports.length === 0) {
    return (
      <div>
        <PageHeader title="Relatório Final" backHref={`/app/obras/${id}`} />
        <Card><EmptyState icon={<FileCheck2 size={40} />} title="Nenhum RDO para consolidar" description="Crie diários de obra antes de gerar o relatório final." /></Card>
      </div>
    );
  }

  return (
    <div>
      {node}
      <PageHeader title="Relatório Final da Obra" description={project.name} backHref={`/app/obras/${id}`}
        action={<div className="flex gap-2"><Button variant="outline" onClick={shareLink}><Link2 size={16} /> Link</Button><Button onClick={generate}><FileDown size={16} /> Gerar PDF</Button></div>} />

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card className="p-5 bg-gradient-to-br from-brand to-brand-dark text-white border-0">
            <div className="flex items-center gap-2 mb-2"><Sparkles size={18} /> <span className="font-semibold">Resumo gerado pela IA</span></div>
            <p className="text-white/95 text-sm leading-relaxed">{ai.resumo_geral_da_obra}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge className="bg-white/20 text-white"><Calendar size={12} /> {ai.periodo_execucao}</Badge>
              <Badge className="bg-white/20 text-white">{reports.length} RDOs</Badge>
              <Badge className="bg-white/20 text-white">{allPhotos.length} fotos</Badge>
              <Badge className="bg-white/20 text-white">{formatBRL(totalExpenses)} em gastos</Badge>
            </div>
          </Card>

          <Card>
            <CardHeader title="Linha do tempo da obra" icon={<Calendar size={18} />} />
            <div className="p-4 space-y-3">
              {ai.linha_do_tempo.map((t, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="h-2.5 w-2.5 rounded-full bg-brand mt-1.5" />
                    {i < ai.linha_do_tempo.length - 1 && <div className="w-px flex-1 bg-border" />}
                  </div>
                  <div className="pb-3">
                    <p className="text-sm font-medium">{formatDateBR(t.date)}</p>
                    <p className="text-sm text-muted">{t.resumo}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <div className="grid sm:grid-cols-2 gap-5">
            <Card>
              <CardHeader title="Principais serviços" icon={<Hammer size={18} />} />
              <div className="p-4 space-y-1.5 text-sm">{ai.principais_servicos.map((s, i) => <p key={i} className="flex gap-2"><CheckCircle2 size={14} className="text-success shrink-0 mt-0.5" /> {s}</p>)}</div>
            </Card>
            <Card>
              <CardHeader title="Pendências em aberto" icon={<ListTodo size={18} />} />
              <div className="p-4 space-y-1.5 text-sm">
                {ai.pendencias_abertas.length === 0 ? <p className="text-success flex items-center gap-2"><CheckCircle2 size={16} /> Obra apta à entrega.</p> :
                  ai.pendencias_abertas.map((s, i) => <p key={i} className="flex gap-2"><Circle size={12} className="text-warning shrink-0 mt-1" /> {s}</p>)}
              </div>
            </Card>
          </div>

          {ai.gastos_resumidos.length > 0 && (
            <Card>
              <CardHeader title="Gastos por categoria" icon={<Wallet size={18} />} />
              <div className="divide-y divide-border">
                {ai.gastos_resumidos.map((g) => (
                  <div key={g.category} className="flex items-center justify-between p-3 text-sm"><span className="capitalize">{g.category}</span><span className="font-medium">{formatBRL(g.total)}</span></div>
                ))}
                <div className="flex items-center justify-between p-3 font-bold"><span>Total</span><span>{formatBRL(totalExpenses)}</span></div>
              </div>
            </Card>
          )}

          {ai.ocorrencias_relevantes.length > 0 && (
            <Card>
              <CardHeader title="Ocorrências relevantes" icon={<AlertTriangle size={18} />} />
              <div className="p-4 space-y-1.5 text-sm">{ai.ocorrencias_relevantes.map((s, i) => <p key={i} className="flex gap-2"><span className="text-danger">•</span> {s}</p>)}</div>
            </Card>
          )}

          <Card>
            <CardHeader title="Conclusão técnica e recomendações" icon={<FileCheck2 size={18} />} />
            <div className="p-4">
              <p className="text-sm">{ai.conclusao_tecnica}</p>
              <ul className="mt-3 space-y-1.5">{ai.recomendacoes.map((r, i) => <li key={i} className="flex gap-2 text-sm text-muted"><span className="text-brand">→</span> {r}</li>)}</ul>
            </div>
          </Card>
        </div>

        {/* Opções */}
        <div className="space-y-5">
          <div className="lg:sticky lg:top-20 space-y-5">
            <Card className="p-5">
              <h3 className="font-semibold mb-3">Opções do relatório</h3>
              <div className="space-y-2">
                <Toggle label="Incluir gastos" checked={opts.includeExpenses} onChange={(v) => setOpts({ ...opts, includeExpenses: v })} />
                <Toggle label="Incluir vídeos" checked={opts.includeVideos} onChange={(v) => setOpts({ ...opts, includeVideos: v })} />
                <Toggle label="Incluir ocorrências internas" checked={opts.includeInternalOccurrences} onChange={(v) => setOpts({ ...opts, includeInternalOccurrences: v })} />
                <Toggle label="Apenas fotos selecionadas" checked={opts.onlySelectedPhotos} onChange={(v) => setOpts({ ...opts, onlySelectedPhotos: v })} />
              </div>
              <Button className="w-full mt-4" onClick={generate}><FileDown size={16} /> Gerar PDF completo</Button>
              <Button variant="outline" className="w-full mt-2" onClick={shareLink}><Link2 size={16} /> Gerar link para o cliente</Button>
            </Card>

            <Card className="p-5">
              <div className="flex items-center gap-2 mb-3"><Camera size={16} className="text-brand" /><h3 className="font-semibold">Galeria consolidada</h3></div>
              <div className="grid grid-cols-3 gap-1.5">
                {allPhotos.slice(0, 9).map((m) => (
                  <div key={m.id} className="rounded-lg overflow-hidden aspect-square border border-border">
                    {m.dataUrl ? <img src={m.dataUrl} alt={m.caption} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full" style={{ background: m.color }} />}
                  </div>
                ))}
              </div>
              {allPhotos.length > 9 && <p className="text-xs text-muted mt-2">+{allPhotos.length - 9} fotos no PDF</p>}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!checked)} className="w-full flex items-center justify-between rounded-xl border border-border px-3 py-2.5 text-sm">
      <span>{label}</span>
      <span className={`h-5 w-9 rounded-full transition-colors relative ${checked ? "bg-brand" : "bg-black/20 dark:bg-white/20"}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${checked ? "left-4" : "left-0.5"}`} />
      </span>
    </button>
  );
}
