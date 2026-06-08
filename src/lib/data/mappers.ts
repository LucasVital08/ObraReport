// Conversão entre os objetos do app (camelCase) e as linhas do Supabase
// (snake_case). Usado pela sincronização (escrita) e pelo repositório (leitura).

import type {
  Project, DailyReport, Task, TeamMember, TimeCard, Material, Equipment,
  Checklist, Incident, Expense, Contact, FinalReport, Company, ProjectDocument,
} from "@/lib/types";

type Row = Record<string, unknown>;
const s = (v: unknown) => (v == null ? "" : String(v));
const n = (v: unknown) => (v == null || v === "" ? undefined : Number(v));
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

// ---------- Project ----------
export const projectMap = {
  toRow(p: Project, companyId: string): Row {
    return {
      id: p.id, company_id: companyId, name: p.name, client: p.client, address: p.address ?? null,
      technical_lead: p.technicalLead ?? null, supervisor: p.supervisor ?? null,
      start_date: p.startDate || null, expected_end_date: p.expectedEndDate || null,
      real_end_date: p.realEndDate || null, status: p.status, budget: p.budget ?? null,
      description: p.description ?? null, cover_color: p.coverColor ?? null,
    };
  },
  fromRow(r: Row): Project {
    return {
      id: s(r.id), companyId: s(r.company_id), name: s(r.name), client: s(r.client),
      address: s(r.address), technicalLead: s(r.technical_lead),
      supervisor: s(r.supervisor), startDate: s(r.start_date),
      expectedEndDate: s(r.expected_end_date), realEndDate: r.real_end_date ? s(r.real_end_date) : undefined,
      status: s(r.status) as Project["status"], budget: n(r.budget), description: s(r.description),
      coverColor: s(r.cover_color) || "#f4720b", createdAt: s(r.created_at),
    };
  },
};

// ---------- Report (conteúdo rico em JSONB) ----------
export const reportMap = {
  toRow(r: DailyReport, companyId: string): Row {
    return {
      id: r.id, company_id: companyId, project_id: r.projectId, number: r.number, date: r.date,
      responsible: r.responsible, supervisor: r.supervisor, arrival: r.arrival ?? null, departure: r.departure ?? null,
      weather: r.weather ?? null, site_condition: r.siteCondition ?? null, executive_summary: r.executiveSummary ?? "",
      notes: r.notes ?? "", status: r.status, create_mode: r.createMode, raw_input: r.rawInput ?? null,
      media: r.media ?? [], signatures: r.signatures ?? [],
      content: {
        team: r.team, activities: r.activities, materials: r.materials, materialsRequested: r.materialsRequested,
        equipment: r.equipment, equipmentRequested: r.equipmentRequested, occurrences: r.occurrences, risks: r.risks,
        impediments: r.impediments, clientRequests: r.clientRequests, providencias: r.providencias,
        pending: r.pending, nextDayPlan: r.nextDayPlan, expenses: r.expenses, comments: r.comments ?? [],
      },
    };
  },
  fromRow(r: Row): DailyReport {
    const c = (r.content || {}) as Record<string, unknown>;
    return {
      id: s(r.id), companyId: s(r.company_id), projectId: s(r.project_id), number: Number(r.number) || 1,
      date: s(r.date), responsible: s(r.responsible), supervisor: s(r.supervisor),
      arrival: r.arrival ? s(r.arrival) : undefined, departure: r.departure ? s(r.departure) : undefined,
      weather: r.weather ? s(r.weather) : undefined, siteCondition: r.site_condition ? s(r.site_condition) : undefined,
      team: arr(c.team), activities: arr(c.activities), materials: arr(c.materials), materialsRequested: arr(c.materialsRequested),
      equipment: arr(c.equipment), equipmentRequested: arr(c.equipmentRequested), occurrences: arr(c.occurrences),
      risks: arr(c.risks), impediments: arr(c.impediments), clientRequests: arr(c.clientRequests),
      providencias: arr(c.providencias), pending: arr(c.pending), nextDayPlan: arr(c.nextDayPlan),
      executiveSummary: s(r.executive_summary), notes: s(r.notes), media: arr(r.media), expenses: arr(c.expenses),
      comments: arr(c.comments), signatures: arr(r.signatures),
      status: s(r.status) as DailyReport["status"], createMode: s(r.create_mode) as DailyReport["createMode"],
      rawInput: r.raw_input ? s(r.raw_input) : undefined, createdAt: s(r.created_at), updatedAt: s(r.updated_at),
    };
  },
};

// ---------- Task ----------
export const taskMap = {
  toRow(t: Task, companyId: string): Row {
    return { id: t.id, company_id: companyId, project_id: t.projectId ?? null, title: t.title, description: t.description ?? "",
      assignee: t.assignee ?? null, priority: t.priority, due_date: t.dueDate || null, status: t.status };
  },
  fromRow(r: Row): Task {
    return { id: s(r.id), companyId: s(r.company_id), projectId: s(r.project_id), title: s(r.title),
      description: s(r.description), assignee: s(r.assignee), priority: s(r.priority) as Task["priority"],
      dueDate: r.due_date ? s(r.due_date) : "", status: s(r.status) as Task["status"], createdAt: s(r.created_at) };
  },
};

// ---------- TeamMember ----------
export const teamMap = {
  toRow(t: TeamMember, companyId: string): Row {
    return { id: t.id, company_id: companyId, project_id: t.projectId ?? null, name: t.name, role: t.role ?? null,
      phone: t.phone ?? null, active: t.active ?? true };
  },
  fromRow(r: Row): TeamMember {
    return { id: s(r.id), companyId: s(r.company_id), projectId: r.project_id ? s(r.project_id) : undefined,
      name: s(r.name), role: s(r.role), phone: s(r.phone), active: r.active !== false };
  },
};

// ---------- TimeCard ----------
export const timeCardMap = {
  toRow(t: TimeCard, companyId: string): Row {
    return { id: t.id, company_id: companyId, project_id: t.projectId ?? null, member_name: t.memberName, date: t.date,
      check_in: t.checkIn ?? null, check_out: t.checkOut ?? null, break_minutes: t.breakMinutes ?? 60, note: t.note ?? "" };
  },
  fromRow(r: Row): TimeCard {
    return { id: s(r.id), companyId: s(r.company_id), projectId: s(r.project_id), memberName: s(r.member_name),
      date: s(r.date), checkIn: s(r.check_in), checkOut: s(r.check_out), breakMinutes: Number(r.break_minutes) || 0, note: s(r.note) };
  },
};

// ---------- Material ----------
export const materialMap = {
  toRow(m: Material, companyId: string): Row {
    return { id: m.id, company_id: companyId, project_id: m.projectId ?? null, name: m.name, unit: m.unit ?? null,
      quantity_used: m.quantityUsed ?? 0, quantity_requested: m.quantityRequested ?? 0, supplier: m.supplier ?? null,
      estimated_value: m.estimatedValue ?? 0, status: m.status };
  },
  fromRow(r: Row): Material {
    return { id: s(r.id), companyId: s(r.company_id), projectId: s(r.project_id), name: s(r.name), unit: s(r.unit),
      quantityUsed: Number(r.quantity_used) || 0, quantityRequested: Number(r.quantity_requested) || 0,
      supplier: s(r.supplier), estimatedValue: Number(r.estimated_value) || 0, status: s(r.status) as Material["status"] };
  },
};

// ---------- Equipment ----------
export const equipmentMap = {
  toRow(e: Equipment, companyId: string): Row {
    return { id: e.id, company_id: companyId, project_id: e.projectId ?? null, name: e.name, type: e.type ?? null,
      responsible: e.responsible ?? null, condition_out: e.conditionOut ?? null, status: e.status, pickup_date: e.pickupDate || null };
  },
  fromRow(r: Row): Equipment {
    return { id: s(r.id), companyId: s(r.company_id), projectId: s(r.project_id), name: s(r.name), type: s(r.type),
      responsible: s(r.responsible), conditionOut: s(r.condition_out), status: s(r.status) as Equipment["status"],
      pickupDate: r.pickup_date ? s(r.pickup_date) : "" };
  },
};

// ---------- Checklist ----------
export const checklistMap = {
  toRow(c: Checklist, companyId: string): Row {
    return { id: c.id, company_id: companyId, project_id: c.projectId ?? null, title: c.title, template: c.template ?? null,
      responsible: c.responsible ?? null, date: c.date || null, status: c.status, items: c.items ?? [] };
  },
  fromRow(r: Row): Checklist {
    return { id: s(r.id), companyId: s(r.company_id), projectId: s(r.project_id), title: s(r.title), template: s(r.template),
      responsible: s(r.responsible), date: s(r.date), status: s(r.status) as Checklist["status"], items: arr(r.items) };
  },
};

// ---------- Incident ----------
export const incidentMap = {
  toRow(i: Incident, companyId: string): Row {
    return { id: i.id, company_id: companyId, project_id: i.projectId ?? null, title: i.title, category: i.category ?? null,
      severity: i.severity, description: i.description ?? "", responsible: i.responsible ?? null, status: i.status,
      proposed_solution: i.proposedSolution ?? null, resolved_at: i.resolvedAt || null };
  },
  fromRow(r: Row): Incident {
    return { id: s(r.id), companyId: s(r.company_id), projectId: s(r.project_id), title: s(r.title), category: s(r.category),
      severity: s(r.severity) as Incident["severity"], description: s(r.description), responsible: s(r.responsible),
      status: s(r.status) as Incident["status"], proposedSolution: s(r.proposed_solution),
      resolvedAt: r.resolved_at ? s(r.resolved_at) : undefined, createdAt: s(r.created_at) };
  },
};

// ---------- Expense ----------
export const expenseMap = {
  toRow(e: Expense, companyId: string): Row {
    return { id: e.id, company_id: companyId, project_id: e.projectId ?? null, report_id: e.rdoId ?? null, date: e.date,
      category: e.category, description: e.description, amount: e.amount, payment_method: e.paymentMethod ?? null,
      responsible: e.responsible ?? null, has_receipt: e.hasReceipt ?? false, note: e.note ?? null };
  },
  fromRow(r: Row): Expense {
    return { id: s(r.id), companyId: s(r.company_id), projectId: s(r.project_id), rdoId: r.report_id ? s(r.report_id) : undefined,
      date: s(r.date), category: s(r.category), description: s(r.description), amount: Number(r.amount) || 0,
      paymentMethod: s(r.payment_method), responsible: s(r.responsible), hasReceipt: r.has_receipt === true,
      note: r.note ? s(r.note) : undefined };
  },
};

// ---------- Contact ----------
export const contactMap = {
  toRow(c: Contact, companyId: string): Row {
    return { id: c.id, company_id: companyId, name: c.name, type: c.type ?? null, phone: c.phone ?? null,
      whatsapp: c.whatsapp ?? null, email: c.email ?? null, company_name: c.company ?? null };
  },
  fromRow(r: Row): Contact {
    return { id: s(r.id), companyId: s(r.company_id), name: s(r.name), type: s(r.type), phone: s(r.phone),
      whatsapp: s(r.whatsapp), email: s(r.email), company: s(r.company_name) };
  },
};

// ---------- FinalReport ----------
export const finalReportMap = {
  toRow(f: FinalReport, companyId: string): Row {
    return { id: f.id, company_id: companyId, project_id: f.projectId, generated_at: f.generatedAt,
      executive_summary: f.executiveSummary ?? "", technical_conclusion: f.technicalConclusion ?? "",
      recommendations: f.recommendations ?? [], options: f.options ?? {} };
  },
  fromRow(r: Row): FinalReport {
    return { id: s(r.id), companyId: s(r.company_id), projectId: s(r.project_id), generatedAt: s(r.generated_at),
      executiveSummary: s(r.executive_summary), technicalConclusion: s(r.technical_conclusion),
      recommendations: arr(r.recommendations), options: (r.options || {}) as FinalReport["options"] };
  },
};

// ---------- ProjectDocument (arquivo no Storage; URL pública em storage_path) ----------
export const documentMap = {
  toRow(d: ProjectDocument, companyId: string): Row {
    return { id: d.id, company_id: companyId, project_id: d.projectId ?? null, name: d.name,
      mime_type: d.mimeType ?? null, size: d.size ?? 0, storage_path: d.dataUrl ?? null,
      uploaded_at: d.uploadedAt || null };
  },
  fromRow(r: Row): ProjectDocument {
    return { id: s(r.id), companyId: s(r.company_id), projectId: s(r.project_id), name: s(r.name),
      mimeType: s(r.mime_type), size: Number(r.size) || 0, dataUrl: s(r.storage_path),
      uploadedAt: s(r.uploaded_at) };
  },
};

// ---------- Company ----------
export const companyMap = {
  toRow(c: Company): Row {
    return { id: c.id, name: c.name, logo_text: c.logoText, brand_color: c.brandColor, plan: c.plan,
      document: c.document ?? null, city: c.city ?? null, client_visibility: c.clientVisibility ?? null };
  },
};

// Registro de toRow por nome de tabela (usado pela sincronização de escrita).
export const TO_ROW: Record<string, (obj: unknown, companyId: string) => Row> = {
  projects: (o, c) => projectMap.toRow(o as Project, c),
  reports: (o, c) => reportMap.toRow(o as DailyReport, c),
  tasks: (o, c) => taskMap.toRow(o as Task, c),
  team_members: (o, c) => teamMap.toRow(o as TeamMember, c),
  time_cards: (o, c) => timeCardMap.toRow(o as TimeCard, c),
  materials: (o, c) => materialMap.toRow(o as Material, c),
  equipment: (o, c) => equipmentMap.toRow(o as Equipment, c),
  checklists: (o, c) => checklistMap.toRow(o as Checklist, c),
  incidents: (o, c) => incidentMap.toRow(o as Incident, c),
  expenses: (o, c) => expenseMap.toRow(o as Expense, c),
  contacts: (o, c) => contactMap.toRow(o as Contact, c),
  final_reports: (o, c) => finalReportMap.toRow(o as FinalReport, c),
  documents: (o, c) => documentMap.toRow(o as ProjectDocument, c),
  companies: (o) => companyMap.toRow(o as Company),
};
