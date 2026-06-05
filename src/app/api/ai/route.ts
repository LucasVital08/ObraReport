import { NextResponse } from "next/server";
import { organizeRdoText } from "@/lib/ai/engine";
import { FREE_TEXT_SYSTEM, BASE_SYSTEM, QUESTION_PROMPTS } from "@/lib/ai/prompts";
import type { AiRdoResult } from "@/lib/types";

// Rota de IA do RDO.
// Dois modos:
//   1) { text }        -> relato livre (voz/texto): 1 prompt completo.
//   2) { questions }   -> [{ key, question, answer }]: CADA resposta é tratada
//      com um prompt ESPECÍFICO (QUESTION_PROMPTS) e os resultados são mesclados.
// Se OPENAI_API_KEY estiver configurada, usa a OpenAI; senão, cai no motor
// local determinístico (em português). Sempre resiliente: erros viram fallback.

export const runtime = "nodejs";

function emptyResult(): AiRdoResult {
  return {
    resumo_executivo: "", equipe_presente: [], horarios: {}, atividades_executadas: [],
    materiais_utilizados: [], equipamentos_utilizados: [], ocorrencias: [], gastos: [],
    pendencias: [], solicitacoes: [], riscos: [], clima: "",
    campos_faltantes: [], perguntas_complementares: [],
  };
}

function dedupeStr(arr: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of arr) {
    const v = (s || "").trim();
    if (v && !seen.has(v.toLowerCase())) { seen.add(v.toLowerCase()); out.push(v); }
  }
  return out;
}

// Mescla resultados parciais (um por pergunta) em um único AiRdoResult.
function mergeResults(parts: Partial<AiRdoResult>[]): AiRdoResult {
  const r = emptyResult();
  const resumo: string[] = [];
  for (const p of parts) {
    if (!p) continue;
    if (p.resumo_executivo) resumo.push(p.resumo_executivo);
    if (Array.isArray(p.equipe_presente)) r.equipe_presente.push(...p.equipe_presente.filter((t) => t?.name));
    if (p.horarios?.chegada) r.horarios.chegada = p.horarios.chegada;
    if (p.horarios?.saida) r.horarios.saida = p.horarios.saida;
    if (Array.isArray(p.atividades_executadas)) r.atividades_executadas.push(...p.atividades_executadas);
    if (Array.isArray(p.materiais_utilizados)) r.materiais_utilizados.push(...p.materiais_utilizados);
    if (Array.isArray(p.equipamentos_utilizados)) r.equipamentos_utilizados.push(...p.equipamentos_utilizados);
    if (Array.isArray(p.ocorrencias)) r.ocorrencias.push(...p.ocorrencias);
    if (Array.isArray(p.gastos)) r.gastos.push(...p.gastos.filter((g) => g?.description));
    if (Array.isArray(p.pendencias)) r.pendencias.push(...p.pendencias);
    if (Array.isArray(p.solicitacoes)) r.solicitacoes.push(...p.solicitacoes);
    if (Array.isArray(p.riscos)) r.riscos.push(...p.riscos);
    if (p.clima) r.clima = p.clima;
    if (Array.isArray(p.campos_faltantes)) r.campos_faltantes.push(...p.campos_faltantes);
    if (Array.isArray(p.perguntas_complementares)) r.perguntas_complementares.push(...p.perguntas_complementares);
  }
  r.resumo_executivo = resumo.join(" ");
  r.atividades_executadas = dedupeStr(r.atividades_executadas);
  r.materiais_utilizados = dedupeStr(r.materiais_utilizados);
  r.equipamentos_utilizados = dedupeStr(r.equipamentos_utilizados);
  r.ocorrencias = dedupeStr(r.ocorrencias);
  r.pendencias = dedupeStr(r.pendencias);
  r.solicitacoes = dedupeStr(r.solicitacoes);
  r.riscos = dedupeStr(r.riscos);
  r.campos_faltantes = dedupeStr(r.campos_faltantes);
  r.perguntas_complementares = dedupeStr(r.perguntas_complementares);
  return r;
}

async function callOpenAI(apiKey: string, system: string, user: string): Promise<Partial<AiRdoResult>> {
  const resp = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.1,
    }),
  });
  if (!resp.ok) throw new Error(`OpenAI ${resp.status}`);
  const data = await resp.json();
  return JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
}

interface QA { key: string; question: string; answer: string }

export async function POST(req: Request) {
  let body: { text?: string; questions?: QA[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }); }

  const apiKey = process.env.OPENAI_API_KEY;

  // ---- Modo PERGUNTAS: prompt específico por resposta ----
  if (Array.isArray(body.questions)) {
    const answers = body.questions.filter((a) => a?.answer?.trim() && QUESTION_PROMPTS[a.key]);
    if (answers.length === 0) return NextResponse.json({ mode: "vazio", result: emptyResult() });

    if (!apiKey) {
      const compiled = answers.map((a) => `${a.question}\n${a.answer}`).join(". ");
      return NextResponse.json({ mode: "simulado", result: organizeRdoText(compiled) });
    }

    const parts = await Promise.all(answers.map(async (a) => {
      const qp = QUESTION_PROMPTS[a.key];
      const user = `Pergunta feita ao operador: "${a.question}"\nResposta do operador: "${a.answer}"\n\nInstrução: ${qp.instrucao}\nPreencha SOMENTE: ${qp.campos.join(", ")}. Deixe todos os demais campos vazios.`;
      try { return await callOpenAI(apiKey, BASE_SYSTEM, user); }
      catch { return organizeRdoText(a.answer) as Partial<AiRdoResult>; } // fallback por pergunta
    }));
    return NextResponse.json({ mode: "openai", result: mergeResults(parts) });
  }

  // ---- Modo TEXTO LIVRE (voz/texto) ----
  const text = String(body?.text || "");
  if (!text.trim()) return NextResponse.json({ error: "Texto vazio" }, { status: 400 });

  if (!apiKey) return NextResponse.json({ mode: "simulado", result: organizeRdoText(text) });

  try {
    const result = await callOpenAI(apiKey, FREE_TEXT_SYSTEM, text);
    return NextResponse.json({ mode: "openai", result });
  } catch {
    return NextResponse.json({ mode: "simulado_fallback", result: organizeRdoText(text) });
  }
}
