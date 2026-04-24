-- ============================================================================
-- Corban Connect · Setup completo (idempotente)
--
-- Cole este arquivo INTEIRO no SQL Editor do Supabase e execute UMA VEZ.
-- Substitui a necessidade de rodar 0001/0002/0003 separadamente — este
-- arquivo já cria tudo e é seguro re-executar (usa IF NOT EXISTS / CREATE OR
-- REPLACE), então se você rodou migrations antigas não tem problema.
--
-- No final, o NOTIFY força o PostgREST a recarregar o cache de schema, o
-- que evita o erro "Could not find the 'xxx' column of 'contracts' in the
-- schema cache" depois de alterar a tabela.
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1. Tabelas
-- ────────────────────────────────────────────────────────────────────────────

create table if not exists public.contracts (
  id                 text primary key,
  client_name        text not null,
  client_cpf         text not null,
  client_phone       text,
  client_birth       text,
  corban_name        text,
  product            text,
  amount             numeric(14, 2) default 0,
  installments       integer default 0,
  installment_value  numeric(14, 2) default 0,
  status             text not null check (
    status in ('pending_docs', 'credit_analysis', 'at_risk', 'formalized', 'canceled')
  ),
  status_label       text,
  pendency_type      text,
  pendency_description text,
  pendency_days      integer,
  last_update        text,
  timeline           jsonb default '[]'::jsonb,
  notifications      jsonb default '[]'::jsonb,
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table if not exists public.notification_log (
  id           bigserial primary key,
  contract_id  text not null references public.contracts(id) on delete cascade,
  channel      text not null check (channel in ('whatsapp', 'sms', 'email')),
  status       text not null check (status in ('delivered', 'read', 'pending', 'failed')),
  reg          text,
  sent_at      timestamptz default now()
);

create table if not exists public.xlsx_uploads (
  id          bigserial primary key,
  uploaded_by uuid references auth.users(id) on delete set null,
  filename    text,
  row_count   integer,
  uploaded_at timestamptz default now()
);

-- ────────────────────────────────────────────────────────────────────────────
-- 2. Colunas expandidas (do relatório real do banco + CNPJ do Corban)
-- ────────────────────────────────────────────────────────────────────────────

alter table public.contracts
  -- Observações da equipe interna
  add column if not exists ultima_observacao    text,
  add column if not exists motivo_recusa        text,
  add column if not exists atividade            text,

  -- Identificadores da proposta
  add column if not exists nro_proposta         text,
  add column if not exists nro_proposta_banco   text,
  add column if not exists nro_contrato_externo text,
  add column if not exists nro_cartao           text,
  add column if not exists id_formalizacao      text,

  -- Corban / login
  add column if not exists corban_cnpj          text,

  -- Financeiro
  add column if not exists matricula            text,
  add column if not exists tabela               text,
  add column if not exists valor_solicitado     numeric(14, 2),
  add column if not exists valor_iof            numeric(14, 2),
  add column if not exists valor_financiado     numeric(14, 2),
  add column if not exists valor_ted            numeric(14, 2),
  add column if not exists valor_comissao       numeric(14, 2),
  add column if not exists valor_segurado       numeric(14, 2),
  add column if not exists valor_seguro         numeric(14, 2),
  add column if not exists rmc                  numeric(14, 2),
  add column if not exists limite_total         numeric(14, 2),
  add column if not exists limite_compras       numeric(14, 2),
  add column if not exists limite_saque         numeric(14, 2),

  -- Taxas & datas
  add column if not exists taxa_juros_am        numeric(8, 4),
  add column if not exists taxa_juros_aa        numeric(8, 4),
  add column if not exists taxa_cet_am          numeric(8, 4),
  add column if not exists taxa_cet_aa          numeric(8, 4),
  add column if not exists data_primeiro_vcto   text,
  add column if not exists data_ultimo_vcto     text,
  add column if not exists data_digitacao       text,
  add column if not exists hora_digitacao       text,

  -- Empregador
  add column if not exists empregador           text,
  add column if not exists orgao_secretaria     text,
  add column if not exists codigo_empregador    text,
  add column if not exists sindicato            text,

  -- Equipe
  add column if not exists gerente_comercial       text,
  add column if not exists gerente_resp_promotora  text,
  add column if not exists usuario_digitador       text,

  -- Dados extras do cliente
  add column if not exists email_cliente        text,
  add column if not exists rg_cliente           text,
  add column if not exists naturalidade         text,
  add column if not exists estado_civil         text,
  add column if not exists sexo                 text,

  -- Endereço
  add column if not exists endereco             text,
  add column if not exists bairro               text,
  add column if not exists cidade               text,
  add column if not exists uf                   text,
  add column if not exists cep                  text,

  -- Dados bancários
  add column if not exists banco                text,
  add column if not exists agencia              text,
  add column if not exists conta                text,
  add column if not exists conta_dv             text,

  -- Representante legal
  add column if not exists cpf_repr_legal       text,
  add column if not exists nome_repr_legal      text,

  -- Meta proposta / corban
  add column if not exists tipo_proposta        text,
  add column if not exists tipo_produto         text,
  add column if not exists nome_matriz          text,
  add column if not exists ponto_de_venda       text;

-- ────────────────────────────────────────────────────────────────────────────
-- 3. Índices
-- ────────────────────────────────────────────────────────────────────────────

create index if not exists contracts_cpf_idx         on public.contracts (client_cpf);
create index if not exists contracts_status_idx      on public.contracts (status);
create index if not exists contracts_corban_idx      on public.contracts (corban_name);
create index if not exists contracts_corban_cnpj_idx on public.contracts (corban_cnpj);
create index if not exists contracts_empregador_idx  on public.contracts (empregador);
create index if not exists contracts_nro_proposta_idx on public.contracts (nro_proposta);
create index if not exists notification_log_contract_idx on public.notification_log (contract_id);

-- ────────────────────────────────────────────────────────────────────────────
-- 4. Trigger updated_at
-- ────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists contracts_set_updated_at on public.contracts;
create trigger contracts_set_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

-- ────────────────────────────────────────────────────────────────────────────
-- 5. Row Level Security
-- ────────────────────────────────────────────────────────────────────────────

alter table public.contracts        enable row level security;
alter table public.notification_log enable row level security;
alter table public.xlsx_uploads     enable row level security;

drop policy if exists "contracts_auth_read"   on public.contracts;
drop policy if exists "contracts_auth_write"  on public.contracts;
drop policy if exists "contracts_anon_read"   on public.contracts;
create policy "contracts_auth_read"  on public.contracts for select using (auth.role() = 'authenticated');
create policy "contracts_auth_write" on public.contracts for all    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');
create policy "contracts_anon_read"  on public.contracts for select using (true);

drop policy if exists "notification_log_auth_read"  on public.notification_log;
drop policy if exists "notification_log_auth_write" on public.notification_log;
create policy "notification_log_auth_read"  on public.notification_log for select using (auth.role() = 'authenticated');
create policy "notification_log_auth_write" on public.notification_log for insert with check (auth.role() = 'authenticated');

drop policy if exists "xlsx_uploads_auth" on public.xlsx_uploads;
create policy "xlsx_uploads_auth" on public.xlsx_uploads for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ────────────────────────────────────────────────────────────────────────────
-- 6. Reload do cache de schema do PostgREST
--    (evita erro "Could not find the 'xxx' column of 'contracts'
--     in the schema cache" depois de adicionar/alterar colunas)
-- ────────────────────────────────────────────────────────────────────────────

notify pgrst, 'reload schema';
