# Jiu-Jitsu Academy v1.5.2 — Login próprio

## Objetivo
Remover a dependência de e-mail para autenticação e deixar o acesso totalmente administrado pela academia.

## Mudanças
- Login agora usa `login + senha`.
- E-mail deixou de ser credencial de acesso e virou contato opcional.
- Administrador cria login e senha inicial de alunos, professores e administradores.
- Administrador pode redefinir senha a qualquer momento.
- Administrador pode alterar login, bloquear e reativar usuários em **Usuários e acessos**.
- Removido fluxo de convite por e-mail.
- Removida dependência de SMTP para criação/recuperação de acesso.
- Tela "Esqueci minha senha" agora orienta o usuário a procurar o Administrador Geral.
- Cadastro de aluno e professor já cria o acesso imediatamente.
- Usuários antigos recebem login automaticamente na migração, derivado do e-mail anterior.
- Compatibilidade temporária: usuários antigos ainda podem digitar o e-mail antigo no campo Login até o cadastro ser revisado.

## Segurança
O Supabase Auth continua armazenando e validando as senhas. O aplicativo não grava senha em tabela própria. Para novas contas é usado um e-mail técnico interno, invisível para o usuário, apenas porque o Supabase Auth trabalha com credencial de e-mail/senha internamente.
