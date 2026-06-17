-- ObraReport IA — Multi-empresa + acesso por obra (REDESENHO, em desenvolvimento).
-- Branch: claude/multi-empresa. NÃO rode em produção ainda — revise antes.
-- Objetivo:
--   • Um perfil pode pertencer a VÁRIAS empresas  -> tabela public.memberships
--   • Acesso a UMA obra específica (view/edit)     -> tabela public.project_members
-- Estratégia: ADITIVA. Cria tabelas, helpers (SECURITY DEFINER, sem recursão de
-- RLS) e novas policies PERMISSIVAS. As policies antigas (single-company) seguem
-- valendo, então nada quebra durante a transição.

create extension if not exists pgcrypto;

-- ===================== Tabelas =====================
create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','supervisor','member')),
  created_at timestamptz not null default now(),
  unique (user_id, company_id)
);
create index if not exists memberships_user_idx on public.memberships(user_id);
create index if not exists memberships_company_idx on public.memberships(company_id);

create table if not exists public.project_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  permission text not null default 'view' check (permission in ('view','edit')),
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);
create index if not exists project_members_user_idx on public.project_members(user_id);
create index if not exists project_members_project_idx on public.project_members(project_id);

-- ===================== Backfill (a partir do modelo atual) =====================
-- Perfis internos viram memberships da empresa atual.
insert into public.memberships (user_id, company_id, role)
  select id, company_id, role from public.profiles
  where company_id is not null and role in ('owner','admin','supervisor','member')
  on conflict (user_id, company_id) do nothing;

-- Contratantes (role client) viram project_members "view" das obras liberadas.
insert into public.project_members (company_id, project_id, user_id, permission)
  select p.company_id, pid, p.id, 'view'
  from public.profiles p, unnest(coalesce(p.client_project_ids, '{}')) as pid
  where p.role = 'client'
  on conflict (project_id, user_id) do nothing;

-- ===================== Helpers (SECURITY DEFINER => sem recursão) =====================
create or replace function public.my_company_ids() returns setof uuid
  language sql stable security definer set search_path = public as $$
  select company_id from public.memberships where user_id = auth.uid()
$$;

create or replace function public.company_role(cid uuid) returns text
  language sql stable security definer set search_path = public as $$
  select role from public.memberships where user_id = auth.uid() and company_id = cid
$$;

create or replace function public.is_company_member(cid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.memberships where user_id = auth.uid() and company_id = cid)
$$;

create or replace function public.can_edit_project(pid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.projects pr
    join public.memberships m on m.company_id = pr.company_id and m.user_id = auth.uid()
    where pr.id = pid
  ) or exists (
    select 1 from public.project_members pm
    where pm.project_id = pid and pm.user_id = auth.uid() and pm.permission = 'edit'
  )
$$;

create or replace function public.can_view_project(pid uuid) returns boolean
  language sql stable security definer set search_path = public as $$
  select public.can_edit_project(pid) or exists (
    select 1 from public.project_members pm
    where pm.project_id = pid and pm.user_id = auth.uid()
  )
$$;

-- ===================== RLS das novas tabelas =====================
alter table public.memberships enable row level security;
alter table public.project_members enable row level security;

drop policy if exists mem_read on public.memberships;
create policy mem_read on public.memberships for select
  using (user_id = auth.uid() or public.is_company_member(company_id));

drop policy if exists mem_admin on public.memberships;
create policy mem_admin on public.memberships for all
  using (public.company_role(company_id) in ('owner','admin'))
  with check (public.company_role(company_id) in ('owner','admin'));

drop policy if exists pm_read on public.project_members;
create policy pm_read on public.project_members for select
  using (user_id = auth.uid() or public.is_company_member(company_id));

drop policy if exists pm_manage on public.project_members;
create policy pm_manage on public.project_members for all
  using (public.company_role(company_id) in ('owner','admin','supervisor'))
  with check (public.company_role(company_id) in ('owner','admin','supervisor'));

-- ===================== Policies ADITIVAS (multi-empresa + obra) =====================
-- Projetos: membro de QUALQUER empresa do usuário vê/edita as obras dela;
-- e quem tem acesso por obra vê (view) ou edita (edit) aquela obra.
drop policy if exists proj_membership_all on public.projects;
create policy proj_membership_all on public.projects for all
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

drop policy if exists proj_member_view on public.projects;
create policy proj_member_view on public.projects for select using (public.can_view_project(id));

drop policy if exists proj_member_edit on public.projects;
create policy proj_member_edit on public.projects for update
  using (public.can_edit_project(id)) with check (public.can_edit_project(id));

-- Relatórios (RDO): mesma lógica, por obra.
drop policy if exists report_membership_all on public.reports;
create policy report_membership_all on public.reports for all
  using (public.is_company_member(company_id))
  with check (public.is_company_member(company_id));

drop policy if exists report_member_view on public.reports;
create policy report_member_view on public.reports for select using (public.can_view_project(project_id));

drop policy if exists report_member_write on public.reports;
create policy report_member_write on public.reports for all
  using (public.can_edit_project(project_id)) with check (public.can_edit_project(project_id));

-- NOTA: as demais tabelas (tasks, materiais, etc.) seguem nas policies atuais por
-- enquanto; serão estendidas conforme o cliente passar a usar memberships.
