-- JIU-JITSU ACADEMY v1.4 - AULAS, RESERVAS E QR
-- Migração aditiva e segura: não apaga nenhum cadastro existente.

create index if not exists classes_starts_at_idx on public.classes(starts_at);
create index if not exists classes_professor_idx on public.classes(professor_id);
create index if not exists reservations_class_status_idx on public.reservations(class_id,status);
create index if not exists reservations_student_idx on public.reservations(student_id);
create index if not exists attendance_class_idx on public.attendance(class_id);
create index if not exists attendance_student_idx on public.attendance(student_id);
create index if not exists qr_tokens_class_idx on public.qr_tokens(class_id,expires_at);

-- Limpa tokens antigos/expirados de forma opcional quando esta função for chamada.
create or replace function public.cleanup_expired_qr_tokens()
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare deleted_count integer;
begin
  delete from public.qr_tokens
  where expires_at < now() - interval '1 day';
  get diagnostics deleted_count = row_count;
  return deleted_count;
end;
$$;

-- Mantém a leitura de aulas disponível aos usuários autenticados.
drop policy if exists "classes visible authenticated" on public.classes;
create policy "classes visible authenticated" on public.classes for select to authenticated using(true);

-- Reserva permanece restrita ao próprio aluno; APIs do servidor fazem as validações de capacidade/status.
drop policy if exists "reservations own read" on public.reservations;
create policy "reservations own read" on public.reservations for select to authenticated using(student_id=auth.uid() or public.is_professor());
