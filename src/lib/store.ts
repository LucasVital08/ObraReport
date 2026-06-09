"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { createSeedData, buildSampleShoppingVitoria, type AppData } from "@/lib/seed";
import { nowISO, uid } from "@/lib/utils";

// localStorage à prova de erros: se a cota estourar (ex.: muitas fotos em
// base64 no modo sem Supabase), apenas avisa e segue — sem quebrar o app.
const safeStorage = {
  getItem: (k: string) => { try { return localStorage.getItem(k); } catch { return null; } },
  setItem: (k: string, v: string) => {
    try { localStorage.setItem(k, v); }
    catch (e) { console.warn("[store] não foi possível persistir (cota cheia?)", e); }
  },
  removeItem: (k: string) => { try { localStorage.removeItem(k); } catch { /* ignore */ } },
};
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { syncUpsert, syncDelete } from "@/lib/data/sync";
import type { CompanyData } from "@/lib/data/repo";
import type {
  Checklist, Company, Contact, DailyReport, Equipment, Expense, Incident,
  Material, Project, Task, TeamMember, TimeCard, FinalReport, PlanId, ProjectDocument,
  RdoComment, User,
} from "@/lib/types";

interface State extends AppData {
  isAuthenticated: boolean;
  onboardingComplete: boolean;
  demoMode: boolean;
  theme: "light" | "dark";
  finalReports: FinalReport[];
  documents: ProjectDocument[];
  hydrated: boolean;

  // auth / setup
  login: (email: string) => void;
  logout: () => void;
  register: (name: string, email: string, companyName: string) => void;
  // Sincroniza a sessão real (Supabase) com o store. null = deslogado.
  setSession: (payload: { user: User; company: Company | null } | null) => void;
  // Carrega os dados da empresa (vindos do Supabase) para o store.
  hydrateData: (data: Partial<CompanyData>) => void;
  loadDemo: () => void;
  loadDemoClient: () => void;
  resetAll: () => void;
  importSampleObra: () => boolean;
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

  addDocument: (d: Omit<ProjectDocument, "id" | "companyId">) => { ok: boolean; error?: string };
  deleteDocument: (id: string) => void;

  // comentários/observações em RDOs (ex.: do contratante)
  addRdoComment: (rdoId: string, c: Omit<RdoComment, "id" | "createdAt">) => void;
  deleteRdoComment: (rdoId: string, commentId: string) => void;
}

const CID = "cmp_demo";

function emptyData(): AppData {
  // Identidade NEUTRA para conta nova (sem herdar a demo). O onboarding preenche
  // o nome real da empresa. A demonstração (RF Soluções) vem só via loadDemo().
  const now = new Date().toISOString();
  const user: User = { id: "usr_local", name: "", email: "", role: "owner", companyId: "cmp_local", avatarColor: "#f4720b" };
  const company: Company = { id: "cmp_local", name: "Minha empresa", logoText: "OR", brandColor: "#f4720b", plan: "free", createdAt: now };
  return {
    user, company,
    projects: [], reports: [], tasks: [], team: [], timeCards: [],
    materials: [], equipment: [], checklists: [], incidents: [], expenses: [], contacts: [],
  };
}

// ---- Sincronização com o Supabase (somente em produção, fora do modo demo) ----
function canSync(s: State): boolean {
  return isSupabaseEnabled && !s.demoMode && !!s.user?.companyId;
}
function up(s: State, table: string, obj: unknown) {
  if (canSync(s)) syncUpsert(table, obj, s.user.companyId);
}
function del(s: State, table: string, id: string) {
  if (canSync(s)) syncDelete(table, id);
}

export const useStore = create<State>()(
  persist(
    (set) => ({
      ...emptyData(),
      finalReports: [],
      documents: [],
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
      setSession: (payload) =>
        set((s) =>
          payload
            ? {
                isAuthenticated: true,
                onboardingComplete: true,
                demoMode: false,
                user: payload.user,
                company: payload.company ?? s.company,
              }
            : { isAuthenticated: false }),
      hydrateData: (data) => set(() => ({ ...(data as Partial<State>) })),
      register: (name, email, companyName) =>
        set(() => {
          const data = emptyData();
          return {
            ...data,
            finalReports: [],
            documents: [],
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
            documents: [],
            isAuthenticated: true,
            onboardingComplete: true,
            demoMode: true,
          };
        }),
      // Entra na demonstração com o perfil do CONTRATANTE (camada cliente):
      // mesma base de dados, mas com papel "client" e acesso só às obras dele.
      loadDemoClient: () =>
        set(() => {
          const data = createSeedData();
          return {
            ...data,
            user: {
              ...data.user,
              name: "Carlos Andrade",
              email: "contratante@cliente.com.br",
              role: "client",
              clientProjectIds: data.projects.map((p) => p.id),
            },
            finalReports: [],
            documents: [],
            isAuthenticated: true,
            onboardingComplete: true,
            demoMode: true,
          };
        }),
      resetAll: () =>
        set(() => ({
          ...emptyData(),
          finalReports: [],
          documents: [],
          isAuthenticated: false,
          onboardingComplete: false,
          demoMode: false,
        })),
      // Importa a obra de exemplo (Shopping Vitória) com os 17 RDOs na conta
      // atual. Sincroniza com o Supabase quando habilitado. Evita duplicar.
      importSampleObra: () => {
        const s = useStore.getState();
        if (s.projects.some((p) => p.name.startsWith("Shopping Vitória"))) return false;
        const cid = s.user.companyId || CID;
        const { project, reports, team } = buildSampleShoppingVitoria(cid);
        set((st) => {
          up(st, "projects", project);
          reports.forEach((r) => up(st, "reports", r));
          team.forEach((t) => up(st, "team_members", t));
          return {
            projects: [...st.projects, project],
            reports: [...st.reports, ...reports],
            team: [...st.team, ...team],
          };
        });
        return true;
      },
      completeOnboarding: () => set({ onboardingComplete: true }),
      setTheme: (theme) => set({ theme }),
      updateCompany: (patch) =>
        set((s) => {
          const company = { ...s.company, ...patch };
          up(s, "companies", company);
          return { company };
        }),
      setPlan: (plan) =>
        set((s) => {
          const company = { ...s.company, plan };
          up(s, "companies", company);
          return { company };
        }),

      // ---- projects ----
      addProject: (p) => {
        const id = uid("prj");
        set((s) => {
          const o: Project = { ...p, id, companyId: s.user.companyId || CID, createdAt: nowISO() };
          up(s, "projects", o);
          return { projects: [...s.projects, o] };
        });
        return id;
      },
      updateProject: (id, patch) =>
        set((s) => {
          const projects = s.projects.map((x) => (x.id === id ? { ...x, ...patch } : x));
          const o = projects.find((x) => x.id === id);
          if (o) up(s, "projects", o);
          return { projects };
        }),
      deleteProject: (id) =>
        set((s) => {
          del(s, "projects", id); // o banco remove em cascata os filhos
          return {
            projects: s.projects.filter((x) => x.id !== id),
            reports: s.reports.filter((x) => x.projectId !== id),
            documents: (s.documents ?? []).filter((x) => x.projectId !== id),
          };
        }),

      // ---- reports ----
      addReport: (r) => {
        const id = uid("rdo");
        set((s) => {
          const number = s.reports.filter((x) => x.projectId === r.projectId).length + 1;
          const o: DailyReport = { ...r, id, companyId: s.user.companyId || CID, number, createdAt: nowISO(), updatedAt: nowISO() };
          up(s, "reports", o);
          return { reports: [...s.reports, o] };
        });
        return id;
      },
      updateReport: (id, patch) =>
        set((s) => {
          const reports = s.reports.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: nowISO() } : x));
          const o = reports.find((x) => x.id === id);
          if (o) up(s, "reports", o);
          return { reports };
        }),
      deleteReport: (id) => set((s) => { del(s, "reports", id); return { reports: s.reports.filter((x) => x.id !== id) }; }),

      // ---- tasks ----
      addTask: (t) => set((s) => { const o: Task = { ...t, id: uid("tsk"), companyId: s.user.companyId || CID, createdAt: nowISO() }; up(s, "tasks", o); return { tasks: [...s.tasks, o] }; }),
      updateTask: (id, patch) => set((s) => { const tasks = s.tasks.map((x) => (x.id === id ? { ...x, ...patch } : x)); const o = tasks.find((x) => x.id === id); if (o) up(s, "tasks", o); return { tasks }; }),
      deleteTask: (id) => set((s) => { del(s, "tasks", id); return { tasks: s.tasks.filter((x) => x.id !== id) }; }),

      addTeamMember: (t) => set((s) => { const o: TeamMember = { ...t, id: uid("tm"), companyId: s.user.companyId || CID }; up(s, "team_members", o); return { team: [...s.team, o] }; }),
      updateTeamMember: (id, patch) => set((s) => { const team = s.team.map((x) => (x.id === id ? { ...x, ...patch } : x)); const o = team.find((x) => x.id === id); if (o) up(s, "team_members", o); return { team }; }),
      deleteTeamMember: (id) => set((s) => { del(s, "team_members", id); return { team: s.team.filter((x) => x.id !== id) }; }),

      addTimeCard: (t) => set((s) => { const o: TimeCard = { ...t, id: uid("tc"), companyId: s.user.companyId || CID }; up(s, "time_cards", o); return { timeCards: [...s.timeCards, o] }; }),
      deleteTimeCard: (id) => set((s) => { del(s, "time_cards", id); return { timeCards: s.timeCards.filter((x) => x.id !== id) }; }),

      addMaterial: (m) => set((s) => { const o: Material = { ...m, id: uid("mt"), companyId: s.user.companyId || CID }; up(s, "materials", o); return { materials: [...s.materials, o] }; }),
      updateMaterial: (id, patch) => set((s) => { const materials = s.materials.map((x) => (x.id === id ? { ...x, ...patch } : x)); const o = materials.find((x) => x.id === id); if (o) up(s, "materials", o); return { materials }; }),
      deleteMaterial: (id) => set((s) => { del(s, "materials", id); return { materials: s.materials.filter((x) => x.id !== id) }; }),

      addEquipment: (e) => set((s) => { const o: Equipment = { ...e, id: uid("eq"), companyId: s.user.companyId || CID }; up(s, "equipment", o); return { equipment: [...s.equipment, o] }; }),
      updateEquipment: (id, patch) => set((s) => { const equipment = s.equipment.map((x) => (x.id === id ? { ...x, ...patch } : x)); const o = equipment.find((x) => x.id === id); if (o) up(s, "equipment", o); return { equipment }; }),
      deleteEquipment: (id) => set((s) => { del(s, "equipment", id); return { equipment: s.equipment.filter((x) => x.id !== id) }; }),

      addChecklist: (c) => set((s) => { const o: Checklist = { ...c, id: uid("ck"), companyId: s.user.companyId || CID }; up(s, "checklists", o); return { checklists: [...s.checklists, o] }; }),
      updateChecklist: (id, patch) => set((s) => { const checklists = s.checklists.map((x) => (x.id === id ? { ...x, ...patch } : x)); const o = checklists.find((x) => x.id === id); if (o) up(s, "checklists", o); return { checklists }; }),
      deleteChecklist: (id) => set((s) => { del(s, "checklists", id); return { checklists: s.checklists.filter((x) => x.id !== id) }; }),

      addIncident: (i) => set((s) => { const o: Incident = { ...i, id: uid("inc"), companyId: s.user.companyId || CID, createdAt: nowISO() }; up(s, "incidents", o); return { incidents: [...s.incidents, o] }; }),
      updateIncident: (id, patch) => set((s) => { const incidents = s.incidents.map((x) => (x.id === id ? { ...x, ...patch } : x)); const o = incidents.find((x) => x.id === id); if (o) up(s, "incidents", o); return { incidents }; }),
      deleteIncident: (id) => set((s) => { del(s, "incidents", id); return { incidents: s.incidents.filter((x) => x.id !== id) }; }),

      addExpense: (e) => set((s) => { const o: Expense = { ...e, id: uid("exp"), companyId: s.user.companyId || CID }; up(s, "expenses", o); return { expenses: [...s.expenses, o] }; }),
      updateExpense: (id, patch) => set((s) => { const expenses = s.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)); const o = expenses.find((x) => x.id === id); if (o) up(s, "expenses", o); return { expenses }; }),
      deleteExpense: (id) => set((s) => { del(s, "expenses", id); return { expenses: s.expenses.filter((x) => x.id !== id) }; }),

      addContact: (c) => set((s) => { const o: Contact = { ...c, id: uid("ct"), companyId: s.user.companyId || CID }; up(s, "contacts", o); return { contacts: [...s.contacts, o] }; }),
      updateContact: (id, patch) => set((s) => { const contacts = s.contacts.map((x) => (x.id === id ? { ...x, ...patch } : x)); const o = contacts.find((x) => x.id === id); if (o) up(s, "contacts", o); return { contacts }; }),
      deleteContact: (id) => set((s) => { del(s, "contacts", id); return { contacts: s.contacts.filter((x) => x.id !== id) }; }),

      saveFinalReport: (f) => {
        const id = uid("fr");
        set((s) => {
          const o: FinalReport = { ...f, id, companyId: s.user.companyId || CID };
          up(s, "final_reports", o);
          return { finalReports: [...(s.finalReports ?? []).filter((x) => x.projectId !== f.projectId), o] };
        });
        return id;
      },

      addDocument: (d) => {
        // Guarda de tamanho só vale quando o arquivo é guardado inline (data URL
        // base64) no estado persistido — o localStorage tem limite (~5MB). Quando
        // o arquivo foi enviado ao Storage, dataUrl é uma URL http e só a string
        // é persistida; nesse caso não há limite de tamanho.
        const inline = !/^https?:\/\//i.test(d.dataUrl || "");
        const MAX = 3 * 1024 * 1024; // 3 MB
        if (inline && d.size > MAX) {
          return { ok: false, error: "Arquivo muito grande (máx. 3 MB nesta versão). Comprima o PDF e tente novamente." };
        }
        try {
          set((s) => {
            const doc = { ...d, id: uid("doc"), companyId: s.user.companyId || CID };
            up(s, "documents", doc);
            return { documents: [...(s.documents ?? []), doc] };
          });
          return { ok: true };
        } catch {
          return { ok: false, error: "Não foi possível salvar o documento (limite de armazenamento atingido)." };
        }
      },
      deleteDocument: (id) => set((s) => { del(s, "documents", id); return { documents: (s.documents ?? []).filter((x) => x.id !== id) }; }),

      addRdoComment: (rdoId, c) =>
        set((s) => {
          const reports = s.reports.map((r) =>
            r.id === rdoId
              ? { ...r, comments: [...(r.comments ?? []), { ...c, id: uid("cmt"), createdAt: nowISO() }] }
              : r,
          );
          const o = reports.find((r) => r.id === rdoId);
          if (o) up(s, "reports", o);
          return { reports };
        }),
      deleteRdoComment: (rdoId, commentId) =>
        set((s) => {
          const reports = s.reports.map((r) =>
            r.id === rdoId
              ? { ...r, comments: (r.comments ?? []).filter((x) => x.id !== commentId) }
              : r,
          );
          const o = reports.find((r) => r.id === rdoId);
          if (o) up(s, "reports", o);
          return { reports };
        }),
    }),
    {
      name: "obrareport-ia-store",
      storage: createJSONStorage(() => safeStorage),
      // Backfill defensivo: estados persistidos por versões antigas podem não
      // ter alguns arrays (ex.: documents, finalReports), o que causava crash
      // ao acessar `.filter`. Garantimos que todas as coleções existam.
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<State>;
        return {
          ...current,
          ...p,
          projects: p.projects ?? current.projects,
          reports: p.reports ?? current.reports,
          tasks: p.tasks ?? current.tasks,
          team: p.team ?? current.team,
          timeCards: p.timeCards ?? current.timeCards,
          materials: p.materials ?? current.materials,
          equipment: p.equipment ?? current.equipment,
          checklists: p.checklists ?? current.checklists,
          incidents: p.incidents ?? current.incidents,
          expenses: p.expenses ?? current.expenses,
          contacts: p.contacts ?? current.contacts,
          finalReports: p.finalReports ?? [],
          documents: p.documents ?? [],
        };
      },
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
