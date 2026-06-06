"use client";

import { createClient } from "@/lib/supabase/client";
import { TO_ROW } from "@/lib/data/mappers";

// Escreve uma entidade no Supabase (write-through). Best-effort: em caso de
// falha de rede, apenas registra no console (fila offline = fase futura).
export function syncUpsert(table: string, obj: unknown, companyId: string) {
  const sb = createClient();
  if (!sb) return;
  const mapper = TO_ROW[table];
  if (!mapper) return;
  const row = mapper(obj, companyId);
  void sb.from(table).upsert(row).then(({ error }) => {
    if (error) console.error(`[sync upsert ${table}]`, error.message);
  });
}

export function syncDelete(table: string, id: string) {
  const sb = createClient();
  if (!sb) return;
  void sb.from(table).delete().eq("id", id).then(({ error }) => {
    if (error) console.error(`[sync delete ${table}]`, error.message);
  });
}
