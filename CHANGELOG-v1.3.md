# Jiu-Jitsu Academy v1.3 — Alunos completos

## Novidades
- Cadastro completo de alunos com dados pessoais, esportivos, emergência e observações.
- Vínculo real com professor responsável, plano, categoria, faixa e graus.
- Criação automática do usuário do aluno no Supabase Auth e convite por e-mail.
- Edição posterior do aluno sem recriar o acesso.
- Status Ativo, Inativo e Bloqueado.
- Foto do aluno com upload seguro pelo servidor para Supabase Storage (até 4 MB; JPG/PNG/WEBP).
- Busca por nome, CPF, e-mail e telefone.
- Filtros por status, faixa e plano.
- Listagem com professor, plano, faixa, graduação e data de início.
- Nova API `/api/students/options` para cadastros auxiliares.
- Nova API `/api/students/photo` para fotos.

## Banco
Execute `supabase/v1.3-alunos.sql` uma vez no SQL Editor. A migração é aditiva e não apaga nenhum cadastro existente.
