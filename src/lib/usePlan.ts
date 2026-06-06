"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { limitsFor, type PlanLimits } from "@/lib/plans";
import type { PlanId, ProjectStatus } from "@/lib/types";

// Estados que NÃO contam como "obra ativa" para fins de limite de plano.
const INACTIVE_STATUS: ProjectStatus[] = ["concluida", "entregue", "cancelada"];

export interface PlanState {
  plan: PlanId;
  limits: PlanLimits;
  activeObras: number;
  rdosThisMonth: number;
  canAddObra: boolean;
  canAddRdo: boolean;
  aiEnabled: boolean;
  remainingRdos: number; // Infinity quando ilimitado
}

// Hook central de cobrança/limite. Lê o plano da empresa e o uso atual do store
// e diz se ainda cabe criar obra/RDO. Usado para mostrar paywall e travar ações.
export function usePlan(): PlanState {
  const plan = useStore((s) => s.company.plan);
  const projects = useStore((s) => s.projects);
  const reports = useStore((s) => s.reports);

  return React.useMemo(() => {
    const limits = limitsFor(plan);
    const activeObras = projects.filter((p) => !INACTIVE_STATUS.includes(p.status)).length;

    const now = new Date();
    const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const rdosThisMonth = reports.filter((r) => (r.date || r.createdAt || "").startsWith(ym)).length;

    const remainingRdos = limits.rdosPerMonth - rdosThisMonth;
    return {
      plan,
      limits,
      activeObras,
      rdosThisMonth,
      canAddObra: activeObras < limits.obras,
      canAddRdo: rdosThisMonth < limits.rdosPerMonth,
      aiEnabled: limits.ai,
      remainingRdos: limits.rdosPerMonth === Infinity ? Infinity : Math.max(0, remainingRdos),
    };
  }, [plan, projects, reports]);
}
