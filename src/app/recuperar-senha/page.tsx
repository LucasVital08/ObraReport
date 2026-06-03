"use client";

import React from "react";
import Link from "next/link";
import { Logo } from "@/components/brand";
import { Button, Card, Field, Input } from "@/components/ui";
import { Mail, CheckCircle2 } from "lucide-react";

export default function RecoverPage() {
  const [sent, setSent] = React.useState(false);
  const [email, setEmail] = React.useState("");
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-brand-soft/50 to-background">
      <Link href="/" className="mb-8"><Logo size="lg" /></Link>
      <Card className="w-full max-w-sm p-6">
        {sent ? (
          <div className="text-center">
            <CheckCircle2 size={40} className="mx-auto text-success mb-3" />
            <h1 className="text-xl font-bold">Verifique seu e-mail</h1>
            <p className="text-sm text-muted mt-2">
              Se houver uma conta para <strong>{email}</strong>, enviamos um link para redefinir a senha.
            </p>
            <Link href="/login"><Button variant="outline" className="w-full mt-5">Voltar ao login</Button></Link>
          </div>
        ) : (
          <>
            <h1 className="text-xl font-bold text-center">Recuperar senha</h1>
            <p className="text-sm text-muted text-center mt-1">Enviaremos um link de redefinição</p>
            <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="mt-6 space-y-4">
              <Field label="E-mail da conta">
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" required />
                </div>
              </Field>
              <Button type="submit" className="w-full" size="lg">Enviar link de recuperação</Button>
            </form>
            <p className="mt-4 text-sm text-muted text-center">
              <Link href="/login" className="text-brand hover:underline">Voltar ao login</Link>
            </p>
          </>
        )}
      </Card>
    </div>
  );
}
