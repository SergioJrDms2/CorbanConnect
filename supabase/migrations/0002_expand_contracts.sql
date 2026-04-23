-- Expand the contracts table with all fields from the real "Relatório de Produção Analítico"
-- XLSX export, including internal team observations, financial detail, banking, address and
-- proposal identifiers.

alter table public.contracts
  -- ── Internal team observations (always captured) ──────────────────────────
  add column if not exists ultima_observacao    text,
  add column if not exists motivo_recusa        text,
  add column if not exists atividade            text,

  -- ── Proposal identifiers ──────────────────────────────────────────────────
  add column if not exists nro_proposta         text,
  add column if not exists nro_proposta_banco   text,
  add column if not exists nro_contrato_externo text,
  add column if not exists nro_cartao           text,
  add column if not exists id_formalizacao      text,

  -- ── Financial ─────────────────────────────────────────────────────────────
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

  -- ── Rates & schedule ──────────────────────────────────────────────────────
  add column if not exists taxa_juros_am        numeric(8, 4),
  add column if not exists taxa_juros_aa        numeric(8, 4),
  add column if not exists taxa_cet_am          numeric(8, 4),
  add column if not exists taxa_cet_aa          numeric(8, 4),
  add column if not exists data_primeiro_vcto   text,
  add column if not exists data_ultimo_vcto     text,
  add column if not exists data_digitacao       text,
  add column if not exists hora_digitacao       text,

  -- ── Employer ──────────────────────────────────────────────────────────────
  add column if not exists empregador           text,
  add column if not exists orgao_secretaria     text,
  add column if not exists codigo_empregador    text,
  add column if not exists sindicato            text,

  -- ── Team ──────────────────────────────────────────────────────────────────
  add column if not exists gerente_comercial       text,
  add column if not exists gerente_resp_promotora  text,
  add column if not exists usuario_digitador       text,

  -- ── Client extras ─────────────────────────────────────────────────────────
  add column if not exists email_cliente        text,
  add column if not exists rg_cliente           text,
  add column if not exists naturalidade         text,
  add column if not exists estado_civil         text,
  add column if not exists sexo                 text,

  -- ── Address ───────────────────────────────────────────────────────────────
  add column if not exists endereco             text,
  add column if not exists bairro               text,
  add column if not exists cidade               text,
  add column if not exists uf                   text,
  add column if not exists cep                  text,

  -- ── Banking ───────────────────────────────────────────────────────────────
  add column if not exists banco                text,
  add column if not exists agencia              text,
  add column if not exists conta                text,
  add column if not exists conta_dv             text,

  -- ── Legal representative ──────────────────────────────────────────────────
  add column if not exists cpf_repr_legal       text,
  add column if not exists nome_repr_legal      text,

  -- ── Proposal meta / corban hierarchy ──────────────────────────────────────
  add column if not exists tipo_proposta        text,
  add column if not exists tipo_produto         text,
  add column if not exists nome_matriz          text,
  add column if not exists ponto_de_venda       text;

create index if not exists contracts_empregador_idx on public.contracts (empregador);
create index if not exists contracts_nro_proposta_idx on public.contracts (nro_proposta);
