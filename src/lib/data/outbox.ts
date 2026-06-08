"use client";

import { createClient } from "@/lib/supabase/client";

// Fila offline (outbox): guarda as escritas que não foram confirmadas no
// servidor (sem rede ou erro) e as reenvia quando a conexão volta. Garante o
// "offline-first": o app sempre grava local (Zustand/localStorage) e a
// sincronização com o Supabase é eventual e resiliente.

export type OutboxJob =
  | { jid: string; op: "upsert"; table: string; row: Record<string, unknown>; id: string; ts: number }
  | { jid: string; op: "delete"; table: string; id: string; ts: number };

const KEY = "obrareport-outbox-v1";

function read(): OutboxJob[] {
  if (typeof localStorage === "undefined") return [];
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") as OutboxJob[]; }
  catch { return []; }
}
function write(jobs: OutboxJob[]) {
  try { localStorage.setItem(KEY, JSON.stringify(jobs)); } catch { /* limite atingido — ignora */ }
}

export function pendingCount(): number {
  return read().length;
}

// Omit que distribui sobre a união (preserva o discriminante op).
type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

// Enfileira deduplicando por entidade (table+id): mantém só a última operação.
export function enqueue(job: DistributiveOmit<OutboxJob, "jid" | "ts">) {
  const jobs = read().filter((j) => !(j.table === job.table && j.id === job.id));
  jobs.push({ ...job, jid: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, ts: Date.now() } as OutboxJob);
  write(jobs);
  notify();
}

let flushing = false;

// Reenvia a fila na ordem. Para no primeiro erro (para tentar de novo depois) e
// mantém o que faltou. Retorna quantos foram enviados e quantos restam.
export async function flush(): Promise<{ done: number; left: number }> {
  if (flushing) return { done: 0, left: pendingCount() };
  const sb = createClient();
  if (!sb) return { done: 0, left: 0 };
  if (typeof navigator !== "undefined" && !navigator.onLine) return { done: 0, left: pendingCount() };

  flushing = true;
  let done = 0;
  try {
    let jobs = read();
    while (jobs.length) {
      const job = jobs[0];
      const res = job.op === "delete"
        ? await sb.from(job.table).delete().eq("id", job.id)
        : await sb.from(job.table).upsert(job.row);
      if (res.error) {
        console.error(`[outbox ${job.op} ${job.table}]`, res.error.message);
        break; // tenta de novo no próximo flush
      }
      jobs = jobs.slice(1);
      write(jobs);
      done++;
    }
    return { done, left: read().length };
  } finally {
    flushing = false;
    notify();
  }
}

// Notificação simples para a UI atualizar o contador de pendências.
type Listener = (n: number) => void;
const listeners = new Set<Listener>();
function notify() { const n = pendingCount(); listeners.forEach((l) => l(n)); }
export function subscribe(l: Listener): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}
