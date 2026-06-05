"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";
import { signInEmail, signUpEmail, signInGoogle, sendPhoneOtp, verifyPhoneOtp } from "@/lib/supabase/auth";
import { Mail, Lock, User, Building2, Phone, KeyRound } from "lucide-react";

function GoogleButton({ label }: { label: string }) {
  const [busy, setBusy] = React.useState(false);
  return (
    <Button variant="outline" className="w-full" disabled={busy}
      onClick={async () => { setBusy(true); try { await signInGoogle(); } catch { setBusy(false); } }}>
      <span className="font-bold text-[15px]">G</span> {label}
    </Button>
  );
}

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = React.useState<"email" | "phone">("email");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [otp, setOtp] = React.useState("");
  const [otpSent, setOtpSent] = React.useState(false);
  const [err, setErr] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function loginEmail(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const { error } = await signInEmail(email, password);
    setBusy(false);
    if (error) setErr(error.message); else router.push("/app");
  }
  async function sendCode() {
    setErr(""); setBusy(true);
    const { error } = await sendPhoneOtp(phone);
    setBusy(false);
    if (error) setErr(error.message); else setOtpSent(true);
  }
  async function confirmCode() {
    setErr(""); setBusy(true);
    const { error } = await verifyPhoneOtp(phone, otp);
    setBusy(false);
    if (error) setErr(error.message); else router.push("/app");
  }

  return (
    <div>
      {err && <div className="mb-3 rounded-lg bg-danger-soft text-danger text-sm px-3 py-2">{err}</div>}
      {mode === "email" ? (
        <form onSubmit={loginEmail} className="space-y-4">
          <Field label="E-mail">
            <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required /></div>
          </Field>
          <Field label="Senha">
            <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required /></div>
          </Field>
          <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Entrando…" : "Entrar"}</Button>
        </form>
      ) : (
        <div className="space-y-4">
          <Field label="Telefone (com DDD)">
            <div className="relative"><Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="pl-9" placeholder="+55 27 99999-9999" disabled={otpSent} /></div>
          </Field>
          {otpSent && (
            <Field label="Código recebido por SMS">
              <div className="relative"><KeyRound size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input value={otp} onChange={(e) => setOtp(e.target.value)} className="pl-9" placeholder="123456" /></div>
            </Field>
          )}
          {otpSent
            ? <Button className="w-full" size="lg" disabled={busy} onClick={confirmCode}>{busy ? "Verificando…" : "Confirmar código"}</Button>
            : <Button className="w-full" size="lg" disabled={busy || !phone} onClick={sendCode}>{busy ? "Enviando…" : "Receber código por SMS"}</Button>}
        </div>
      )}

      <div className="my-4 flex items-center gap-3 text-xs text-muted"><span className="flex-1 h-px bg-border" /> ou <span className="flex-1 h-px bg-border" /></div>
      <div className="space-y-2">
        <GoogleButton label="Entrar com Google" />
        <Button variant="ghost" className="w-full" onClick={() => { setMode(mode === "email" ? "phone" : "email"); setErr(""); }}>
          {mode === "email" ? "Entrar por telefone (SMS)" : "Entrar por e-mail e senha"}
        </Button>
      </div>
    </div>
  );
}

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [err, setErr] = React.useState("");
  const [okMsg, setOkMsg] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    const { data, error } = await signUpEmail({ name, companyName: company, email, password });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    if (data.session) router.push("/app");
    else setOkMsg("Conta criada! Confirme o e-mail que enviamos para ativar o acesso.");
  }

  if (okMsg) return <div className="rounded-lg bg-success-soft text-success text-sm px-3 py-3 text-center">{okMsg}</div>;

  return (
    <div>
      {err && <div className="mb-3 rounded-lg bg-danger-soft text-danger text-sm px-3 py-2">{err}</div>}
      <form onSubmit={submit} className="space-y-4">
        <Field label="Seu nome">
          <div className="relative"><User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-9" required /></div>
        </Field>
        <Field label="Nome da empresa">
          <div className="relative"><Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input value={company} onChange={(e) => setCompany(e.target.value)} className="pl-9" required /></div>
        </Field>
        <Field label="E-mail">
          <div className="relative"><Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required /></div>
        </Field>
        <Field label="Senha">
          <div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required minLength={6} /></div>
        </Field>
        <Button type="submit" className="w-full" size="lg" disabled={busy}>{busy ? "Criando…" : "Criar conta e começar"}</Button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-muted"><span className="flex-1 h-px bg-border" /> ou <span className="flex-1 h-px bg-border" /></div>
      <GoogleButton label="Cadastrar com Google" />
    </div>
  );
}
