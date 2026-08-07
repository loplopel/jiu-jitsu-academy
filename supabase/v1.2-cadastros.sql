-- JIU-JITSU ACADEMY v1.2 - CADASTROS ADMINISTRATIVOS
-- Execute UMA VEZ no Supabase > SQL Editor antes de usar o cadastro completo de professores.

create table if not exists public.professor_details (
  id uuid primary key references public.profiles(id) on delete cascade,
  cpf text unique,
  whatsapp text,
  birth_date date,
  belt_id uuid references public.belts(id),
  degrees int not null default 0 check (degrees between 0 and 6),
  specialty text,
  start_date date default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.professor_details enable row level security;

drop policy if exists "staff reads professor details" on public.professor_details;
create policy "staff reads professor details" on public.professor_details
for select to authenticated using(public.is_professor());

drop policy if exists "admin manages professor details" on public.professor_details;
create policy "admin manages professor details" on public.professor_details
for all to authenticated using(public.is_admin()) with check(public.is_admin());

-- A tabela schedules já existia na v1.1; estas políticas permitem leitura e gestão autenticada.
drop policy if exists "schedules visible authenticated" on public.schedules;
create policy "schedules visible authenticated" on public.schedules
for select to authenticated using(true);

drop policy if exists "admin manages schedules" on public.schedules;
create policy "admin manages schedules" on public.schedules
for all to authenticated using(public.is_admin()) with check(public.is_admin());
