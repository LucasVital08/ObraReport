"use client";

import React from "react";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { flush, pendingCount, subscribe } from "@/lib/data/outbox";

// Estado de conectividade + reenvio da fila offline. Reenvia ao reconectar e
// periodicamente enquanto houver pendências.
export function useOfflineSync() {
  const [online, setOnline] = React.useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [pending, setPending] = React.useState(() =>
    typeof window === "undefined" || !isSupabaseEnabled ? 0 : pendingCount(),
  );

  React.useEffect(() => {
    if (!isSupabaseEnabled) return;
    const unsub = subscribe(setPending);

    const goOnline = () => { setOnline(true); void flush(); };
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    void flush(); // tenta esvaziar o que ficou da sessão anterior
    const iv = setInterval(() => { if (navigator.onLine && pendingCount() > 0) void flush(); }, 20000);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
      unsub();
      clearInterval(iv);
    };
  }, []);

  return { online, pending };
}
