"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSeedData, type AppData } from "@/lib/seed";
import { nowISO, uid } from "@/lib/utils";
import type {
  Checklist, Company, Contact, DailyReport, Equipment, Expense, Incident,
  Material, Project, Task, TeamMember, TimeCard, FinalReport, PlanId,
} from "@/lib/types";

interface State extends AppData {
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  demoMode: boolean;
  theme: "light" | "dark";
  finalReports: FinalReport[];
  hydrated: boolean;

  // auth / setup
  login: (email: string) => void;
  logout: () => void;
  register: (name: string, email: string, companyName: string) => void;
  loadDemo: () => void;
  resetAll: () => void;
  completeOnboarding: () => void;
  setTheme: (t: "light" | "dark") => void;
  updateCompany: (patch: Partial<Company>) => void;
  setPlan: (plan: PlanId) => void;

  // projects
  addProject: (p: Omit<Project, "id" | "companyId" | "createdAt">) => string;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;

  // reports
  addReport: (r: Omit<DailyReport, "id" | "companyId" | "number" | "createdAt" | "updatedAt">) => string;
  updateReport: (id: string, patch: Partial<DailyReport>) => void;
  deleteReport: (id: string) => void;

  // generic collections
  addTask: (t: Omit<Task, "id" | "companyId" | "createdAt">) => void;
  updateTask: (id: string, patch: Partial<Task>) => void;
  deleteTask: (id: string) => void;

  addTeamMember: (t: Omit<TeamMember, "id" | "companyId">) => void;
  updateTeamMember: (id: string, patch: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;

  addTimeCard: (t: Omit<TimeCard, "id" | "companyId">) => void;
  deleteTimeCard: (id: string) => void;

  addMaterial: (m: Omit<Material, "id" | "companyId">) => void;
  updateMaterial: (id: string, patch: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;

  addEquipment: (e: Omit<Equipment, "id" | "companyId">) => void;
  updateEquipment: (id: string, patch: Partial<Equipment>) => void;
  deleteEquipment: (id: string) => void;

  addChecklist: (c: Omit<Checklist, "id" | "companyId">) => void;
  updateChecklist: (id: string, patch: Partial<Checklist>) => void;
  deleteChecklist: (id: string) => void;

  addIncident: (i: Omit<Incident, "id" | "companyId" | "createdAt">) => void;
  updateIncident: (id: string, patch: Partial<Incident>) => void;
  deleteIncident: (id: string) => void;

  addExpense: (e: Omit<Expense, "id" | "companyId">) => void;
  updateExpense: (id: string, patch: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  addContact: (c: Omit<Contact, "id" | "companyId">) => void;
  updateContact: (id: string, patch: Partial<Contact>) => void;
  deleteContact: (id: string) => void;

  saveFinalReport: (f: Omit<FinalReport, "id" | "companyId">) => string;
}

const CID = "cmp_demo";

function emptyData(): AppData {
  const seed = createSeedData();
  return {
    user: seed.user,
    company: seed.company,
    projects: [],
    reports: [],
    tasks: [],
    team: [],
    timeCards: [],
    materials: [],
    equipment: [],
    checklists: [],
    incidents: [],
    expenses: [],
    contacts: [],
  };
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...emptyData(),
      finalReports: [],
      isAuthenticated: false,
      onboardingComplete: false,
      demoMode: false,
      theme: "light",
      hydrated: false,

      login: (email) =>
        set((s) => ({
          isAuthenticated: true,
          user: { ...s.user, email },
        })),
      logout: () => set({ isAuthenticated: false }),
      register: (name, email, companyName) =>
        set(() => {
          const data = emptyData();
          return {
            ...data,
            finalReports: [],
            user: { ...data.user, name, email },
            company: { ...data.company, name: companyName },
            isAuthenticated: true,
            onboardingComplete: false,
            demoMode: false,
          };
        }),
      loadDemo: () =>
        set(() => {
          const data = createSeedData();
          return {
            ...data,
            finalReports: [],
            isAuthenticated: true,
            onboardingComplete: true,
            demoMode: true,
          };
        }),
      resetAll: () =>
        set(() => ({
          ...emptyData(),
          finalReports: [],
          isAuthenticated: false,
          onboardingComplete: false,
          demoMode: false,
        })),
      completeOnboarding: () => set({ onboardingComplete: true }),
      setTheme: (theme) => set({ theme }),
      updateCompany: (patch) => set((s) => ({ company: { ...s.company, ...patch } })),
      setPlan: (plan) => set((s) => ({ company: { ...s.company, plan } })),

      // ---- projects ----
      addProject: (p) => {
        const id = uid("prj");
        set((s) => ({
          projects: [...s.projects, { ...p, id, companyId: CID, createdAt: nowISO() }],
        }));
        return id;
      },
      updateProject: (id, patch) =>
        set((s) => ({ projects: s.projects.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteProject: (id) =>
        set((s) => ({
          projects: s.projects.filter((x) => x.id !== id),
          reports: s.reports.filter((x) => x.projectId !== id),
        })),

      // ---- reports ----
      addReport: (r) => {
        const id = uid("rdo");
        set((s) => {
          const number =
            s.reports.filter((x) => x.projectId === r.projectId).length + 1;
          return {
            reports: [
              ...s.reports,
              { ...r, id, companyId: CID, number, createdAt: nowISO(), updatedAt: nowISO() },
            ],
          };
        });
        return id;
      },
      updateReport: (id, patch) =>
        set((s) => ({
          reports: s.reports.map((x) =>
            x.id === id ? { ...x, ...patch, updatedAt: nowISO() } : x,
          ),
        })),
      deleteReport: (id) => set((s) => ({ reports: s.reports.filter((x) => x.id !== id) })),

      // ---- tasks ----
      addTask: (t) => set((s) => ({ tasks: [...s.tasks, { ...t, id: uid("tsk"), companyId: CID, createdAt: nowISO() }] })),
      updateTask: (id, patch) => set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((x) => x.id !== id) })),

      addTeamMember: (t) => set((s) => ({ team: [...s.team, { ...t, id: uid("tm"), companyId: CID }] })),
      updateTeamMember: (id, patch) => set((s) => ({ team: s.team.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteTeamMember: (id) => set((s) => ({ team: s.team.filter((x) => x.id !== id) })),

      addTimeCard: (t) => set((s) => ({ timeCards: [...s.timeCards, { ...t, id: uid("tc"), companyId: CID }] })),
      deleteTimeCard: (id) => set((s) => ({ timeCards: s.timeCards.filter((x) => x.id !== id) })),

      addMaterial: (m) => set((s) => ({ materials: [...s.materials, { ...m, id: uid("mt"), companyId: CID }] })),
      updateMaterial: (id, patch) => set((s) => ({ materials: s.materials.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteMaterial: (id) => set((s) => ({ materials: s.materials.filter((x) => x.id !== id) })),

      addEquipment: (e) => set((s) => ({ equipment: [...s.equipment, { ...e, id: uid("eq"), companyId: CID }] })),
      updateEquipment: (id, patch) => set((s) => ({ equipment: s.equipment.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteEquipment: (id) => set((s) => ({ equipment: s.equipment.filter((x) => x.id !== id) })),

      addChecklist: (c) => set((s) => ({ checklists: [...s.checklists, { ...c, id: uid("ck"), companyId: CID }] })),
      updateChecklist: (id, patch) => set((s) => ({ checklists: s.checklists.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteChecklist: (id) => set((s) => ({ checklists: s.checklists.filter((x) => x.id !== id) })),

      addIncident: (i) => set((s) => ({ incidents: [...s.incidents, { ...i, id: uid("inc"), companyId: CID, createdAt: nowISO() }] })),
      updateIncident: (id, patch) => set((s) => ({ incidents: s.incidents.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteIncident: (id) => set((s) => ({ incidents: s.incidents.filter((x) => x.id !== id) })),

      addExpense: (e) => set((s) => ({ expenses: [...s.expenses, { ...e, id: uid("exp"), companyId: CID }] })),
      updateExpense: (id, patch) => set((s) => ({ expenses: s.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteExpense: (id) => set((s) => ({ expenses: s.expenses.filter((x) => x.id !== id) })),

      addContact: (c) => set((s) => ({ contacts: [...s.contacts, { ...c, id: uid("ct"), companyId: CID }] })),
      updateContact: (id, patch) => set((s) => ({ contacts: s.contacts.map((x) => (x.id === id ? { ...x, ...patch } : x)) })),
      deleteContact: (id) => set((s) => ({ contacts: s.contacts.filter((x) => x.id !== id) })),

      saveFinalReport: (f) => {
        const id = uid("fr");
        set((s) => ({
          finalReports: [
            ...s.finalReports.filter((x) => x.projectId !== f.projectId),
            { ...f, id, companyId: CID },
          ],
        }));
        return id;
      },
    }),
    {
      name: "obrareport-ia-store",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

// Hook auxiliar para evitar mismatch de hidratação SSR.
export function useHydrated(): boolean {
  return useStore((s) => s.hydrated);
}
