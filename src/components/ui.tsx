"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

// ---- Button ----
type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "outline";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export function Button({
  children, variant = "primary", size = "md", className, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant; size?: ButtonSize;
}) {
  const variants: Record<ButtonVariant, string> = {
    primary: "bg-brand text-white hover:bg-brand-dark shadow-sm",
    secondary: "bg-graphite text-white hover:opacity-90",
    ghost: "text-foreground hover:bg-black/5 dark:hover:bg-white/10",
    danger: "bg-danger text-white hover:opacity-90",
    success: "bg-success text-white hover:opacity-90",
    outline: "border border-border bg-surface text-foreground hover:bg-black/5 dark:hover:bg-white/5",
  };
  const sizes: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2",
    icon: "h-10 w-10",
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
        variants[variant], sizes[size], className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

// ---- Card ----
export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("rounded-2xl border border-border bg-surface", className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, icon }: {
  title: React.ReactNode; subtitle?: React.ReactNode; action?: React.ReactNode; icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-4 border-b border-border">
      <div className="flex items-start gap-3 min-w-0">
        {icon && <div className="shrink-0 mt-0.5 text-brand">{icon}</div>}
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground truncate">{title}</h3>
          {subtitle && <p className="text-sm text-muted mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

// ---- Badge ----
type Tone = "neutral" | "brand" | "success" | "warning" | "danger" | "info";
export function Badge({ tone = "neutral", children, className }: {
  tone?: Tone; children: React.ReactNode; className?: string;
}) {
  const tones: Record<Tone, string> = {
    neutral: "bg-black/5 text-foreground dark:bg-white/10",
    brand: "bg-brand-soft text-brand-dark",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
  };
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap", tones[tone], className)}>
      {children}
    </span>
  );
}

// ---- Inputs ----
export function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={cn("block text-sm font-medium text-foreground mb-1.5", className)}>{children}</label>;
}

export const inputCls =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputCls, props.className)} {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cn(inputCls, "min-h-24 resize-y", props.className)} {...props} />;
}

export function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select className={cn(inputCls, "appearance-none cursor-pointer", props.className)} {...props}>
      {children}
    </select>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
    </div>
  );
}

// ---- Modal ----
export function Modal({ open, onClose, title, children, footer, wide }: {
  open: boolean; onClose: () => void; title: string;
  children: React.ReactNode; footer?: React.ReactNode; wide?: boolean;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className={cn(
        "relative z-10 w-full bg-surface rounded-t-2xl sm:rounded-2xl border border-border shadow-2xl max-h-[92vh] flex flex-col animate-fade-up",
        wide ? "sm:max-w-2xl" : "sm:max-w-md",
      )}>
        <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
          <h3 className="font-semibold text-lg">{title}</h3>
          <button onClick={onClose} className="text-muted hover:text-foreground p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto">{children}</div>
        {footer && <div className="p-4 border-t border-border shrink-0 flex gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}

// ---- Empty State ----
export function EmptyState({ icon, title, description, action }: {
  icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12 px-4">
      {icon && <div className="mb-3 text-muted/60">{icon}</div>}
      <h3 className="font-semibold text-foreground">{title}</h3>
      {description && <p className="text-sm text-muted mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ---- Stat ----
export function Stat({ label, value, icon, tone = "brand", hint }: {
  label: string; value: React.ReactNode; icon?: React.ReactNode; tone?: Tone; hint?: string;
}) {
  const toneBg: Record<Tone, string> = {
    neutral: "bg-black/5 text-foreground dark:bg-white/10",
    brand: "bg-brand-soft text-brand-dark",
    success: "bg-success-soft text-success",
    warning: "bg-warning-soft text-warning",
    danger: "bg-danger-soft text-danger",
    info: "bg-info-soft text-info",
  };
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted">{label}</span>
        {icon && <div className={cn("rounded-lg p-1.5", toneBg[tone])}>{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold text-foreground">{value}</div>
      {hint && <div className="text-xs text-muted mt-1">{hint}</div>}
    </Card>
  );
}

// ---- Progress ----
export function Progress({ value, tone = "brand" }: { value: number; tone?: "brand" | "success" | "warning" | "danger" }) {
  const colors = { brand: "bg-brand", success: "bg-success", warning: "bg-warning", danger: "bg-danger" };
  return (
    <div className="h-2 w-full rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", colors[tone])} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}

// ---- Tabs ----
export function Tabs({ tabs, active, onChange }: {
  tabs: { id: string; label: string; count?: number }[];
  active: string; onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto no-scrollbar border-b border-border">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn(
            "px-3.5 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition-colors",
            active === t.id
              ? "border-brand text-brand"
              : "border-transparent text-muted hover:text-foreground",
          )}
        >
          {t.label}
          {typeof t.count === "number" && (
            <span className="ml-1.5 text-xs opacity-70">{t.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ---- Toast (simples) ----
export function useToast() {
  const [msg, setMsg] = React.useState<string | null>(null);
  const show = React.useCallback((m: string) => {
    setMsg(m);
    setTimeout(() => setMsg(null), 2600);
  }, []);
  const node = msg ? (
    <div className="fixed bottom-24 sm:bottom-6 left-1/2 -translate-x-1/2 z-[60] animate-fade-up">
      <div className="bg-graphite text-white text-sm px-4 py-2.5 rounded-xl shadow-lg">{msg}</div>
    </div>
  ) : null;
  return { show, node };
}
