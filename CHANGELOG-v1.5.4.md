# v1.5.4 — Login por navegador estabilizado

- Mantém login próprio (usuário + senha).
- Remove dependência do endpoint de login para transportar cookies de sessão.
- O servidor resolve apenas o login amigável para a conta interna do Supabase.
- A autenticação real passa a ocorrer com `createBrowserClient`, que grava a sessão diretamente no navegador.
- Confirma a existência da sessão antes de redirecionar.
- Mantém roteamento por perfil: Admin, Professor e Aluno.
- Não requer SQL novo e não altera usuários existentes.
