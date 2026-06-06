import { NextResponse } from "next/server";
import { organizeRdoText } from "@/lib/ai/engine";
import { FREE_TEXT_SYSTEM, QUESTIONS_SYSTEM, QUESTION_PROMPTS } from "@/lib/ai/prompts";
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

async function callOpenAI(apiKey: string, system: string, user: string): Promise<Partial<AiRdoResult>> {
  // Provedor configurável: padrão OpenAI; pode apontar para qualquer API
  // compatível (Gemini, Groq, DeepSeek, OpenRouter) via OPENAI_BASE_URL.
  const base = (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const resp = await fetch(`${base}/chat/completions`, {
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
  if (!resp.ok) throw new Error(`IA ${resp.status}`);
  const data = await resp.json();
  return JSON.parse(data?.choices?.[0]?.message?.content ?? "{}");
}

interface QA { key: string; question: string; answer: string }

export async function POST(req: Request) {
  let body: { text?: string; questions?: QA[] };
  try { body = await req.json(); }
  catch { return NextResponse.json({ error: "Corpo inválido" }, { status: 400 }); }

  const apiKey = process.env.OPENAI_API_KEY;

  // ---- Modo PERGUNTAS: compila TODAS as perguntas+respostas e passa por um
  // único prompt predefinido que preenche o modelo de RDO. ----
  if (Array.isArray(body.questions)) {
    const answers = body.questions.filter((a) => a?.answer?.trim() && QUESTION_PROMPTS[a.key]);
    if (answers.length === 0) return NextResponse.json({ mode: "vazio", result: emptyResult() });

    const compiled = answers.map((a, i) => `${i + 1}. Pergunta: ${a.question}\n   Resposta: ${a.answer}`).join("\n\n");

    if (!apiKey) {
      return NextResponse.json({ mode: "simulado", result: organizeRdoText(answers.map((a) => a.answer).join(". ")) });
    }
    try {
      const result = await callOpenAI(apiKey, QUESTIONS_SYSTEM, `Perguntas e respostas do RDO:\n\n${compiled}`);
      return NextResponse.json({ mode: "openai", result });
    } catch {
      return NextResponse.json({ mode: "simulado_fallback", result: organizeRdoText(answers.map((a) => a.answer).join(". ")) });
    }
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
