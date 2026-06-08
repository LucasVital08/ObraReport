"use client";

import React from "react";
import { useOfflineSync } from "@/lib/data/useOfflineSync";
import { CloudOff, RefreshCw, Download, X } from "lucide-react";

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Camada de PWA: registra o service worker, mostra o estado offline / pendências
// de sincronização e oferece o botão "Instalar app" quando o navegador permite.
export function PwaLayer() {
  const { online, pending } = useOfflineSync();
  const [installEvt, setInstallEvt] = React.useState<InstallPromptEvent | null>(null);
  const [installHidden, setInstallHidden] = React.useState(false);

  // Registra o service worker (somente no navegador, em HTTPS/localhost).
  React.useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const onLoad = () => { navigator.serviceWorker.register("/sw.js").catch(() => {}); };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  // Captura o evento de instalação (Android/Chrome/Edge).
  React.useEffect(() => {
    const onPrompt = (e: Event) => { e.preventDefault(); setInstallEvt(e as InstallPromptEvent); };
    const onInstalled = () => { setInstallEvt(null); setInstallHidden(true); };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function install() {
    if (!installEvt) return;
    await installEvt.prompt();
    await installEvt.userChoice.catch(() => null);
    setInstallEvt(null);
  }

  const showInstall = installEvt && !installHidden;

  return (
    <>
      {/* Indicador de conectividade / sincronização */}
      {(!online || pending > 0) && (
        <div className="fixed inset-x-0 bottom-20 lg:bottom-4 z-[55] flex justify-center px-4 pointer-events-none">
          <div className={`pointer-events-auto inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold shadow-lg ${
            online ? "bg-brand text-white" : "bg-graphite text-white"
          }`}>
            {online ? <RefreshCw size={14} className="animate-spin" /> : <CloudOff size={14} />}
            {online
              ? `Sincronizando ${pending} alteração${pending === 1 ? "" : "ões"}…`
              : pending > 0
                ? `Offline — ${pending} alteração${pending === 1 ? "" : "ões"} na fila`
                : "Você está offline. As alterações são salvas no aparelho."}
          </div>
        </div>
      )}

      {/* Banner "Instalar app" */}
      {showInstall && (
        <div className="fixed inset-x-0 bottom-20 lg:bottom-4 z-[56] flex justify-center px-4">
          <div className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border bg-surface shadow-xl px-4 py-3 max-w-md w-full">
            <div className="h-9 w-9 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center shrink-0">
              <Download size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight">Instalar o ObraReport</p>
              <p className="text-xs text-muted">Acesso rápido e uso offline, como um app.</p>
            </div>
            <button onClick={install} className="rounded-lg bg-brand text-white text-sm font-semibold px-3 py-1.5 hover:bg-brand-dark shrink-0">
              Instalar
            </button>
            <button onClick={() => setInstallHidden(true)} className="p-1 text-muted hover:text-foreground shrink-0" aria-label="Dispensar">
              <X size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
