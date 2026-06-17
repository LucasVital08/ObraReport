"use client";

import Link from "next/link";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, Button, EmptyState, Badge } from "@/components/ui";
import { ProjectStatusBadge } from "@/components/status";
import { isWatchedProject } from "@/lib/permissions";
import { formatBRL } from "@/lib/utils";
import { Building2, Plus, FileText, MapPin, User, Eye } from "lucide-react";

export default function ObrasPage() {
  // O app é completo para todos: qualquer pessoa vê as próprias obras e pode
  // criar novas. As obras em que o usuário entra apenas como contratante ficam
  // marcadas como "Acompanhando" (somente leitura), mas aparecem na mesma lista.
  const projects = useStore((s) => s.projects);
  const reports = useStore((s) => s.reports);
  const user = useStore((s) => s.user);

  return (
    <div>
      <PageHeader title="Obras" description="Todas as suas obras e projetos"
        action={<Link href="/app/obras/nova"><Button><Plus size={16} /> Nova obra</Button></Link>} />

      {projects.length === 0 ? (
        <Card><EmptyState icon={<Building2 size={40} />} title="Nenhuma obra cadastrada"
          description="Crie sua primeira obra para começar a registrar diários, fotos e gastos."
          action={<Link href="/app/obras/nova"><Button><Plus size={16} /> Criar primeira obra</Button></Link>} /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((p) => {
            const count = reports.filter((r) => r.projectId === p.id).length;
            return (
              <Link key={p.id} href={`/app/obras/${p.id}`}>
                <Card className="overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all h-full">
                  <div className="relative h-20 p-3 flex items-end justify-between" style={{ background: `linear-gradient(135deg, ${p.coverColor}, ${p.coverColor}cc)` }}>
                    <div className="h-9 w-9 rounded-xl bg-white/20 ring-1 ring-white/30 backdrop-blur flex items-center justify-center text-white"><Building2 size={18} /></div>
                    <div className="flex items-center gap-1.5">
                      {isWatchedProject(user, p.id) && <Badge className="bg-white/90 text-graphite"><Eye size={11} /> Acompanhando</Badge>}
                      <ProjectStatusBadge status={p.status} />
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold leading-snug line-clamp-2">{p.name}</h3>
                    <div className="mt-2 space-y-1 text-sm text-muted">
                      <p className="flex items-center gap-1.5"><User size={14} /> {p.client}</p>
                      {p.address && <p className="flex items-center gap-1.5 line-clamp-1"><MapPin size={14} /> {p.address}</p>}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <Badge tone="brand"><FileText size={12} /> {count} RDOs</Badge>
                      {p.budget ? <span className="text-muted">{formatBRL(p.budget)}</span> : null}
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
