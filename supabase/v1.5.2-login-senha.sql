-- JIU-JITSU ACADEMY v1.5.2
-- Login próprio + senha administrada pela academia
-- Migração aditiva. NÃO apaga alunos, professores, aulas, planos ou histórico.

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists contact_email text;

-- Preserva o e-mail antigo apenas como contato dos usuários já existentes.
update public.profiles
set contact_email = email
where contact_email is null
  and email is not null
  and email not like '%@auth.conexaopaulista.invalid';

-- Cria logins para os usuários antigos usando a parte anterior ao @.
-- Se houver duplicidade, acrescenta parte do UUID.
do $$
declare
  r record;
  base text;
  candidate text;
  n int;
begin
  for r in select id,email,username from public.profiles order by created_at,id loop
    if r.username is null or btrim(r.username)='' then
      base := lower(regexp_replace(split_part(coalesce(r.email,''),'@',1),'[^a-zA-Z0-9._-]','','g'));
      if length(base) < 3 then base := 'user' || substring(replace(r.id::text,'-',''),1,6); end if;
      candidate := left(base,32);
      n := 0;
      while exists(select 1 from public.profiles p where lower(p.username)=lower(candidate) and p.id<>r.id) loop
        n := n + 1;
        candidate := left(base,24) || '-' || substring(replace(r.id::text,'-',''),1,5) || n::text;
      end loop;
      update public.profiles set username=candidate where id=r.id;
    end if;
  end loop;
end $$;

create unique index if not exists profiles_username_lower_unique on public.profiles(lower(username));
create index if not exists profiles_username_idx on public.profiles(username);

-- O username passa a ser obrigatório depois de preencher a base existente.
alter table public.profiles alter column username set not null;

-- Atualiza o trigger para novas contas criadas pela API do sistema.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path=public as $$
begin
  insert into public.profiles(id,name,email,username,contact_email,role)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'username',''), 'user' || substring(replace(new.id::text,'-',''),1,8)),
    nullif(new.raw_user_meta_data->>'contact_email',''),
    coalesce((new.raw_user_meta_data->>'role')::public.user_role,'aluno'::public.user_role)
  )
  on conflict(id) do nothing;
  return new;
end; $$;

-- Segurança: usuários autenticados não podem alterar seu login ou perfil de acesso.
revoke update on public.profiles from authenticated;
grant update(name,phone,avatar_url) on public.profiles to authenticated;
