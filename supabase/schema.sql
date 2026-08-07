-- JIU-JITSU ACADEMY - BANCO COMPLETO
create extension if not exists pgcrypto;
create type public.user_role as enum ('admin','professor','aluno');
create type public.student_status as enum ('ativo','inativo','bloqueado');
create type public.class_status as enum ('open','closed','cancelled');
create type public.payment_status as enum ('pending','paid','overdue','cancelled');

create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 role public.user_role not null default 'aluno', name text not null, email text not null,
 phone text, avatar_url text, active boolean not null default true,
 permissions jsonb not null default '{}'::jsonb, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.belts(id uuid primary key default gen_random_uuid(),name text not null unique,sort_order int not null,minimum_months int default 0);
create table public.categories(id uuid primary key default gen_random_uuid(),name text not null unique,min_weight numeric,max_weight numeric,sex text,age_group text,active boolean default true);
create table public.plans(id uuid primary key default gen_random_uuid(),name text not null,amount numeric(10,2) not null,billing_cycle text not null default 'monthly',class_limit int,active boolean default true,created_at timestamptz default now());
create table public.students(
 id uuid primary key references public.profiles(id) on delete cascade,cpf text unique,birth_date date,sex text,weight numeric(6,2),height numeric(5,2),category_id uuid references public.categories(id),responsible_professor_id uuid references public.profiles(id),start_date date default current_date,belt_id uuid references public.belts(id),degrees int default 0 check(degrees between 0 and 4),last_graduation_date date,training_time_months int default 0,notes text,emergency_contact text,injuries text,plan_id uuid references public.plans(id),status public.student_status default 'ativo'
);
create table public.schedules(id uuid primary key default gen_random_uuid(),name text not null,weekday int not null check(weekday between 0 and 6),start_time time not null,end_time time not null,professor_id uuid references public.profiles(id),capacity int not null default 30,active boolean default true);
create table public.classes(id uuid primary key default gen_random_uuid(),schedule_id uuid references public.schedules(id),title text not null,professor_id uuid not null references public.profiles(id),starts_at timestamptz not null,ends_at timestamptz not null,capacity int not null default 30,status public.class_status default 'open',notes text,created_at timestamptz default now());
create table public.reservations(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes(id) on delete cascade,student_id uuid not null references public.students(id) on delete cascade,status text not null default 'reserved',created_at timestamptz default now(),cancelled_at timestamptz,unique(class_id,student_id));
create table public.qr_tokens(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes(id) on delete cascade,token_hash text not null unique,expires_at timestamptz not null,used_at timestamptz,used_by uuid references public.profiles(id),created_by uuid references public.profiles(id),created_at timestamptz default now());
create table public.attendance(id uuid primary key default gen_random_uuid(),class_id uuid not null references public.classes(id) on delete cascade,student_id uuid not null references public.students(id) on delete cascade,checked_in_at timestamptz not null default now(),confirmed_by uuid references public.profiles(id),ip_address inet,device_info text,latitude numeric(10,7),longitude numeric(10,7),qr_token_id uuid references public.qr_tokens(id),notes text,unique(class_id,student_id));
create table public.graduations(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id),from_belt_id uuid references public.belts(id),to_belt_id uuid not null references public.belts(id),degrees int default 0,graduation_date date not null,professor_id uuid references public.profiles(id),iea_score numeric(5,2),notes text,created_at timestamptz default now());
create table public.events(id uuid primary key default gen_random_uuid(),name text not null,event_type text not null check(event_type in('campeonato','seminario')),starts_at timestamptz not null,ends_at timestamptz,location text,capacity int,description text,status text default 'open',created_at timestamptz default now());
create table public.event_participants(id uuid primary key default gen_random_uuid(),event_id uuid references public.events(id) on delete cascade,student_id uuid references public.students(id) on delete cascade,result text,points int default 0,unique(event_id,student_id));
create table public.monthly_fees(id uuid primary key default gen_random_uuid(),student_id uuid not null references public.students(id),plan_id uuid references public.plans(id),reference_month date not null,due_date date not null,amount numeric(10,2) not null,status public.payment_status default 'pending',paid_at timestamptz,payment_method text,notes text,unique(student_id,reference_month));
create table public.achievements(id uuid primary key default gen_random_uuid(),code text unique not null,name text not null,description text,icon text,threshold int,active boolean default true);
create table public.student_achievements(id uuid primary key default gen_random_uuid(),student_id uuid references public.students(id),achievement_id uuid references public.achievements(id),earned_at timestamptz default now(),unique(student_id,achievement_id));
create table public.iea_scores(id uuid primary key default gen_random_uuid(),student_id uuid references public.students(id),score numeric(5,2) not null,frequency numeric(5,2),streak numeric(5,2),training_time numeric(5,2),events numeric(5,2),competitions numeric(5,2),graduation numeric(5,2),attendance numeric(5,2),calculated_at timestamptz default now());
create table public.notifications(id uuid primary key default gen_random_uuid(),user_id uuid references public.profiles(id) on delete cascade,title text not null,message text not null,kind text not null default 'general',read_at timestamptz,created_at timestamptz default now());

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$ begin insert into public.profiles(id,name,email,role) values(new.id,coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),new.email,'aluno'); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin' and active); $$;
create or replace function public.is_professor() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from profiles where id=auth.uid() and role in('admin','professor') and active); $$;

alter table profiles enable row level security;alter table belts enable row level security;alter table categories enable row level security;alter table plans enable row level security;alter table students enable row level security;alter table schedules enable row level security;alter table classes enable row level security;alter table reservations enable row level security;alter table qr_tokens enable row level security;alter table attendance enable row level security;alter table graduations enable row level security;alter table events enable row level security;alter table event_participants enable row level security;alter table monthly_fees enable row level security;alter table notifications enable row level security;alter table iea_scores enable row level security;
create policy "belts visible" on belts for select to authenticated using(true);create policy "admin manages belts" on belts for all using(is_admin()) with check(is_admin());
create policy "categories visible" on categories for select to authenticated using(true);create policy "admin manages categories" on categories for all using(is_admin()) with check(is_admin());
create policy "plans visible" on plans for select to authenticated using(true);create policy "admin manages plans" on plans for all using(is_admin()) with check(is_admin());
create policy "profiles self or staff" on profiles for select using(id=auth.uid() or is_professor());
create policy "admin manages profiles" on profiles for all using(is_admin()) with check(is_admin());
create policy "staff reads students" on students for select using(id=auth.uid() or is_professor());create policy "staff manages students" on students for all using(is_professor()) with check(is_professor());
create policy "classes visible authenticated" on classes for select to authenticated using(true);create policy "staff manages classes" on classes for all using(is_professor()) with check(is_professor());
create policy "reservations own read" on reservations for select using(student_id=auth.uid() or is_professor());create policy "students reserve own" on reservations for insert with check(student_id=auth.uid());create policy "students update own reservation" on reservations for update using(student_id=auth.uid() or is_professor());
create policy "qr staff only" on qr_tokens for select using(is_professor());create policy "qr staff create" on qr_tokens for insert with check(is_professor());create policy "qr staff update" on qr_tokens for update using(is_professor());
create policy "attendance own or staff" on attendance for select using(student_id=auth.uid() or is_professor());create policy "staff attendance update" on attendance for update using(is_professor());
create policy "graduations own or staff" on graduations for select using(student_id=auth.uid() or is_professor());create policy "staff manages graduations" on graduations for all using(is_professor()) with check(is_professor());
create policy "events visible" on events for select to authenticated using(true);create policy "admin manages events" on events for all using(is_admin()) with check(is_admin());
create policy "event participants own or staff" on event_participants for select using(student_id=auth.uid() or is_professor());create policy "staff manages participants" on event_participants for all using(is_professor()) with check(is_professor());
create policy "fees own or admin" on monthly_fees for select using(student_id=auth.uid() or is_admin());create policy "admin manages fees" on monthly_fees for all using(is_admin()) with check(is_admin());
create policy "notifications own" on notifications for select using(user_id=auth.uid() or is_admin());create policy "notifications update own" on notifications for update using(user_id=auth.uid());create policy "admin sends notifications" on notifications for insert with check(is_admin());
create policy "iea own or staff" on iea_scores for select using(student_id=auth.uid() or is_professor());create policy "staff manages iea" on iea_scores for all using(is_professor()) with check(is_professor());

insert into belts(name,sort_order,minimum_months) values('Branca',1,0),('Azul',2,24),('Roxa',3,18),('Marrom',4,12),('Preta',5,12) on conflict do nothing;
insert into achievements(code,name,description,threshold) values('FIRST_CLASS','Primeira aula','Primeiro treino registrado',1),('CLASSES_10','10 aulas','10 treinos concluídos',10),('CLASSES_50','50 aulas','50 treinos concluídos',50),('CLASSES_100','100 aulas','100 treinos concluídos',100),('CLASSES_200','200 aulas','200 treinos concluídos',200),('DAYS_365','365 dias treinando','Um ano de jornada',365),('BELT_BLUE','Faixa Azul','Conquistou a faixa azul',null),('BELT_PURPLE','Faixa Roxa','Conquistou a faixa roxa',null),('BELT_BROWN','Faixa Marrom','Conquistou a faixa marrom',null),('BELT_BLACK','Faixa Preta','Conquistou a faixa preta',null),('MAX_STREAK','Maior sequência','Recorde pessoal de treinos consecutivos',null),('STUDENT_MONTH','Aluno do mês','Destaque mensal da academia',null) on conflict do nothing;

-- MÉTRICAS, RANKING E GAMIFICAÇÃO
create or replace view public.student_training_metrics as
select
  s.id as student_id,
  p.name,
  count(a.id)::int as total_attendance,
  count(a.id) filter (where a.checked_in_at >= date_trunc('month',now()))::int as month_attendance,
  count(a.id) filter (where a.checked_in_at >= date_trunc('year',now()))::int as year_attendance,
  max(a.checked_in_at) as last_training_at,
  extract(day from now() - max(a.checked_in_at))::int as days_absent
from students s join profiles p on p.id=s.id
left join attendance a on a.student_id=s.id
group by s.id,p.name;

create or replace view public.monthly_ranking as
select student_id,name,month_attendance,
 dense_rank() over(order by month_attendance desc) as rank
from public.student_training_metrics;

create or replace function public.award_attendance_achievements() returns trigger
language plpgsql security definer set search_path=public as $$
declare total_count int; ach_code text;
begin
 select count(*) into total_count from attendance where student_id=new.student_id;
 for ach_code in select unnest(array['FIRST_CLASS','CLASSES_10','CLASSES_50','CLASSES_100','CLASSES_200']) loop
   if (ach_code='FIRST_CLASS' and total_count>=1) or (ach_code='CLASSES_10' and total_count>=10) or
      (ach_code='CLASSES_50' and total_count>=50) or (ach_code='CLASSES_100' and total_count>=100) or
      (ach_code='CLASSES_200' and total_count>=200) then
     insert into student_achievements(student_id,achievement_id)
     select new.student_id,id from achievements where code=ach_code on conflict do nothing;
   end if;
 end loop;
 return new;
end; $$;
create trigger attendance_achievements after insert on attendance for each row execute procedure public.award_attendance_achievements();

create or replace function public.award_belt_achievement() returns trigger
language plpgsql security definer set search_path=public as $$
declare belt_name text; code_name text;
begin
 select name into belt_name from belts where id=new.to_belt_id;
 code_name := case belt_name when 'Azul' then 'BELT_BLUE' when 'Roxa' then 'BELT_PURPLE' when 'Marrom' then 'BELT_BROWN' when 'Preta' then 'BELT_BLACK' else null end;
 if code_name is not null then
   insert into student_achievements(student_id,achievement_id)
   select new.student_id,id from achievements where code=code_name on conflict do nothing;
 end if;
 update students set belt_id=new.to_belt_id,degrees=new.degrees,last_graduation_date=new.graduation_date where id=new.student_id;
 return new;
end; $$;
create trigger graduation_achievement after insert on graduations for each row execute procedure public.award_belt_achievement();

grant select on public.student_training_metrics to authenticated;
grant select on public.monthly_ranking to authenticated;

-- EDIÇÃO SEGURA DO PRÓPRIO PERFIL (sem permitir alteração de papel/permissões)
create policy "profile self update" on profiles for update using(id=auth.uid()) with check(id=auth.uid());
revoke update on public.profiles from authenticated;
grant update(name,phone,avatar_url) on public.profiles to authenticated;

-- v1.2: detalhes específicos dos professores
create table if not exists public.professor_details (
 id uuid primary key references public.profiles(id) on delete cascade,
 cpf text unique, whatsapp text, birth_date date, belt_id uuid references public.belts(id),
 degrees int not null default 0 check(degrees between 0 and 6), specialty text,
 start_date date default current_date, notes text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
alter table public.professor_details enable row level security;
create policy "staff reads professor details" on public.professor_details for select to authenticated using(public.is_professor());
create policy "admin manages professor details" on public.professor_details for all to authenticated using(public.is_admin()) with check(public.is_admin());
create policy "schedules visible authenticated" on public.schedules for select to authenticated using(true);
create policy "admin manages schedules" on public.schedules for all to authenticated using(public.is_admin()) with check(public.is_admin());
