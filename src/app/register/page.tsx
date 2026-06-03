"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { Logo } from "@/components/brand";
import { Button, Card, Field, Input } from "@/components/ui";
import { User, Mail, Lock, Building2 } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const register = useStore((s) => s.register);
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [company, setCompany] = React.useState("");
  const [password, setPassword] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    register(name || "Novo usuário", email, company || "Minha Empresa");
    router.push("/onboarding");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-brand-soft/50 to-background">
      <Link href="/" className="mb-8"><Logo size="lg" /></Link>
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-bold text-center">Criar conta grátis</h1>
        <p className="text-sm text-muted text-center mt-1">Comece a documentar sua obra hoje</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          <Field label="Seu nome">
            <div className="relative">
              <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-9" placeholder="Lucas Vital" required />
            </div>
          </Field>
          <Field label="Nome da empresa">
            <div className="relative">
              <Building2 size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input value={company} onChange={(e) => setCompany(e.target.value)} className="pl-9" placeholder="AKS Enterprise" required />
            </div>
          </Field>
          <Field label="E-mail">
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" placeholder="voce@empresa.com.br" required />
            </div>
          </Field>
          <Field label="Senha">
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9" placeholder="Mínimo 6 caracteres" required minLength={6} />
            </div>
          </Field>
          <Button type="submit" className="w-full" size="lg">Criar conta e começar</Button>
        </form>
        <p className="mt-4 text-xs text-muted text-center">
          Ao criar a conta, você concorda com os{" "}
          <Link href="/termos" className="underline">Termos de uso</Link> e a{" "}
          <Link href="/privacidade" className="underline">Política de privacidade</Link>.
        </p>
      </Card>
      <p className="mt-6 text-sm text-muted">
        Já tem conta? <Link href="/login" className="text-brand font-medium hover:underline">Entrar</Link>
      </p>
    </div>
  );
}
