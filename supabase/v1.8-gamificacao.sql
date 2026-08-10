-- Jiu-Jitsu Academy v1.8 - Gamificação e ranking
-- Aditivo. Não apaga alunos, professores, aulas, presenças ou graduações.

create table if not exists public.gamification_awards (
  id uuid primary key default gen_random_uuid(),
  award_month text not null,
  award_type text not null default 'student_month',
  student_id uuid not null references public.students(id) on delete cascade,
  awarded_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique(award_month,award_type)
);
alter table public.gamification_awards enable row level security;
drop policy if exists "gamification awards visible" on public.gamification_awards;
create policy "gamification awards visible" on public.gamification_awards for select to authenticated using(true);
drop policy if exists "admin manages gamification awards" on public.gamification_awards;
create policy "admin manages gamification awards" on public.gamification_awards for all to authenticated using(public.is_admin()) with check(public.is_admin());

alter table public.achievements enable row level security;
alter table public.student_achievements enable row level security;
drop policy if exists "achievements visible" on public.achievements;
create policy "achievements visible" on public.achievements for select to authenticated using(active=true);
drop policy if exists "student achievements visible" on public.student_achievements;
create policy "student achievements visible" on public.student_achievements for select to authenticated using(student_id=auth.uid() or public.is_professor());

insert into public.achievements(code,name,description,threshold,active) values
('FIRST_CLASS','Primeira aula','Primeiro treino registrado',1,true),
('CLASSES_10','10 aulas','10 treinos concluídos',10,true),
('CLASSES_50','50 aulas','50 treinos concluídos',50,true),
('CLASSES_100','100 aulas','100 treinos concluídos',100,true),
('CLASSES_200','200 aulas','200 treinos concluídos',200,true),
('DAYS_365','365 dias treinando','Um ano entre o primeiro e o treino mais recente',365,true),
('BELT_BLUE','Faixa Azul','Conquistou a faixa azul',null,true),
('BELT_PURPLE','Faixa Roxa','Conquistou a faixa roxa',null,true),
('BELT_BROWN','Faixa Marrom','Conquistou a faixa marrom',null,true),
('BELT_BLACK','Faixa Preta','Conquistou a faixa preta',null,true),
('MAX_STREAK','Maior sequência','Manteve ao menos 8 semanas consecutivas de treino',8,true),
('STUDENT_MONTH','Aluno do mês','Destaque esportivo escolhido pela equipe',null,true)
on conflict (code) do update set name=excluded.name,description=excluded.description,threshold=excluded.threshold,active=true;

grant select on public.achievements to authenticated;
grant select on public.student_achievements to authenticated;
grant select on public.gamification_awards to authenticated;
