-- ObraReport IA — Visibilidade do RDO para o contratante (Fase: feedback do dono).
-- Rode no Supabase APÓS o 0001/0002: SQL Editor → cole → Run.
-- Guarda, por empresa, quais seções do RDO o contratante (role "client") enxerga.
-- Formato (JSON): { "equipe": bool, "ocorrencias": bool, "pendencias": bool, "gastos": bool }
-- Quando nulo, o app aplica o padrão seguro (esconde equipe, pendências e gastos).

alter table public.companies add column if not exists client_visibility jsonb;
