-- Corban authentication identifier.
--
-- Extracted automatically from the "NOME PROMOTORA" column of the XLSX export
-- (e.g. "64.839.379 EDLEA BARBOSA" → corban_cnpj="64839379").
--
-- The Corban portal uses this as the sole login identifier — no password,
-- no separate signup. It mirrors the client flow (CPF + birth) but for the
-- Corban it's just their CNPJ prefix.

alter table public.contracts
  add column if not exists corban_cnpj text;

create index if not exists contracts_corban_cnpj_idx on public.contracts (corban_cnpj);
