"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/client";
import { getInvite, acceptInvite, type InviteInfo } from "@/lib/supabase/invites";
import { signInEmail, signUpEmail } from "@/lib/supabase/auth";
import { Logo } from "@/components/brand";
import { Card, Button, Field, Input, Badge } from "@/components/ui";
import { ROLE_LABELS } from "@/lib/types";
import { Building2, CheckCircle2, AlertTriangle } from "lucide-react";

export default function ConvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = String(params?.token || "");

  const [loading, setLoading] = React.useState(true);
  const [invite, setInvite] = React.useState<InviteInfo | null>(null);
  const [authed, setAuthed] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  // formulário de acesso (quando não logado)
  const [mode, setMode] = React.useState<"login" | "signup">("login");
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [info, setInfo] = React.useState("");

  React.useEffect(() => {
    let active = true;
    (async () => {
      if (!isSupabaseEnabled) { setLoading(false); return; }
      try {
        const sb = createClient();
        const [inv, auth] = await Promise.all([getInvite(token), sb?.auth.getUser()]);
        if (!active) return;
        setInvite(inv);
        setAuthed(Boolean(auth?.data?.user));
        if (inv?.email) setEmail(inv.email);
      } catch (e) {
        if (active) setErr((e as Error).message || "Não foi possível carregar o convite.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [token]);

  async function accept() {
    setBusy(true); setErr("");
    try {
      await acceptInvite(token);
      router.replace("/app");
    } catch (e) {
      setErr((e as Error).message || "Não foi possível aceitar o convite.");
      setBusy(false);
    }
  }

  async function submitAuth() {
    setBusy(true); setErr(""); setInfo("");
    try {
      if (mode === "login") {
        const { data, error } = await signInEmail(email.trim(), password);
        if (error) throw error;
        if (data.session) { await accept(); return; }
      } else {
        const { data, error } = await signUpEmail({
          name: name.trim() || email.split("@")[0], companyName: "Conta pessoal",
          email: email.trim(), password,
        });
        if (error) throw error;
        if (data.session) { await accept(); return; }
        setInfo("Conta criada! Confirme o e-mail que enviamos e volte a abrir este link para entrar na empresa.");
      }
    } catch (e) {
      setErr((e as Error).message || "Falha na autenticação.");
    } finally {
      setBusy(false);
    }
  }

  const invalid = invite && (invite.status !== "pending" || invite.expired);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-brand-soft/40 to-transparent">
      <Card className="w-full max-w-md p-6">
        <div className="flex justify-center mb-4"><Logo /></div>

        {!isSupabaseEnabled ? (
          <Message tone="warn" title="Convites indisponíveis"
            text="Este recurso precisa do backend (Supabase) configurado." />
        ) : loading ? (
          <p className="text-center text-muted py-8">Carregando convite…</p>
        ) : !invite ? (
          <Message tone="warn" title="Convite não encontrado" text="O link pode estar incorreto. Confira com quem te convidou." />
        ) : invalid ? (
          <Message tone="warn" title="Convite indisponível"
            text={invite.expired ? "Este convite expirou. Peça um novo." : "Este convite já foi usado ou foi revogado."} />
        ) : (
          <>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center mb-3">
                <Building2 size={24} />
              </div>
              <h1 className="text-lg font-bold">Convite para {invite.companyName}</h1>
              <p className="text-sm text-muted mt-1">
                Você foi convidado(a) como <Badge tone="brand">{ROLE_LABELS[invite.role]}</Badge>
              </p>
            </div>

            {err && <p className="mt-4 rounded-lg bg-danger-soft text-danger text-sm px-3 py-2">{err}</p>}
            {info && <p className="mt-4 rounded-lg bg-info-soft text-info text-sm px-3 py-2">{info}</p>}

            {authed ? (
              <Button className="w-full mt-5" onClick={accept} disabled={busy}>
                <CheckCircle2 size={16} /> {busy ? "Entrando…" : "Aceitar e entrar na empresa"}
              </Button>
            ) : (
              <div className="mt-5">
                <div className="inline-flex w-full rounded-xl border border-border p-1 text-sm mb-4">
                  <button onClick={() => setMode("login")}
                    className={`flex-1 py-1.5 rounded-lg font-medium ${mode === "login" ? "bg-brand text-white" : "text-muted"}`}>Já tenho conta</button>
                  <button onClick={() => setMode("signup")}
                    className={`flex-1 py-1.5 rounded-lg font-medium ${mode === "signup" ? "bg-brand text-white" : "text-muted"}`}>Criar conta</button>
                </div>
                <div className="space-y-3">
                  {mode === "signup" && (
                    <Field label="Seu nome"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Como devemos te chamar" /></Field>
                  )}
                  <Field label="E-mail"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
                  <Field label="Senha"><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
                  <Button className="w-full" onClick={submitAuth} disabled={busy || !email || !password}>
                    {busy ? "Aguarde…" : mode === "login" ? "Entrar e aceitar" : "Criar conta e aceitar"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        <p className="text-center text-xs text-muted mt-6">
          <Link href="/login" className="hover:underline">Voltar ao login</Link>
        </p>
      </Card>
    </div>
  );
}

function Message({ tone, title, text }: { tone: "warn"; title: string; text: string }) {
  return (
    <div className="text-center py-6">
      <div className="mx-auto h-12 w-12 rounded-2xl bg-warning-soft text-warning flex items-center justify-center mb-3">
        <AlertTriangle size={24} />
      </div>
      <h1 className="text-lg font-bold">{title}</h1>
      <p className="text-sm text-muted mt-1">{text}</p>
    </div>
  );
}
