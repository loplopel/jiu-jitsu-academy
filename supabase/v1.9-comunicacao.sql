-- Jiu-Jitsu Academy v1.9 - Comunicação e notificações internas
-- Migração aditiva. Não apaga usuários, aulas, presenças, graduações ou conquistas.

alter table public.notifications add column if not exists link_url text;
alter table public.notifications add column if not exists scheduled_for timestamptz;
alter table public.notifications add column if not exists sent_by uuid references public.profiles(id) on delete set null;
alter table public.notifications add column if not exists source_key text;
alter table public.notifications add column if not exists delivered_at timestamptz default now();

create unique index if not exists notifications_source_key_unique
  on public.notifications(source_key)
  where source_key is not null;
create index if not exists notifications_user_created_idx on public.notifications(user_id,created_at desc);
create index if not exists notifications_user_read_idx on public.notifications(user_id,read_at);

create table if not exists public.notification_settings (
  id boolean primary key default true check(id=true),
  class_reminders boolean not null default true,
  class_reminder_minutes int not null default 120 check(class_reminder_minutes between 15 and 1440),
  event_reminders boolean not null default true,
  event_reminder_hours int not null default 24 check(event_reminder_hours between 1 and 168),
  birthday_messages boolean not null default true,
  achievement_messages boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.notification_settings(id) values(true) on conflict (id) do nothing;

alter table public.notification_settings enable row level security;
drop policy if exists "notification settings visible" on public.notification_settings;
create policy "notification settings visible" on public.notification_settings for select to authenticated using(true);
drop policy if exists "admin manages notification settings" on public.notification_settings;
create policy "admin manages notification settings" on public.notification_settings for all to authenticated using(public.is_admin()) with check(public.is_admin());

grant select on public.notification_settings to authenticated;
grant select,update,insert on public.notification_settings to authenticated;
