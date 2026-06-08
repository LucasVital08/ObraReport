"use client";

import React from "react";
import { createClient } from "./client";
import { isSupabaseEnabled } from "./config";
import { useStore } from "@/lib/store";
import type { Role, PlanId } from "@/lib/types";

// Sincroniza a sessão do Supabase com o store do app (modo produção).
// - Sessão real do Supabase tem prioridade (entra como produção).
// - Sem sessão E em modo demo: mantém o demo (não força logout).
// - Sem sessão e fora do demo: desloga.
export function useAuthSync(): { ready: boolean } {
  const setSession = useStore((s) => s.setSession);
  const [checked, setChecked] = React.useState(false);

  React.useEffect(() => {
    if (!isSupabaseEnabled) return;
    const supabase = createClient();
    if (!supabase) return;
    let active = true;

    async function load(userId: string | null, email: string | null) {
      if (!active) return;
      if (userId) {
        const { data: prof } = await supabase!.from("profiles").select("*").eq("id", userId).single();
        if (!active) return;
        if (prof) {
          const { data: comp } = await supabase!.from("companies").select("*").eq("id", prof.company_id).single();
          if (!active) return;
          setSession({
            user: {
              id: prof.id, name: prof.name || "", email: prof.email || email || "",
              role: (prof.role as Role) || "owner", companyId: prof.company_id,
              avatarColor: prof.avatar_color || "#f4720b", clientProjectIds: prof.client_project_ids || [],
            },
            company: comp
              ? {
                  id: comp.id, name: comp.name, logoText: comp.logo_text || "OR",
                  brandColor: comp.brand_color || "#f4720b", plan: (comp.plan as PlanId) || "free",
                  city: comp.city || undefined, createdAt: comp.created_at,
                  clientVisibility: comp.client_visibility || undefined,
                }
              : null,
          });
          setChecked(true);
          return;
        }
      }
      // Sem sessão válida: só desloga se NÃO estiver no modo demonstração.
      if (!useStore.getState().demoMode) setSession(null);
      setChecked(true);
    }

    supabase.auth.getUser().then(({ data }) => load(data.user?.id ?? null, data.user?.email ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      load(session?.user?.id ?? null, session?.user?.email ?? null);
    });
    return () => { active = false; sub.subscription.unsubscribe(); };
  }, [setSession]);

  const ready = !isSupabaseEnabled || checked;
  return { ready };
}
