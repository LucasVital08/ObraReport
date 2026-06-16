"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { aiFromQuestions } from "@/lib/ai/client";
import { emptyDraft, applyAiResult, type RdoDraft } from "@/lib/rdo";
import { loadProgress, saveProgress, clearProgress } from "@/lib/rdoProgress";
import { useSpeech } from "@/lib/useSpeech";
import { RdoEditor } from "@/components/rdo-editor";
import { PageHeader } from "@/components/page";
import { UpgradeGate } from "@/components/upgrade-gate";
import { usePlan } from "@/lib/usePlan";
import { formatLimit } from "@/lib/plans";
import { Card, Button, Select, Textarea, useToast, Badge } from "@/components/ui";
import {
  Mic, Square, Sparkles, ArrowRight, ArrowLeft, Save, CheckCircle2, Plus, X, Trophy, Wand2, Loader2,
} from "lucide-react";

type Stage = "intro" | "creating" | "review";

// 10 perguntas certeiras: cobrem tudo que um RDO profissional precisa, sem
// redundância. Todas as respostas vão para a IA (prompt consolidado) montar o
// relatório. A ordem segue o raciocínio natural do dia de obra.
const QUESTIONS = [
  { key: "clima", q: "Como estava o tempo e a condição do canteiro hoje?", hint: "Ex.: sol de manhã, chuva à tarde que parou o serviço externo; canteiro organizado." },
  { key: "equipe", q: "Quem trabalhou hoje e em quais funções?", hint: "Nomes e funções. Ex.: João (pedreiro), Carlos (servente)." },
  { key: "horarios", q: "Qual foi o horário de início e de término do trabalho?", hint: "Ex.: das 7h30 às 17h." },
  { key: "atividades", q: "O que foi executado hoje? Detalhe os serviços e o avanço de cada um.", hint: "Diga cada serviço e se ficou concluído, parcial ou não saiu." },
  { key: "materiais", q: "Quais materiais e equipamentos foram usados? Faltou algum?", hint: "Ex.: 10 sacos de cimento, betoneira; faltou areia." },
  { key: "ocorrencias", q: "Houve problema, atraso, impedimento ou questão de segurança?", hint: "Atrasos, falta de material/energia, acidentes, riscos, EPI. Se não houve, diga \"não\"." },
  { key: "solicitacoes", q: "Houve solicitação, decisão ou cobrança do contratante/fiscalização?", hint: "Pedidos, aprovações ou observações do cliente. Se não, diga \"não\"." },
  { key: "gastos", q: "Houve algum gasto, compra ou reembolso?", hint: "Ex.: R$ 80 de gasolina, R$ 95 no almoço. Se não, diga \"não\"." },
  { key: "pendencias", q: "O que ficou pendente e qual o plano para o próximo dia?", hint: "O que falta concluir e o que será feito amanhã." },
  { key: "observacoes", q: "Mais alguma observação técnica importante para registrar?", hint: "Visitas, detalhes técnicos, algo a destacar. Se não, diga \"não\"." },
];

function NovoRdoInner() {
  const router = useRouter();
  const params = useSearchParams();
  const projects = useStore((s) => s.projects);
  const team = useStore((s) => s.team);
  const user = useStore((s) => s.user);
  const addReport = useStore((s) => s.addReport);
  const { show, node } = useToast();
  const { canAddRdo, limits, remainingRdos } = usePlan();

  const activeProjects = projects.filter((p) => !["entregue", "cancelada"].includes(p.status));
  const initialProject = params.get("obra") || activeProjects[0]?.id || projects[0]?.id || "";

  // Retoma o RDO em andamento (sobrevive a refresh/troca de tela).
  const [saved] = React.useState(() => loadProgress());
  const [projectId, setProjectId] = React.useState(saved?.projectId || initialProject);
  const [stage, setStage] = React.useState<Stage>(saved?.stage ?? "intro");
  const [draft, setDraft] = React.useState<RdoDraft | null>(saved?.draft ?? null);
  const [answers, setAnswers] = React.useState<Record<string, string>>(saved?.answers ?? {});
  const [idx, setIdx] = React.useState(saved?.idx ?? 0);
  const [saving, setSaving] = React.useState(false);

  const project = projects.find((p) => p.id === projectId);
  const teamNames = team.filter((t) => t.projectId === projectId || !t.projectId).map((t) => t.name);
  const answeredCount = QUESTIONS.filter((q) => (answers[q.key] || "").trim()).length;

  // Persiste o progresso enquanto cria/revisa; some no modo intro.
  React.useEffect(() => {
    if (stage === "creating" || stage === "review") saveProgress({ stage, projectId, idx, answers, draft });
  }, [stage, projectId, idx, answers, draft]);

  function start() {
    if (!projectId) { show("Selecione uma obra primeiro."); return; }
    if (!canAddRdo) { show("Limite de RDOs do mês atingido. Faça upgrade do plano."); return; }
    setStage("creating");
  }

  function discard() {
    clearProgress();
    setAnswers({}); setIdx(0); setDraft(null); setStage("intro");
  }

  function save() {
    if (!draft || saving) return; // trava contra toque duplo (evita RDO duplicado)
    setSaving(true);
    try {
      const id = addReport(draft);
      clearProgress();
      router.push(`/app/rdo/${id}`);
    } catch {
      setSaving(false); // não trava o botão se algo falhar ao salvar
      show("Não foi possível salvar agora. Tente novamente.");
    }
  }

  // ---- Tela cheia imersiva de criação ----
  if (stage === "creating" && projectId) {
    return (
      <ImmersiveCreator
        projectName={project?.name || "Obra"}
        supervisor={project?.supervisor || user.name}
        projectId={projectId}
        answers={answers} setAnswers={setAnswers} idx={idx} setIdx={setIdx}
        onCancel={() => setStage("intro")}
        onDone={(d) => { setDraft(d); setStage("review"); }}
      />
    );
  }

  // ---- Revisão antes de salvar ----
  if (stage === "review" && draft) {
    return (
      <div>
        {node}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStage("creating")}><ArrowLeft size={16} /> Refazer</Button>
            <Badge tone="brand"><Sparkles size={12} /> Revisão do RDO</Badge>
          </div>
          <Button onClick={save} disabled={saving}><Save size={16} /> {saving ? "Salvando…" : "Salvar RDO"}</Button>
        </div>
        <RdoEditor draft={draft} onChange={(patch) => setDraft({ ...draft, ...patch })} teamSuggestions={teamNames} />
        <div className="mt-5 flex justify-end">
          <Button size="lg" onClick={save} disabled={saving}><Save size={18} /> {saving ? "Salvando…" : "Salvar RDO"}</Button>
        </div>
      </div>
    );
  }

  // ---- Intro (escolha da obra + começar) ----
  return (
    <div>
      {node}
      <PageHeader title="Criar RDO" description="Diário de obra inteligente" backHref="/app" />

      {(answeredCount > 0 || draft) && (
        <Card className="p-4 mb-4 border-brand/40 bg-brand-soft flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-semibold text-sm">Você tem um RDO em andamento</p>
            <p className="text-xs text-muted">{answeredCount}/{QUESTIONS.length} perguntas respondidas{draft ? " • pronto para revisão" : ""}.</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={discard}>Descartar</Button>
            <Button size="sm" onClick={() => setStage(draft ? "review" : "creating")}>Continuar</Button>
          </div>
        </Card>
      )}

      {projects.length > 0 && !canAddRdo ? (
        <UpgradeGate
          title="Limite de RDOs do mês atingido"
          description={`Seu plano permite ${formatLimit(limits.rdosPerMonth)} RDO(s) por mês. Faça upgrade para criar relatórios ilimitados.`}
        />
      ) : projects.length === 0 ? (
        <Card className="p-6 text-center">
          <p className="font-medium">Você ainda não tem nenhuma obra</p>
          <p className="text-sm text-muted mt-1">Crie uma obra para começar a registrar RDOs.</p>
          <Link href="/app/obras/nova" className="inline-block mt-4"><Button><Plus size={16} /> Criar obra</Button></Link>
        </Card>
      ) : (
        <Card className="p-6 bg-gradient-to-br from-brand to-brand-dark text-white border-0">
          <div className="flex items-center gap-2 mb-2"><Wand2 size={20} /><span className="font-semibold">Assistente de RDO por IA</span></div>
          <h2 className="text-2xl font-extrabold leading-tight">Responda algumas perguntas.<br />A IA monta o seu RDO.</h2>
          <p className="text-white/85 text-sm mt-2 max-w-md">
            Uma experiência guiada em tela cheia: responda por <strong>voz</strong> ou <strong>teclado</strong> e
            a inteligência artificial organiza tudo — atividades, equipe, ocorrências, gastos e pendências.
          </p>

          <div className="mt-5 bg-white/10 rounded-2xl p-4">
            <label className="text-xs text-white/80">Obra / projeto</label>
            <div className="mt-1 flex gap-2 items-stretch">
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}
                className="flex-1 min-w-0 truncate bg-white text-graphite border-0">
                <option value="">Selecione a obra…</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>
            </div>
            {remainingRdos !== Infinity && (
              <p className="mt-2 text-xs text-white/80">
                {remainingRdos} RDO(s) restante(s) no seu plano este mês.
              </p>
            )}
          </div>

          <div className="mt-5 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-white/85 text-sm">
              <Trophy size={16} /> {QUESTIONS.length} perguntas • ~2 min
            </div>
            <button onClick={start} disabled={!projectId}
              className="bg-white text-brand-dark font-bold rounded-xl px-6 py-3 inline-flex items-center gap-2 hover:bg-white/90 disabled:opacity-60">
              Começar agora <ArrowRight size={18} />
            </button>
          </div>
        </Card>
      )}
    </div>
  );
}

// =====================================================================
//  Experiência imersiva (tela cheia) de criação por perguntas + IA
// =====================================================================
function ImmersiveCreator({ projectId, projectName, supervisor, answers, setAnswers, idx, setIdx, onCancel, onDone }: {
  projectId: string; projectName: string; supervisor: string;
  answers: Record<string, string>; setAnswers: (a: Record<string, string>) => void;
  idx: number; setIdx: (i: number) => void;
  onCancel: () => void; onDone: (d: RdoDraft) => void;
}) {
  const speech = useSpeech();
  const [busy, setBusy] = React.useState(false);
  const current = QUESTIONS[idx];
  const total = QUESTIONS.length;
  const progress = Math.round(((idx + 1) / total) * 100);
  const answeredCount = QUESTIONS.filter((q) => (answers[q.key] || "").trim()).length;

  const committed = answers[current.key] || "";
  const liveTail = speech.listening ? (speech.transcript + speech.interim).trim() : "";
  const displayValue = speech.listening ? (committed ? committed + " " : "") + liveTail : committed;
  const micBusy = speech.listening || speech.transcribing;

  // Finaliza a captura de voz do trecho atual e devolve o mapa de respostas já
  // com o texto reconhecido aplicado à pergunta corrente (stop() é assíncrono).
  async function captureCurrent(): Promise<Record<string, string>> {
    let extra = "";
    if (speech.listening || speech.transcribing) extra = (await speech.stop()).trim();
    speech.reset();
    const key = current.key;
    if (!extra) return answers;
    return { ...answers, [key]: (answers[key] ? answers[key] + " " : "") + extra };
  }

  async function toggleMic() {
    if (micBusy) { setAnswers(await captureCurrent()); }
    else { speech.reset(); await speech.start(); }
  }
  async function goPrev() {
    const next = await captureCurrent();
    setAnswers(next);
    if (idx > 0) setIdx(idx - 1);
  }
  async function goNext() {
    const next = await captureCurrent();
    setAnswers(next);
    if (idx < total - 1) setIdx(idx + 1);
    else finish(next);
  }

  async function finish(mergedInput?: Record<string, string>) {
    if (busy) return;
    const merged = { ...(mergedInput ?? answers) };
    const isNegative = (s: string) => {
      const v = s.trim().toLowerCase();
      return v === "-" || /^(n[ãa]o|nada|nenhum|nenhuma|sem|n\/a)\b/.test(v);
    };
    const qa = QUESTIONS.map((q) => ({ q: q.q, a: (merged[q.key] || "").trim() }))
      .filter((x) => x.a).map((x) => `• ${x.q}\n${x.a}`).join("\n\n");
    // Todas as respostas (não-negativas) vão para a IA montar o RDO completo.
    const llmAnswers = QUESTIONS
      .map((q) => ({ key: q.key, question: q.q, answer: (merged[q.key] || "").trim() }))
      .filter((a) => a.answer && !isNegative(a.answer));

    setBusy(true);
    const baseDraft = emptyDraft(projectId, supervisor, "perguntas");
    const ai = await aiFromQuestions(llmAnswers);
    let d = applyAiResult(baseDraft, ai, qa);
    // Fallback determinístico de horários a partir da resposta de horário.
    if (merged.horarios && (!d.arrival || !d.departure)) {
      const { chegada, saida } = extractTimeRange(merged.horarios);
      d = { ...d, arrival: d.arrival || chegada || "", departure: d.departure || saida || "" };
    }
    onDone(d);
  }

  if (busy) {
    return (
      <div className="fixed inset-0 z-[60] bg-gradient-to-br from-brand to-brand-dark text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="h-20 w-20 rounded-3xl bg-white/15 flex items-center justify-center animate-pulse-ring"><Wand2 size={36} /></div>
        <h2 className="text-2xl font-extrabold mt-6">Montando seu RDO…</h2>
        <p className="text-white/85 mt-2 max-w-sm">A IA está organizando suas respostas em um relatório profissional.</p>
      </div>
    );
  }

  const isLast = idx === total - 1;
  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col">
      {/* Cabeçalho + progresso */}
      <div className="shrink-0 border-b border-border bg-surface/90 backdrop-blur">
        <div className="flex items-center justify-between gap-3 px-4 h-14 max-w-2xl mx-auto w-full">
          <button onClick={onCancel} className="p-2 -ml-2 rounded-lg text-muted hover:text-foreground" aria-label="Fechar"><X size={20} /></button>
          <div className="min-w-0 text-center">
            <p className="text-xs text-muted truncate">{projectName.split("—")[0].trim()}</p>
            <p className="text-sm font-semibold">Criar RDO</p>
          </div>
          <div className="flex items-center gap-1 text-xs font-semibold text-brand"><Trophy size={14} /> {answeredCount}/{total}</div>
        </div>
        <div className="h-1.5 w-full bg-black/10 dark:bg-white/10">
          <div className="h-full bg-brand transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Pergunta */}
      <div className="flex-1 overflow-y-auto">
        <div key={idx} className="max-w-2xl mx-auto w-full px-5 py-8 animate-fade-up">
          <p className="text-sm font-semibold text-brand">Pergunta {idx + 1} de {total}</p>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-2 leading-tight">{current.q}</h1>
          {current.hint && <p className="text-muted mt-2">{current.hint}</p>}

          {/* Microfone grande */}
          <div className="flex flex-col items-center text-center mt-8">
            {speech.supported && (
              <button onClick={toggleMic} disabled={speech.transcribing}
                className={`h-24 w-24 rounded-full flex items-center justify-center text-white transition-all disabled:opacity-80 ${speech.listening ? "bg-danger animate-pulse-ring" : speech.transcribing ? "bg-brand/70" : "bg-brand hover:bg-brand-dark"}`}>
                {speech.transcribing ? <Loader2 size={32} className="animate-spin" /> : speech.listening ? <Square size={32} /> : <Mic size={40} />}
              </button>
            )}
            <p className="mt-3 text-sm text-muted">
              {speech.transcribing ? "Transcrevendo o áudio…"
                : speech.listening ? (speech.mode === "recorder" ? "Gravando… toque para finalizar" : "Ouvindo… fale agora")
                : speech.supported ? "Toque para falar — ou digite abaixo"
                : "Digite sua resposta abaixo"}
            </p>
            {speech.error && <p className="mt-1 text-xs text-danger max-w-xs">{speech.error}</p>}
          </div>

          {/* Resposta por teclado (largura cheia) */}
          <div className="mt-6">
            <Textarea value={displayValue} readOnly={micBusy}
              onChange={(e) => setAnswers({ ...answers, [current.key]: e.target.value })}
              placeholder="Digite a resposta aqui — ou toque no microfone acima…"
              className="w-full min-h-40 text-base leading-relaxed" />
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="shrink-0 border-t border-border bg-surface">
        <div className="max-w-2xl mx-auto w-full px-5 py-3 flex items-center justify-between gap-2">
          <Button variant="ghost" onClick={goPrev} disabled={idx === 0 || speech.transcribing}><ArrowLeft size={16} /> Anterior</Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={goNext} disabled={speech.transcribing}>Pular</Button>
            {isLast ? (
              <Button onClick={goNext} disabled={speech.transcribing}><CheckCircle2 size={16} /> Concluir</Button>
            ) : (
              <Button onClick={goNext} disabled={speech.transcribing}>Próxima <ArrowRight size={16} /></Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function extractTime(s: string): string | undefined {
  // Aceita "07:30", "7h30", "7 30", "às 7", "730".
  let m = s.match(/(\d{1,2})\s*(?:h|horas|:)\s*(\d{0,2})/i);
  if (!m) m = s.match(/\b(\d{1,2})\s+(\d{2})\b/); // "7 30"
  if (!m) {
    const d = s.match(/\b(\d{3,4})\b/); // "730" / "1700"
    if (d) { const v = d[1].padStart(4, "0"); return `${v.slice(0, 2)}:${v.slice(2)}`; }
    const h = s.match(/\b(\d{1,2})\b/); // "às 7"
    if (h) return `${h[1].padStart(2, "0")}:00`;
    return undefined;
  }
  return `${m[1].padStart(2, "0")}:${(m[2] || "00").padStart(2, "0")}`;
}

// Extrai início e término de uma única resposta ("das 7h30 às 17h").
function extractTimeRange(s: string): { chegada?: string; saida?: string } {
  const tokens = s.match(/\d{1,2}\s*[:h]\s*\d{0,2}|\b\d{3,4}\b|\b\d{1,2}\b/gi) || [];
  const times = tokens.map((t) => extractTime(t)).filter((t): t is string => !!t);
  return { chegada: times[0], saida: times.length > 1 ? times[times.length - 1] : undefined };
}

export default function NovoRdoPage() {
  return (
    <Suspense fallback={<div className="text-muted">Carregando…</div>}>
      <NovoRdoInner />
    </Suspense>
  );
}
