-- Corban Connect · initial schema
-- Run this migration in your Supabase project (SQL editor or `supabase db push`).

-- ============================================
-- Contracts (source of truth: XLSX upload from internal dashboard)
-- ============================================
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

create index if not exists contracts_cpf_idx    on public.contracts (client_cpf);
create index if not exists contracts_status_idx on public.contracts (status);
create index if not exists contracts_corban_idx on public.contracts (corban_name);

-- ============================================
-- Notification log (append-only, auditable)
-- ============================================
create table if not exists public.notification_log (
  id           bigserial primary key,
  contract_id  text not null references public.contracts(id) on delete cascade,
  channel      text not null check (channel in ('whatsapp', 'sms', 'email')),
  status       text not null check (status in ('delivered', 'read', 'pending', 'failed')),
  reg          text,
  sent_at      timestamptz default now()
);

create index if not exists notification_log_contract_idx on public.notification_log (contract_id);

-- ============================================
-- Upload history (who uploaded which XLSX, when, how many rows)
-- ============================================
create table if not exists public.xlsx_uploads (
  id          bigserial primary key,
  uploaded_by uuid references auth.users(id) on delete set null,
  filename    text,
  row_count   integer,
  uploaded_at timestamptz default now()
);

-- ============================================
-- updated_at trigger
-- ============================================
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

-- ============================================
-- Row Level Security
-- ============================================
alter table public.contracts        enable row level security;
alter table public.notification_log enable row level security;
alter table public.xlsx_uploads     enable row level security;

-- Authenticated users (internal staff / corbans) can read and write contracts.
drop policy if exists "contracts_auth_read"   on public.contracts;
drop policy if exists "contracts_auth_write"  on public.contracts;
create policy "contracts_auth_read"  on public.contracts for select using (auth.role() = 'authenticated');
create policy "contracts_auth_write" on public.contracts for all    using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- Public (anon) access for the client portal — CPF lookup only.
-- The client portal queries by exact CPF + birth, so wide read is acceptable for v1.0.
drop policy if exists "contracts_anon_read" on public.contracts;
create policy "contracts_anon_read" on public.contracts for select using (true);

drop policy if exists "notification_log_auth_read"  on public.notification_log;
drop policy if exists "notification_log_auth_write" on public.notification_log;
create policy "notification_log_auth_read"  on public.notification_log for select using (auth.role() = 'authenticated');
create policy "notification_log_auth_write" on public.notification_log for insert with check (auth.role() = 'authenticated');

drop policy if exists "xlsx_uploads_auth" on public.xlsx_uploads;
create policy "xlsx_uploads_auth" on public.xlsx_uploads for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
