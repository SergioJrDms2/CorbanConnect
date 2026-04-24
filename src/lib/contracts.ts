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
  corban_cnpj: string | null;
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

  // ── Internal team observations ────────────────────────────────────────
  ultima_observacao: string | null;
  motivo_recusa: string | null;

  // ── Identification ────────────────────────────────────────────────────
  matricula: string | null;
  nro_proposta: string | null;
  nro_proposta_banco: string | null;
  nro_contrato_externo: string | null;

  // ── Financial details ─────────────────────────────────────────────────
  tabela: string | null;
  taxa_juros_am: number | null;
  taxa_juros_aa: number | null;
  taxa_cet_am: number | null;
  taxa_cet_aa: number | null;
  valor_solicitado: number | null;
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
  tipo_produto: string | null;
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
      rg: row.rg_cliente ?? null,
      naturalidade: row.naturalidade ?? null,
      estadoCivil: row.estado_civil ?? null,
      sexo: row.sexo ?? null,
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

    ultimaObservacao: row.ultima_observacao ?? null,
    motivoRecusa: row.motivo_recusa ?? null,
    atividade: row.atividade ?? null,

    nroProposta: row.nro_proposta ?? null,
    nroPropBanco: row.nro_proposta_banco ?? null,
    nroContratoExterno: row.nro_contrato_externo ?? null,
    nroCartao: row.nro_cartao ?? null,
    idFormalizacao: row.id_formalizacao ?? null,

    tabela: row.tabela ?? null,
    valorSolicitado: row.valor_solicitado ?? null,
    valorIof: row.valor_iof ?? null,
    valorFinanciado: row.valor_financiado ?? null,
    valorTed: row.valor_ted ?? null,
    valorComissao: row.valor_comissao ?? null,
    valorSegurado: row.valor_segurado ?? null,
    valorSeguro: row.valor_seguro ?? null,
    rmc: row.rmc ?? null,
    limiteTotal: row.limite_total ?? null,
    limiteCompras: row.limite_compras ?? null,
    limiteSaque: row.limite_saque ?? null,

    taxaJurosAm: row.taxa_juros_am ?? null,
    taxaJurosAa: row.taxa_juros_aa ?? null,
    taxaCetAm: row.taxa_cet_am ?? null,
    taxaCetAa: row.taxa_cet_aa ?? null,
    dataPrimeiroVcto: row.data_primeiro_vcto ?? null,
    dataUltimoVcto: row.data_ultimo_vcto ?? null,
    dataDigitacao: row.data_digitacao ?? null,
    horaDigitacao: row.hora_digitacao ?? null,

    empregador: row.empregador ?? null,
    orgaoSecretaria: row.orgao_secretaria ?? null,
    codigoEmpregador: row.codigo_empregador ?? null,
    sindicato: row.sindicato ?? null,

    gerenteComercial: row.gerente_comercial ?? null,
    gerenteRespPromotora: row.gerente_resp_promotora ?? null,
    usuarioDigitador: row.usuario_digitador ?? null,

    endereco: row.endereco ?? null,
    bairro: row.bairro ?? null,
    cidade: row.cidade ?? null,
    uf: row.uf ?? null,
    cep: row.cep ?? null,

    banco: row.banco ?? null,
    agencia: row.agencia ?? null,
    conta: row.conta ?? null,
    contaDv: row.conta_dv ?? null,

    cpfReprLegal: row.cpf_repr_legal ?? null,
    nomeReprLegal: row.nome_repr_legal ?? null,

    corbanName: row.corban_name ?? null,
    corbanCnpj: row.corban_cnpj ?? null,
    nomeMatriz: row.nome_matriz ?? null,
    pontoDeVenda: row.ponto_de_venda ?? null,
    tipoProposta: row.tipo_proposta ?? null,
    tipoProduto: row.tipo_produto ?? null,
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
    corban_cnpj: c.corbanCnpj ?? null,
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
    ultima_observacao: c.ultimaObservacao ?? null,
    motivo_recusa: c.motivoRecusa ?? null,
    matricula: c.client.matricula ?? null,
    nro_proposta: c.nroProposta ?? null,
    nro_proposta_banco: c.nroPropBanco ?? null,
    nro_contrato_externo: c.nroContratoExterno ?? null,
    tabela: c.tabela ?? null,
    taxa_juros_am: c.taxaJurosAm ?? null,
    taxa_juros_aa: c.taxaJurosAa ?? null,
    taxa_cet_am: c.taxaCetAm ?? null,
    taxa_cet_aa: c.taxaCetAa ?? null,
    valor_solicitado: c.valorSolicitado ?? null,
    valor_comissao: c.valorComissao ?? null,
    valor_iof: c.valorIof ?? null,
    valor_financiado: c.valorFinanciado ?? null,
    valor_ted: c.valorTed ?? null,
    valor_segurado: c.valorSegurado ?? null,
    valor_seguro: c.valorSeguro ?? null,
    limite_total: c.limiteTotal ?? null,
    limite_compras: c.limiteCompras ?? null,
    limite_saque: c.limiteSaque ?? null,
    rmc: c.rmc ?? null,
    data_primeiro_vcto: c.dataPrimeiroVcto ?? null,
    data_ultimo_vcto: c.dataUltimoVcto ?? null,
    data_digitacao: c.dataDigitacao ?? null,
    hora_digitacao: c.horaDigitacao ?? null,
    empregador: c.empregador ?? null,
    orgao_secretaria: c.orgaoSecretaria ?? null,
    codigo_empregador: c.codigoEmpregador ?? null,
    sindicato: c.sindicato ?? null,
    gerente_comercial: c.gerenteComercial ?? null,
    gerente_resp_promotora: c.gerenteRespPromotora ?? null,
    usuario_digitador: c.usuarioDigitador ?? null,
    email_cliente: c.client.email ?? null,
    rg_cliente: c.client.rg ?? null,
    naturalidade: c.client.naturalidade ?? null,
    estado_civil: c.client.estadoCivil ?? null,
    sexo: c.client.sexo ?? null,
    endereco: c.endereco ?? null,
    bairro: c.bairro ?? null,
    cidade: c.cidade ?? null,
    uf: c.uf ?? null,
    cep: c.cep ?? null,
    banco: c.banco ?? null,
    agencia: c.agencia ?? null,
    conta: c.conta ?? null,
    conta_dv: c.contaDv ?? null,
    atividade: c.atividade ?? null,
    tipo_proposta: c.tipoProposta ?? null,
    tipo_produto: c.tipoProduto ?? null,
    nome_matriz: c.nomeMatriz ?? null,
    ponto_de_venda: c.pontoDeVenda ?? null,
    nro_cartao: c.nroCartao ?? null,
    id_formalizacao: c.idFormalizacao ?? null,
    cpf_repr_legal: c.cpfReprLegal ?? null,
    nome_repr_legal: c.nomeReprLegal ?? null,
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

/**
 * Look up ALL contracts belonging to a CPF + birth combination.
 * A client can have multiple open contracts (e.g. cartão RMC + empréstimo).
 */
export async function fetchContractsByCpfAndBirth(
  cpf: string,
  birth: string,
): Promise<Contract[]> {
  const normalizedCpf = cpf.replace(/\D/g, '');

  const fromMock = () =>
    MOCK_CONTRACTS.filter(
      (c) =>
        c.client.cpf.replace(/\D/g, '') === normalizedCpf && c.client.birth === birth,
    );

  if (!supabase) return fromMock();

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('client_cpf', normalizedCpf)
    .eq('client_birth', birth)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch contracts:', error.message);
    return [];
  }
  if (!data || data.length === 0) return fromMock();
  return (data as ContractRow[]).map(rowToContract);
}

/**
 * Look up ALL contracts belonging to a Corban by their CNPJ (the identifier
 * extracted from the "NOME PROMOTORA" column of the XLSX — e.g. "64.839.379").
 * Returns an empty array if none found. The Corban portal uses this as login:
 * if at least one contract matches, the Corban is "authenticated".
 */
export async function fetchContractsByCorbanCnpj(cnpj: string): Promise<Contract[]> {
  const normalized = cnpj.replace(/\D/g, '');
  if (!normalized) return [];

  const fromMock = () =>
    MOCK_CONTRACTS.filter(
      (c) => (c.corbanCnpj ?? '').replace(/\D/g, '') === normalized,
    );

  if (!supabase) return fromMock();

  const { data, error } = await supabase
    .from('contracts')
    .select('*')
    .eq('corban_cnpj', normalized)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch contracts by corban:', error.message);
    return [];
  }
  if (!data || data.length === 0) return fromMock();
  return (data as ContractRow[]).map(rowToContract);
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
