# Corban Connect

Plataforma de notificações automáticas e portal de acompanhamento de contratos da Starbank. O produto estrutura o fluxo entre Starbank, Corban e cliente final, preservando o Corban como intermediário exclusivo e garantindo que pendências contratuais sejam comunicadas de forma proativa.

> PRD v1.0 — protótipo navegável em React + TypeScript + Tailwind, com persistência em Supabase.

## Stack

- React 18 + TypeScript
- Vite 5
- Tailwind CSS 3
- Supabase (auth + Postgres + RLS)
- SheetJS (`xlsx`) para upload de carteira
- lucide-react (ícones)

## Portais disponíveis

| Portal | Persona | Acesso |
| --- | --- | --- |
| **Portal do Cliente** | Cliente final | CPF + data de nascimento |
| **Painel do Corban** | Correspondente bancário | Credenciais Starbank |
| **Dashboard Interno** | Analista Starbank | E-mail + senha (Supabase Auth) |

## Setup

```bash
cp .env.example .env.local
# preencha VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY

npm install
npm run dev         # http://localhost:5173
```

### Banco de dados (Supabase)

A migration está em `supabase/migrations/0001_init.sql`. Aplique no seu projeto Supabase:

1. Acesse o **SQL Editor** no painel do Supabase.
2. Cole o conteúdo de `supabase/migrations/0001_init.sql` e execute.

A migração cria:

- `public.contracts` — carteira de contratos (fonte de verdade via XLSX).
- `public.notification_log` — log append-only de disparos (LGPD · retenção 5 anos).
- `public.xlsx_uploads` — histórico de uploads (quem, quando, quantas linhas).
- RLS habilitado em todas as tabelas. Leitura pública em `contracts` para lookup por CPF/nascimento no portal do cliente; escrita apenas para usuários autenticados.

### Criar usuário interno

1. Acesse **Authentication → Users** no Supabase.
2. Clique em **Add user** e cadastre um e-mail + senha da equipe Starbank.
3. (Opcional) Em **Auth → Providers → Email**, desative "Confirm email" para testes.

Alternativamente, use a aba **Criar conta** na tela de login interno.

## Upload da carteira (XLSX)

Dentro do Dashboard Interno há a seção **Upload de carteira · XLSX**.

1. Clique em **Baixar template** — gera `corban-connect-template.xlsx` com cabeçalho + linha exemplo.
2. Preencha a planilha com os contratos dos Corbans.
3. Arraste ou selecione o arquivo no uploader.
4. O parser valida colunas, status permitidos e CPF; exibe erros e avisos por linha.
5. Clique em **Sincronizar** — faz `upsert` no Supabase por `contract_id`.

### Colunas da planilha

Obrigatórias: `contract_id`, `client_name`, `client_cpf`, `status`.

Opcionais: `client_phone`, `client_birth`, `corban_name`, `product`, `amount`, `installments`, `installment_value`, `pendency_type`, `pendency_description`, `pendency_days`, `last_update`.

Valores válidos para `status`: `pending_docs`, `credit_analysis`, `at_risk`, `formalized`, `canceled`.

## Scripts

```bash
npm run dev       # Vite dev server
npm run build     # tsc + bundle de produção (chunk XLSX lazy)
npm run preview   # preview do build
npm run lint      # checagem de tipos (tsc)
```

## Estrutura

```
src/
├── App.tsx                      # roteamento + gate de auth
├── main.tsx
├── index.css                    # Tailwind base + fonte Geist
├── types.ts                     # tipos compartilhados
├── vite-env.d.ts                # tipagem de import.meta.env
├── components/                  # Brand, Card, Buttons, StatusBadge, Field, XlsxUpload
├── data/mockContracts.ts        # fallback local quando Supabase não está configurado
├── hooks/useContracts.ts        # busca contratos via Supabase (ou mock)
├── lib/
│   ├── format.ts                # formatBRL, formatCpf, formatBirth, maskCpf
│   ├── theme.ts                 # STATUS_CONFIG, colorMap
│   ├── supabase.ts              # cliente Supabase (null se não configurado)
│   ├── contracts.ts             # fetch/upsert + adapter row <-> Contract
│   └── xlsx.ts                  # parser + template generator (lazy-loaded)
├── views/
│   ├── HomeView.tsx
│   ├── ClientLoginView.tsx
│   ├── ClientStatusView.tsx
│   ├── CorbanLoginView.tsx
│   ├── CorbanDashboardView.tsx
│   ├── CorbanContractView.tsx
│   ├── InternalLoginView.tsx    # Supabase Auth (signin / signup)
│   ├── InternalDashboardView.tsx
│   └── NotificationPreviewView.tsx
└── supabase/migrations/0001_init.sql
```

## Premissas inegociáveis

1. O cliente pertence ao Corban — a Starbank nunca cria canal de suporte direto.
2. A abordagem ao Corban é de parceria, nunca de controle.
3. Toda comunicação com o cliente é informativa e redirecionadora.

## Modo demo (sem Supabase)

Se as variáveis de ambiente não forem configuradas, o app roda em modo demo:
dados do mock são usados, o login interno oferece um botão "Continuar em modo demo" e o
upload XLSX faz parsing mas não persiste.
