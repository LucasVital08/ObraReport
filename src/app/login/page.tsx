"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/brand";
import { Button, Card, Field, Input } from "@/components/ui";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { LoginForm } from "@/components/auth-forms";
import { Mail, Lock, HardHat, ShieldCheck } from "lucide-react";

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const login = useStore((s) => s.login);
  const loadDemo = useStore((s) => s.loadDemo);
  const loadDemoClient = useStore((s) => s.loadDemoClient);
  const onboardingComplete = useStore((s) => s.onboardingComplete);
  const [email, setEmail] = React.useState("gestor360@aksenterprise.com.br");
  const [password, setPassword] = React.useState("demo1234");

  React.useEffect(() => {
    if (params.get("demo") === "1") {
      loadDemo();
      router.push("/app");
    }
  }, [params, loadDemo, router]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    login(email);
    router.push(onboardingComplete ? "/app" : "/onboarding");
  }

  function demo() {
    loadDemo();
    router.push("/app");
  }

  function demoClient() {
    loadDemoClient();
    router.push("/app");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-brand-soft/50 to-background">
      <Link href="/" className="mb-8"><Logo size="lg" /></Link>
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-bold text-center">Entrar na sua conta</h1>
        <p className="text-sm text-muted text-center mt-1">Acesse o painel da sua obra</p>
        {isSupabaseEnabled ? (
          <div className="mt-6"><LoginForm /></div>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <Field label="E-mail">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
              </div>
            </Field>
            <Field label="Senha">
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" required />
              </div>
            </Field>
            <div className="text-right">
              <Link href="/recuperar-senha" className="text-sm text-brand hover:underline">Esqueci minha senha</Link>
            </div>
            <Button type="submit" className="w-full" size="lg">Entrar</Button>
          </form>
        )}
        <div className="my-4 flex items-center gap-3 text-xs text-muted">
          <span className="flex-1 h-px bg-border" /> demonstração <span className="flex-1 h-px bg-border" />
        </div>
        <div className="space-y-2">
          <Button variant="outline" className="w-full" onClick={demo}>
            <HardHat size={16} /> Entrar como construtora
          </Button>
          <Button variant="outline" className="w-full" onClick={demoClient}>
            <ShieldCheck size={16} /> Entrar como contratante
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted text-center">
          A construtora lança os RDOs; o contratante acompanha, comenta e aprova.
        </p>
      </Card>
      <p className="mt-6 text-sm text-muted">
        Não tem conta? <Link href="/register" className="text-brand font-medium hover:underline">Criar agora</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted">Carregando…</div>}>
      <LoginInner />
    </Suspense>
  );
}
