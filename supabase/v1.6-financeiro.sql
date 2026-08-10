-- Jiu-Jitsu Academy v1.6 - Financeiro completo
-- Migração aditiva. Não apaga cadastros existentes.

alter table public.students
  add column if not exists billing_due_day integer not null default 10;

alter table public.students
  drop constraint if exists students_billing_due_day_check;
alter table public.students
  add constraint students_billing_due_day_check check (billing_due_day between 1 and 28);

alter type public.payment_status add value if not exists 'isento';

alter table public.monthly_fees
  add column if not exists discount numeric(10,2) not null default 0,
  add column if not exists surcharge numeric(10,2) not null default 0,
  add column if not exists paid_amount numeric(10,2),
  add column if not exists payment_reference text,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists monthly_fees_due_date_idx on public.monthly_fees(due_date);
create index if not exists monthly_fees_status_idx on public.monthly_fees(status);
create index if not exists monthly_fees_reference_month_idx on public.monthly_fees(reference_month);

-- Atualiza mensalidades pendentes que já passaram do vencimento.
update public.monthly_fees
set status='overdue', updated_at=now()
where status='pending' and due_date < current_date;


create table if not exists public.academy_settings(
  id integer primary key default 1 check(id=1),
  block_overdue_reservations boolean not null default false,
  updated_at timestamptz not null default now()
);
insert into public.academy_settings(id,block_overdue_reservations) values(1,false) on conflict(id) do nothing;
alter table public.academy_settings enable row level security;
drop policy if exists "authenticated reads academy settings" on public.academy_settings;
create policy "authenticated reads academy settings" on public.academy_settings for select to authenticated using(true);
