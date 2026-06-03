"use client";

import React from "react";

// Tipos mínimos para a Web Speech API (evita dependência de libs externas).
interface SpeechRecognitionResultLike { transcript: string }
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { isFinal: boolean; 0: SpeechRecognitionResultLike; length: number }[];
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: SpeechRecognitionEventLike) => void) | null;
  onerror: ((e: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

type SpeechCtorWindow = {
  SpeechRecognition?: new () => SpeechRecognitionLike;
  webkitSpeechRecognition?: new () => SpeechRecognitionLike;
};

export function useSpeech() {
  const [supported] = React.useState(() => {
    if (typeof window === "undefined") return false;
    const w = window as unknown as SpeechCtorWindow;
    return !!(w.SpeechRecognition || w.webkitSpeechRecognition);
  });
  const [listening, setListening] = React.useState(false);
  const [transcript, setTranscript] = React.useState("");
  const [interim, setInterim] = React.useState("");
  const recRef = React.useRef<SpeechRecognitionLike | null>(null);
  const finalRef = React.useRef("");

  React.useEffect(() => {
    const w = window as unknown as SpeechCtorWindow;
    const Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (Ctor) {
      const rec = new Ctor();
      rec.lang = "pt-BR";
      rec.continuous = true;
      rec.interimResults = true;
      rec.onresult = (e) => {
        let interimText = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          const text = res[0].transcript;
          if (res.isFinal) finalRef.current += text + " ";
          else interimText += text;
        }
        setTranscript(finalRef.current);
        setInterim(interimText);
      };
      rec.onend = () => setListening(false);
      rec.onerror = () => setListening(false);
      recRef.current = rec;
    }
    return () => { try { recRef.current?.stop(); } catch {} };
  }, []);

  const start = React.useCallback(() => {
    if (!recRef.current) return;
    try { recRef.current.start(); setListening(true); } catch {}
  }, []);

  const stop = React.useCallback(() => {
    try { recRef.current?.stop(); } catch {}
    setListening(false);
    setInterim("");
  }, []);

  const reset = React.useCallback(() => {
    finalRef.current = "";
    setTranscript("");
    setInterim("");
  }, []);

  const setManual = React.useCallback((text: string) => {
    finalRef.current = text;
    setTranscript(text);
  }, []);

  return { supported, listening, transcript, interim, start, stop, reset, setManual };
}
