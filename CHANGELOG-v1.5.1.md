# v1.5.1 — Correção definitiva de autenticação por e-mail

- Novo endpoint SSR `/auth/confirm` para validar `token_hash` com `verifyOtp` e salvar sessão em cookie.
- Recuperação de senha não depende mais do PKCE iniciado no mesmo navegador/dispositivo.
- Convites de aluno/professor passam pelo mesmo fluxo seguro.
- Tela de nova senha apenas abre após sessão de recuperação válida.
- Mensagens de link inválido/expirado mais claras.
- Mantém toda a organização e usabilidade da v1.5.

## Configuração obrigatória no Supabase
Atualizar os templates **Reset password** e **Invite user** em Authentication > Emails > Templates conforme `SUPABASE-EMAIL-TEMPLATES-v1.5.1.txt`.
