"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { organizeRdoText } from "@/lib/ai/engine";
import { emptyDraft, applyAiResult, type RdoDraft } from "@/lib/rdo";
import { useSpeech } from "@/lib/useSpeech";
import { RdoEditor } from "@/components/rdo-editor";
import { PageHeader } from "@/components/page";
import { Card, Button, Select, Textarea, Field, useToast, Badge } from "@/components/ui";
import {
  Mic, MessageSquareText, ListChecks, PenLine, Copy, Square, RotateCcw,
  Sparkles, ArrowRight, ArrowLeft, Save, CheckCircle2, Plus,
} from "lucide-react";

type Stage = "mode" | "voice" | "text" | "questions" | "review";

const QUESTIONS = [
  { key: "atividades", q: "O que foi executado hoje?", hint: "Descreva as principais atividades." },
  { key: "equipe", q: "Quem esteve presente?", hint: "Liste os nomes da equipe." },
  { key: "chegada", q: "Qual foi o horário de chegada?", hint: "Ex.: 07:30" },
  { key: "saida", q: "Qual foi o horário de saída?", hint: "Ex.: 17:00" },
  { key: "status", q: "O serviço foi concluído, parcial ou ficou pendente?", hint: "" },
  { key: "problema", q: "Houve algum problema, atraso ou impedimento?", hint: "" },
  { key: "solicitacao", q: "Houve solicitação do cliente/contratante?", hint: "" },
  { key: "materiais", q: "Foram usados materiais ou equipamentos?", hint: "" },
  { key: "gastos", q: "Houve compra, gasto ou reembolso?", hint: "" },
  { key: "seguranca", q: "Houve acidente, risco ou problema de segurança?", hint: "" },
  { key: "pendencia", q: "O que ficou pendente para o próximo dia?", hint: "" },
  { key: "obs", q: "Alguma observação final?", hint: "" },
];

function NovoRdoInner() {
  const router = useRouter();
  const params = useSearchParams();
  const projects = useStore((s) => s.projects);
  const reports = useStore((s) => s.reports);
  const team = useStore((s) => s.team);
  const user = useStore((s) => s.user);
  const addReport = useStore((s) => s.addReport);
  const { show, node } = useToast();

  const activeProjects = projects.filter((p) => !["entregue", "cancelada"].includes(p.status));
  const initialProject = params.get("obra") || activeProjects[0]?.id || projects[0]?.id || "";
  const [projectId, setProjectId] = React.useState(initialProject);
  const [stage, setStage] = React.useState<Stage>("mode");
  const [draft, setDraft] = React.useState<RdoDraft | null>(null);

  const project = projects.find((p) => p.id === projectId);
  const teamNames = team.filter((t) => t.projectId === projectId || !t.projectId).map((t) => t.name);

  React.useEffect(() => {
    const modo = params.get("modo");
    if (modo && ["voz", "texto", "perguntas", "manual"].includes(modo) && stage === "mode" && projectId) {
      startMode(modo as "voz" | "texto" | "perguntas" | "manual");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startMode(mode: "voz" | "texto" | "perguntas" | "manual") {
    if (!projectId) { show("Selecione uma obra primeiro."); return; }
    const sup = project?.supervisor || user.name;
    const d = emptyDraft(projectId, sup, mode === "voz" ? "voz" : mode === "texto" ? "texto" : mode === "perguntas" ? "perguntas" : "manual");
    setDraft(d);
    if (mode === "voz") setStage("voice");
    else if (mode === "texto") setStage("text");
    else if (mode === "perguntas") setStage("questions");
    else setStage("review");
  }

  function duplicateLast() {
    if (!projectId) { show("Selecione uma obra primeiro."); return; }
    const last = reports.filter((r) => r.projectId === projectId).sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!last) { show("Nenhum RDO anterior nesta obra."); return; }
    const { id, companyId, number, createdAt, updatedAt, ...rest } = last;
    void id; void companyId; void number; void createdAt; void updatedAt;
    setDraft({ ...rest, date: new Date().toISOString().slice(0, 10), status: "rascunho", signatures: [] });
    setStage("review");
  }

  function save() {
    if (!draft) return;
    const id = addReport(draft);
    show("RDO salvo com sucesso!");
    setTimeout(() => router.push(`/app/rdo/${id}`), 500);
  }

  if (!project && stage === "mode") {
    // sem obra
  }

  return (
    <div>
      {node}
      <PageHeader title="Criar RDO" description="Diário de obra inteligente" backHref="/app" />

      {/* Seletor de obra */}
      <Card className="p-4 mb-5">
        {projects.length === 0 ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="font-medium">Você ainda não tem nenhuma obra</p>
              <p className="text-sm text-muted">Crie uma obra para começar a registrar RDOs.</p>
            </div>
            <Link href="/app/obras/nova"><Button><Plus size={16} /> Criar obra</Button></Link>
          </div>
        ) : (
          <Field label="Obra / projeto">
            <div className="flex gap-2 items-stretch">
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="flex-1 min-w-0 truncate">
                <option value="">Selecione a obra…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
              <Link href="/app/obras/nova" className="shrink-0">
                <Button variant="outline" className="h-full whitespace-nowrap"><Plus size={16} /> Nova obra</Button>
              </Link>
            </div>
          </Field>
        )}
      </Card>

      {stage === "mode" && projects.length > 0 && <ModeSelector onSelect={startMode} onDuplicate={duplicateLast} />}

      {stage === "voice" && draft && (
        <VoiceMode draft={draft} onBack={() => setStage("mode")}
          onDone={(d) => { setDraft(d); setStage("review"); }} />
      )}
      {stage === "text" && draft && (
        <TextMode draft={draft} onBack={() => setStage("mode")}
          onDone={(d) => { setDraft(d); setStage("review"); }} />
      )}
      {stage === "questions" && draft && (
        <QuestionsMode draft={draft} onBack={() => setStage("mode")}
          onDone={(d) => { setDraft(d); setStage("review"); }} />
      )}

      {stage === "review" && draft && (
        <div>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => setStage("mode")}><ArrowLeft size={16} /> Modo</Button>
              <Badge tone="brand"><Sparkles size={12} /> Revisão do RDO</Badge>
            </div>
            <Button onClick={save}><Save size={16} /> Salvar RDO</Button>
          </div>
          <RdoEditor draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} teamSuggestions={teamNames} />
          <div className="mt-5 flex justify-end">
            <Button size="lg" onClick={save}><Save size={18} /> Salvar RDO</Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeSelector({ onSelect, onDuplicate }: { onSelect: (m: "voz" | "texto" | "perguntas" | "manual") => void; onDuplicate: () => void }) {
  const modes: { id: "voz" | "texto" | "perguntas" | "manual"; icon: React.ElementType; title: string; desc: string; featured?: boolean }[] = [
    { id: "voz", icon: Mic, title: "Criar com IA por voz", desc: "Toque no microfone e fale o que aconteceu. A IA organiza tudo.", featured: true },
    { id: "texto", icon: MessageSquareText, title: "Criar com IA por texto", desc: "Cole ou digite um texto bruto. A IA transforma em RDO." },
    { id: "perguntas", icon: ListChecks, title: "Criar por perguntas", desc: "Responda perguntas simples, uma a uma." },
    { id: "manual", icon: PenLine, title: "Criar manualmente", desc: "Preencha todos os campos no formulário tradicional." },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {modes.map((m) => {
        const Icon = m.icon;
        return (
          <button key={m.id} onClick={() => onSelect(m.id)}
            className={`text-left rounded-2xl border p-5 transition-all hover:shadow-md hover:border-brand ${m.featured ? "border-brand bg-brand-soft" : "border-border bg-surface"}`}>
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-3 ${m.featured ? "bg-brand text-white" : "bg-brand-soft text-brand-dark"}`}>
              <Icon size={24} />
            </div>
            <h3 className="font-semibold flex items-center gap-2">{m.title} {m.featured && <Badge tone="brand">Recomendado</Badge>}</h3>
            <p className="text-sm text-muted mt-1">{m.desc}</p>
          </button>
        );
      })}
      <button onClick={onDuplicate} className="text-left rounded-2xl border border-dashed border-border p-5 hover:border-brand transition-colors sm:col-span-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-black/5 dark:bg-white/5 flex items-center justify-center"><Copy size={20} /></div>
          <div><h3 className="font-semibold">Duplicar RDO anterior</h3><p className="text-sm text-muted">Reaproveite o último relatório desta obra como base.</p></div>
        </div>
      </button>
    </div>
  );
}

function VoiceMode({ draft, onBack, onDone }: { draft: RdoDraft; onBack: () => void; onDone: (d: RdoDraft) => void }) {
  const speech = useSpeech();
  const [seconds, setSeconds] = React.useState(0);
  const [manualText, setManualText] = React.useState("");

  React.useEffect(() => {
    if (!speech.listening) return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [speech.listening]);

  const text = speech.transcript || manualText;

  function organize() {
    const finalText = (speech.transcript + " " + manualText).trim();
    const ai = organizeRdoText(finalText);
    onDone(applyAiResult(draft, ai, finalText));
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={16} /> Voltar</Button>
        <Badge tone="brand"><Mic size={12} /> RDO por voz</Badge>
      </div>

      <div className="flex flex-col items-center text-center py-4">
        <button
          onClick={() => (speech.listening ? speech.stop() : speech.start())}
          className={`h-24 w-24 rounded-full flex items-center justify-center text-white transition-all ${speech.listening ? "bg-danger animate-pulse-ring" : "bg-brand hover:bg-brand-dark"}`}
        >
          {speech.listening ? <Square size={32} /> : <Mic size={40} />}
        </button>
        <p className="mt-4 font-medium">
          {speech.listening ? `Ouvindo… ${formatTime(seconds)}` : "Toque para falar"}
        </p>
        <p className="text-sm text-muted mt-1 max-w-sm">
          {speech.supported
            ? "Fale naturalmente: equipe, horários, atividades, materiais, ocorrências e pendências."
            : "Seu navegador não suporta reconhecimento de voz. Digite o texto abaixo."}
        </p>
      </div>

      {(text || speech.interim) && (
        <div className="rounded-xl bg-black/5 dark:bg-white/5 p-4 text-sm">
          <p className="text-xs text-muted mb-1 uppercase tracking-wide">Transcrição</p>
          {speech.transcript}<span className="text-muted">{speech.interim}</span>
        </div>
      )}

      <div className="mt-4">
        <Field label={speech.supported ? "Ou complemente por texto" : "Digite o relato"}>
          <Textarea value={manualText} onChange={(e) => setManualText(e.target.value)}
            placeholder="Ex.: Hoje a equipe chegou às 9h30. Estavam William, Ítalo e Lucas. Iniciamos o lixamento..." />
        </Field>
      </div>

      <div className="flex items-center justify-between mt-4 gap-2 flex-wrap">
        <Button variant="ghost" onClick={() => { speech.reset(); setManualText(""); setSeconds(0); }}><RotateCcw size={16} /> Limpar</Button>
        <Button onClick={organize} disabled={!(speech.transcript || manualText).trim()}><Sparkles size={16} /> Organizar com IA <ArrowRight size={16} /></Button>
      </div>
    </Card>
  );
}

function TextMode({ draft, onBack, onDone }: { draft: RdoDraft; onBack: () => void; onDone: (d: RdoDraft) => void }) {
  const [text, setText] = React.useState("");
  const sample = "cheguei 9h30 com william italo geidson hopkins. fomos na castelo locações trocar a lixadeira grande por 2 pequenas, só tinha 1 extensão. iniciei lixamento e preparação. busquei tinta na tech tintas. precisa de jato com mangueira de 20m e 2 plugs. gastei 80 de gasolina e 95 no almoço da equipe";
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={16} /> Voltar</Button>
        <Badge tone="brand"><MessageSquareText size={12} /> RDO por texto</Badge>
      </div>
      <Field label="Cole ou digite seu relato (mesmo bagunçado)" hint="A IA corrige a linguagem e organiza em campos. Não inventa fatos.">
        <Textarea value={text} onChange={(e) => setText(e.target.value)} className="min-h-40"
          placeholder="Escreva como quiser, com abreviações e tudo. A IA organiza." />
      </Field>
      <button onClick={() => setText(sample)} className="text-sm text-brand hover:underline mt-2">Usar texto de exemplo</button>
      <div className="flex justify-end mt-4">
        <Button onClick={() => onDone(applyAiResult(draft, organizeRdoText(text), text))} disabled={!text.trim()}>
          <Sparkles size={16} /> Organizar relatório <ArrowRight size={16} />
        </Button>
      </div>
    </Card>
  );
}

function QuestionsMode({ draft, onBack, onDone }: { draft: RdoDraft; onBack: () => void; onDone: (d: RdoDraft) => void }) {
  const speech = useSpeech();
  const [idx, setIdx] = React.useState(0);
  const [answers, setAnswers] = React.useState<Record<string, string>>({});
  const current = QUESTIONS[idx];
  const progress = ((idx + 1) / QUESTIONS.length) * 100;

  // Texto já confirmado para a pergunta atual.
  const committed = answers[current.key] || "";
  // Enquanto grava, mostra a transcrição ao vivo (parcial + final) na caixa.
  const liveTail = speech.listening ? (speech.transcript + speech.interim).trim() : "";
  const displayValue = speech.listening
    ? (committed ? committed + " " : "") + liveTail
    : committed;

  // Confirma o que foi falado na resposta atual (chamado ao parar de gravar / avançar).
  function commitSpeech() {
    const t = speech.transcript.trim();
    if (t) setAnswers((a) => ({ ...a, [current.key]: (a[current.key] ? a[current.key] + " " : "") + t }));
    speech.reset();
  }

  function toggleMic() {
    if (speech.listening) {
      speech.stop();
      commitSpeech();
    } else {
      speech.reset();
      speech.start();
    }
  }

  function next() {
    if (speech.listening) { speech.stop(); commitSpeech(); }
    if (idx < QUESTIONS.length - 1) { setIdx(idx + 1); speech.reset(); }
    else finish();
  }
  function finish() {
    if (speech.listening) speech.stop();
    const merged = { ...answers };
    const t = speech.transcript.trim();
    if (t) merged[current.key] = (merged[current.key] ? merged[current.key] + " " : "") + t;

    // Descarta respostas negativas/vazias para não gerar registros falsos.
    const isNegative = (s: string) => {
      const v = s.trim().toLowerCase();
      return v === "-" || /^(n[ãa]o|nada|nenhum|nenhuma|sem|n\/a)\b/.test(v);
    };

    // 1) Compilado "pergunta + resposta" — vira o relato original do RDO.
    const qa = QUESTIONS
      .map((q) => ({ q: q.q, a: (merged[q.key] || "").trim() }))
      .filter((x) => x.a)
      .map((x) => `• ${x.q}\n${x.a}`)
      .join("\n\n");

    // 2) Texto guiado para a IA: prefixos por categoria orientam a
    //    classificação (atividades, equipe, ocorrências, solicitações,
    //    materiais, gastos, riscos e pendências).
    const guided: string[] = [];
    const add = (prefix: string, key: string) => {
      const v = (merged[key] || "").trim();
      if (v && !isNegative(v)) guided.push(prefix + v);
    };
    add("", "atividades");
    add("Equipe presente na obra: ", "equipe");
    add("Ocorrência/impedimento: ", "problema");
    add("Solicitação do cliente: ", "solicitacao");
    add("Materiais e equipamentos utilizados: ", "materiais");
    add("Gasto: ", "gastos");
    add("Risco de segurança: ", "seguranca");
    add("Pendência para o próximo dia: ", "pendencia");
    const composed = guided.join(". ");

    // 3) Trata com a IA e aplica ao RDO, preservando o compilado como relato.
    const ai = organizeRdoText(composed);
    let d = applyAiResult(draft, ai, qa || composed);

    // 4) Inclui as informações já precisas (campos diretos das perguntas).
    if (merged.chegada) d = { ...d, arrival: extractTime(merged.chegada) || d.arrival };
    if (merged.saida) d = { ...d, departure: extractTime(merged.saida) || d.departure };
    const noteParts = [merged.obs, merged.status ? `Status do serviço: ${merged.status}` : ""]
      .map((s) => (s || "").trim()).filter(Boolean);
    if (noteParts.length) d = { ...d, notes: noteParts.join(" — ") };

    onDone(d);
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft size={16} /> Voltar</Button>
        <Badge tone="brand"><ListChecks size={12} /> Pergunta {idx + 1} de {QUESTIONS.length}</Badge>
      </div>
      <div className="h-1.5 w-full rounded-full bg-black/10 dark:bg-white/10 mb-6">
        <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="min-h-[120px]">
        <h2 className="text-xl font-bold">{current.q}</h2>
        {current.hint && <p className="text-sm text-muted mt-1">{current.hint}</p>}
        <div className="mt-4 flex gap-2">
          <Textarea value={displayValue} readOnly={speech.listening}
            onChange={(e) => setAnswers({ ...answers, [current.key]: e.target.value })}
            placeholder="Sua resposta (texto ou voz)" className="flex-1" />
          {speech.supported && (
            <button onClick={toggleMic}
              className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-white ${speech.listening ? "bg-danger animate-pulse-ring" : "bg-brand"}`}>
              {speech.listening ? <Square size={18} /> : <Mic size={20} />}
            </button>
          )}
        </div>
        {speech.listening && (
          <p className="text-xs text-brand mt-2 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-danger animate-pulse" /> Ouvindo… fale agora. O texto aparece na caixa.
          </p>
        )}
        {!speech.supported && (
          <p className="text-xs text-muted mt-2">Reconhecimento de voz indisponível neste navegador — digite a resposta.</p>
        )}
      </div>

      <div className="flex items-center justify-between mt-6">
        <Button variant="ghost" onClick={() => { if (idx > 0) { setIdx(idx - 1); speech.reset(); } }} disabled={idx === 0}><ArrowLeft size={16} /> Anterior</Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={next}>Pular</Button>
          {idx < QUESTIONS.length - 1 ? (
            <Button onClick={next}>Próxima <ArrowRight size={16} /></Button>
          ) : (
            <Button onClick={finish}><CheckCircle2 size={16} /> Concluir</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}
function extractTime(s: string): string | undefined {
  const m = s.match(/(\d{1,2})\s*(?:h|horas|:)\s*(\d{0,2})/i);
  if (!m) return undefined;
  return `${m[1].padStart(2, "0")}:${(m[2] || "00").padStart(2, "0")}`;
}

export default function NovoRdoPage() {
  return (
    <Suspense fallback={<div className="text-muted">Carregando…</div>}>
      <NovoRdoInner />
    </Suspense>
  );
}
