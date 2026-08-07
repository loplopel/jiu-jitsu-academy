-- CONEXAO PAULISTA - LIMPEZA DA BASE OPERACIONAL
-- Mantem usuarios/auth, perfis, faixas e conquistas-base.
-- Use somente se quiser apagar dados de teste operacionais.
begin;
delete from public.student_achievements;
delete from public.iea_scores;
delete from public.notifications;
delete from public.monthly_fees;
delete from public.event_participants;
delete from public.events;
delete from public.graduations;
delete from public.attendance;
delete from public.qr_tokens;
delete from public.reservations;
delete from public.classes;
delete from public.schedules;
delete from public.students;
delete from public.categories;
delete from public.plans;
commit;
