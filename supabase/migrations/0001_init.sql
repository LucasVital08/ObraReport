-- ObraReport IA — esquema inicial (multi-empresa) + segurança por linha (RLS).
-- Rode no Supabase: SQL Editor → cole este arquivo → Run.
-- Modelo espelha src/lib/types.ts. Conteúdo rico do RDO fica em JSONB.

create extension if not exists pgcrypto;

-- ===================== Funções de contexto (RLS) =====================
-- SECURITY DEFINER: leem o profile do usuário logado sem cair em recursão de RLS.
create or replace function public.my_company_id() returns uuid
  language sql stable security definer set search_path = public as $$
  select company_id from public.profiles where id = auth.uid()
$$;

create or replace function public.my_role() returns text
  language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.my_client_projects() returns uuid[]
  language sql stable security definer set search_path = public as $$
  select coalesce(client_project_ids, '{}') from public.profiles where id = auth.uid()
$$;

-- updated_at automático
create or replace function public.touch_updated_at() returns trigger
  language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

-- ===================== Tabelas =====================
create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_text text default 'OR',
  brand_color text default '#f4720b',
  plan text not null default 'free' check (plan in ('free','basico','profissional','empresa')),
  document text,
  city text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null default '',
  email text,
  phone text,
  role text not null default 'owner' check (role in ('owner','admin','supervisor','member','client')),
  avatar_color text default '#f4720b',
  client_project_ids uuid[] not null default '{}',
  created_at timestamptz not null default now()
);
create index on public.profiles(company_id);

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'trialing', -- trialing|active|past_due|canceled
  mp_preapproval_id text,
  current_period_end timestamptz,
  trial_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger trg_sub_touch before update on public.subscriptions for each row execute function public.touch_updated_at();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null,
  client text default '',
  address text,
  technical_lead text,
  supervisor text,
  start_date date,
  expected_end_date date,
  real_end_date date,
  status text not null default 'em_andamento',
  budget numeric,
  description text,
  cover_color text default '#f4720b',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.projects(company_id);
create trigger trg_proj_touch before update on public.projects for each row execute function public.touch_updated_at();

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  number int not null default 1,
  date date not null default current_date,
  responsible text default '',
  supervisor text default '',
  arrival text, departure text, weather text, site_condition text,
  executive_summary text default '',
  notes text default '',
  status text not null default 'rascunho',
  create_mode text not null default 'manual',
  raw_input text,
  content jsonb not null default '{}',   -- team, activities, materials, occurrences, pending, etc.
  media jsonb not null default '[]',     -- metadados; arquivos vão para o Storage
  signatures jsonb not null default '[]',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.reports(company_id);
create index on public.reports(project_id);
create trigger trg_report_touch before update on public.reports for each row execute function public.touch_updated_at();

create table public.rdo_comments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  report_id uuid not null references public.reports(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  author_id uuid references auth.users(id),
  author_name text not null,
  author_role text not null default 'member',
  text text not null,
  created_at timestamptz not null default now()
);
create index on public.rdo_comments(report_id);

create table public.expenses (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  report_id uuid references public.reports(id) on delete set null,
  date date not null default current_date,
  category text default 'outros',
  description text default '',
  amount numeric not null default 0,
  payment_method text,
  responsible text,
  has_receipt boolean default false,
  note text,
  created_at timestamptz not null default now()
);
create index on public.expenses(company_id);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null, description text default '',
  assignee text, priority text default 'media', status text default 'a_fazer',
  due_date date, created_at timestamptz not null default now()
);
create index on public.tasks(company_id);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete set null,
  name text not null, role text, phone text, active boolean default true,
  created_at timestamptz not null default now()
);
create index on public.team_members(company_id);

create table public.time_cards (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  member_name text, date date, check_in text, check_out text, break_minutes int default 60, note text,
  created_at timestamptz not null default now()
);
create index on public.time_cards(company_id);

create table public.materials (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null, unit text, quantity_used numeric default 0, quantity_requested numeric default 0,
  supplier text, estimated_value numeric default 0, status text default 'solicitado',
  created_at timestamptz not null default now()
);
create index on public.materials(company_id);

create table public.equipment (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null, type text, responsible text, condition_out text, status text default 'disponivel', pickup_date date,
  created_at timestamptz not null default now()
);
create index on public.equipment(company_id);

create table public.checklists (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null, template text, responsible text, date date, status text default 'aberto',
  items jsonb not null default '[]',
  created_at timestamptz not null default now()
);
create index on public.checklists(company_id);

create table public.incidents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  title text not null, category text, severity text default 'media', description text,
  responsible text, status text default 'aberta', proposed_solution text, resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.incidents(company_id);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  name text not null, type text, phone text, whatsapp text, email text, company_name text,
  created_at timestamptz not null default now()
);
create index on public.contacts(company_id);

create table public.final_reports (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid not null references public.projects(id) on delete cascade,
  generated_at timestamptz not null default now(),
  executive_summary text, technical_conclusion text,
  recommendations jsonb default '[]', options jsonb default '{}',
  created_at timestamptz not null default now()
);
create index on public.final_reports(company_id);

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  name text not null, mime_type text, size bigint default 0, storage_path text,
  uploaded_at timestamptz not null default now()
);
create index on public.documents(company_id);

-- ===================== RLS =====================
alter table public.companies      enable row level security;
alter table public.profiles       enable row level security;
alter table public.subscriptions  enable row level security;
alter table public.projects       enable row level security;
alter table public.reports        enable row level security;
alter table public.rdo_comments   enable row level security;
alter table public.expenses       enable row level security;
alter table public.tasks          enable row level security;
alter table public.team_members   enable row level security;
alter table public.time_cards     enable row level security;
alter table public.materials      enable row level security;
alter table public.equipment      enable row level security;
alter table public.checklists     enable row level security;
alter table public.incidents      enable row level security;
alter table public.contacts       enable row level security;
alter table public.final_reports  enable row level security;
alter table public.documents      enable row level security;

-- companies / profiles / subscriptions
create policy company_member_read on public.companies for select using (id = public.my_company_id());
create policy company_admin_update on public.companies for update using (id = public.my_company_id() and public.my_role() in ('owner','admin'));

create policy profile_self_or_company on public.profiles for select using (company_id = public.my_company_id());
create policy profile_self_update on public.profiles for update using (id = auth.uid());
create policy profile_admin_manage on public.profiles for all using (company_id = public.my_company_id() and public.my_role() in ('owner','admin'))
  with check (company_id = public.my_company_id() and public.my_role() in ('owner','admin'));

create policy sub_company_read on public.subscriptions for select using (company_id = public.my_company_id());

-- projects: membros internos = tudo da empresa; contratante (client) = só as obras dele
create policy proj_members_all on public.projects for all
  using (company_id = public.my_company_id() and public.my_role() <> 'client')
  with check (company_id = public.my_company_id() and public.my_role() <> 'client');
create policy proj_client_read on public.projects for select
  using (company_id = public.my_company_id() and public.my_role() = 'client' and id = any(public.my_client_projects()));

-- reports
create policy report_members_all on public.reports for all
  using (company_id = public.my_company_id() and public.my_role() <> 'client')
  with check (company_id = public.my_company_id() and public.my_role() <> 'client');
create policy report_client_read on public.reports for select
  using (company_id = public.my_company_id() and public.my_role() = 'client' and project_id = any(public.my_client_projects()));
-- contratante pode aprovar/assinar (atualizar) RDOs das obras dele
create policy report_client_update on public.reports for update
  using (company_id = public.my_company_id() and public.my_role() = 'client' and project_id = any(public.my_client_projects()))
  with check (company_id = public.my_company_id());

-- rdo_comments: membros = tudo; contratante = ler e comentar nas obras dele
create policy comment_members_all on public.rdo_comments for all
  using (company_id = public.my_company_id() and public.my_role() <> 'client')
  with check (company_id = public.my_company_id());
create policy comment_client_read on public.rdo_comments for select
  using (company_id = public.my_company_id() and public.my_role() = 'client' and project_id = any(public.my_client_projects()));
create policy comment_client_insert on public.rdo_comments for insert
  with check (company_id = public.my_company_id() and public.my_role() = 'client' and project_id = any(public.my_client_projects()));

-- Demais tabelas operacionais: acesso interno por empresa; contratante só leitura
-- das que pertencem às obras dele (expenses/incidents). As outras ficam internas.
create policy exp_members_all on public.expenses for all
  using (company_id = public.my_company_id() and public.my_role() <> 'client')
  with check (company_id = public.my_company_id() and public.my_role() <> 'client');

do $$
declare t text;
begin
  foreach t in array array['tasks','team_members','time_cards','materials','equipment','checklists','incidents','contacts','final_reports','documents']
  loop
    execute format($f$
      create policy %1$s_members_all on public.%1$s for all
      using (company_id = public.my_company_id() and public.my_role() <> 'client')
      with check (company_id = public.my_company_id() and public.my_role() <> 'client');
    $f$, t);
  end loop;
end $$;

-- ===================== Cadastro automático (signup) =====================
-- Ao criar um usuário: se vier company_id nos metadados, vincula a essa empresa
-- (fluxo de convite); senão, cria uma empresa nova com o usuário como owner.
create or replace function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $$
declare cid uuid;
begin
  cid := nullif(new.raw_user_meta_data->>'company_id','')::uuid;
  if cid is null then
    insert into public.companies(name, logo_text)
    values (coalesce(new.raw_user_meta_data->>'company_name','Minha empresa'),
            upper(left(coalesce(new.raw_user_meta_data->>'company_name','OR'),2)))
    returning id into cid;
    insert into public.subscriptions(company_id, plan, status, trial_end)
    values (cid, 'free', 'trialing', now() + interval '14 days');
  end if;
  insert into public.profiles(id, company_id, name, email, phone, role)
  values (new.id, cid,
          coalesce(new.raw_user_meta_data->>'name', split_part(coalesce(new.email,''),'@',1)),
          new.email, new.phone,
          coalesce(new.raw_user_meta_data->>'role','owner'));
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ===================== Storage (fotos e documentos) =====================
insert into storage.buckets (id, name, public) values ('rdo-media','rdo-media', false) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('documents','documents', false) on conflict do nothing;

-- Caminho dos arquivos começa com o company_id: ex. "<company_id>/<...>"
create policy media_company_rw on storage.objects for all
  using (bucket_id in ('rdo-media','documents') and (storage.foldername(name))[1] = public.my_company_id()::text)
  with check (bucket_id in ('rdo-media','documents') and (storage.foldername(name))[1] = public.my_company_id()::text);
