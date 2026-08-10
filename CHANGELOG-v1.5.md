# Jiu-Jitsu Academy — v1.5

## Objetivo
Simplificar o uso diário do aplicativo sem remover os recursos já construídos.

## Principais mudanças

### Navegação por perfil
- Administrador: Início, Alunos, Professores, Aulas, Financeiro, Graduações, Eventos, Relatórios, Notificações, Usuários e Configurações.
- Professor: Início, Minhas aulas, Meus alunos, Presença/QR, Estatísticas, Graduações, Eventos, Notificações e Perfil.
- Aluno: Início, Agenda, Check-in, Evolução, Perfil, Eventos, Ranking e Notificações.
- Menu mobile passa a mostrar somente as cinco ações essenciais do perfil.

### Dashboard Administrador
- Atalhos para Novo aluno, Novo professor, Criar aula e Mensalidades.
- Aulas do dia em destaque.
- Mensalidades vencidas e alunos em risco em um bloco de atenção.
- Indicadores e gráficos continuam usando dados reais do Supabase.

### Dashboard Professor
- Próxima aula do dia em destaque.
- Atalhos diretos para Minhas aulas, QR e Meus alunos.
- Indicadores resumidos e sem itens administrativos desnecessários.

### Dashboard Aluno
- Próxima aula em destaque.
- Acesso direto a Agenda, Check-in, Evolução e Perfil.
- Treinos do mês, total de treinos, faixa/graus e IEA.
- Experiência mobile-first.

### Recuperação de senha
- Mensagens do Supabase deixam de aparecer em inglês.
- Tratamento específico para limite de envio de e-mail.
- Bloqueio temporário do botão para impedir vários cliques consecutivos.
- Instrução clara para conferir caixa de entrada/spam.
- Reenvio de acesso de aluno também trata rate limit de forma amigável.

### Segurança e produção
- Nenhuma credencial é adicionada ao projeto.
- Para remover o limite baixo do serviço de e-mail padrão do Supabase em produção, configure SMTP próprio no painel do Supabase.

## Banco de dados
A v1.5 não exige SQL novo.
