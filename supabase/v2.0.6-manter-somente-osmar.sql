-- v2.0.6 - manter somente o professor Osmar Rodrigues (login: osmar)
-- IMPORTANTE: este script preserva o histórico e reassocia vínculos dos demais
-- professores ao Osmar antes de remover os outros acessos de professor.
-- Não altera Administrador Geral nem alunos.

begin;

do $$
declare
  keep_id uuid;
  other_ids uuid[];
begin
  select id into keep_id
  from public.profiles
  where role='professor' and lower(username)='osmar' and lower(name)='osmar rodrigues'
  limit 1;

  if keep_id is null then
    raise exception 'Professor Osmar Rodrigues com login osmar não encontrado. Nada foi removido.';
  end if;

  select coalesce(array_agg(id),array[]::uuid[]) into other_ids
  from public.profiles
  where role='professor' and id<>keep_id;

  -- Preserva vínculos esportivos e históricos, apontando para Osmar.
  update public.students set responsible_professor_id=keep_id
    where responsible_professor_id=any(other_ids);
  update public.schedules set professor_id=keep_id
    where professor_id=any(other_ids);
  update public.classes set professor_id=keep_id
    where professor_id=any(other_ids);
  update public.graduations set professor_id=keep_id
    where professor_id=any(other_ids);
  update public.attendance set confirmed_by=keep_id
    where confirmed_by=any(other_ids);
  update public.qr_tokens set created_by=keep_id
    where created_by=any(other_ids);
  update public.qr_tokens set used_by=keep_id
    where used_by=any(other_ids);

  -- A exclusão em auth.users remove profiles/professor_details por cascade.
  delete from auth.users where id=any(other_ids);
end $$;

commit;

-- Conferência: deve retornar apenas Osmar entre os professores.
select p.id,p.name,p.username,p.active
from public.profiles p
where p.role='professor'
order by p.name;
