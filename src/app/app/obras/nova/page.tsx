"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Field, Input, Textarea, Select } from "@/components/ui";
import { todayISO } from "@/lib/utils";
import { PROJECT_STATUS_LABELS, type ProjectStatus } from "@/lib/types";
import { Building2 } from "lucide-react";

const COLORS = ["#f4720b", "#2563eb", "#16a34a", "#7c3aed", "#dc2626", "#0891b2", "#db2777", "#ca8a04"];

export default function NovaObraPage() {
  const router = useRouter();
  const addProject = useStore((s) => s.addProject);
  const user = useStore((s) => s.user);

  const [form, setForm] = React.useState({
    name: "", client: "", address: "", technicalLead: "", supervisor: user.name,
    startDate: todayISO(), expectedEndDate: todayISO(), status: "em_andamento" as ProjectStatus,
    budget: "", description: "", coverColor: "#f4720b",
  });

  function set<K extends keyof typeof form>(k: K, v: (typeof form)[K]) { setForm((f) => ({ ...f, [k]: v })); }

  function save() {
    const id = addProject({
      name: form.name || "Nova obra", client: form.client || "Cliente", address: form.address,
      technicalLead: form.technicalLead, supervisor: form.supervisor, startDate: form.startDate,
      expectedEndDate: form.expectedEndDate, status: form.status,
      budget: form.budget ? Number(form.budget) : undefined, description: form.description,
      coverColor: form.coverColor,
    });
    router.push(`/app/obras/${id}`);
  }

  return (
    <div>
      <PageHeader title="Nova obra" description="Cadastre os dados do projeto" backHref="/app/obras" />
      <Card className="max-w-2xl">
        <CardHeader title="Dados da obra" icon={<Building2 size={18} />} />
        <div className="p-4 grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2"><Field label="Nome da obra"><Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Ex.: Reforma Loja Centro" /></Field></div>
          <Field label="Cliente / contratante"><Input value={form.client} onChange={(e) => set("client", e.target.value)} /></Field>
          <Field label="Status">
            <Select value={form.status} onChange={(e) => set("status", e.target.value as ProjectStatus)}>
              {Object.entries(PROJECT_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </Select>
          </Field>
          <div className="sm:col-span-2"><Field label="Endereço"><Input value={form.address} onChange={(e) => set("address", e.target.value)} /></Field></div>
          <Field label="Responsável técnico"><Input value={form.technicalLead} onChange={(e) => set("technicalLead", e.target.value)} placeholder="Engenheiro / Arquiteto" /></Field>
          <Field label="Supervisor"><Input value={form.supervisor} onChange={(e) => set("supervisor", e.target.value)} /></Field>
          <Field label="Data de início"><Input type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} /></Field>
          <Field label="Previsão de término"><Input type="date" value={form.expectedEndDate} onChange={(e) => set("expectedEndDate", e.target.value)} /></Field>
          <Field label="Orçamento estimado (R$)"><Input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="0,00" /></Field>
          <Field label="Cor da obra">
            <div className="flex gap-2 flex-wrap pt-2">
              {COLORS.map((c) => <button key={c} onClick={() => set("coverColor", c)} className={`h-8 w-8 rounded-full border-2 ${form.coverColor === c ? "border-foreground" : "border-transparent"}`} style={{ background: c }} />)}
            </div>
          </Field>
          <div className="sm:col-span-2"><Field label="Descrição"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Escopo e detalhes da obra" /></Field></div>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" onClick={() => router.push("/app/obras")}>Cancelar</Button>
          <Button onClick={save}>Criar obra</Button>
        </div>
      </Card>
    </div>
  );
}
