# v1.5.5 — Login robusto por rota HTTP

- Login não depende mais da hidratação React nem de JavaScript do navegador.
- O formulário envia diretamente para `/api/auth/login`.
- O servidor resolve o username, autentica no Supabase e devolve a sessão em cookies na mesma resposta de redirecionamento.
- Funciona mesmo se uma extensão do Chrome causar hydration mismatch.
- Mantém redirecionamento por perfil e compatibilidade com login por e-mail antigo.
- Não exige SQL novo.
