# Jiu-Jitsu Academy v1.4 — Aulas, Reservas e QR Real

## Entregue nesta versão

- Aulas com criação, edição, fechamento, reabertura e cancelamento.
- Administrador pode escolher o professor responsável pela aula.
- Professor só gerencia as próprias aulas.
- Aluno visualiza as próximas aulas, quantidade de vagas e professor.
- Reserva e cancelamento de vaga pelo próprio aluno.
- Bloqueio de reserva quando a aula estiver lotada, encerrada ou fechada.
- Lista real de alunos inscritos por aula.
- Presença exibida para professor/administrador após o check-in.
- QR Code exclusivo da aula, válido por 30 segundos e de uso único.
- QR Code só pode ser gerado durante o horário real da aula.
- Após um aluno usar o QR, a tela do professor detecta o uso e gera outro automaticamente.
- Check-in bloqueia presença duplicada.
- Check-in registra IP, dispositivo e geolocalização quando autorizada.
- Check-in sem reserva é aceito apenas se ainda houver vaga; a reserva é criada automaticamente.
- Check-in bloqueado para aluno inativo/bloqueado.
- Fluxo de login após escanear QR preserva o endereço do check-in.
- Service Worker PWA revisado: páginas autenticadas não ficam presas em cache.
- Cache de produção atualizado para `conexao-paulista-v2`.

## Banco

Execute `supabase/v1.4-aulas-qr.sql` no SQL Editor do Supabase. A migração é aditiva e não apaga cadastros.

## Revisão final v1.4
- Corrigido fluxo de convite/recuperação: a tela de nova senha agora troca o `code` do Supabase por uma sessão antes de salvar a senha.
- Link expirado ou reutilizado agora exibe mensagem amigável e botão **Enviar novo link**.
- Tela **Alunos** ganhou **Reenviar acesso** por e-mail.
- Administrador Geral agora pode **Excluir aluno** pela lixeira; a exclusão remove Auth, perfil, cadastro e vínculos dependentes.
