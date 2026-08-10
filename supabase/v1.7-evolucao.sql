-- v1.7 - evolução esportiva
-- Migração aditiva. Não remove tabelas ou dados financeiros antigos.
create index if not exists attendance_student_checked_idx on public.attendance(student_id, checked_in_at desc);
create index if not exists graduations_student_date_idx on public.graduations(student_id, graduation_date desc);
create index if not exists event_participants_student_idx on public.event_participants(student_id);
create index if not exists iea_scores_student_date_idx on public.iea_scores(student_id, calculated_at desc);

-- Garante que professores e administradores possam registrar histórico esportivo.
drop policy if exists "staff manages graduations" on public.graduations;
create policy "staff manages graduations" on public.graduations for all to authenticated using(public.is_professor()) with check(public.is_professor());

drop policy if exists "iea own or staff" on public.iea_scores;
create policy "iea own or staff" on public.iea_scores for select to authenticated using(student_id=auth.uid() or public.is_professor());
drop policy if exists "staff manages iea" on public.iea_scores;
create policy "staff manages iea" on public.iea_scores for all to authenticated using(public.is_professor()) with check(public.is_professor());
