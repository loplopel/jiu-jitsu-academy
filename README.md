# Jiu-Jitsu Academy — Gestão Completa

Aplicativo full-stack para gerenciamento profissional de academia de Jiu-Jitsu.

## Stack
- Next.js 16.2.11 + React 19 + TypeScript
- Supabase: PostgreSQL, Auth, RLS e Storage
- Vercel para deploy
- Recharts para dashboards
- QR Code dinâmico (30 s), token de uso único e validação server-side
- PDF, Excel e CSV
- Vitest para testes

## Perfis
### Administrador Geral
Professores, alunos, horários, graduações, categorias, planos, mensalidades, campeonatos, seminários, dashboards, relatórios, notificações, usuários e permissões.

### Professor
Cadastro/acompanhamento de alunos, abertura/fechamento/edição/cancelamento de aulas, capacidade, inscritos, QR Code, presença, observações e estatísticas.

### Aluno
Login, perfil, reserva/cancelamento, scan do QR, histórico, frequência, evolução, graduação, calendário, conquistas e notificações.

## 1. Abrir no VS Code
1. Extraia o ZIP.
2. Abra o VS Code.
3. **File > Open Folder** e selecione `jiu-jitsu-academy`.
4. Abra o terminal integrado.
5. Execute:
```bash
npm install
```

## 2. Criar o Supabase
1. Crie um projeto em Supabase.
2. Entre em **SQL Editor**.
3. Copie todo o arquivo `supabase/schema.sql`.
4. Execute o SQL.
5. Em **Project Settings / API**, copie Project URL, Publishable key e Secret/Service Role key.

## 3. Variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha:
```env
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
SUPABASE_SERVICE_ROLE_KEY=sb_secret_xxx
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ACADEMY_NAME=Minha Academia
NEXT_PUBLIC_ACADEMY_LAT=-23.0000000
NEXT_PUBLIC_ACADEMY_LNG=-46.0000000
CHECKIN_MAX_DISTANCE_METERS=250
```
**Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no navegador.** Ela é usada apenas nas rotas server-side de segurança do QR.

## 4. Configurar autenticação e recuperação de senha
No Supabase: **Authentication > URL Configuration**.
- Site URL local: `http://localhost:3000`
- Redirect URL local: `http://localhost:3000/update-password`
- Após deploy, adicione `https://SEU-DOMINIO.vercel.app/update-password`

Para produção, configure SMTP próprio no Supabase para os e-mails de recuperação.

## 5. Criar o primeiro Administrador Geral
Em **Authentication > Users > Add user**, crie seu usuário. Depois execute no SQL Editor:
```sql
update public.profiles
set role='admin', name='Administrador Geral', permissions='{"all": true}'::jsonb
where email='SEU_EMAIL@DOMINIO.COM';
```

## 6. Rodar localmente
```bash
npm run dev
```
Acesse `http://localhost:3000`.

Validações antes de publicar:
```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## 7. Deploy no GitHub
Dentro da pasta:
```bash
git init
git add .
git commit -m "Jiu-Jitsu Academy v1.0"
git branch -M main
git remote add origin https://github.com/SEU-USUARIO/SEU-REPOSITORIO.git
git push -u origin main
```
Não envie `.env.local`; ele já está no `.gitignore`.

## 8. Deploy na Vercel
1. New Project > importe o repositório do GitHub.
2. Framework: Next.js (detectado automaticamente).
3. Cadastre todas as variáveis do `.env.local` em **Environment Variables**.
4. Ajuste `NEXT_PUBLIC_APP_URL` para a URL final.
5. Deploy.
6. Volte ao Supabase e adicione a URL final em Auth Redirect URLs.

## QR Code — segurança implementada
- Token criptograficamente aleatório.
- Apenas hash do token fica no banco.
- Expiração em 30 segundos.
- Uso único.
- Vinculado à aula.
- API exige usuário autenticado.
- Registra data/hora, IP, User-Agent e localização quando autorizada.
- Pode bloquear check-in fora do raio da academia quando LAT/LNG estão configurados.
- Restrição única impede duas presenças do mesmo aluno na mesma aula.

## IEA — Índice de Evolução do Atleta
Pesos iniciais configurados em `lib/iea.ts`:
- Frequência: 25%
- Assiduidade: 20%
- Graduação/evolução: 15%
- Sequência: 12%
- Tempo de treino: 12%
- Eventos: 8%
- Competições: 8%

Faixas de interpretação:
- 80–100: apto para avaliação
- 60–79,9: evolução consistente
- 40–59,9: acompanhar
- abaixo de 40: risco de evasão

Os pesos são fáceis de alterar conforme a metodologia da academia.

## Gamificação
O banco já inclui conquistas para primeira aula, 10/50/100/200 aulas, 365 dias, faixas Azul/Roxa/Marrom/Preta, maior sequência e Aluno do Mês.

## Estrutura principal
```text
app/
  api/classes/[id]/qr/route.ts
  api/check-in/route.ts
  aulas/
  alunos/
  check-in/
  dashboard/
  eventos/
  financeiro/
  graduacoes/
  meu-painel/
  professor/
  relatorios/
  usuarios/
components/
lib/
supabase/schema.sql
tests/
```

## Produção — recomendações
- Ative MFA para Administradores Gerais.
- Configure SMTP próprio.
- Configure backup/PITR conforme o plano do Supabase.
- Use Storage privado para fotos de alunos.
- Tenha consentimento/LGPD para CPF, saúde/lesões, localização e contato de emergência.
- Defina política de retenção dos logs de localização/IP.

## Próximas integrações opcionais
A estrutura suporta futuras integrações com Mercado Pago/Pagar.me/Stripe, WhatsApp Business API, catraca, leitor NFC, push notification e assinatura digital.
