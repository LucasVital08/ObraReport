"use client";

import React from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, Select, EmptyState, Badge } from "@/components/ui";
import { formatDateBR } from "@/lib/utils";
import { Images, Camera, Film } from "lucide-react";
import type { MediaItem } from "@/lib/types";

type EnrichedMedia = MediaItem & { rdoId: string; projectId: string; rdoNumber: number; date: string };

export default function FotosPage() {
  const reports = useStore((s) => s.reports);
  const projects = useStore((s) => s.projects);
  const [filter, setFilter] = React.useState("");
  const [phase, setPhase] = React.useState("");
  const [kind, setKind] = React.useState("");

  const allMedia: EnrichedMedia[] = reports.flatMap((r) =>
    r.media.map((m) => ({ ...m, rdoId: r.id, projectId: r.projectId, rdoNumber: r.number, date: r.date })),
  );

  const filtered = allMedia.filter((m) =>
    (!filter || m.projectId === filter) && (!phase || m.phase === phase) && (!kind || m.kind === kind),
  );

  // agrupa por data (linha do tempo)
  const byDate = filtered.reduce<Record<string, EnrichedMedia[]>>((acc, m) => {
    (acc[m.date] ||= []).push(m);
    return acc;
  }, {});
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a));

  return (
    <div>
      <PageHeader title="Fotos e vídeos" description="Galeria e linha do tempo da obra" />

      <Card className="p-3 mb-4 flex flex-wrap gap-2">
        <Select value={filter} onChange={(e) => setFilter(e.target.value)} className="max-w-xs"><option value="">Todas as obras</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select>
        <Select value={phase} onChange={(e) => setPhase(e.target.value)} className="w-40"><option value="">Todas as fases</option><option value="antes">Antes</option><option value="durante">Durante</option><option value="depois">Depois</option></Select>
        <Select value={kind} onChange={(e) => setKind(e.target.value)} className="w-36"><option value="">Tudo</option><option value="photo">Fotos</option><option value="video">Vídeos</option></Select>
      </Card>

      {filtered.length === 0 ? (
        <Card><EmptyState icon={<Images size={40} />} title="Nenhuma mídia" description="Adicione fotos e vídeos ao criar ou editar um RDO." /></Card>
      ) : (
        <div className="space-y-6">
          {dates.map((date) => (
            <div key={date}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{formatDateBR(date)}</h3>
                <Badge>{byDate[date].length}</Badge>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                {byDate[date].map((m) => (
                  <Link key={m.id} href={`/app/rdo/${m.rdoId}`} className="rounded-xl overflow-hidden aspect-square border border-border relative group">
                    {m.dataUrl ? <img src={m.dataUrl} alt={m.caption} className="w-full h-full object-cover" /> :
                      <div className="w-full h-full flex items-center justify-center" style={{ background: m.color }}>
                        {m.kind === "video" ? <Film size={20} className="text-white/90" /> : <Camera size={18} className="text-white/80" />}
                      </div>}
                    <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white rounded px-1 capitalize">{m.phase}</span>
                    <span className="absolute bottom-0 inset-x-0 text-[10px] bg-black/60 text-white px-1 py-0.5 truncate">{m.caption}</span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
