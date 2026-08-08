-- V1.4 - APAGAR UM ALUNO DE TESTE COM SEGURANCA
-- Recomendado: use o botão de lixeira na tela Alunos.
-- Este arquivo existe apenas como alternativa administrativa no SQL Editor.
--
-- 1) Troque o e-mail abaixo pelo e-mail do aluno de teste.
-- 2) Execute TODO o bloco de uma vez.
-- 3) Isso remove dados esportivos/financeiros do aluno e o perfil público.
-- 4) ATENCAO: o usuário em Authentication deve ser apagado pela tela
--    Authentication > Users (ou pela lixeira do aplicativo, que faz tudo).

DO $$
DECLARE
  aluno_id uuid;
BEGIN
  SELECT id INTO aluno_id FROM public.profiles
  WHERE lower(email)=lower('TROQUE-PELO-EMAIL-DO-ALUNO@EXEMPLO.COM')
    AND role='aluno'
  LIMIT 1;

  IF aluno_id IS NULL THEN
    RAISE EXCEPTION 'Aluno não encontrado. Confira o e-mail informado.';
  END IF;

  DELETE FROM public.graduations WHERE student_id=aluno_id;
  DELETE FROM public.monthly_fees WHERE student_id=aluno_id;
  DELETE FROM public.student_achievements WHERE student_id=aluno_id;
  DELETE FROM public.iea_scores WHERE student_id=aluno_id;
  DELETE FROM public.event_participants WHERE student_id=aluno_id;
  DELETE FROM public.reservations WHERE student_id=aluno_id;
  DELETE FROM public.attendance WHERE student_id=aluno_id;
  DELETE FROM public.students WHERE id=aluno_id;
  DELETE FROM public.profiles WHERE id=aluno_id;
END $$;
