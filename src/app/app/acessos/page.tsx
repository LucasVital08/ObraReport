"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import {
  listMembers, listInvites, createInvite, revokeInvite, updateMemberRole, removeMember,
  type Member, type Invite,
} from "@/lib/supabase/invites";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Field, Input, Select, Badge, EmptyState, useToast } from "@/components/ui";
import { ROLE_LABELS, type Role } from "@/lib/types";
import { Avatar } from "@/components/brand";
import { UserPlus, Link2, Copy, Trash2, Users, ShieldAlert, Check } from "lucide-react";

// Papéis que podem ser convidados (owner é exclusivo do criador da empresa).
const INVITE_ROLES: Role[] = ["admin", "supervisor", "member", "client"];

export default function AcessosPage() {
  const { show, node } = useToast();
  const user = useStore((s) => s.user);
  const company = useStore((s) => s.company);
  const projects = useStore((s) => s.projects);
  const isManager = user.role === "owner" || user.role === "admin";

  const canLoad = isSupabaseEnabled && isManager;
  const [members, setMembers] = React.useState<Member[]>([]);
  const [invites, setInvites] = React.useState<Invite[]>([]);
  const [loading, setLoading] = React.useState(canLoad);

  // formulário de convite
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<Role>("member");
  const [projIds, setProjIds] = React.useState<string[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [copiedId, setCopiedId] = React.useState<string>("");

  React.useEffect(() => {
    if (!canLoad) return;
    let active = true;
    (async () => {
      try {
        const [m, i] = await Promise.all([listMembers(), listInvites()]);
        if (active) { setMembers(m); setInvites(i); }
      } catch (e) {
        if (active) show((e as Error).message || "Erro ao carregar acessos.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoad]);

  async function copy(link: string, id: string) {
    try {
      await navigator.clipboard.writeText(link);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 1800);
    } catch {
      show("Copie o link manualmente: " + link);
    }
  }

  async function handleCreate() {
    setCreating(true);
    try {
      const inv = await createInvite({
        email: email.trim() || undefined, role,
        clientProjectIds: role === "client" ? projIds : [],
        companyId: user.companyId || company.id,
      });
      setInvites((prev) => [inv, ...prev]);
      setEmail(""); setProjIds([]);
      await copy(inv.link, inv.id);
      show("Convite criado e link copiado!");
    } catch (e) {
      show((e as Error).message || "Não foi possível criar o convite.");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    try {
      await revokeInvite(id);
      setInvites((prev) => prev.map((i) => (i.id === id ? { ...i, status: "revoked" } : i)));
      show("Convite revogado.");
    } catch (e) {
      show((e as Error).message || "Erro ao revogar.");
    }
  }

  async function handleRole(m: Member, newRole: Role) {
    try {
      await updateMemberRole(m.id, newRole, newRole === "client" ? m.clientProjectIds : []);
      setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, role: newRole } : x)));
      show("Papel atualizado.");
    } catch (e) {
      show((e as Error).message || "Erro ao atualizar papel.");
    }
  }

  async function handleRemoveMember(m: Member) {
    if (!confirm(`Remover ${m.name || m.email} da empresa? Essa pessoa perde o acesso às obras e aos RDOs.`)) return;
    try {
      await removeMember(m.id);
      setMembers((prev) => prev.filter((x) => x.id !== m.id));
      show("Membro removido da empresa.");
    } catch (e) {
      show((e as Error).message || "Erro ao remover membro.");
    }
  }

  function toggleProj(id: string) {
    setProjIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  // ---- Estados de bloqueio ----
  if (!isSupabaseEnabled) {
    return (
      <div>
        <PageHeader title="Equipe & acessos" description="Convide membros e contratantes" />
        <Card className="p-6 flex items-start gap-3">
          <ShieldAlert className="text-info shrink-0" size={20} />
          <div>
            <p className="font-medium">Disponível no modo produção</p>
            <p className="text-sm text-muted mt-1">
              Convites e gestão de acessos usam o backend (Supabase). Configure o Supabase
              para liberar este recurso. No modo demonstração os dados ficam só neste aparelho.
            </p>
          </div>
        </Card>
      </div>
    );
  }
  if (!isManager) {
    return (
      <div>
        <PageHeader title="Equipe & acessos" description="Convide membros e contratantes" />
        <Card className="p-6 flex items-start gap-3">
          <ShieldAlert className="text-warning shrink-0" size={20} />
          <p className="text-sm">Apenas o dono ou administradores da empresa podem gerenciar acessos.</p>
        </Card>
      </div>
    );
  }

  const pending = invites.filter((i) => i.status === "pending");

  return (
    <div>
      {node}
      <PageHeader title="Equipe & acessos" description="Convide membros da equipe e contratantes para a sua empresa" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Convidar */}
        <Card>
          <CardHeader title="Convidar para a empresa" icon={<UserPlus size={18} />}
            subtitle="Gera um link de convite para enviar por WhatsApp, e-mail, etc." />
          <div className="p-4 space-y-4">
            <Field label="E-mail (opcional)" hint="Só para sua organização — o convite vale por link.">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pessoa@empresa.com" />
            </Field>
            <Field label="Papel / nível de acesso">
              <Select value={role} onChange={(e) => setRole(e.target.value as Role)}>
                {INVITE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
              </Select>
            </Field>
            {role === "client" && (
              <Field label="Obras que o contratante pode acompanhar">
                {projects.length === 0 ? (
                  <p className="text-sm text-muted">Cadastre uma obra primeiro.</p>
                ) : (
                  <div className="space-y-1.5 max-h-44 overflow-y-auto rounded-xl border border-border p-2">
                    {projects.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 text-sm px-1 py-1 cursor-pointer">
                        <input type="checkbox" checked={projIds.includes(p.id)} onChange={() => toggleProj(p.id)} />
                        <span className="truncate">{p.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              </Field>
            )}
            <Button onClick={handleCreate} disabled={creating || (role === "client" && projIds.length === 0)} className="w-full">
              <Link2 size={16} /> {creating ? "Gerando…" : "Gerar link de convite"}
            </Button>
          </div>
        </Card>

        {/* Membros atuais */}
        <Card>
          <CardHeader title="Membros da empresa" icon={<Users size={18} />} subtitle={`${members.length} pessoa(s)`} />
          <div className="divide-y divide-border">
            {loading ? (
              <p className="p-4 text-sm text-muted">Carregando…</p>
            ) : members.length === 0 ? (
              <p className="p-4 text-sm text-muted">Nenhum membro encontrado.</p>
            ) : members.map((m) => (
              <div key={m.id} className="flex items-center gap-3 p-3.5">
                <Avatar name={m.name || m.email} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{m.name || "(sem nome)"} {m.id === user.id && <span className="text-muted">(você)</span>}</p>
                  <p className="text-xs text-muted truncate">{m.email}</p>
                </div>
                {m.role === "owner" || m.id === user.id ? (
                  <Badge tone={m.role === "owner" ? "brand" : "neutral"}>{ROLE_LABELS[m.role]}</Badge>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <Select value={m.role} onChange={(e) => handleRole(m, e.target.value as Role)} className="w-auto text-xs">
                      {INVITE_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                    </Select>
                    <button onClick={() => handleRemoveMember(m)} aria-label="Remover membro"
                      className="p-1.5 rounded-lg text-muted hover:text-danger hover:bg-danger-soft"><Trash2 size={15} /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Convites pendentes */}
      <Card className="mt-5">
        <CardHeader title="Convites pendentes" icon={<Link2 size={18} />} subtitle={`${pending.length} aguardando`} />
        {pending.length === 0 ? (
          <EmptyState icon={<UserPlus size={28} />} title="Nenhum convite pendente"
            description="Crie um convite acima e compartilhe o link com a pessoa." />
        ) : (
          <div className="divide-y divide-border">
            {pending.map((i) => (
              <div key={i.id} className="flex items-center gap-3 p-3.5 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{i.email || "Convite por link"}</p>
                  <p className="text-xs text-muted">{ROLE_LABELS[i.role]} • expira {new Date(i.expiresAt).toLocaleDateString("pt-BR")}</p>
                </div>
                <Button size="sm" variant="outline" onClick={() => copy(i.link, i.id)}>
                  {copiedId === i.id ? <><Check size={14} /> Copiado</> : <><Copy size={14} /> Copiar link</>}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleRevoke(i.id)} className="text-danger">
                  <Trash2 size={14} /> Revogar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
