// Gamificação do ObraReport IA — calculada a partir dos dados existentes
// (local-first, sem persistência extra). Gera XP, nível, ofensiva (streak)
// e conquistas para engajar o usuário a registrar mais e melhor.

import type { DailyReport, Project } from "@/lib/types";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  progress: number;
  goal: number;
  unlocked: boolean;
}

export interface LevelStep {
  level: number;
  title: string;
  xpRequired: number; // XP acumulado necessário para alcançar o nível
  reached: boolean;
  current: boolean;
}

export interface GamificationResult {
  xp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForNext: number;
  pctToNext: number;
  streak: number;
  totalRdos: number;
  achievements: Achievement[];
  unlockedCount: number;
  ladder: LevelStep[];
}

// Como o XP é ganho (exibido na tela para o usuário).
export const XP_RULES: { label: string; xp: number }[] = [
  { label: "RDO registrado", xp: 10 },
  { label: "Obra cadastrada", xp: 15 },
  { label: "RDO aprovado pelo contratante", xp: 5 },
  { label: "Assinatura coletada", xp: 5 },
  { label: "Relatório final gerado", xp: 25 },
  { label: "Foto adicionada", xp: 1 },
];

// XP acumulado necessário para alcançar o início de um nível.
export function xpToReachLevel(level: number): number {
  return (100 * (level - 1) * level) / 2;
}

const LEVEL_TITLES = [
  "Aprendiz de obra",
  "Pedreiro",
  "Mestre de obras",
  "Encarregado",
  "Engenheiro",
  "Mestre construtor",
  "Lenda da obra",
];

function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)];
}

// Maior sequência de dias consecutivos com pelo menos um RDO.
function longestStreak(dates: string[]): number {
  const uniq = [...new Set(dates)].sort();
  if (uniq.length === 0) return 0;
  let best = 1, cur = 1;
  for (let i = 1; i < uniq.length; i++) {
    const prev = new Date(uniq[i - 1] + "T12:00:00").getTime();
    const curr = new Date(uniq[i] + "T12:00:00").getTime();
    const diff = Math.round((curr - prev) / 86400000);
    cur = diff === 1 ? cur + 1 : 1;
    best = Math.max(best, cur);
  }
  return best;
}

export function computeGamification(
  reports: DailyReport[],
  projects: Project[],
  finalReportsCount: number,
): GamificationResult {
  const totalRdos = reports.length;
  const photos = reports.reduce((a, r) => a + r.media.filter((m) => m.kind === "photo").length, 0);
  const signatures = reports.reduce((a, r) => a + (r.signatures?.length ?? 0), 0);
  const approved = reports.filter((r) => r.status === "aprovado").length;
  const streak = longestStreak(reports.map((r) => r.date));

  const xp =
    totalRdos * 10 +
    photos * 1 +
    signatures * 5 +
    approved * 5 +
    projects.length * 15 +
    finalReportsCount * 25;

  // Nível: cada nível L exige 100*L de XP (acumulativo crescente).
  let level = 1;
  let cum = 0;
  while (xp >= cum + 100 * level) {
    cum += 100 * level;
    level += 1;
  }
  const xpIntoLevel = xp - cum;
  const xpForNext = 100 * level;
  const pctToNext = Math.min(100, Math.round((xpIntoLevel / xpForNext) * 100));

  const ach = (id: string, title: string, description: string, emoji: string, progress: number, goal: number): Achievement => ({
    id, title, description, emoji,
    progress: Math.min(progress, goal),
    goal,
    unlocked: progress >= goal,
  });

  const achievements: Achievement[] = [
    ach("first", "Primeiro RDO", "Registre seu primeiro diário de obra", "📋", totalRdos, 1),
    ach("ten", "Ritmo de obra", "Registre 10 RDOs", "🔥", totalRdos, 10),
    ach("fifty", "Veterano", "Registre 50 RDOs", "🏆", totalRdos, 50),
    ach("photos", "Olho clínico", "Adicione 50 fotos aos RDOs", "📸", photos, 50),
    ach("multi", "Multi-obras", "Gerencie 3 obras ao mesmo tempo", "🏗️", projects.length, 3),
    ach("approved", "Selo de aprovação", "Tenha um RDO aprovado pelo contratante", "✅", approved, 1),
    ach("final", "Entrega final", "Gere um relatório final consolidado", "📑", finalReportsCount, 1),
    ach("streak", "Sequência de fogo", "5 dias seguidos com RDO registrado", "⚡", streak, 5),
  ];

  const ladder: LevelStep[] = LEVEL_TITLES.map((title, i) => {
    const lvl = i + 1;
    const xpRequired = xpToReachLevel(lvl);
    return { level: lvl, title, xpRequired, reached: xp >= xpRequired, current: lvl === level };
  });

  return {
    xp, level, levelTitle: levelTitle(level),
    xpIntoLevel, xpForNext, pctToNext,
    streak, totalRdos,
    achievements,
    unlockedCount: achievements.filter((a) => a.unlocked).length,
    ladder,
  };
}
