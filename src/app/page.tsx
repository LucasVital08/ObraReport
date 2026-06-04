"use client";

import Link from "next/link";
import { Logo } from "@/components/brand";
import { Button, Card } from "@/components/ui";
import { PLANS, formatPlanPrice } from "@/lib/plans";
import {
  Mic, FileText, MessageSquareText, Images, PenLine, Wallet, Users,
  CheckCircle2, ArrowRight, Sparkles, ShieldCheck, Smartphone, FileCheck2,
  XCircle, Building2,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/90 backdrop-blur">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 h-16">
          <Logo />
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted">
            <a href="#solucao" className="hover:text-foreground">Solução</a>
            <a href="#recursos" className="hover:text-foreground">Recursos</a>
            <a href="#planos" className="hover:text-foreground">Planos</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login"><Button variant="ghost" size="sm">Entrar</Button></Link>
            <Link href="/register"><Button size="sm">Teste grátis</Button></Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-brand-soft/60 to-transparent dark:from-brand-soft/20" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 sm:py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-brand/30 bg-brand-soft px-4 py-1.5 text-sm font-medium text-brand-dark mb-6">
            <Sparkles size={16} /> RDO inteligente feito para o Brasil
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-foreground max-w-3xl mx-auto leading-tight">
            Transforme voz, fotos e anotações da obra em{" "}
            <span className="text-brand">RDO profissional</span> em menos de 5 minutos.
          </h1>
          <p className="mt-5 text-lg text-muted max-w-2xl mx-auto">
            Controle equipe, tarefas, gastos, fotos, vídeos, materiais, ocorrências e gere
            relatórios diários e finais da obra com IA.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/register"><Button size="lg" className="w-full sm:w-auto">Começar teste grátis <ArrowRight size={18} /></Button></Link>
            <Link href="/login?demo=1"><Button size="lg" variant="outline" className="w-full sm:w-auto">Ver demonstração</Button></Link>
          </div>
          <p className="mt-4 text-sm text-muted">Sem cartão de crédito • Dados de demonstração inclusos</p>

          {/* Mock card */}
          <div className="mt-12 max-w-2xl mx-auto text-left">
            <Card className="p-5 shadow-xl">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-12 w-12 rounded-full bg-brand text-white flex items-center justify-center animate-pulse-ring"><Mic size={22} /></span>
                <div>
                  <p className="font-semibold">Assistente RDO IA</p>
                  <p className="text-sm text-muted">Ouvindo… fale o que aconteceu na obra</p>
                </div>
              </div>
              <p className="text-sm text-muted italic border-l-2 border-brand pl-3">
                “Hoje a equipe chegou às 9h30. Estavam William, Ítalo e Lucas. Iniciamos o
                lixamento e a preparação da superfície. Faltou uma extensão…”
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                {[
                  ["Horário", "09:30 – 17:00"],
                  ["Equipe", "3 presentes"],
                  ["Atividades", "Lixamento, preparação"],
                  ["Ocorrência", "Falta de extensão"],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-black/5 dark:bg-white/5 px-3 py-2">
                    <p className="text-xs text-muted">{k}</p>
                    <p className="font-medium">{v}</p>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-success text-sm font-medium">
                <CheckCircle2 size={16} /> IA organizou em RDO estruturado
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Dores */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center">Cansado de RDO feito no improviso?</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            "RDO feito no WhatsApp", "Fotos perdidas na galeria", "Falta de comprovação do serviço",
            "Cliente pedindo prestação de contas", "Gastos desorganizados", "Equipe sem controle",
            "Relatórios demorados", "Informações incompletas", "Final da obra sem documentação",
          ].map((d) => (
            <div key={d} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3">
              <XCircle size={18} className="text-danger shrink-0" />
              <span className="text-sm">{d}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Solução */}
      <section id="solucao" className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">A solução completa para o diário de obra</h2>
          <p className="text-center text-muted mt-2 max-w-xl mx-auto">Tudo o que você precisa para documentar, controlar e comprovar a execução da obra.</p>
          <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              [Mic, "RDO por voz", "Fale o que aconteceu e a IA monta o relatório."],
              [MessageSquareText, "RDO por IA com texto", "Cole qualquer anotação e receba um RDO estruturado."],
              [FileText, "Perguntas guiadas", "Responda perguntas simples e o RDO se completa sozinho."],
              [Images, "Fotos e vídeos organizados", "Antes, durante e depois — tudo na linha do tempo."],
              [PenLine, "Assinatura do cliente", "Assinatura eletrônica simples no próprio celular."],
              [FileCheck2, "Relatório final da obra", "Consolide todos os RDOs em um único documento."],
            ].map(([Icon, title, desc]) => {
              const I = Icon as React.ElementType;
              return (
                <Card key={title as string} className="p-5">
                  <div className="h-11 w-11 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center mb-3"><I size={22} /></div>
                  <h3 className="font-semibold">{title as string}</h3>
                  <p className="text-sm text-muted mt-1">{desc as string}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Recursos / diferenciais */}
      <section id="recursos" className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center">Por que escolher o ObraReport IA</h2>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            [ShieldCheck, "Feito para o Brasil", "Linguagem simples, do jeito que se fala na obra."],
            [Smartphone, "Funciona no celular", "Mobile-first, instalável como app (PWA)."],
            [Building2, "Para qualquer obra", "Pequena, média ou grande — e vários ramos."],
            [Wallet, "Reduz retrabalho", "Documentação profissional e prestação de contas."],
          ].map(([Icon, title, desc]) => {
            const I = Icon as React.ElementType;
            return (
              <div key={title as string} className="text-center">
                <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center mb-3"><I size={24} /></div>
                <h3 className="font-semibold">{title as string}</h3>
                <p className="text-sm text-muted mt-1">{desc as string}</p>
              </div>
            );
          })}
        </div>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {["Construtoras","Empreiteiros","Engenheiros","Arquitetos","Energia solar","Pintura","Drywall","Elétrica","Climatização","Manutenção"].map((s) => (
            <span key={s} className="rounded-full border border-border bg-surface px-3 py-1 text-sm text-muted">{s}</span>
          ))}
        </div>
      </section>

      {/* Planos resumo */}
      <section id="planos" className="bg-surface border-y border-border">
        <div className="max-w-6xl mx-auto px-4 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">Planos para cada tamanho de operação</h2>
          <p className="text-center text-muted mt-2">Comece grátis. Inteligência artificial já a partir do plano Básico.</p>
          <div className="mt-10 grid sm:grid-cols-2 xl:grid-cols-4 gap-5">
            {PLANS.map((p) => {
              const isFree = p.priceMonthly === null;
              return (
                <Card key={p.id} className={p.highlight ? "p-6 border-brand ring-2 ring-brand/30 relative" : "p-6 relative"}>
                  {p.highlight ? <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand text-white text-xs font-semibold px-3 py-1">Mais popular</span> : null}
                  <h3 className="font-bold text-lg">{p.name}</h3>
                  <p className="text-xs text-muted">{p.tagline}</p>
                  <p className="mt-2"><span className="text-3xl font-extrabold">{formatPlanPrice(p.priceMonthly)}</span><span className="text-muted">{isFree ? "" : "/mês"}</span></p>
                  {!isFree && p.priceAnnual !== null && <p className="text-xs text-muted">ou {formatPlanPrice(p.priceAnnual)}/ano</p>}
                  <ul className="mt-4 space-y-2">
                    {p.shortFeatures.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm"><CheckCircle2 size={16} className="text-success shrink-0" /> {f}</li>
                    ))}
                  </ul>
                  <Link href="/register" className="block mt-5">
                    <Button className="w-full" variant={p.highlight ? "primary" : "outline"}>{isFree ? "Começar grátis" : "Assinar agora"}</Button>
                  </Link>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="max-w-4xl mx-auto px-4 py-20 text-center">
        <Users size={40} className="mx-auto text-brand mb-4" />
        <h2 className="text-2xl sm:text-3xl font-bold">Fale o que aconteceu na obra. A IA faz o resto.</h2>
        <p className="text-muted mt-3 max-w-xl mx-auto">A IA transforma em RDO profissional, organiza fotos e vídeos, e no fim gera o relatório completo da obra.</p>
        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register"><Button size="lg" className="w-full sm:w-auto">Criar meu primeiro RDO <ArrowRight size={18} /></Button></Link>
          <Link href="/login?demo=1"><Button size="lg" variant="outline" className="w-full sm:w-auto">Ver demonstração</Button></Link>
        </div>
      </section>

      <footer className="border-t border-border bg-surface">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" />
          <p className="text-sm text-muted">© {new Date().getFullYear()} ObraReport IA — AKS Enterprise. Todos os direitos reservados.</p>
          <div className="flex gap-4 text-sm text-muted">
            <Link href="/privacidade" className="hover:text-foreground">Privacidade</Link>
            <Link href="/termos" className="hover:text-foreground">Termos</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
