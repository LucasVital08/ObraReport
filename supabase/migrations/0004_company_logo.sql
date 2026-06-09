-- ObraReport IA — Logo da empresa (sai no PDF e no topo).
-- Rode no Supabase APÓS os anteriores: SQL Editor → cole → Run.
-- Guarda o logo como data URL (base64) ou URL pública.

alter table public.companies add column if not exists logo_url text;
