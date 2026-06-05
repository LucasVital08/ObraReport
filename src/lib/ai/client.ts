"use client";

import { organizeRdoText } from "@/lib/ai/engine";
import type { AiRdoResult } from "@/lib/types";

// Cliente da IA usado pela UI. Chama a rota /api/ai (que usa OpenAI quando há
// OPENAI_API_KEY) e, em qualquer falha de rede, cai no motor local para o app
// nunca travar.

export interface QA { key: string; question: string; answer: string }

async function callApi(payload: object): Promise<AiRdoResult | null> {
  try {
    const r = await fetch("/api/ai", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!r.ok) return null;
    const data = await r.json();
    return (data?.result as AiRdoResult) ?? null;
  } catch {
    return null;
  }
}

// Modos voz/texto: relato livre.
export async function aiFromText(text: string): Promise<AiRdoResult> {
  return (await callApi({ text })) ?? organizeRdoText(text);
}

// Modo perguntas: cada resposta tratada com prompt específico (no servidor).
export async function aiFromQuestions(answers: QA[]): Promise<AiRdoResult> {
  const result = await callApi({ questions: answers });
  if (result) return result;
  const compiled = answers.filter((a) => a.answer?.trim()).map((a) => `${a.question}\n${a.answer}`).join(". ");
  return organizeRdoText(compiled);
}
