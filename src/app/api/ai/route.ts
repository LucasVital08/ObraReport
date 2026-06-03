import { NextResponse } from "next/server";
import { organizeRdoText } from "@/lib/ai/engine";

// Rota de IA do RDO.
// - Se OPENAI_API_KEY estiver configurada, encaminha o texto para a OpenAI
//   solicitando o mesmo schema de saída (AiRdoResult).
// - Caso contrário, usa o motor simulado local (determinístico, em português).
//
// O front-end usa o motor local por padrão para funcionar offline/sem chave;
// esta rota deixa a integração com OpenAI pronta para produção.

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Você é o Assistente RDO IA. Organize o relato de obra (voz/texto) em JSON estruturado em português.
NUNCA invente fatos. Quando algo não estiver claro, deixe vazio e adicione em "campos_faltantes" e "perguntas_complementares".
Responda APENAS com JSON no formato:
{"resumo_executivo":"","equipe_presente":[{"name":"","role":""}],"horarios":{"chegada":"","saida":""},"atividades_executadas":[],"materiais_utilizados":[],"equipamentos_utilizados":[],"ocorrencias":[],"gastos":[{"description":"","amount":0,"category":""}],"pendencias":[],"solicitacoes":[],"riscos":[],"clima":"","campos_faltantes":[],"perguntas_complementares":[]}`;

export async function POST(req: Request) {
  let text = "";
  try {
    const body = await req.json();
    text = String(body?.text || "");
  } catch {
    return NextResponse.json({ error: "Corpo inválido" }, { status: 400 });
  }
  if (!text.trim()) return NextResponse.json({ error: "Texto vazio" }, { status: 400 });

  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    // Modo simulado
    return NextResponse.json({ mode: "simulado", result: organizeRdoText(text) });
  }

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        temperature: 0.2,
      }),
    });
    if (!resp.ok) throw new Error(`OpenAI ${resp.status}`);
    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content ?? "{}";
    return NextResponse.json({ mode: "openai", result: JSON.parse(content) });
  } catch {
    // fallback resiliente
    return NextResponse.json({ mode: "simulado_fallback", result: organizeRdoText(text) });
  }
}
