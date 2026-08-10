# v1.8 — Gamificação + limpeza definitiva

## Gamificação
- Ranking mensal por presença.
- Ranking anual por presença.
- Ranking geral por total de treinos.
- Ranking por maior sequência semanal.
- Ranking por evolução/IEA.
- Conquistas automáticas: primeira aula, 10, 50, 100 e 200 aulas, 365 dias, faixas Azul/Roxa/Marrom/Preta e sequência de 8 semanas.
- Aluno do mês definido pelo Administrador Geral.
- Tela de ranking adaptada para Admin, Professor e Aluno.
- Catálogo de metas e conquistas desbloqueadas.

## Limpeza definitiva
Foram removidas fisicamente do aplicativo as rotas e APIs de:
- Financeiro
- Mensalidades
- Planos
- API financeira
- APIs administrativas de mensalidades e planos

As tabelas antigas continuam no Supabase para não destruir histórico. O aplicativo não as utiliza mais.

## Correções herdadas da v1.7
- Página de relatórios normalizada para exportCSV/exportPDF/exportExcel.
- Tipagem do retorno dinâmico do Supabase ajustada para o build do Next.js.
