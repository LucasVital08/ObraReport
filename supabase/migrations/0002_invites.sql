-- ObraReport IA — Convites de equipe e contratantes (Fase 8).
-- Rode no Supabase APÓS o 0001: SQL Editor → cole → Run.
-- Fluxo: owner/admin cria um convite (gera token/link). O convidado abre
-- /convite/<token>, entra/cria conta e chama accept_invite(), que move o
-- perfil dele para a empresa convidante com o papel definido.

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  email text,
  role text not null default 'member' check (role in ('admin','supervisor','member','client')),
  client_project_ids uuid[] not null default '{}',
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  invited_by uuid references auth.users(id),
  status text not null default 'pending' check (status in ('pending','accepted','revoked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id)
);
create index if not exists invites_company_idx on public.invites(company_id);
create index if not exists invites_token_idx on public.invites(token);

alter table public.invites enable row level security;

-- Owner/admin da empresa gerenciam (CRUD) os convites da própria empresa.
drop policy if exists invite_admin_manage on public.invites;
create policy invite_admin_manage on public.invites for all
  using (company_id = public.my_company_id() and public.my_role() in ('owner','admin'))
  with check (company_id = public.my_company_id() and public.my_role() in ('owner','admin'));

-- Lê os dados públicos de um convite por token (para a tela de aceite, mesmo
-- sem ser membro da empresa). SECURITY DEFINER evita expor a tabela inteira.
create or replace function public.get_invite(invite_token text)
returns table (company_id uuid, company_name text, role text, email text, status text, expired boolean)
language sql stable security definer set search_path = public as $$
  select i.company_id, c.name, i.role, i.email, i.status,
         (i.expires_at is not null and i.expires_at < now()) as expired
  from public.invites i
  join public.companies c on c.id = i.company_id
  where i.token = invite_token
$$;
grant execute on function public.get_invite(text) to anon, authenticated;

-- Aceita o convite: roda como o usuário logado (auth.uid()). Move o perfil para
-- a empresa convidante, aplica o papel e remove a empresa antiga se ficou órfã.
create or replace function public.accept_invite(invite_token text)
returns void language plpgsql security definer set search_path = public as $$
declare inv record; old_company uuid;
begin
  if auth.uid() is null then raise exception 'Faça login para aceitar o convite'; end if;

  select * into inv from public.invites
    where token = invite_token and status = 'pending'
      and (expires_at is null or expires_at > now());
  if inv is null then raise exception 'Convite inválido, já usado ou expirado'; end if;

  select company_id into old_company from public.profiles where id = auth.uid();

  update public.profiles
    set company_id = inv.company_id,
        role = inv.role,
        client_project_ids = coalesce(inv.client_project_ids, '{}')
    where id = auth.uid();

  update public.invites
    set status = 'accepted', accepted_at = now(), accepted_by = auth.uid()
    where id = inv.id;

  if old_company is not null and old_company <> inv.company_id
     and not exists (select 1 from public.profiles where company_id = old_company) then
    delete from public.companies where id = old_company;
  end if;
end $$;
grant execute on function public.accept_invite(text) to authenticated;
