"use client";

import React from "react";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { useStore } from "@/lib/store";
import { loadCompanyData } from "@/lib/data/repo";

// Carrega os dados da empresa do Supabase para o store quando há sessão real
// (modo produção). Sem configuração ou em modo demo, não faz nada.
export function useDataSync() {
  const companyId = useStore((s) => s.user.companyId);
  const isAuth = useStore((s) => s.isAuthenticated);
  const demoMode = useStore((s) => s.demoMode);
  const hydrateData = useStore((s) => s.hydrateData);
  const loadedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!isSupabaseEnabled || demoMode || !isAuth || !companyId) return;
    if (loadedRef.current === companyId) return;
    loadedRef.current = companyId;
    loadCompanyData(companyId).then((data) => { if (data) hydrateData(data); }).catch(() => {});
  }, [companyId, isAuth, demoMode, hydrateData]);
}
