"use client";

import React from "react";
import { useStore } from "@/lib/store";

// Error boundary do segmento /app: evita a tela de crash do navegador,
// mostra a mensagem real e oferece recuperação (recarregar dados de demo).
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const loadDemo = useStore((s) => s.loadDemo);

  React.useEffect(() => {
    // Log para diagnóstico no console do dispositivo.
    console.error("[ObraReport] erro de página:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold mt-3">Algo deu errado nesta página</h1>
        <p className="text-muted text-sm mt-1">
          Tente novamente. Se o problema persistir, recarregue os dados de demonstração
          (isso atualiza sua base local para a versão mais recente).
        </p>
        <pre className="mt-3 text-left text-xs bg-black/5 dark:bg-white/10 rounded-lg p-3 overflow-auto max-h-40 whitespace-pre-wrap">
          {error?.message || "Erro desconhecido"}
        </pre>
        <div className="mt-4 flex gap-2 justify-center flex-wrap">
          <button onClick={reset} className="rounded-xl bg-brand text-white px-4 py-2.5 text-sm font-semibold hover:bg-brand-dark">
            Tentar novamente
          </button>
          <button
            onClick={() => { loadDemo(); window.location.href = "/app"; }}
            className="rounded-xl border border-border px-4 py-2.5 text-sm font-semibold hover:border-brand"
          >
            Recarregar dados demo
          </button>
        </div>
      </div>
    </div>
  );
}
