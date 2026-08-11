# Jiu-Jitsu Academy — Conexão Paulista v2.0.3

Base final com cadastro esportivo refinado, categoria automática por idade/sexo/peso, QR, evolução, ranking e notificações.

# Conexão Paulista Jiu-Jitsu — v2.0

PWA de gestão esportiva para equipe de Jiu-Jitsu, com três perfis: Administrador Geral, Professor e Aluno.

## Recursos
- Login próprio (usuário + senha administrados pela academia)
- Perfis e permissões por função
- Alunos e professores
- Aulas, reservas e capacidade
- QR Code dinâmico de 30 segundos e uso único
- Presença com IP, dispositivo e localização quando autorizada
- Graduações, histórico e IEA
- Ranking, conquistas e aluno do mês
- Eventos, seminários e competições
- Notificações internas e lembretes
- Relatórios PDF, Excel e CSV
- PWA Android/iPhone com offline controlado

## Stack
Next.js 16, React 19, TypeScript, Supabase, Vercel, Vitest, jsPDF, XLSX e QRCode.

## Instalação
```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```
Configure `.env.local` com seu projeto Supabase. Nunca versione esse arquivo.

## Supabase
Para instalação nova, execute `supabase/schema.sql` e depois as migrações aplicáveis em ordem até `v1.9-comunicacao.sql`. Em uma instalação já atualizada, a v2.0 não exige SQL adicional.

## Validação antes de produção
```powershell
npm run typecheck
npm test
npm run build
```

## Deploy
Faça commit/push para a branch `main` conectada à Vercel. Configure na Vercel as mesmas variáveis do `.env.local` (sem expor secrets).

## PWA
Android: instalar pelo Chrome. iPhone: Safari > Compartilhar > Adicionar à Tela de Início. O QR/check-in exige internet para validação segura.

## Segurança
- `SUPABASE_SERVICE_ROLE_KEY` somente no servidor.
- RLS e verificações de perfil devem permanecer ativas.
- Rotas administrativas são bloqueadas para professor/aluno no proxy.
- Sessões inválidas são limpas e o logout remove cookies de autenticação.
