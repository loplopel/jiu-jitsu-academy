# v1.7 — Evolução esportiva + IEA

## Direção do produto
O módulo financeiro foi retirado da experiência do aplicativo. A Conexão Paulista usa este sistema para gestão esportiva da equipe: alunos, professores, aulas, presença, graduação e evolução.

## Evolução
- central de evolução para Admin, Professor e Aluno;
- IEA de 0 a 100 com pesos: frequência 30%, regularidade 20%, sequência 15%, tempo de treino 10%, eventos 10%, competições 5% e graduação 10%;
- presenças em 30, 60 e 90 dias;
- sequência medida em semanas ativas;
- tempo total de treino e tempo na faixa atual;
- participação em eventos e competições;
- alertas por ausência recente;
- histórico completo de graduações;
- registro de graduação por Admin/Professor;
- IEA armazenável no histórico para acompanhamento;
- IEA é indicador de apoio e nunca promove aluno automaticamente.

## Financeiro removido
- removidos menus Financeiro/Mensalidade;
- removidos Planos e Mensalidades de Cadastros;
- removidos campos plano e vencimento do cadastro do aluno;
- removido bloqueio de reserva por inadimplência;
- removidos cards financeiros do dashboard;
- tabelas antigas no Supabase não são apagadas por segurança, mas deixam de ser usadas pelo app.
