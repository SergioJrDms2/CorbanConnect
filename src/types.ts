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

  // Financial extras (from real xlsx)
  tabela: string | null;
  taxaJurosAm: number | null;
  taxaCetAm: number | null;
  valorComissao: number | null;
  dataPrimeiroVcto: string | null;
  dataUltimoVcto: string | null;
  nroPropBanco: string | null;

  // Employer
  empregador: string | null;
  orgaoSecretaria: string | null;

  // People
  gerenteRespPromotora: string | null;
  usuarioDigitador: string | null;

  // Location
  cidade: string | null;
  uf: string | null;

  // Corban / matrix
  corbanName: string | null;
  nomeMatriz: string | null;
  pontoDeVenda: string | null;
  tipoProposta: string | null;
}

export type ViewId =
  | 'home'
  | 'client-login'
  | 'client-status'
  | 'corban-login'
  | 'corban-dashboard'
  | 'corban-contract'
  | 'internal-login'
  | 'internal-dashboard'
  | 'notifications';

export type ToneColor = 'amber' | 'sky' | 'red' | 'emerald' | 'slate' | 'violet';
