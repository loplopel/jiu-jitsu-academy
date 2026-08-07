-- JIU-JITSU ACADEMY v1.3 - ALUNOS COMPLETOS
-- Migração aditiva: não apaga alunos, professores, planos ou qualquer dado existente.

alter table public.students add column if not exists whatsapp text;
alter table public.students add column if not exists emergency_name text;
alter table public.students add column if not exists emergency_phone text;
alter table public.students add column if not exists emergency_relation text;

-- Permite até 6 graus para faixas avançadas, preservando os valores existentes.
alter table public.students drop constraint if exists students_degrees_check;
alter table public.students add constraint students_degrees_check check (degrees between 0 and 6);

-- Bucket público apenas para imagens de perfil. Uploads no app são feitos somente pela API protegida do servidor.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('student-photos','student-photos',true,4194304,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=true,file_size_limit=4194304,allowed_mime_types=array['image/jpeg','image/png','image/webp'];

create index if not exists students_status_idx on public.students(status);
create index if not exists students_professor_idx on public.students(responsible_professor_id);
create index if not exists students_plan_idx on public.students(plan_id);
create index if not exists students_belt_idx on public.students(belt_id);
