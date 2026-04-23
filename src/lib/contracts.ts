import { STATUS_CONFIG } from './theme';
import { MOCK_CONTRACTS } from '../data/mockContracts';
import { supabase } from './supabase';
import type {
  Contract,
  ContractStatus,
  NotificationEvent,
  Pendency,
  TimelineStep,
} from '../types';

export interface ContractRow {
  // ── Core (always present) ─────────────────────────────────────────────
  id: string;
  client_name: string;
  client_cpf: string;
  client_phone: string | null;
  client_birth: string | null;
  corban_name: string | null;
  product: string | null;
  amount: number | null;
  installments: number | null;
  installment_value: number | null;
  status: ContractStatus;
  status_label: string | null;
  pendency_type: string | null;
  pendency_description: string | null;
  pendency_days: number | null;
  last_update: string | null;
  timeline: TimelineStep[] | null;
  notifications: NotificationEvent[] | null;

  // ── Identification ────────────────────────────────────────────────────
  matricula: string | null;
  nro_proposta_banco: string | null;

  // ── Financial details ─────────────────────────────────────────────────
  tabela: string | null;
  taxa_juros_am: number | null;
  taxa_juros_aa: number | null;
  taxa_cet_am: number | null;
  taxa_cet_aa: number | null;
  valor_comissao: number | null;
  valor_iof: number | null;
  valor_financiado: number | null;
  valor_ted: number | null;
  valor_segurado: number | null;
  valor_seguro: number | null;
  limite_total: number | null;
  limite_compras: number | null;
  limite_saque: number | null;
  rmc: number | null;

  // ── Dates ─────────────────────────────────────────────────────────────
  data_primeiro_vcto: string | null;
  data_ultimo_vcto: string | null;
  data_digitacao: string | null;
  hora_digitacao: string | null;

  // ── Employer / organ ──────────────────────────────────────────────────
  empregador: string | null;
  orgao_secretaria: string | null;
  codigo_empregador: string | null;
  sindicato: string | null;

  // ── People ────────────────────────────────────────────────────────────
  gerente_comercial: string | null;
  gerente_resp_promotora: string | null;
  usuario_digitador: string | null;

  // ── Client extras ─────────────────────────────────────────────────────
  email_cliente: string | null;
  rg_cliente: string | null;
  naturalidade: string | null;
  estado_civil: string | null;
  sexo: string | null;

  // ── Address ───────────────────────────────────────────────────────────
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;

  // ── Banking ───────────────────────────────────────────────────────────
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  conta_dv: string | null;

  // ── Proposal meta ─────────────────────────────────────────────────────
  atividade: string | null;
  tipo_proposta: string | null;
  nome_matriz: string | null;
  ponto_de_venda: string | null;

  // ── Card / formalization IDs ──────────────────────────────────────────
  nro_cartao: string | null;
  id_formalizacao: string | null;

  // ── Legal representative ──────────────────────────────────────────────
  cpf_repr_legal: string | null;
  nome_repr_legal: string | null;
}

function defaultTimeline(status: ContractStatus): TimelineStep[] {
  const order: Array<{ step: string; key: ContractStatus | 'done' }> = [
    { step: 'Proposta iniciada', key: 'done' },
    { step: 'Dados cadastrais', key: 'done' },
    { step: 'Análise de crédito', key: 'credit_analysis' },
    { step: 'Documentação', key: 'pending_docs' },
    { step: 'Formalização', key: 'formalized' },
    { step: 'Liberação', key: 'done' },
  ];

  const currentIndex = (() => {
    switch (status) {
      case 'credit_analysis':
        return 2;
      case 'pending_docs':
      case 'at_risk':
        return 3;
      case 'formalized':
        return 5;
      case 'canceled':
        return -1;
      default:
        return 3;
    }
  })();

  return order.map((o, i) => ({
    step: o.step,
    date: '—',
    done: i < currentIndex,
    current: i === currentIndex,
  }));
}

function rowToContract(row: ContractRow): Contract {
  const pendency: Pendency | null = row.pendency_type
    ? {
        type: row.pendency_type,
        description: row.pendency_description ?? '',
        days: row.pendency_days ?? 0,
      }
    : null;

  const timeline =
    Array.isArray(row.timeline) && row.timeline.length > 0
      ? row.timeline
      : defaultTimeline(row.status);

  return {
    id: row.id,
    client: {
      name: row.client_name,
      cpf: row.client_cpf,
      phone: row.client_phone ?? '',
      birth: row.client_birth ?? '',
      email: row.email_cliente ?? '',
      matricula: row.matricula ?? '',
    },
    product: row.product ?? '—',
    amount: Number(row.amount ?? 0),
    installments: Number(row.installments ?? 0),
    installmentValue: Number(row.installment_value ?? 0),
    status: row.status,
    statusLabel: row.status_label ?? STATUS_CONFIG[row.status]?.label ?? row.status,
    pendency,
    lastUpdate: row.last_update ?? '—',
    timeline,
    notifications: Array.isArray(row.notifications) ? row.notifications : [],

    // Financial extras
    tabela: row.tabela ?? null,
    taxaJurosAm: row.taxa_juros_am ?? null,
    taxaCetAm: row.taxa_cet_am ?? null,
    valorComissao: row.valor_comissao ?? null,
    dataPrimeiroVcto: row.data_primeiro_vcto ?? null,
    dataUltimoVcto: row.data_ultimo_vcto ?? null,
    nroPropBanco: row.nro_proposta_banco ?? null,

    // Employer
    empregador: row.empregador ?? null,
    orgaoSecretaria: row.orgao_secretaria ?? null,

    // People
    gerenteRespPromotora: row.gerente_resp_promotora ?? null,
    usuarioDigitador: row.usuario_digitador ?? null,

    // Location
    cidade: row.cidade ?? null,
    uf: row.uf ?? null,

    // Corban
    corbanName: row.corban_name ?? null,
    nomeMatriz: row.nome_matriz ?? null,
    pontoDeVenda: row.ponto_de_venda ?? null,
    tipoProposta: row.tipo_proposta ?? null,
  };
}

export function contractToRow(c: Contract, corbanName?: string): ContractRow {
  return {
    id: c.id,
    client_name: c.client.name,
    client_cpf: c.client.cpf,
    client_phone: c.client.phone || null,
    client_birth: c.client.birth || null,
    corban_name: corbanName ?? c.corbanName ?? null,
    product: c.product,
    amount: c.amount,
    installments: c.installments,
    installment_value: c.installmentValue,
    status: c.status,
    status_label: c.statusLabel,
    pendency_type: c.pendency?.type ?? null,
    pendency_description: c.pendency?.description ?? null,
    pendency_days: c.pendency?.days ?? null,
    last_update: c.lastUpdate,
    timeline: c.timeline,
    notifications: c.notifications,
    matricula: c.client.matricula ?? null,
    nro_proposta_banco: c.nroPropBanco ?? null,
    tabela: c.tabela ?? null,
    taxa_juros_am: c.taxaJurosAm ?? null,
    taxa_juros_aa: null,
    taxa_cet_am: c.taxaCetAm ?? null,
    taxa_cet_aa: null,
    valor_comissao: c.valorComissao ?? null,
    valor_iof: null,
    valor_financiado: null,
    valor_ted: null,
    valor_segurado: null,
    valor_seguro: null,
    limite_total: null,
    limite_compras: null,
    limite_saque: null,
    rmc: null,
    data_primeiro_vcto: c.dataPrimeiroVcto ?? null,
    data_ultimo_vcto: c.dataUltimoVcto ?? null,
    data_digitacao: null,
    hora_digitacao: null,
    empregador: c.empregador ?? null,
    orgao_secretaria: c.orgaoSecretaria ?? null,
    codigo_empregador: null,
    sindicato: null,
    gerente_comercial: null,
    gerente_resp_promotora: c.gerenteRespPromotora ?? null,
    usuario_digitador: c.usuarioDigitador ?? null,
    email_cliente: c.client.email ?? null,
    rg_cliente: null,
    naturalidade: null,
    estado_civil: null,
    sexo: null,
    endereco: null,
    bairro: null,
    cidade: c.cidade ?? null,
    uf: c.uf ?? null,
    cep: null,
    banco: null,
    agencia: null,
    conta: null,
    conta_dv: null,
    atividade: null,
    tipo_proposta: c.tipoProposta ?? null,
    nome_matriz: c.nomeMatriz ?? null,
    ponto_de_venda: c.pontoDeVenda ?? null,
    nro_cartao: null,
    id_formalizacao: null,
    cpf_repr_legal: null,
    nome_repr_legal: null,
  };
}

export async function fetchContracts(): Promise<Contract[]> {
  if (!supabase) return MOCK_CONTRACTS;

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch contracts from Supabase:', error.message);
    return MOCK_CONTRACTS;
  }
  if (!data || data.length === 0) return MOCK_CONTRACTS;

  return (data as ContractRow[]).map(rowToContract);
}

export async function fetchContractByCpfAndBirth(
  cpf: string,
  birth: string,
): Promise<Contract | null> {
  const normalizedCpf = cpf.replace(/\D/g, '');

  if (!supabase) {
    return (
      MOCK_CONTRACTS.find(
        (c) =>
          c.client.cpf.replace(/\D/g, '') === normalizedCpf && c.client.birth === birth,
      ) ?? null
    );
  }

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('client_cpf', normalizedCpf)
    .eq('client_birth', birth)
    .limit(1);

  if (error) {
    console.error('Failed to fetch contract:', error.message);
    return null;
  }
  if (!data || data.length === 0) {
    return (
      MOCK_CONTRACTS.find(
        (c) =>
          c.client.cpf.replace(/\D/g, '') === normalizedCpf && c.client.birth === birth,
      ) ?? null
    );
  }
  return rowToContract(data[0] as ContractRow);
}

export interface UpsertResult {
  inserted: number;
  error?: string;
}

export async function upsertContracts(rows: ContractRow[]): Promise<UpsertResult> {
  if (!supabase) {
    return { inserted: 0, error: 'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY.' };
  }
  if (rows.length === 0) return { inserted: 0, error: 'Planilha vazia.' };

  const { error } = await supabase.from('contracts').upsert(rows, { onConflict: 'id' });
  if (error) return { inserted: 0, error: error.message };

  const { data: user } = await supabase.auth.getUser();
  await supabase.from('xlsx_uploads').insert({
    uploaded_by: user.user?.id ?? null,
    row_count: rows.length,
  });

  return { inserted: rows.length };
}

export async function deleteContract(id: string): Promise<{ error?: string }> {
  if (!supabase) return { error: 'Supabase não configurado.' };
  const { error } = await supabase.from('contracts').delete().eq('id', id);
  return error ? { error: error.message } : {};
}
