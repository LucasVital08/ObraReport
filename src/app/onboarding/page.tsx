"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useStore, useHydrated } from "@/lib/store";
import { Logo } from "@/components/brand";
import { Button, Card, Field, Input, Textarea, Progress } from "@/components/ui";
import { todayISO } from "@/lib/utils";
import {
  Building2, Palette, HardHat, Users, FileText, Sparkles, ArrowRight,
  ArrowLeft, CheckCircle2, Mic, MessageSquareText, ListChecks, Play,
} from "lucide-react";

const COLORS = ["#f4720b", "#2563eb", "#16a34a", "#7c3aed", "#dc2626", "#0891b2"];
const PDF_TEMPLATES = [
  { id: "executivo", name: "Executivo", desc: "Objetivo, foco em resumo e dados." },
  { id: "detalhado", name: "Detalhado com fotos", desc: "Fotos grandes e seções completas." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const hydrated = useHydrated();
  const isAuth = useStore((s) => s.isAuthenticated);
  const company = useStore((s) => s.company);
  const updateCompany = useStore((s) => s.updateCompany);
  const addProject = useStore((s) => s.addProject);
  const addTeamMember = useStore((s) => s.addTeamMember);
  const completeOnboarding = useStore((s) => s.completeOnboarding);
  const loadDemo = useStore((s) => s.loadDemo);

  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState(company.name);
  const [color, setColor] = React.useState(company.brandColor);
  const [city, setCity] = React.useState(company.city || "");
  const [projName, setProjName] = React.useState("");
  const [projClient, setProjClient] = React.useState("");
  const [projAddress, setProjAddress] = React.useState("");
  const [members, setMembers] = React.useState("");
  const [template, setTemplate] = React.useState("detalhado");

  React.useEffect(() => {
    if (hydrated && !isAuth) router.replace("/login");
  }, [hydrated, isAuth, router]);

  const steps = ["Empresa", "Identidade", "Primeira obra", "Equipe", "Modelo de PDF", "Pronto"];
  const progress = ((step + 1) / steps.length) * 100;

  function finish() {
    updateCompany({ name, brandColor: color, city, logoText: name.slice(0, 3).toUpperCase() });
    let projectId: string | undefined;
    if (projName.trim()) {
      projectId = addProject({
        name: projName, client: projClient || "Cliente", address: projAddress,
        technicalLead: "", supervisor: "", startDate: todayISO(),
        expectedEndDate: todayISO(), status: "em_andamento", description: "",
        coverColor: color,
      });
    }
    members.split("\n").map((m) => m.trim()).filter(Boolean).forEach((m) => {
      addTeamMember({ name: m, role: "Membro", active: true, projectId });
    });
    completeOnboarding();
    router.push(projectId ? `/app/obras/${projectId}` : "/app");
  }

  function skipWithDemo() {
    loadDemo();
    router.push("/app");
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-soft/40 to-background flex flex-col">
      <header className="p-4 flex items-center justify-between">
        <Logo />
        <button onClick={skipWithDemo} className="text-sm text-muted hover:text-foreground flex items-center gap-1.5">
          <Play size={14} /> Pular com dados demo
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-lg">
          <div className="mb-4">
            <div className="flex justify-between text-xs text-muted mb-1.5">
              <span>Passo {step + 1} de {steps.length}</span>
              <span>{steps[step]}</span>
            </div>
            <Progress value={progress} />
          </div>

          <Card className="p-6 animate-fade-up">
            {step === 0 && (
              <Step icon={<Building2 />} title="Vamos configurar sua empresa" desc="Esses dados aparecem nos seus relatórios.">
                <Field label="Nome da empresa"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="AKS Enterprise" /></Field>
                <Field label="Cidade / Estado"><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Vitória - ES" /></Field>
              </Step>
            )}
            {step === 1 && (
              <Step icon={<Palette />} title="Identidade visual" desc="Escolha a cor principal e veja a prévia da sua logo.">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center text-white font-bold text-lg" style={{ background: color }}>
                    {name.slice(0, 3).toUpperCase() || "ABC"}
                  </div>
                  <p className="text-sm text-muted">Logo simulada (iniciais). Você pode enviar uma imagem depois em Configurações.</p>
                </div>
                <Field label="Cor principal">
                  <div className="flex gap-2 flex-wrap">
                    {COLORS.map((c) => (
                      <button key={c} onClick={() => setColor(c)}
                        className={`h-9 w-9 rounded-full border-2 ${color === c ? "border-foreground" : "border-transparent"}`}
                        style={{ background: c }} />
                    ))}
                  </div>
                </Field>
              </Step>
            )}
            {step === 2 && (
              <Step icon={<HardHat />} title="Crie sua primeira obra" desc="Você pode pular e criar depois.">
                <Field label="Nome da obra"><Input value={projName} onChange={(e) => setProjName(e.target.value)} placeholder="Reforma Loja Centro" /></Field>
                <Field label="Cliente / contratante"><Input value={projClient} onChange={(e) => setProjClient(e.target.value)} placeholder="Nome do cliente" /></Field>
                <Field label="Endereço"><Input value={projAddress} onChange={(e) => setProjAddress(e.target.value)} placeholder="Rua, número, cidade" /></Field>
              </Step>
            )}
            {step === 3 && (
              <Step icon={<Users />} title="Convide sua equipe" desc="Um nome por linha. Opcional.">
                <Field label="Membros da equipe">
                  <Textarea value={members} onChange={(e) => setMembers(e.target.value)} placeholder={"William Costa\nÍtalo Ferreira\nHopkins Almeida"} />
                </Field>
              </Step>
            )}
            {step === 4 && (
              <Step icon={<FileText />} title="Modelo de PDF" desc="Você poderá alternar a qualquer momento.">
                <div className="space-y-2">
                  {PDF_TEMPLATES.map((t) => (
                    <button key={t.id} onClick={() => setTemplate(t.id)}
                      className={`w-full text-left rounded-xl border p-3 ${template === t.id ? "border-brand bg-brand-soft" : "border-border"}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{t.name}</span>
                        {template === t.id && <CheckCircle2 size={18} className="text-brand" />}
                      </div>
                      <p className="text-sm text-muted mt-0.5">{t.desc}</p>
                    </button>
                  ))}
                </div>
              </Step>
            )}
            {step === 5 && (
              <Step icon={<Sparkles />} title="Tudo pronto!" desc="Veja como criar seu RDO em segundos:">
                <div className="space-y-2">
                  {[
                    [Mic, "RDO por voz", "Toque no microfone e fale o que aconteceu."],
                    [MessageSquareText, "RDO por texto", "Cole qualquer anotação e a IA organiza."],
                    [ListChecks, "Perguntas guiadas", "Responda perguntas simples uma a uma."],
                  ].map(([Icon, t, d]) => {
                    const I = Icon as React.ElementType;
                    return (
                      <div key={t as string} className="flex items-start gap-3 rounded-xl bg-black/5 dark:bg-white/5 p-3">
                        <div className="h-9 w-9 rounded-lg bg-brand text-white flex items-center justify-center shrink-0"><I size={18} /></div>
                        <div><p className="font-medium text-sm">{t as string}</p><p className="text-xs text-muted">{d as string}</p></div>
                      </div>
                    );
                  })}
                </div>
              </Step>
            )}

            <div className="flex items-center justify-between mt-6">
              <Button variant="ghost" onClick={() => (step === 0 ? router.push("/") : setStep(step - 1))}>
                <ArrowLeft size={16} /> Voltar
              </Button>
              {step < steps.length - 1 ? (
                <Button onClick={() => setStep(step + 1)}>Continuar <ArrowRight size={16} /></Button>
              ) : (
                <Button onClick={finish}>Entrar no painel <ArrowRight size={16} /></Button>
              )}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

function Step({ icon, title, desc, children }: { icon: React.ReactNode; title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="h-12 w-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center mb-3">{icon}</div>
      <h2 className="text-xl font-bold">{title}</h2>
      <p className="text-sm text-muted mt-1 mb-5">{desc}</p>
      <div className="space-y-4">{children}</div>
    </div>
  );
}
