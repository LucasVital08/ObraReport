"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Field, Input, useToast, Badge } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/types";
import { getClientVisibility, CLIENT_VISIBILITY_SECTIONS } from "@/lib/visibility";
import { recompressDataUrl } from "@/lib/data/storage";
import { loadProgress, saveProgress } from "@/lib/rdoProgress";
import { Building2, User, Palette, FileText, Moon, Sun, LogOut, Trash2, Shield, Database, Eye, ImageDown } from "lucide-react";

const COLORS = ["#f4720b", "#2563eb", "#16a34a", "#7c3aed", "#dc2626", "#0891b2"];

export default function ConfigPage() {
  const router = useRouter();
  const { show, node } = useToast();
  const company = useStore((s) => s.company);
  const user = useStore((s) => s.user);
  const theme = useStore((s) => s.theme);
  const updateCompany = useStore((s) => s.updateCompany);
  const setTheme = useStore((s) => s.setTheme);
  const logout = useStore((s) => s.logout);
  const resetAll = useStore((s) => s.resetAll);
  const loadDemo = useStore((s) => s.loadDemo);
  const hydrateData = useStore((s) => s.hydrateData);

  const [name, setName] = React.useState(company.name);
  const [city, setCity] = React.useState(company.city || "");
  const [optimizing, setOptimizing] = React.useState(false);

  // Recomprime fotos antigas (já em base64) no lugar e libera espaço, sem perder
  // nada — inclui o RDO em andamento. Em produção (fotos em URL) nada muda.
  async function optimizeSpace() {
    setOptimizing(true);
    try {
      const lsSize = () => ["obrareport-ia-store", "obrareport-rdo-progress-v1"]
        .reduce((n, k) => n + (localStorage.getItem(k)?.length || 0), 0);
      const before = lsSize();

      const recompMedia = (media: { dataUrl?: string }[] | undefined) =>
        Promise.all((media || []).map(async (m) =>
          m.dataUrl && m.dataUrl.startsWith("data:image") ? { ...m, dataUrl: await recompressDataUrl(m.dataUrl) } : m));

      const { reports, documents } = useStore.getState();
      const newReports = await Promise.all(reports.map(async (r) => ({ ...r, media: await recompMedia(r.media) })));
      const newDocs = await Promise.all((documents ?? []).map(async (d) =>
        d.dataUrl && d.dataUrl.startsWith("data:image") ? { ...d, dataUrl: await recompressDataUrl(d.dataUrl) } : d));
      hydrateData({ reports: newReports as typeof reports, documents: newDocs as typeof documents });

      const prog = loadProgress();
      if (prog?.draft) {
        const media = await recompMedia(prog.draft.media);
        saveProgress({ ...prog, draft: { ...prog.draft, media: media as typeof prog.draft.media } });
      }

      setTimeout(() => {
        const freed = Math.round((before - lsSize()) / 1024);
        show(freed > 0 ? `Espaço liberado: ~${freed} KB.` : "As fotos já estavam otimizadas.");
        setOptimizing(false);
      }, 80);
    } catch {
      show("Não foi possível otimizar agora.");
      setOptimizing(false);
    }
  }
  const [template, setTemplate] = React.useState("detalhado");

  const isManager = user.role === "owner" || user.role === "admin";
  const vis = getClientVisibility(company);

  function saveCompany() {
    updateCompany({ name, city, logoText: name.slice(0, 3).toUpperCase() });
    show("Dados da empresa salvos!");
  }

  function toggleVis(key: keyof typeof vis) {
    updateCompany({ clientVisibility: { ...vis, [key]: !vis[key] } });
    show("Visibilidade do contratante atualizada.");
  }

  return (
    <div>
      {node}
      <PageHeader title="Configurações" description="Empresa, conta e preferências" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card>
          <CardHeader title="Empresa" icon={<Building2 size={18} />} />
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold" style={{ background: company.brandColor }}>{company.logoText}</div>
              <div><p className="font-medium">{company.name}</p><Badge tone="brand" className="capitalize mt-0.5">Plano {company.plan}</Badge></div>
            </div>
            <Field label="Nome da empresa"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Cidade / Estado"><Input value={city} onChange={(e) => setCity(e.target.value)} /></Field>
            <Field label="Cor principal">
              <div className="flex gap-2 pt-1">{COLORS.map((c) => <button key={c} onClick={() => updateCompany({ brandColor: c })} className={`h-8 w-8 rounded-full border-2 ${company.brandColor === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} />)}</div>
            </Field>
            <Button onClick={saveCompany}>Salvar empresa</Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Conta" icon={<User size={18} />} />
          <div className="p-4 space-y-4">
            <Field label="Nome"><Input value={user.name} readOnly /></Field>
            <Field label="E-mail"><Input value={user.email} readOnly /></Field>
            <Field label="Perfil"><Input value={ROLE_LABELS[user.role]} readOnly /></Field>
            <Button variant="outline" onClick={() => { logout(); router.push("/login"); }}><LogOut size={16} /> Sair da conta</Button>
          </div>
        </Card>

        <Card>
          <CardHeader title="Aparência" icon={<Palette size={18} />} />
          <div className="p-4 space-y-3">
            <p className="text-sm text-muted">Tema da interface</p>
            <div className="flex gap-2">
              <Button variant={theme === "light" ? "primary" : "outline"} onClick={() => setTheme("light")}><Sun size={16} /> Claro</Button>
              <Button variant={theme === "dark" ? "primary" : "outline"} onClick={() => setTheme("dark")}><Moon size={16} /> Escuro</Button>
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="Modelo de PDF" icon={<FileText size={18} />} />
          <div className="p-4 space-y-2">
            {[["executivo", "Executivo", "Objetivo, foco em resumo."], ["detalhado", "Detalhado com fotos", "Fotos grandes e seções completas."]].map(([id, n, d]) => (
              <button key={id} onClick={() => setTemplate(id)} className={`w-full text-left rounded-xl border p-3 ${template === id ? "border-brand bg-brand-soft" : "border-border"}`}>
                <p className="font-medium text-sm">{n}</p><p className="text-xs text-muted">{d}</p>
              </button>
            ))}
          </div>
        </Card>

        {isManager && (
          <Card className="lg:col-span-2">
            <CardHeader title="O que o contratante enxerga" icon={<Eye size={18} />}
              subtitle="Escolha quais seções do RDO o contratante vê — na tela e no PDF. O time interno sempre vê tudo." />
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CLIENT_VISIBILITY_SECTIONS.map((s) => (
                <button key={s.key} onClick={() => toggleVis(s.key)}
                  className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${vis[s.key] ? "border-brand bg-brand-soft" : "border-border"}`}>
                  <span className={`mt-0.5 h-5 w-9 shrink-0 rounded-full flex items-center px-0.5 transition-colors ${vis[s.key] ? "bg-brand justify-end" : "bg-black/15 dark:bg-white/20 justify-start"}`}>
                    <span className="h-4 w-4 rounded-full bg-white" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-medium">{s.label}</span>
                    <span className="block text-xs text-muted">{vis[s.key] ? "Visível ao contratante" : "Oculto do contratante"} — {s.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </Card>
        )}

        <Card className="lg:col-span-2">
          <CardHeader title="Privacidade e dados (LGPD)" icon={<Shield size={18} />} />
          <div className="p-4 space-y-3 text-sm text-muted">
            <p>Seus dados ficam isolados por empresa e armazenados localmente neste dispositivo nesta versão de demonstração. Você pode recarregar os dados de exemplo ou excluir tudo.</p>
            <p>Fotos antigas grandes podem ocupar bastante espaço no aparelho. Use “Otimizar fotos” para recomprimi-las e liberar memória sem perder nenhuma foto.</p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={optimizeSpace} disabled={optimizing}><ImageDown size={16} /> {optimizing ? "Otimizando…" : "Otimizar fotos e liberar espaço"}</Button>
              <Button variant="outline" onClick={() => { loadDemo(); show("Dados de demonstração recarregados!"); }}><Database size={16} /> Recarregar dados demo</Button>
              <Button variant="ghost" className="text-danger" onClick={() => { if (confirm("Excluir TODOS os dados? Esta ação não pode ser desfeita.")) { resetAll(); router.push("/login"); } }}><Trash2 size={16} /> Excluir todos os dados</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
