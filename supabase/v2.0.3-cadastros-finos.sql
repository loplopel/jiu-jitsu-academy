-- v2.0.3 - ajustes de cadastro esportivo
-- Adiciona sexo e peso ao professor. Não apaga nem altera cadastros existentes.
alter table if exists public.professor_details add column if not exists sex text;
alter table if exists public.professor_details add column if not exists weight numeric(6,2);
