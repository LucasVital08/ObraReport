import React from "react";
import { formatDateBR } from "@/lib/utils";

export interface TimelineItem {
  date: string;
  resumo: string;
}

// Linha do tempo vertical (reutilizada na obra e no relatório final).
// Os dados vêm da IA via buildFinalReport(...).linha_do_tempo.
export function Timeline({ items, empty = "Sem registros para exibir." }: { items: TimelineItem[]; empty?: string }) {
  if (items.length === 0) return <p className="p-4 text-sm text-muted">{empty}</p>;
  return (
    <div className="p-4 space-y-3">
      {items.map((t, i) => (
        <div key={i} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="h-2.5 w-2.5 rounded-full bg-brand mt-1.5" />
            {i < items.length - 1 && <div className="w-px flex-1 bg-border" />}
          </div>
          <div className="pb-3">
            <p className="text-sm font-medium">{formatDateBR(t.date)}</p>
            <p className="text-sm text-muted">{t.resumo}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
