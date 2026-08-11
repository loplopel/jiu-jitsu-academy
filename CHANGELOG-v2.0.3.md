# v2.0.3 — Cadastros esportivos refinados

## Aluno
- Formulário reduzido ao que a equipe realmente usa.
- Dados pessoais: Nome, Login, Senha inicial, E-mail de contato opcional, Data de nascimento, Sexo e Peso.
- Vínculos esportivos: Categoria automática, Professor responsável, Faixa, Graus, Data de início e Foto.
- Categoria calculada automaticamente por idade, sexo e peso.
- Exemplo: `Master 2 - Leve`.
- Faixas disponíveis filtradas pela categoria etária.

## Tabelas usadas
Faixa etária:
- Pré Mirim: 4–5
- Mirim: 6–7
- Infantil A: 8–9
- Infantil B: 10–11
- Infanto A: 12–13
- Infanto B: 14–15
- Juvenil: 16–17
- Adulto: 18–29
- Master 1: 30–35
- Master 2: 36–40
- Master 3: 41–45
- Master 4: 46–50
- Master 5: 51–55
- Master 6: acima de 56

Peso com kimono:
- Juvenil e Adulto/Master usam os limites masculino/feminino fornecidos pela equipe.
- A referência enviada não contém limites de peso para Pré Mirim a Infanto B; nessas idades o sistema registra somente a categoria etária, sem inventar limite de peso.

## Professor
- Novo formulário: Nome, Login, Senha inicial, Data de nascimento, Sexo, Peso, Faixa, Graus e Observação.
- Faixas filtradas de acordo com a idade.
- Adicionados `sex` e `weight` em `professor_details`.

## Banco
Execute `supabase/v2.0.3-cadastros-finos.sql` antes de testar cadastro/edição de professor.
