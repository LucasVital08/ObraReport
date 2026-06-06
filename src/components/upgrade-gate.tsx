"use client";

import Link from "next/link";
import { Card, Button } from "@/components/ui";
import { Lock, Sparkles } from "lucide-react";

// Bloco de "limite do plano atingido" reutilizável. Mostra o motivo e leva para
// a página de planos. Usado quando o usuário tenta criar obra/RDO além do limite.
export function UpgradeGate({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="max-w-xl mx-auto p-8 text-center">
      <div className="mx-auto h-14 w-14 rounded-2xl bg-brand-soft text-brand-dark flex items-center justify-center mb-4">
        <Lock size={26} />
      </div>
      <h2 className="text-lg font-bold">{title}</h2>
      <p className="text-sm text-muted mt-1.5 max-w-sm mx-auto">{description}</p>
      <Link href="/app/planos" className="inline-block mt-5">
        <Button><Sparkles size={16} /> Ver planos e fazer upgrade</Button>
      </Link>
    </Card>
  );
}
