import type { ContractStatus } from '../types';
import { STATUS_CONFIG } from './theme';
import type { ContractRow } from './contracts';

type XlsxModule = typeof import('xlsx');

let xlsxPromise: Promise<XlsxModule> | null = null;
function loadXlsx(): Promise<XlsxModule> {
  if (!xlsxPromise) xlsxPromise = import('xlsx');
  return xlsxPromise;
}

const EXPECTED_COLUMNS = [
  'contract_id',
  'client_name',
  'client_cpf',
  'client_phone',
  'client_birth',
  'corban_name',
  'product',
  'amount',
  'installments',
  'installment_value',
  'status',
  'pendency_type',
  'pendency_description',
  'pendency_days',
  'last_update',
] as const;

type ExpectedColumn = (typeof EXPECTED_COLUMNS)[number];

function isContractStatus(v: unknown): v is ContractStatus {
  return (
    typeof v === 'string' &&
    ['pending_docs', 'credit_analysis', 'at_risk', 'formalized', 'canceled'].includes(v)
  );
}

function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const parsed = Number(String(v).replace(/\./g, '').replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function toString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' ? null : s;
}

export interface ParsedXlsx {
  rows: ContractRow[];
  errors: string[];
  warnings: string[];
}

export async function parseContractsXlsx(file: File): Promise<ParsedXlsx> {
  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];

  if (!sheet) {
    return { rows: [], errors: ['Planilha sem abas válidas.'], warnings: [] };
  }

  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: null });
  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: ContractRow[] = [];

  if (records.length === 0) {
    errors.push('A planilha não contém linhas.');
    return { rows, errors, warnings };
  }

  const firstRow = records[0];
  const missing: ExpectedColumn[] = EXPECTED_COLUMNS.filter(
    (col) => !(col in firstRow) && col !== 'client_phone' && col !== 'client_birth' &&
      col !== 'corban_name' && col !== 'pendency_type' && col !== 'pendency_description' &&
      col !== 'pendency_days' && col !== 'last_update',
  );
  if (missing.length > 0) {
    errors.push(`Colunas obrigatórias ausentes: ${missing.join(', ')}.`);
  }

  records.forEach((r, idx) => {
    const lineNum = idx + 2;
    const id = toString(r.contract_id);
    const name = toString(r.client_name);
    const cpfRaw = toString(r.client_cpf);
    const statusRaw = toString(r.status);

    if (!id) {
      errors.push(`Linha ${lineNum}: contract_id ausente.`);
      return;
    }
    if (!name) {
      errors.push(`Linha ${lineNum}: client_name ausente.`);
      return;
    }
    if (!cpfRaw) {
      errors.push(`Linha ${lineNum}: client_cpf ausente.`);
      return;
    }
    if (!isContractStatus(statusRaw)) {
      errors.push(
        `Linha ${lineNum}: status inválido "${statusRaw}". Use: pending_docs, credit_analysis, at_risk, formalized, canceled.`,
      );
      return;
    }

    const cpf = cpfRaw.replace(/\D/g, '');
    if (cpf.length !== 11) {
      warnings.push(`Linha ${lineNum}: CPF ${cpfRaw} não possui 11 dígitos.`);
    }

    const pendencyType = toString(r.pendency_type);
    const pendencyDays = toNumber(r.pendency_days);

    rows.push({
      id,
      client_name: name,
      client_cpf: cpf,
      client_phone: toString(r.client_phone),
      client_birth: toString(r.client_birth),
      corban_name: toString(r.corban_name),
      product: toString(r.product),
      amount: toNumber(r.amount),
      installments: toNumber(r.installments) ?? 0,
      installment_value: toNumber(r.installment_value),
      status: statusRaw,
      status_label: STATUS_CONFIG[statusRaw]?.label ?? statusRaw,
      pendency_type: pendencyType,
      pendency_description: toString(r.pendency_description),
      pendency_days: pendencyType ? (pendencyDays ?? 0) : null,
      last_update: toString(r.last_update),
      timeline: null,
      notifications: null,
    });
  });

  return { rows, errors, warnings };
}

export async function downloadContractsTemplate(): Promise<void> {
  const XLSX = await loadXlsx();
  const headers = EXPECTED_COLUMNS;
  const exampleRow: Record<ExpectedColumn, string | number> = {
    contract_id: 'CTR-2026-00412',
    client_name: 'Maria Aparecida Silva',
    client_cpf: '12345678901',
    client_phone: '(11) 98765-4321',
    client_birth: '15/03/1968',
    corban_name: 'Ricardo Almeida',
    product: 'Crédito Consignado INSS',
    amount: 8500,
    installments: 72,
    installment_value: 198.54,
    status: 'pending_docs',
    pendency_type: 'Holerite ilegível',
    pendency_description: 'Reenviar holerite em alta resolução.',
    pendency_days: 9,
    last_update: '22/04/2026 · 09:12',
  };

  const sheet = XLSX.utils.json_to_sheet([exampleRow], { header: headers as unknown as string[] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'contratos');
  XLSX.writeFile(wb, 'corban-connect-template.xlsx');
}
