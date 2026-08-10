# Conexão Paulista Jiu-Jitsu Academy

Sistema PWA em Next.js + Supabase para gestão de academia de Jiu-Jitsu.

## Versão atual: 1.6.0

A autenticação foi simplificada: **login + senha administrados pela academia**. Não há convite por e-mail nem recuperação por e-mail.

## Novidades da v1.6
- Financeiro completo com geração individual e mensal em lote.
- Dia de vencimento por aluno.
- Baixa com forma de pagamento, desconto, acréscimo e observação.
- Indicadores de recebido, a receber, vencido e inadimplentes.
- Histórico financeiro visível para o aluno.
- Regra opcional de bloqueio de novas reservas por inadimplência.

Antes de usar o Financeiro da v1.6, execute `supabase/v1.6-financeiro.sql` no SQL Editor do Supabase.

### Como funciona o acesso
- O Administrador Geral cria o usuário.
- Define um `login` único.
- Define a senha inicial.
- Define o perfil: Administrador, Professor ou Aluno.
- Pode alterar o login, redefinir a senha, bloquear ou reativar o acesso.
- E-mail é apenas dado de contato opcional.
- As senhas continuam protegidas pelo Supabase Auth; não são gravadas em tabela própria.

## Perfis

### Administrador Geral
Gerencia alunos, professores, aulas, cadastros, planos, mensalidades, graduações, eventos, relatórios, notificações, usuários e permissões.

### Professor
Gerencia suas aulas, alunos, reservas, QR Code, presença, observações e estatísticas permitidas.

### Aluno
Acessa agenda, reservas, check-in, frequência, evolução, graduação, mensalidade, eventos e perfil.

## PWA
O projeto possui manifest, ícones, service worker e tela offline. Em produção pode ser instalado na tela inicial do Android/iPhone.

## Requisitos
- Node.js 20+ recomendado
- npm
- Projeto Supabase
- Conta Vercel para produção

## Instalação
```powershell
npm install
npm run dev
```

Abra `http://localhost:3000`.

## Variáveis de ambiente
Crie `.env.local` baseado em `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ACADEMY_NAME=Conexão Paulista Jiu-Jitsu
NEXT_PUBLIC_ACADEMY_LAT=...
NEXT_PUBLIC_ACADEMY_LNG=...
CHECKIN_MAX_DISTANCE_METERS=250
```

Nunca envie `SUPABASE_SERVICE_ROLE_KEY` para GitHub ou para o navegador.

## Atualização da v1.5.1 para v1.5.2
Execute uma única vez no SQL Editor do Supabase:

`supabase/v1.5.2-login-senha.sql`

A migração é aditiva e não apaga dados operacionais.

Usuários existentes recebem um login automaticamente usando a parte anterior ao `@` do e-mail antigo. Senhas existentes não são alteradas.

## Banco inicial
Para instalação nova, use `supabase/schema.sql` e depois as migrações posteriores necessárias conforme o projeto. Em uma base já existente, use somente a migração da versão nova.

## Login
Tela: `/login`

O usuário informa apenas:
- Login
- Senha

Para novos usuários, o sistema cria internamente uma credencial técnica no Supabase Auth, invisível na interface. Isso permite usar a segurança de senha do Supabase sem depender de e-mail real.

## Recuperação de senha
Não existe recuperação por e-mail na v1.5.2.

Quando alguém esquecer a senha:
1. Administrador abre `Usuários e acessos`.
2. Clica no ícone de chave.
3. Define uma nova senha.
4. Informa a nova senha ao usuário.

## Deploy Vercel
1. Suba o projeto no GitHub.
2. Importe o repositório na Vercel.
3. Configure as mesmas variáveis de ambiente.
4. Faça o deploy.

URL de produção usada no projeto atual:
`https://jiu-jitsu-academy.vercel.app`

## Supabase URL Configuration
Para o fluxo atual de login/senha não é necessário SMTP. Mantenha as URLs da aplicação configuradas para as demais funcionalidades de autenticação/sessão.

## Testes
```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

## Arquivos importantes
- `supabase/schema.sql` — estrutura geral
- `supabase/v1.5.2-login-senha.sql` — migração de login próprio
- `PASSO-A-PASSO-v1.5.2.txt` — instalação da atualização
- `CHANGELOG-v1.5.2.md` — mudanças da versão

## Roadmap
- v1.6 — Financeiro
- v1.7 — Evolução + IEA
- v1.8 — Gamificação + ranking
- v1.9 — Comunicação e notificações
- v2.0 — acabamento final, relatórios, segurança e testes finais
