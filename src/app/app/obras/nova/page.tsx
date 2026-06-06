"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button } from "@/components/ui";
import { ProjectFormFields, emptyProjectForm, formToProject, type ProjectFormState } from "@/components/project-form";
import { UpgradeGate } from "@/components/upgrade-gate";
import { usePlan } from "@/lib/usePlan";
import { formatLimit } from "@/lib/plans";
import { Building2 } from "lucide-react";

export default function NovaObraPage() {
  const router = useRouter();
  const addProject = useStore((s) => s.addProject);
  const user = useStore((s) => s.user);
  const { canAddObra, limits, activeObras } = usePlan();

  const [form, setForm] = React.useState<ProjectFormState>(() => emptyProjectForm(user.name));
  function set<K extends keyof ProjectFormState>(k: K, v: ProjectFormState[K]) { setForm((f) => ({ ...f, [k]: v })); }

  function save() {
    const id = addProject(formToProject(form));
    router.push(`/app/obras/${id}`);
  }

  if (!canAddObra) {
    return (
      <div>
        <PageHeader title="Nova obra" description="Cadastre os dados do projeto" backHref="/app/obras" />
        <UpgradeGate
          title="Limite de obras do seu plano atingido"
          description={`Seu plano permite ${formatLimit(limits.obras)} obra(s) ativa(s) e você já tem ${activeObras}. Faça upgrade para cadastrar mais obras ou conclua/arquive uma obra existente.`}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Nova obra" description="Cadastre os dados do projeto" backHref="/app/obras" />
      <Card className="max-w-2xl">
        <CardHeader title="Dados da obra" icon={<Building2 size={18} />} />
        <div className="p-4"><ProjectFormFields form={form} set={set} /></div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" onClick={() => router.push("/app/obras")}>Cancelar</Button>
          <Button onClick={save}>Criar obra</Button>
        </div>
      </Card>
    </div>
  );
}
