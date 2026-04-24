export type ContractStatus =
  | 'pending_docs'
  | 'credit_analysis'
  | 'at_risk'
  | 'formalized'
  | 'canceled';

export type NotificationChannel = 'whatsapp' | 'sms' | 'email';

export type NotificationStatus = 'delivered' | 'read' | 'pending' | 'failed';

export interface NotificationEvent {
  channel: NotificationChannel;
  date: string;
  status: NotificationStatus;
  reg: string;
}

export interface TimelineStep {
  step: string;
  date: string;
  done: boolean;
  current?: boolean;
}

export interface Pendency {
  type: string;
  description: string;
  days: number;
}

export interface ContractClient {
  name: string;
  cpf: string;
  phone: string;
  birth: string;
  email?: string;
  matricula?: string;
  rg?: string | null;
  naturalidade?: string | null;
  estadoCivil?: string | null;
  sexo?: string | null;
}

export interface Contract {
  id: string;
  client: ContractClient;
  product: string;
  amount: number;
  installments: number;
  installmentValue: number;
  status: ContractStatus;
  statusLabel: string;
  pendency: Pendency | null;
  lastUpdate: string;
  timeline: TimelineStep[];
  notifications: NotificationEvent[];

  // ── Internal team observations ─────────────────────────────
  ultimaObservacao: string | null;
  motivoRecusa: string | null;
  atividade: string | null;

  // ── Proposal / identifiers ─────────────────────────────────
  nroProposta: string | null;
  nroPropBanco: string | null;
  nroContratoExterno: string | null;
  nroCartao: string | null;
  idFormalizacao: string | null;

  // ── Financial ──────────────────────────────────────────────
  tabela: string | null;
  valorSolicitado: number | null;
  valorIof: number | null;
  valorFinanciado: number | null;
  valorTed: number | null;
  valorComissao: number | null;
  valorSegurado: number | null;
  valorSeguro: number | null;
  rmc: number | null;
  limiteTotal: number | null;
  limiteCompras: number | null;
  limiteSaque: number | null;

  // ── Rates & schedule ───────────────────────────────────────
  taxaJurosAm: number | null;
  taxaJurosAa: number | null;
  taxaCetAm: number | null;
  taxaCetAa: number | null;
  dataPrimeiroVcto: string | null;
  dataUltimoVcto: string | null;
  dataDigitacao: string | null;
  horaDigitacao: string | null;

  // ── Employer ───────────────────────────────────────────────
  empregador: string | null;
  orgaoSecretaria: string | null;
  codigoEmpregador: string | null;
  sindicato: string | null;

  // ── Team ───────────────────────────────────────────────────
  gerenteComercial: string | null;
  gerenteRespPromotora: string | null;
  usuarioDigitador: string | null;

  // ── Address ────────────────────────────────────────────────
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;

  // ── Banking ────────────────────────────────────────────────
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  contaDv: string | null;

  // ── Legal representative ──────────────────────────────────
  cpfReprLegal: string | null;
  nomeReprLegal: string | null;

  // ── Corban / matrix ────────────────────────────────────────
  corbanName: string | null;
  corbanCnpj: string | null;
  nomeMatriz: string | null;
  pontoDeVenda: string | null;
  tipoProposta: string | null;
  tipoProduto: string | null;
}

export type ViewId =
  | 'home'
  | 'client-login'
  | 'client-contracts'
  | 'client-status'
  | 'corban-login'
  | 'corban-dashboard'
  | 'corban-contract'
  | 'internal-login'
  | 'internal-dashboard'
  | 'notifications';

export type ToneColor = 'amber' | 'sky' | 'red' | 'emerald' | 'slate' | 'violet';
