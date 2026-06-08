"use client";

import { createClient } from "@/lib/supabase/client";
import { TO_ROW } from "@/lib/data/mappers";
import { enqueue } from "@/lib/data/outbox";

// Write-through para o Supabase. Offline-first: se estiver sem rede ou der erro,
// a operação vai para a fila (outbox) e é reenviada quando a conexão voltar.
// Em modo demo (sem Supabase), é um no-op.

function offline() {
  return typeof navigator !== "undefined" && !navigator.onLine;
}

export function syncUpsert(table: string, obj: unknown, companyId: string) {
  const sb = createClient();
  if (!sb) return; // demo: sem sincronização
  const mapper = TO_ROW[table];
  if (!mapper) return;
  const row = mapper(obj, companyId);
  const id = String(row.id ?? "");

  if (offline()) { enqueue({ op: "upsert", table, row, id }); return; }
  void sb.from(table).upsert(row).then(({ error }) => {
    if (error) { console.error(`[sync upsert ${table}]`, error.message); enqueue({ op: "upsert", table, row, id }); }
  });
}

export function syncDelete(table: string, id: string) {
  const sb = createClient();
  if (!sb) return;
  if (offline()) { enqueue({ op: "delete", table, id }); return; }
  void sb.from(table).delete().eq("id", id).then(({ error }) => {
    if (error) { console.error(`[sync delete ${table}]`, error.message); enqueue({ op: "delete", table, id }); }
  });
}
