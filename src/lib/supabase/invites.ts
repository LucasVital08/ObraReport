"use client";

import { createClient } from "./client";
import type { Role } from "@/lib/types";

function sb() {
  const c = createClient();
  if (!c) throw new Error("Supabase não configurado");
  return c;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: Role;
  clientProjectIds: string[];
}

export interface Invite {
  id: string;
  email: string | null;
  role: Role;
  clientProjectIds: string[];
  token: string;
  status: "pending" | "accepted" | "revoked";
  createdAt: string;
  expiresAt: string;
  link: string;
}

const linkFor = (token: string) =>
  `${typeof window !== "undefined" ? window.location.origin : ""}/convite/${token}`;

// Membros (perfis) da empresa do usuário logado.
export async function listMembers(): Promise<Member[]> {
  const { data, error } = await sb().from("profiles").select("id,name,email,role,client_project_ids").order("created_at");
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id, name: r.name || "", email: r.email || "", role: (r.role as Role) || "member",
    clientProjectIds: r.client_project_ids || [],
  }));
}

export async function updateMemberRole(id: string, role: Role, clientProjectIds: string[] = []): Promise<void> {
  const { error } = await sb().from("profiles").update({ role, client_project_ids: clientProjectIds }).eq("id", id);
  if (error) throw error;
}

export async function listInvites(): Promise<Invite[]> {
  const { data, error } = await sb().from("invites").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map((r) => ({
    id: r.id, email: r.email, role: (r.role as Role) || "member", clientProjectIds: r.client_project_ids || [],
    token: r.token, status: r.status, createdAt: r.created_at, expiresAt: r.expires_at, link: linkFor(r.token),
  }));
}

export async function createInvite(p: { email?: string; role: Role; clientProjectIds?: string[]; companyId: string }): Promise<Invite> {
  const { data: auth } = await sb().auth.getUser();
  const { data, error } = await sb().from("invites").insert({
    company_id: p.companyId,
    email: p.email || null,
    role: p.role,
    client_project_ids: p.clientProjectIds || [],
    invited_by: auth?.user?.id || null,
  }).select("*").single();
  if (error) throw error;
  return {
    id: data.id, email: data.email, role: data.role, clientProjectIds: data.client_project_ids || [],
    token: data.token, status: data.status, createdAt: data.created_at, expiresAt: data.expires_at, link: linkFor(data.token),
  };
}

export async function revokeInvite(id: string): Promise<void> {
  const { error } = await sb().from("invites").update({ status: "revoked" }).eq("id", id);
  if (error) throw error;
}

export interface InviteInfo {
  companyId: string;
  companyName: string;
  role: Role;
  email: string | null;
  status: "pending" | "accepted" | "revoked";
  expired: boolean;
}

export async function getInvite(token: string): Promise<InviteInfo | null> {
  const { data, error } = await sb().rpc("get_invite", { invite_token: token });
  if (error) throw error;
  const row = Array.isArray(data) ? data[0] : data;
  if (!row) return null;
  return {
    companyId: row.company_id, companyName: row.company_name, role: row.role as Role,
    email: row.email, status: row.status, expired: row.expired,
  };
}

export async function acceptInvite(token: string): Promise<void> {
  const { error } = await sb().rpc("accept_invite", { invite_token: token });
  if (error) throw error;
}
