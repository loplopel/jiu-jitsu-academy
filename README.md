# Jiu-Jitsu Academy — Conexão Paulista v2.0.8

## v2.0.8 — Painel do Aluno + Progresso de Graduação

O painel do aluno prioriza próxima aula, reserva/check-in, frequência anual e o progresso de 70 aulas por grau. O perfil permanece bloqueado para dados esportivos, deixando apenas o peso editável. Professores e administradores passam a ver o progresso de graduação diretamente na lista de alunos. Não há SQL novo obrigatório nesta versão.


Base final com cadastro esportivo refinado, categoria automática por idade/sexo/peso, QR, evolução, graduação por frequência e notificações.

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

## Performance — v2.0.4

A v2.0.4 adiciona índices de banco e reduz trabalho desnecessário nas telas mais pesadas. Após atualizar os arquivos, execute `supabase/v2.0.4-performance.sql` uma vez no SQL Editor do Supabase.

O script não remove dados e pode ser executado novamente com segurança graças a `create index if not exists`.


## v2.0.5

Ajustes finais: menu do Professor simplificado, regra de 70 aulas por grau, troca de faixa após 4 graus, relatório mensal de presença e perfil do aluno com edição exclusiva do peso.
