-- v2.0.13 — vínculos adicionais de professores por aluno
-- O professor responsável continua sendo o principal para evolução/graduação.
-- Professores adicionais apenas liberam as aulas deles para reserva/check-in.
begin;

create table if not exists public.student_professors (
  student_id uuid not null references public.students(id) on delete cascade,
  professor_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, professor_id)
);

create index if not exists idx_student_professors_professor
  on public.student_professors(professor_id);

create index if not exists idx_student_professors_student
  on public.student_professors(student_id);

alter table public.student_professors enable row level security;

drop policy if exists "student professors read own or staff" on public.student_professors;
create policy "student professors read own or staff"
  on public.student_professors
  for select
  using (
    student_id = auth.uid()
    or public.is_professor()
  );

drop policy if exists "staff manages student professors" on public.student_professors;
create policy "staff manages student professors"
  on public.student_professors
  for all
  using (public.is_professor())
  with check (public.is_professor());

-- Garante que não existam vínculos adicionais apontando para usuários que não são professores.
create or replace function public.validate_student_professor_link()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if not exists (
    select 1
    from public.profiles
    where id = new.professor_id
      and role = 'professor'
      and active = true
  ) then
    raise exception 'O vínculo exige um professor ativo.';
  end if;

  if exists (
    select 1
    from public.students
    where id = new.student_id
      and responsible_professor_id = new.professor_id
  ) then
    raise exception 'O professor responsável já é o professor principal.';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_validate_student_professor_link on public.student_professors;
create trigger trg_validate_student_professor_link
before insert or update on public.student_professors
for each row execute function public.validate_student_professor_link();

commit;

-- Conferência opcional:
-- select sp.student_id, s.responsible_professor_id, sp.professor_id
-- from public.student_professors sp
-- join public.students s on s.id=sp.student_id;
