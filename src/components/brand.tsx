"use client";

import { cn } from "@/lib/utils";
import { HardHat } from "lucide-react";

export function Logo({ size = "md", showText = true, className }: {
  size?: "sm" | "md" | "lg"; showText?: boolean; className?: string;
}) {
  const dims = { sm: "h-8 w-8", md: "h-9 w-9", lg: "h-11 w-11" };
  const text = { sm: "text-base", md: "text-lg", lg: "text-2xl" };
  const icon = { sm: 18, md: 20, lg: 26 };
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className={cn("rounded-xl bg-brand flex items-center justify-center text-white shadow-sm", dims[size])}>
        <HardHat size={icon[size]} />
      </div>
      {showText && (
        <span className={cn("font-extrabold tracking-tight text-foreground", text[size])}>
          Obra<span className="text-brand">Report</span>
          <span className="ml-1 text-brand font-black">IA</span>
        </span>
      )}
    </div>
  );
}

export function Avatar({ name, color, size = 36 }: { name: string; color?: string; size?: number }) {
  const init = name
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "").join("");
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-semibold shrink-0"
      style={{ background: color || "#6b7280", width: size, height: size, fontSize: size * 0.38 }}
    >
      {init}
    </div>
  );
}
