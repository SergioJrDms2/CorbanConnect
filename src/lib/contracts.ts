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

interface ContractRow {
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
  };
}

export function contractToRow(c: Contract, corbanName?: string): ContractRow {
  return {
    id: c.id,
    client_name: c.client.name,
    client_cpf: c.client.cpf,
    client_phone: c.client.phone || null,
    client_birth: c.client.birth || null,
    corban_name: corbanName ?? null,
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
    // Fallback to mock so demo flow still works
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

export type { ContractRow };
