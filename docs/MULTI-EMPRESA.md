# Multi-empresa + acesso por obra (redesenho)

> Em desenvolvimento na branch **`claude/multi-empresa`** — NÃO está em produção.
> Objetivo: um perfil em várias empresas; obras pertencem a empresas; pessoas com
> acesso à empresa inteira (gestor) ou só a obras específicas (view/edit).

## Modelo
- **memberships** (`user_id`, `company_id`, `role`): vínculo perfil↔empresa. Um
  usuário tem N memberships. `role` ∈ owner/admin/supervisor/member = acesso a
  TODAS as obras daquela empresa (edita).
- **project_members** (`project_id`, `user_id`, `permission`): acesso a UMA obra.
  `permission` = `view` (acompanha) ou `edit` (edita/cria RDO só nela). É o caso do
  terceiro que libera só uma obra para você.
- Acesso a uma obra = é membro da empresa dona **OU** tem project_member na obra.

## Estado / etapas
1. **Banco (feito):** `supabase/migrations/0005_multi_company.sql` cria as tabelas,
   helpers `SECURITY DEFINER` (`my_company_ids`, `company_role`, `is_company_member`,
   `can_view_project`, `can_edit_project`) e policies ADITIVAS (as antigas seguem
   valendo → transição sem quebra). Backfill: perfis internos → memberships;
   contratantes → project_members `view`.
2. **Tipos (feito):** `Membership`, `ProjectMember`, `CompanyRole`,
   `ProjectPermission` em `src/lib/types.ts`.
3. **Cliente (a fazer):**
   - Store: lista de empresas do usuário + `activeCompanyId` (empresa ativa) +
     seletor de empresa na topbar.
   - `useAuthSync`: carregar memberships; definir empresa ativa.
   - `useDataSync`/repo: carregar dados da empresa ativa **e** das obras com
     project_member; mappers para memberships/project_members.
   - **Convites**: ao convidar, escolher "acesso à empresa" (role) **ou** "acesso a
     esta obra" (view/edit) → grava membership ou project_member.
   - **Obra → Membros**: listar/added/remover membros da obra (view/edit).
   - Guards de UI por `company_role`/`can_edit_project`.
4. **Migração de dados real:** rodar o 0005 no Supabase, validar, e então trocar as
   leituras do cliente de `profiles.company_id` (single) para memberships.

## Princípio
Tudo aditivo e atrás de flag/branch até validar — produção (`main`) segue no modelo
atual (1 empresa) e funcionando, sem risco durante o redesenho.
