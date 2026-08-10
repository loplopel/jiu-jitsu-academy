# Jiu-Jitsu Academy v1.5.3 — Login Próprio Estável

## Correções

- Corrigido o login que podia permanecer eternamente em **Entrando...**.
- A sessão do Supabase agora é gravada diretamente na resposta HTTP do endpoint `/api/auth/login`.
- Os cookies de autenticação são enviados ao navegador antes do redirecionamento.
- O redirecionamento depois do login agora usa navegação completa para garantir que o primeiro request autenticado já leve a sessão.
- Tratamento de falha de rede: o botão volta ao estado normal e o usuário recebe uma mensagem clara.
- Mantida compatibilidade temporária com login por e-mail de usuários antigos.
- Nenhum SQL novo é necessário.
- Nenhum usuário, aluno, professor, plano, aula ou cadastro é apagado.

## Destino por perfil

- Administrador Geral → `/dashboard`
- Professor → `/professor`
- Aluno → `/meu-painel`
