# Corban Connect

Plataforma de notificações automáticas e portal de acompanhamento de contratos da Starbank. O produto estrutura o fluxo entre Starbank, Corban e cliente final, preservando o Corban como intermediário exclusivo e garantindo que pendências contratuais sejam comunicadas de forma proativa.

> PRD v1.0 — protótipo navegável em React + TypeScript + Tailwind, com persistência em Supabase.

## Stack

**Front (`/`):**
- React 18 + TypeScript, Vite 5, Tailwind CSS 3
- Supabase (auth do dashboard interno + RPCs para leitura por CPF/CNPJ)
- SheetJS (`xlsx`) para upload de carteira
- lucide-react (ícones)

**Backend (`/server`):**
- Node.js 20+, Express
- [Baileys](https://github.com/WhiskeySockets/Baileys) para WhatsApp (grátis)
- Nodemailer + SMTP para e-mail
- `node-cron` para a régua D+0/D+3/D+7/D+15
- Supabase service role para gravar em `notification_log`

**Banco (Supabase):**
- Postgres + RLS restritiva
- Tabelas `contracts`, `notification_log`, `xlsx_uploads`, `client_opt_outs`, `corbans`
- RPCs `security definer` para lookups por CPF/CNPJ

## Portais disponíveis

| Portal | Persona | Acesso |
| --- | --- | --- |
| **Portal do Cliente** | Cliente final | CPF + data de nascimento (sem cadastro) |
| **Painel do Corban** | Correspondente bancário | CNPJ da promotora (sem cadastro) |
| **Dashboard Interno** | Analista Starbank | E-mail + senha (Supabase Auth) |

### Autenticação automática (sem cadastro)

Tanto o cliente quanto o Corban acessam sem cadastro. A autenticação é
derivada de dados que já existem no XLSX:

- **Cliente**: CPF + data de nascimento → retorna todos os contratos em
  aberto com esse CPF/nascimento. Se houver mais de um, é exibida uma lista.
- **Corban**: CNPJ da promotora (extraído do campo `NOME PROMOTORA`,
  ex. `64.839.379 EDLEA BARBOSA` → CNPJ `64839379`). O Corban enxerga
  apenas os contratos vinculados ao CNPJ informado.

Apenas o Dashboard Interno usa autenticação real (Supabase Auth com
e-mail + senha), pois é onde se faz upload de dados.

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
2. Cole e execute **`supabase/setup.sql`** — arquivo único, idempotente, que
   cria todas as tabelas, colunas, índices, RLS e força um `NOTIFY pgrst,
   'reload schema'` no final para evitar o erro de "schema cache" do
   PostgREST após alteração de colunas. Pode ser re-executado a qualquer
   momento sem problemas.

   > Os arquivos `supabase/migrations/0001_init.sql`, `0002_expand_contracts.sql`
   > e `0003_corban_cnpj.sql` ficam como histórico. Use `setup.sql` para
   > setup de fresh e para aplicar updates.

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

## Modo desenvolvimento (sem Supabase)

Em ambiente **dev** (`npm run dev`), definir `VITE_ALLOW_MOCK=1` no `.env.local`
permite que os mocks de `src/data/mockContracts.ts` sejam usados como fallback
quando o Supabase não está configurado. Em produção a flag é ignorada — o app
falha com erro claro se não achar as credenciais.

## Ir para produção

Veja **`PRODUCTION.md`** para o runbook completo: rotação de chaves, deploy das
Edge Functions (`dispatch-notification`, `run-ruler`), agendamento do
`pg_cron`, aprovação de templates WhatsApp, deploy na Vercel e checklist
pré-launch.
