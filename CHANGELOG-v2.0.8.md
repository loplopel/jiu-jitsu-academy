# v2.0.8 — Painel do Aluno + Progresso de Graduação

## Aluno
- Novo painel mobile-first com próxima aula em destaque.
- Reserva e cancelamento direto no painel.
- Progresso visual de 0 a 70 aulas para o próximo grau.
- Ao completar 70 aulas, exibe que o próximo grau já pode ser avaliado pelo professor.
- Com 4 graus, exibe que o atleta está apto à avaliação para troca de faixa.
- Treinos no mês, no ano, sequência e IEA em cards rápidos.
- Histórico anual de frequência por mês.
- Lista dos últimos treinos confirmados.
- Perfil continua bloqueado, com peso como único campo editável.
- Perfil agora mostra também graus, professor responsável e data de início.
- A categoria atual do aluno fica destacada na tabela de peso correspondente ao sexo.

## Professor/Admin
- Lista de alunos passa a mostrar o progresso 0/70 para graduação.
- Sinalização rápida de "Grau disponível" e "Troca de faixa".

## Banco
- Nenhuma migração SQL obrigatória.
- A versão usa as tabelas já existentes de alunos, presença, aulas, reservas, graduações e IEA.
