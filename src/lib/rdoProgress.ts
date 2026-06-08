"use client";

import type { RdoDraft } from "@/lib/rdo";

// Persistência do RDO em andamento (perguntas + rascunho), para não se perder ao
// atualizar a página ou trocar de tela. Fica no localStorage e é limpo ao salvar.
const KEY = "obrareport-rdo-progress-v1";
const MAX_AGE = 2 * 24 * 60 * 60 * 1000; // 2 dias

export interface RdoProgress {
  stage: "creating" | "review";
  projectId: string;
  idx: number;
  answers: Record<string, string>;
  draft: RdoDraft | null;
  ts: number;
}

export function loadProgress(): RdoProgress | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as RdoProgress;
    if (!p || Date.now() - (p.ts || 0) > MAX_AGE) return null;
    return p;
  } catch {
    return null;
  }
}

export function saveProgress(p: Omit<RdoProgress, "ts">) {
  if (typeof localStorage === "undefined") return;
  const payload: RdoProgress = { ...p, ts: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // Estouro de cota (fotos grandes em base64 no modo demo): salva sem a mídia,
    // preservando ao menos as respostas e o texto do rascunho.
    try {
      const lite = payload.draft ? { ...payload, draft: { ...payload.draft, media: [] } } : payload;
      localStorage.setItem(KEY, JSON.stringify(lite));
    } catch {
      /* desiste silenciosamente */
    }
  }
}

export function clearProgress() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
