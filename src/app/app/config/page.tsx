"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Field, Input, useToast, Badge } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/types";
import { Building2, User, Palette, FileText, Moon, Sun, LogOut, Trash2, Shield, Database } from "lucide-react";

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

  const [name, setName] = React.useState(company.name);
  const [city, setCity] = React.useState(company.city || "");
  const [template, setTemplate] = React.useState("detalhado");

  function saveCompany() {
    updateCompany({ name, city, logoText: name.slice(0, 3).toUpperCase() });
    show("Dados da empresa salvos!");
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

        <Card className="lg:col-span-2">
          <CardHeader title="Privacidade e dados (LGPD)" icon={<Shield size={18} />} />
          <div className="p-4 space-y-3 text-sm text-muted">
            <p>Seus dados ficam isolados por empresa e armazenados localmente neste dispositivo nesta versão de demonstração. Você pode recarregar os dados de exemplo ou excluir tudo.</p>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" onClick={() => { loadDemo(); show("Dados de demonstração recarregados!"); }}><Database size={16} /> Recarregar dados demo</Button>
              <Button variant="ghost" className="text-danger" onClick={() => { if (confirm("Excluir TODOS os dados? Esta ação não pode ser desfeita.")) { resetAll(); router.push("/login"); } }}><Trash2 size={16} /> Excluir todos os dados</Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
