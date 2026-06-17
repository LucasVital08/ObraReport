"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStore, useHydrated } from "@/lib/store";
import { useAuthSync } from "@/lib/supabase/useAuthSync";
import { useDataSync } from "@/lib/data/useDataSync";
import { isSupabaseEnabled } from "@/lib/supabase/config";
import { signOutSupabase } from "@/lib/supabase/auth";
import { Logo, Avatar } from "@/components/brand";
import { PwaLayer } from "@/components/pwa";
import { cn } from "@/lib/utils";
import { ROLE_LABELS } from "@/lib/types";
import {
  LayoutDashboard, Building2, FileText, Images, ListChecks, Users, Clock,
  Package, Wrench, ClipboardCheck, AlertTriangle, Wallet, BarChart3,
  Contact as ContactIcon, CreditCard, Settings, Shield,
  Plus, Menu, X, LogOut, Moon, Sun, Sparkles, UserPlus,
} from "lucide-react";

interface NavItem { href: string; label: string; icon: React.ElementType; roles?: string[]; }

const NAV: { group: string; items: NavItem[] }[] = [
  {
    group: "Principal",
    items: [
      { href: "/app", label: "Dashboard", icon: LayoutDashboard },
      { href: "/app/obras", label: "Obras", icon: Building2 },
      { href: "/app/relatorios", label: "Relatórios", icon: FileText },
      { href: "/app/insights", label: "Insights", icon: BarChart3 },
    ],
  },
  {
    group: "Execução",
    items: [
      { href: "/app/tarefas", label: "Tarefas", icon: ListChecks },
      { href: "/app/equipe", label: "Equipe", icon: Users },
      { href: "/app/ponto", label: "Cartão de ponto", icon: Clock },
      { href: "/app/fotos", label: "Fotos e vídeos", icon: Images },
      { href: "/app/checklists", label: "Checklists", icon: ClipboardCheck },
      { href: "/app/ocorrencias", label: "Ocorrências", icon: AlertTriangle },
    ],
  },
  {
    group: "Recursos",
    items: [
      { href: "/app/materiais", label: "Materiais", icon: Package },
      { href: "/app/equipamentos", label: "Equipamentos", icon: Wrench },
      { href: "/app/gastos", label: "Gastos", icon: Wallet },
      { href: "/app/contatos", label: "Contatos", icon: ContactIcon },
    ],
  },
  {
    group: "Conta",
    items: [
      { href: "/app/acessos", label: "Equipe & acessos", icon: UserPlus, roles: ["owner", "admin"] },
      { href: "/app/planos", label: "Planos", icon: CreditCard },
      { href: "/app/config", label: "Configurações", icon: Settings },
      { href: "/app/admin", label: "Painel admin", icon: Shield },
    ],
  },
];

const BOTTOM_NAV = [
  { href: "/app", label: "Início", icon: LayoutDashboard },
  { href: "/app/obras", label: "Obras", icon: Building2 },
  { href: "__rdo__", label: "Criar RDO", icon: Plus },
  { href: "/app/fotos", label: "Fotos", icon: Images },
  { href: "__more__", label: "Mais", icon: Menu },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const hydrated = useHydrated();
  const isAuth = useStore((s) => s.isAuthenticated);
  const onboardingComplete = useStore((s) => s.onboardingComplete);
  const company = useStore((s) => s.company);
  const user = useStore((s) => s.user);
  const theme = useStore((s) => s.theme);
  const setTheme = useStore((s) => s.setTheme);
  const logout = useStore((s) => s.logout);
  const [moreOpen, setMoreOpen] = React.useState(false);
  // Modo produção: sincroniza a sessão real do Supabase com o store.
  const { ready: authReady } = useAuthSync();
  useDataSync(); // carrega os dados da empresa do Supabase (modo produção)
  const booting = !hydrated || (isSupabaseEnabled && !authReady);

  // Guarda de rota
  React.useEffect(() => {
    if (booting) return;
    if (!isAuth) router.replace("/login");
    else if (!onboardingComplete) router.replace("/onboarding");
  }, [booting, isAuth, onboardingComplete, router]);

  React.useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  async function handleLogout() {
    if (isSupabaseEnabled) await signOutSupabase();
    logout();
    router.replace("/login");
  }

  if (booting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Carregando…</div>
      </div>
    );
  }
  if (!isAuth || !onboardingComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted">Redirecionando…</div>
      </div>
    );
  }

  // O app é sempre completo: a restrição de "não editar" é por obra (contratante),
  // nunca um corte global de navegação. Todos têm acesso a todos os módulos.
  const nav = NAV;
  const bottomNav = BOTTOM_NAV;

  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <div className="min-h-screen flex">
      <PwaLayer />
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-border bg-surface fixed inset-y-0 left-0 z-30">
        <div className="p-4 border-b border-border">
          <Link href="/app"><Logo /></Link>
        </div>
        <nav className="flex-1 overflow-y-auto p-3 space-y-5">
          {nav.map((group) => (
            <div key={group.group}>
              <p className="px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{group.group}</p>
              <div className="space-y-0.5">
                {group.items.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        isActive(item.href)
                          ? "bg-brand-soft text-brand-dark"
                          : "text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      <Icon size={18} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="p-3 border-t border-border">
          <Link href="/app/rdo/novo"
            className="flex items-center justify-center gap-2 rounded-xl bg-brand text-white py-2.5 text-sm font-semibold hover:bg-brand-dark transition-colors">
            <Sparkles size={16} /> Criar RDO com IA
          </Link>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-20 border-b border-border bg-surface/90 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 h-14">
            <div className="lg:hidden"><Link href="/app"><Logo showText={false} /></Link></div>
            <div className="hidden lg:flex items-center gap-2 min-w-0">
              <Building2 size={16} className="text-muted shrink-0" />
              <span className="text-sm text-muted truncate">{company.name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10"
                aria-label="Alternar tema"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <div className="flex items-center gap-2 pl-1">
                <Avatar name={user.name} color={user.avatarColor} size={32} />
                <div className="hidden sm:block leading-tight">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted">{ROLE_LABELS[user.role]}</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 min-w-0 p-4 sm:p-6 pb-24 lg:pb-6 max-w-6xl w-full mx-auto">{children}</main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
        <div className="grid items-end h-16 px-1 grid-cols-5">
          {bottomNav.map((item) => {
            const Icon = item.icon;
            if (item.href === "__rdo__") {
              return (
                <Link key="rdo" href="/app/rdo/novo" className="flex flex-col items-center -mt-6">
                  <span className="h-14 w-14 rounded-full bg-brand text-white flex items-center justify-center shadow-lg shadow-brand/30">
                    <Plus size={28} />
                  </span>
                  <span className="text-[10px] text-brand font-semibold mt-0.5">RDO</span>
                </Link>
              );
            }
            if (item.href === "__more__") {
              return (
                <button key="more" onClick={() => setMoreOpen(true)} className="flex flex-col items-center gap-0.5 py-2 text-muted">
                  <Icon size={22} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </button>
              );
            }
            return (
              <Link key={item.href} href={item.href}
                className={cn("flex flex-col items-center gap-0.5 py-2", isActive(item.href) ? "text-brand" : "text-muted")}>
                <Icon size={22} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile "Mais" sheet */}
      {moreOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMoreOpen(false)} />
          <div className="relative z-10 w-full bg-surface rounded-t-2xl border-t border-border max-h-[80vh] overflow-y-auto animate-fade-up">
            <div className="flex items-center justify-between p-4 border-b border-border sticky top-0 bg-surface">
              <span className="font-semibold">Menu completo</span>
              <button onClick={() => setMoreOpen(false)} className="p-1 text-muted"><X size={20} /></button>
            </div>
            <div className="p-4 space-y-5">
              {nav.map((group) => (
                <div key={group.group}>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{group.group}</p>
                  <div className="grid grid-cols-3 gap-2">
                    {group.items.filter((item) => !item.roles || item.roles.includes(user.role)).map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link key={item.href} href={item.href} onClick={() => setMoreOpen(false)}
                          className={cn("flex flex-col items-center gap-1.5 rounded-xl border border-border p-3 text-center",
                            isActive(item.href) ? "bg-brand-soft text-brand-dark border-brand/30" : "text-foreground")}>
                          <Icon size={20} />
                          <span className="text-xs font-medium leading-tight">{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <button onClick={() => { setMoreOpen(false); handleLogout(); }}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-medium text-danger">
                <LogOut size={16} /> Sair da conta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
