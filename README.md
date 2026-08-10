# Conexão Paulista Jiu-Jitsu — v1.7

Aplicativo PWA para gestão esportiva da equipe Conexão Paulista.

## Objetivo
O sistema é voltado à rotina de professores e alunos: cadastro, aulas, reservas, QR Code, presença, graduação, evolução, eventos, ranking e relatórios esportivos. O módulo financeiro foi retirado da experiência do aplicativo.

## Perfis
- Administrador Geral: alunos, professores, horários, categorias, aulas, graduações, eventos, relatórios, notificações, usuários e configurações.
- Professor: próprias aulas, alunos vinculados, QR/presença, evolução, graduações, eventos e estatísticas.
- Aluno: agenda, reservas, check-in, evolução, graduação, eventos, ranking e perfil.

## v1.7 — Evolução e IEA
O IEA (Índice de Evolução do Atleta) varia de 0 a 100 e considera:
- Frequência: 30%
- Regularidade/assiduidade: 20%
- Sequência: 15%
- Tempo de treino: 10%
- Eventos: 10%
- Competições: 5%
- Graduação: 10%

O IEA é um indicador de apoio. A decisão de graduação continua sendo do professor.

## Instalação
1. Copie `.env.example` para `.env.local` e preencha as credenciais do Supabase.
2. Execute as migrações já usadas no projeto e, para esta versão, rode `supabase/v1.7-evolucao.sql`.
3. Rode `npm install`.
4. Rode `npm run dev`.
5. Para validar produção: `npm run build`.

## Deploy
O projeto é compatível com GitHub + Vercel. Preserve `.env.local` fora do Git e configure as mesmas variáveis na Vercel.
