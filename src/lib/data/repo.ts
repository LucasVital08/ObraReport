"use client";

import { createClient } from "@/lib/supabase/client";
import {
  projectMap, reportMap, taskMap, teamMap, timeCardMap, materialMap, equipmentMap,
  checklistMap, incidentMap, expenseMap, contactMap, finalReportMap, documentMap,
} from "@/lib/data/mappers";
import type {
  Project, DailyReport, Task, TeamMember, TimeCard, Material, Equipment,
  Checklist, Incident, Expense, Contact, FinalReport, ProjectDocument,
} from "@/lib/types";

export interface CompanyData {
  projects: Project[]; reports: DailyReport[]; tasks: Task[]; team: TeamMember[];
  timeCards: TimeCard[]; materials: Material[]; equipment: Equipment[]; checklists: Checklist[];
  incidents: Incident[]; expenses: Expense[]; contacts: Contact[]; finalReports: FinalReport[];
  documents: ProjectDocument[];
}

type Row = Record<string, unknown>;
const rows = (res: { data: unknown }) => (Array.isArray(res?.data) ? (res.data as Row[]) : []);

// Carrega todos os dados da empresa do Supabase (RLS já limita ao tenant).
export async function loadCompanyData(companyId: string): Promise<CompanyData | null> {
  const sb = createClient();
  if (!sb) return null;
  const sel = (t: string) => sb.from(t).select("*").eq("company_id", companyId);
  const [
    projects, reports, tasks, team, timeCards, materials,
    equipment, checklists, incidents, expenses, contacts, finalReports, documents,
  ] = await Promise.all([
    sel("projects"), sel("reports"), sel("tasks"), sel("team_members"), sel("time_cards"), sel("materials"),
    sel("equipment"), sel("checklists"), sel("incidents"), sel("expenses"), sel("contacts"), sel("final_reports"),
    sel("documents"),
  ]);

  return {
    projects: rows(projects).map(projectMap.fromRow),
    reports: rows(reports).map(reportMap.fromRow),
    tasks: rows(tasks).map(taskMap.fromRow),
    team: rows(team).map(teamMap.fromRow),
    timeCards: rows(timeCards).map(timeCardMap.fromRow),
    materials: rows(materials).map(materialMap.fromRow),
    equipment: rows(equipment).map(equipmentMap.fromRow),
    checklists: rows(checklists).map(checklistMap.fromRow),
    incidents: rows(incidents).map(incidentMap.fromRow),
    expenses: rows(expenses).map(expenseMap.fromRow),
    contacts: rows(contacts).map(contactMap.fromRow),
    finalReports: rows(finalReports).map(finalReportMap.fromRow),
    documents: rows(documents).map(documentMap.fromRow),
  };
}
