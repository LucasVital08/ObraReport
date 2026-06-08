import { NextResponse } from "next/server";

// Transcrição de áudio (voz → texto) para o RDO. Resolve o iPhone/Safari, que
// não têm Web Speech API: o app grava o áudio e envia para cá.
//
// Provedores suportados (nesta ordem de configuração):
//   - Dedicado de transcrição: TRANSCRIBE_API_KEY / TRANSCRIBE_BASE_URL /
//     TRANSCRIBE_MODEL  (ex.: Groq whisper-large-v3 — rápido e barato).
//   - OpenAI Whisper compatível: usa OPENAI_API_KEY / OPENAI_BASE_URL.
//   - Gemini nativo: detectado quando a base é "generativelanguage" (a API
//     compatível com OpenAI do Gemini não tem /audio/transcriptions, então
//     usamos generateContent com o áudio embutido).
// Sem chave configurada, responde { unsupported: true } e a UI orienta a digitar.

export const runtime = "nodejs";

const TRANSCRIBE_PROMPT =
  "Transcreva o áudio em português do Brasil. Responda apenas com o texto falado, sem comentários, sem aspas.";

function isGemini(base: string) {
  return /generativelanguage\.googleapis\.com/i.test(base);
}

async function transcribeOpenAI(base: string, apiKey: string, model: string, file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file, file.name || "audio.webm");
  fd.append("model", model);
  fd.append("language", "pt");
  const resp = await fetch(`${base.replace(/\/$/, "")}/audio/transcriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: fd,
  });
  if (!resp.ok) throw new Error(`transcribe ${resp.status}`);
  const data = await resp.json();
  return String(data?.text || "").trim();
}

async function transcribeGemini(base: string, apiKey: string, model: string, file: File): Promise<string> {
  // base compatível: ".../v1beta/openai" → base nativa ".../v1beta"
  const nativeBase = base.replace(/\/openai\/?$/, "").replace(/\/$/, "");
  const buf = Buffer.from(await file.arrayBuffer());
  const b64 = buf.toString("base64");
  const mime = file.type || "audio/webm";
  const resp = await fetch(`${nativeBase}/models/${model}:generateContent?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: TRANSCRIBE_PROMPT }, { inline_data: { mime_type: mime, data: b64 } }] }],
    }),
  });
  if (!resp.ok) throw new Error(`gemini transcribe ${resp.status}`);
  const data = await resp.json();
  const text = data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p?.text || "").join(" ");
  return String(text || "").trim();
}

export async function POST(req: Request) {
  let form: FormData;
  try { form = await req.formData(); }
  catch { return NextResponse.json({ error: "Envio inválido" }, { status: 400 }); }

  const file = form.get("audio");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: "Áudio vazio" }, { status: 400 });
  }

  // Provedor de transcrição (dedicado tem prioridade; senão usa o de texto).
  const apiKey = process.env.TRANSCRIBE_API_KEY || process.env.OPENAI_API_KEY || "";
  const base = (process.env.TRANSCRIBE_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
  const hasDedicated = Boolean(process.env.TRANSCRIBE_API_KEY || process.env.TRANSCRIBE_BASE_URL);

  if (!apiKey) return NextResponse.json({ unsupported: true });

  try {
    let text: string;
    if (!hasDedicated && isGemini(base)) {
      const model = process.env.TRANSCRIBE_MODEL || process.env.OPENAI_MODEL || "gemini-flash-latest";
      text = await transcribeGemini(base, apiKey, model, file);
    } else {
      const model = process.env.TRANSCRIBE_MODEL || "whisper-1";
      text = await transcribeOpenAI(base, apiKey, model, file);
    }
    return NextResponse.json({ text });
  } catch (e) {
    console.error("[transcribe]", (e as Error).message);
    return NextResponse.json({ error: "Falha na transcrição" }, { status: 502 });
  }
}
