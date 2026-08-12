-- Conexao Paulista Jiu-Jitsu v2.0.4
-- Performance: indices para as consultas mais usadas pelo app.
-- Seguro para rodar mais de uma vez (IF NOT EXISTS).

create index if not exists idx_profiles_username_lower
  on public.profiles (lower(username));

create index if not exists idx_profiles_email_lower
  on public.profiles (lower(email));

create index if not exists idx_profiles_role_active_name
  on public.profiles (role, active, name);

create index if not exists idx_students_status_start_date
  on public.students (status, start_date desc);

create index if not exists idx_students_professor_status
  on public.students (responsible_professor_id, status);

create index if not exists idx_students_belt
  on public.students (belt_id);

create index if not exists idx_students_category
  on public.students (category_id);

create index if not exists idx_classes_starts_at
  on public.classes (starts_at desc);

create index if not exists idx_classes_status_starts_at
  on public.classes (status, starts_at desc);

create index if not exists idx_classes_professor_starts_at
  on public.classes (professor_id, starts_at desc);

create index if not exists idx_reservations_class_status
  on public.reservations (class_id, status);

create index if not exists idx_reservations_student_status
  on public.reservations (student_id, status);

create index if not exists idx_attendance_student_checked_in
  on public.attendance (student_id, checked_in_at desc);

create index if not exists idx_attendance_class_checked_in
  on public.attendance (class_id, checked_in_at desc);

create index if not exists idx_iea_student_calculated
  on public.iea_scores (student_id, calculated_at desc);

create index if not exists idx_graduations_student_date
  on public.graduations (student_id, graduation_date desc);

create index if not exists idx_notifications_user_created
  on public.notifications (user_id, created_at desc);

create index if not exists idx_notifications_user_unread
  on public.notifications (user_id, created_at desc)
  where read_at is null;

create index if not exists idx_student_achievements_student_earned
  on public.student_achievements (student_id, earned_at desc);

create index if not exists idx_events_status_starts_at
  on public.events (status, starts_at desc);

create index if not exists idx_qr_tokens_class_expires
  on public.qr_tokens (class_id, expires_at desc);

analyze public.profiles;
analyze public.students;
analyze public.classes;
analyze public.reservations;
analyze public.attendance;
analyze public.iea_scores;
analyze public.graduations;
analyze public.notifications;
analyze public.student_achievements;
analyze public.events;
analyze public.qr_tokens;
