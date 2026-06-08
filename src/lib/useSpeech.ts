"use client";

import React from "react";

// Entrada de voz híbrida para o RDO:
//  - "speech":   Web Speech API (Chrome/Android) — transcrição ao vivo, grátis.
//  - "recorder": grava o áudio (MediaRecorder) e transcreve via /api/ai/transcribe
//                (Whisper/Gemini). É o caminho do iPhone/Safari, que não têm
//                Web Speech API confiável.
// A interface é a mesma para os dois modos; stop() é assíncrono e resolve com o
// texto final do trecho gravado.

interface SpeechRecognitionResultLike { transcript: string }
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { isFinal: boolean; 0: SpeechRecognitionResultLike; length: number }[];
}
interface SpeechRecognitionLike {
  lang: string; continuous: boolean; interimResults: boolean;
  start: () => void; stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechCtorWindow = {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export type VoiceMode = "speech" | "recorder" | "none";

// Preferimos SEMPRE a Web Speech API quando existe (inclui iPhone/Safari): ela
// mostra a transcrição AO VIVO enquanto a pessoa fala. Só caímos para gravação +
// transcrição no servidor quando o navegador não tem Web Speech.
function detectMode(): VoiceMode {
  if (typeof window === "undefined") return "none";
  const w = window as unknown as SpeechCtorWindow;
  const hasSpeech = !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  const hasRecorder = typeof MediaRecorder !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

  if (hasSpeech) return "speech"; // transcrição ao vivo
  if (hasRecorder) return "recorder"; // fallback: grava e transcreve depois
  return "none";
}

function pickMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function useSpeech() {
  const [mode] = React.useState<VoiceMode>(detectMode);
  const [listening, setListening] = React.useState(false);
  const [transcribing, setTranscribing] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const [error, setError] = React.useState("");

  const recRef = React.useRef<SpeechRecognitionLike | null>(null);
  const segmentRef = React.useRef(""); // texto final do trecho atual (modo speech)
  const resolverRef = React.useRef<((t: string) => void) | null>(null);
  const wantRef = React.useRef(false); // usuário ainda quer ouvir (reinício no iOS)

  // recorder
  const mediaRef = React.useRef<MediaRecorder | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const streamRef = React.useRef<MediaStream | null>(null);

  React.useEffect(() => {
    if (mode === "speech") {
      const w = window as unknown as SpeechCtorWindow;
      const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (Ctor) {
        const rec = new Ctor();
        rec.lang = "pt-BR"; rec.continuous = true; rec.interimResults = true;
        rec.onresult = (e) => {
          let interimText = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) segmentRef.current += res[0].transcript + " ";
            else interimText += res[0].transcript;
          }
          setTranscript(segmentRef.current);
          setInterim(interimText);
        };
        rec.onerror = (ev) => {
          if (ev?.error && ev.error !== "no-speech" && ev.error !== "aborted") setError("Não consegui ouvir. Tente novamente ou digite.");
        };
        rec.onend = () => {
          // iOS encerra o reconhecimento sozinho após pausas. Se o usuário ainda
          // quer falar (não pediu parar), reinicia para manter a captura ao vivo.
          if (wantRef.current && !resolverRef.current) {
            try { rec.start(); return; } catch { /* segue para finalizar */ }
          }
          setListening(false);
          setInterim("");
          if (resolverRef.current) { resolverRef.current(segmentRef.current.trim()); resolverRef.current = null; }
        };
        recRef.current = rec;
      }
    }
    return () => {
      wantRef.current = false; // evita reinício após desmontar
      try { recRef.current?.stop(); } catch { /* ignore */ }
      try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
    };
  }, [mode]);

  const supported = mode !== "none";

  // Envia o áudio gravado para transcrição (modo recorder).
  const finalizeRecording = React.useCallback(async (mimeType: string) => {
    try { streamRef.current?.getTracks().forEach((t) => t.stop()); } catch { /* ignore */ }
    streamRef.current = null;
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];
    if (blob.size === 0) {
      setTranscribing(false);
      if (resolverRef.current) { resolverRef.current(""); resolverRef.current = null; }
      return;
    }
    setTranscribing(true);
    try {
      const ext = mimeType.includes("mp4") ? "mp4" : mimeType.includes("ogg") ? "ogg" : "webm";
      const fd = new FormData();
      fd.append("audio", blob, `gravacao.${ext}`);
      const resp = await fetch("/api/ai/transcribe", { method: "POST", body: fd });
      const data = await resp.json().catch(() => ({}));
      if (data?.unsupported) setError("Transcrição de voz indisponível neste app. Digite a resposta.");
      const text = String(data?.text || "").trim();
      if (!text && !data?.unsupported && !resp.ok) setError("Não consegui transcrever. Tente de novo ou digite.");
      if (text) { segmentRef.current = text; setTranscript(text); }
      if (resolverRef.current) { resolverRef.current(text); resolverRef.current = null; }
    } catch {
      setError("Falha ao transcrever o áudio. Digite a resposta.");
      if (resolverRef.current) { resolverRef.current(""); resolverRef.current = null; }
    } finally {
      setTranscribing(false);
    }
  }, []);

  const start = React.useCallback(async () => {
    setError("");
    if (mode === "speech") {
      if (!recRef.current) return;
      wantRef.current = true;
      try { recRef.current.start(); setListening(true); } catch { /* já iniciado */ }
      return;
    }
    if (mode === "recorder") {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        const mt = pickMimeType();
        const rec = mt ? new MediaRecorder(stream, { mimeType: mt }) : new MediaRecorder(stream);
        chunksRef.current = [];
        rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
        rec.onstop = () => { void finalizeRecording(rec.mimeType || mt || "audio/webm"); };
        mediaRef.current = rec;
        rec.start();
        setListening(true);
      } catch {
        setError("Não foi possível acessar o microfone. Verifique a permissão ou digite.");
        setListening(false);
      }
    }
  }, [mode, finalizeRecording]);

  // Para a captura e resolve com o texto final do trecho.
  const stop = React.useCallback((): Promise<string> => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      if (mode === "speech") {
        wantRef.current = false; // parada explícita: não reinicia
        try { recRef.current?.stop(); } catch { resolve(segmentRef.current.trim()); resolverRef.current = null; }
        setListening(false);
      } else if (mode === "recorder") {
        setListening(false);
        try { mediaRef.current?.stop(); } catch { resolve(""); resolverRef.current = null; }
      } else {
        resolve(""); resolverRef.current = null;
      }
    });
  }, [mode]);

  const reset = React.useCallback(() => {
    segmentRef.current = "";
    setTranscript(""); setInterim(""); setError("");
  }, []);

  const setManual = React.useCallback((text: string) => {
    segmentRef.current = text;
    setTranscript(text);
  }, []);

  return { supported, mode, listening, transcribing, transcript, interim, error, start, stop, reset, setManual };
}
