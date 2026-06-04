"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { Card } from "@/components/ui";
import { computeGamification } from "@/lib/gamification";
import { Trophy, Flame, Star } from "lucide-react";

export function GamificationCard() {
  const reports = useStore((s) => s.reports);
  const projects = useStore((s) => s.projects);
  const finalReports = useStore((s) => s.finalReports);
  const g = computeGamification(reports, projects, (finalReports ?? []).length);

  return (
    <Card className="overflow-hidden">
      {/* Faixa de nível */}
      <div className="p-5 bg-gradient-to-r from-brand to-brand-dark text-white">
        <div className="flex items-center gap-4">
          <div className="relative h-16 w-16 shrink-0 rounded-2xl bg-white/15 flex flex-col items-center justify-center">
            <span className="text-[10px] uppercase tracking-wide text-white/80 leading-none">Nível</span>
            <span className="text-2xl font-extrabold leading-none">{g.level}</span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Trophy size={16} className="shrink-0" />
              <h3 className="font-bold truncate">{g.levelTitle}</h3>
            </div>
            <p className="text-xs text-white/85 mt-0.5">{g.xp} XP acumulados</p>
            {/* Barra de progresso para o próximo nível */}
            <div className="mt-2 h-2 w-full rounded-full bg-white/25 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all" style={{ width: `${g.pctToNext}%` }} />
            </div>
            <p className="text-[11px] text-white/85 mt-1">{g.xpIntoLevel}/{g.xpForNext} XP para o nível {g.level + 1}</p>
          </div>
          <div className="shrink-0 text-center rounded-2xl bg-white/15 px-3 py-2">
            <Flame size={20} className="mx-auto" />
            <p className="text-lg font-extrabold leading-none mt-1">{g.streak}</p>
            <p className="text-[10px] text-white/85">dias seguidos</p>
          </div>
        </div>
      </div>

      {/* Conquistas */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star size={16} className="text-brand" />
            <h4 className="font-semibold text-sm">Conquistas</h4>
          </div>
          <span className="text-xs text-muted">{g.unlockedCount}/{g.achievements.length} desbloqueadas</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {g.achievements.map((a) => {
            const pct = Math.round((a.progress / a.goal) * 100);
            return (
              <div key={a.id}
                title={`${a.title} — ${a.description}`}
                className={`rounded-xl border p-2.5 text-center transition-colors ${a.unlocked ? "border-brand/40 bg-brand-soft" : "border-border bg-black/[0.02] dark:bg-white/[0.03]"}`}>
                <div className={`text-2xl leading-none ${a.unlocked ? "" : "grayscale opacity-40"}`}>{a.emoji}</div>
                <p className={`text-[11px] font-semibold mt-1 leading-tight ${a.unlocked ? "text-brand-dark" : "text-muted"}`}>{a.title}</p>
                {a.unlocked ? (
                  <p className="text-[10px] text-success mt-0.5">Concluída</p>
                ) : (
                  <div className="mt-1.5 h-1 w-full rounded-full bg-black/10 dark:bg-white/10">
                    <div className="h-full rounded-full bg-brand/60" style={{ width: `${pct}%` }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
