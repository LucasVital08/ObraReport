"use client";

import React from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export function PageHeader({ title, description, action, backHref }: {
  title: string; description?: string; action?: React.ReactNode; backHref?: string;
}) {
  return (
    <div className="mb-5">
      {backHref && (
        <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-2">
          <ChevronLeft size={16} /> Voltar
        </Link>
      )}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-muted mt-1">{description}</p>}
        </div>
        {action}
      </div>
    </div>
  );
}
