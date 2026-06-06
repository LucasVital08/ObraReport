"use client";

import React from "react";
import { Field, Input, Textarea, Select } from "@/components/ui";
import { PROJECT_STATUS_LABELS, type Project, type ProjectStatus } from "@/lib/types";
import { todayISO } from "@/lib/utils";

export const PROJECT_COLORS = ["#f4720b", "#2563eb", "#16a34a", "#7c3aed", "#dc2626", "#0891b2", "#db2777", "#ca8a04"];

export interface ProjectFormState {
  name: string; client: string; address: string; technicalLead: string; supervisor: string;
  startDate: string; expectedEndDate: string; realEndDate: string; status: ProjectStatus;
  budget: string; description: string; coverColor: string;
}

export function emptyProjectForm(supervisor = ""): ProjectFormState {
  return {
    name: "", client: "", address: "", technicalLead: "", supervisor,
    startDate: todayISO(), expectedEndDate: todayISO(), realEndDate: "",
    status: "em_andamento", budget: "", description: "", coverColor: "#f4720b",
  };
}

export function projectToForm(p: Project): ProjectFormState {
  return {
    name: p.name, client: p.client, address: p.address || "", technicalLead: p.technicalLead || "",
    supervisor: p.supervisor || "", startDate: p.startDate || todayISO(),
    expectedEndDate: p.expectedEndDate || todayISO(), realEndDate: p.realEndDate || "",
    status: p.status, budget: p.budget ? String(p.budget) : "",
    description: p.description || "", coverColor: p.coverColor || "#f4720b",
  };
}

// Converte o formulário para o objeto da obra (campos editáveis).
export function formToProject(form: ProjectFormState) {
  return {
    name: form.name.trim() || "Nova obra",
    client: form.client.trim() || "Cliente",
    address: form.address,
    technicalLead: form.technicalLead,
    supervisor: form.supervisor,
    startDate: form.startDate,
    expectedEndDate: form.expectedEndDate,
    realEndDate: form.realEndDate || undefined,
    status: form.status,
    budget: form.budget ? Number(form.budget) : undefined,
    description: form.description,
    coverColor: form.coverColor,
  };
}

export function ProjectFormFields({ form, set }: {
  form: ProjectFormState;
  set: <K extends keyof ProjectFormState>(k: K, v: ProjectFormState[K]) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      <Field label="Término real (opcional)"><Input type="date" value={form.realEndDate} onChange={(e) => set("realEndDate", e.target.value)} /></Field>
      <Field label="Orçamento estimado (R$)"><Input type="number" value={form.budget} onChange={(e) => set("budget", e.target.value)} placeholder="0,00" /></Field>
      <div className="sm:col-span-2">
        <Field label="Cor da obra">
          <div className="flex gap-2 flex-wrap pt-2">
            {PROJECT_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => set("coverColor", c)}
                className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${form.coverColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                style={{ background: c }} aria-label={`Cor ${c}`} />
            ))}
          </div>
        </Field>
      </div>
      <div className="sm:col-span-2"><Field label="Descrição"><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Escopo e detalhes da obra" /></Field></div>
    </div>
  );
}
