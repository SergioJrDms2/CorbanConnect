/**
 * xlsx.ts — parser for the system's "Relatório de Produção Analítico" export.
 *
 * Supported spreadsheet format (columns from the banking system):
 *   NOME MATRIZ, NOME PROMOTORA, Ponto de Venda, Situação, Atividade,
 *   Motivo Recusa/Pendência, Tipo Proposta, Tipo Produto, Código Empregador,
 *   Empregador, Órgão/Secretaria, Sindicato, Gerente Comercial, Nome Cliente,
 *   CPF/CNPJ, Matrícula, Data de Nascimento, Telefone Residencial,
 *   Telefone Celular, E-Mail, CPF Repr Legal, Nome Repr Legal,
 *   Data Digitação, Hora Digitação, Data Movimentação, Hora Movimentação,
 *   Nro Proposta, Nro Proposta Banco, Nro Contrato Externo, Nro Cartão,
 *   ID Formalização, RMC, Limite Total, Limite Compras, Limite Saque,
 *   Valor Solicitado, Valor Liberado, Valor IOF, Valor Financiado,
 *   Valor da Parcela, Valor Comissão, Valor Segurado, Valor Seguro,
 *   Prazo, Taxa de Juros A.M., Taxa de Juros A.A., Taxa CET A.M.,
 *   Taxa CET A.A., Data 1º Vcto, Data Ult Vcto, Tabela, Valor da TED,
 *   Banco, Agência, Conta, DV, RG, Naturalidade, Estado Civil, Sexo,
 *   Endereço, Número, Complemento, Bairro, CEP, Cidade, UF,
 *   Usuário Digitador, Última Observação, Gerente Resp. Promotora
 *
 * Situação → ContractStatus mapping:
 *   INT → formalized       (Integrado — pagamento liquidado)
 *   PEN → pending_docs     (Pendente — aguardando documentos)
 *   REP → canceled         (Reprovado/Recusado)
 *   SIM → credit_analysis  (Simulado)
 *   CAD → credit_analysis  (Cadastrado)
 *   AND → credit_analysis  (Em andamento)
 */

import type { ContractStatus } from '../types';
import { STATUS_CONFIG } from './theme';
import type { ContractRow } from './contracts';

type XlsxModule = typeof import('xlsx');

let xlsxPromise: Promise<XlsxModule> | null = null;
function loadXlsx(): Promise<XlsxModule> {
  if (!xlsxPromise) xlsxPromise = import('xlsx');
  return xlsxPromise;
}

// ─── Status mapping ────────────────────────────────────────────────────────

const SITUACAO_MAP: Record<string, ContractStatus> = {
  INT: 'formalized',
  PEN: 'pending_docs',
  REP: 'canceled',
  SIM: 'credit_analysis',
  CAD: 'credit_analysis',
  AND: 'credit_analysis',
};

// ─── Helpers ───────────────────────────────────────────────────────────────

/** Parse BR-format numbers: "1.234,56" → 1234.56 or plain 1234.56 */
function toNumber(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const s = String(v).trim().replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

function toString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s === 'null' || s === 'undefined' ? null : s;
}

/** Normalise a CPF/CNPJ string to digits only */
function normalizeCpf(v: string): string {
  return v.replace(/\D/g, '');
}

/**
 * Normalise a date cell which may arrive as:
 *  - JS Date object (from xlsx)
 *  - "18/01/1982 00:00:00"
 *  - "18/01/1982"
 * Returns "DD/MM/YYYY" or null.
 */
function normalizeDate(v: unknown): string | null {
  if (!v) return null;
  if (v instanceof Date) {
    const d = v.getDate().toString().padStart(2, '0');
    const m = (v.getMonth() + 1).toString().padStart(2, '0');
    const y = v.getFullYear();
    return `${d}/${m}/${y}`;
  }
  const s = String(v).trim();
  // "DD/MM/YYYY HH:MM:SS" → "DD/MM/YYYY"
  const match = s.match(/^(\d{2}\/\d{2}\/\d{4})/);
  if (match) return match[1];
  return null;
}

/** Normalise phone: strip leading country code noise, keep digits + spaces */
function normalizePhone(v: unknown): string | null {
  if (!v) return null;
  const s = String(v).trim();
  if (!s || s === ' ') return null;
  // "55 984144693" → "(98) 4144-693" style cleanup
  const digits = s.replace(/\D/g, '');
  if (!digits) return null;
  return s; // keep as-is from the system
}

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ParsedXlsx {
  rows: ContractRow[];
  errors: string[];
  warnings: string[];
}

// ─── Main parser ───────────────────────────────────────────────────────────

export async function parseContractsXlsx(file: File): Promise<ParsedXlsx> {
  const XLSX = await loadXlsx();
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  const sheet = wb.Sheets[wb.SheetNames[0]];

  if (!sheet) {
    return { rows: [], errors: ['Planilha sem abas válidas.'], warnings: [] };
  }

  const records = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
    raw: false, // Keep formatted values for dates
  });

  const errors: string[] = [];
  const warnings: string[] = [];
  const rows: ContractRow[] = [];

  if (records.length === 0) {
    errors.push('A planilha não contém linhas.');
    return { rows, errors, warnings };
  }

  // ── Detect format: system export vs. legacy template ─────────────────────
  const firstRow = records[0];
  const isSystemFormat = 'Nome Cliente' in firstRow || 'Situação' in firstRow;
  const isLegacyFormat = 'contract_id' in firstRow;

  if (!isSystemFormat && !isLegacyFormat) {
    errors.push(
      'Formato de planilha não reconhecido. ' +
        'Utilize o relatório exportado do sistema (com colunas "Nome Cliente", "Situação" etc.) ' +
        'ou o template da plataforma.',
    );
    return { rows, errors, warnings };
  }

  if (isLegacyFormat) {
    return parseLegacyFormat(records, errors, warnings);
  }

  // ── Parse system export format ────────────────────────────────────────────
  records.forEach((r, idx) => {
    const lineNum = idx + 2; // 1-indexed + header row

    // Required fields
    const nomeCliente = toString(r['Nome Cliente']);
    const cpfRaw = toString(r['CPF/CNPJ']);
    const situacaoRaw = toString(r['Situação'])?.toUpperCase().trim();

    if (!nomeCliente) {
      // Linha de subtotal, agrupamento ou em branco — ignorar silenciosamente
      return;
    }
    if (!cpfRaw) {
      errors.push(`Linha ${lineNum}: "CPF/CNPJ" ausente.`);
      return;
    }

    // Contract ID: prefer Nro Contrato Externo, fall back to Nro Proposta
    const nroContratoExterno = toString(r['Nro Contrato Externo']);
    const nroProposta = toString(r['Nro Proposta']);
    const contractId = nroContratoExterno ?? (nroProposta ? `PROP-${nroProposta}` : null);

    if (!contractId) {
      errors.push(`Linha ${lineNum}: Nenhum identificador de contrato (Nro Contrato Externo ou Nro Proposta).`);
      return;
    }

    // Status mapping
    const status: ContractStatus = situacaoRaw
      ? (SITUACAO_MAP[situacaoRaw] ?? 'credit_analysis')
      : 'credit_analysis';

    if (situacaoRaw && !SITUACAO_MAP[situacaoRaw]) {
      warnings.push(
        `Linha ${lineNum}: Situação "${situacaoRaw}" desconhecida — mapeado para "Análise de Crédito".`,
      );
    }

    // CPF
    const cpf = normalizeCpf(cpfRaw);
    if (cpf.length !== 11 && cpf.length !== 14) {
      warnings.push(`Linha ${lineNum}: CPF/CNPJ "${cpfRaw}" com tamanho inesperado.`);
    }

    // Date of birth
    const dataNasc = normalizeDate(r['Data de Nascimento']);

    // Phone: prefer mobile, fallback to landline
    const celular = normalizePhone(r['Telefone Celular']);
    const residencial = normalizePhone(r['Telefone Residencial']);
    const phone = celular ?? residencial;

    // Corban / Promotora
    const corbanName = toString(r['NOME PROMOTORA']) ?? toString(r['Ponto de Venda']);

    // Product: "Tipo Produto — Empregador"
    const tipoProduto = toString(r['Tipo Produto']);
    const empregador = toString(r['Empregador']);
    const product = [tipoProduto, empregador].filter(Boolean).join(' — ');

    // Financial values
    const amount = toNumber(r['Valor Liberado']) ?? toNumber(r['Valor Solicitado']) ?? 0;
    const installments = toNumber(r['Prazo']) ?? 0;
    const installmentValue = toNumber(r['Valor da Parcela']) ?? 0;
    const comissao = toNumber(r['Valor Comissão']);

    // Last update: Data Movimentação + Hora Movimentação
    const dataMovRaw = normalizeDate(r['Data Movimentação']);
    const horaMovRaw = toString(r['Hora Movimentação']);
    const lastUpdate = dataMovRaw
      ? horaMovRaw
        ? `${dataMovRaw} · ${horaMovRaw}`
        : dataMovRaw
      : '—';

    // Internal observations (always captured — never limited to pending_docs)
    const motivoRecusa = toString(r['Motivo Recusa/Pendência']);
    const ultimaObservacao = toString(r['Última Observação']);

    // Pendency banner is shown for:
    //  - pending_docs with a motivo, OR
    //  - canceled with a motivo that requires Corban action (REDIGITADA etc.)
    const needsAction =
      (status === 'pending_docs' && !!motivoRecusa) ||
      (status === 'canceled' && !!motivoRecusa);
    const pendencyDescription = ultimaObservacao ?? motivoRecusa;

    // Days open since last movement
    let pendencyDays = 0;
    if (needsAction && dataMovRaw) {
      const [dd, mm, yyyy] = dataMovRaw.split('/').map(Number);
      const movDate = new Date(yyyy, mm - 1, dd);
      const today = new Date();
      pendencyDays = Math.max(0, Math.floor((today.getTime() - movDate.getTime()) / 86400000));
    }

    // Proposal identifiers (nroProposta/nroContratoExterno were derived above)
    const nroPropBanco = toString(r['Nro Proposta Banco']);

    rows.push({
      id: contractId,
      client_name: nomeCliente,
      client_cpf: cpf,
      client_phone: phone,
      client_birth: dataNasc,
      corban_name: corbanName,
      product: product || '—',
      amount,
      installments: Math.round(installments),
      installment_value: installmentValue,
      status,
      status_label: STATUS_CONFIG[status]?.label ?? status,
      pendency_type: needsAction ? motivoRecusa : null,
      pendency_description: needsAction ? pendencyDescription : null,
      pendency_days: needsAction ? pendencyDays : null,
      last_update: lastUpdate,
      timeline: null,
      notifications: null,
      ultima_observacao: ultimaObservacao,
      motivo_recusa: motivoRecusa,
      matricula: toString(r['Matrícula']),
      nro_proposta: nroProposta,
      nro_proposta_banco: nroPropBanco,
      nro_contrato_externo: nroContratoExterno,
      tabela: toString(r['Tabela']),
      taxa_juros_am: toNumber(r['Taxa de Juros A.M.']),
      taxa_juros_aa: toNumber(r['Taxa de Juros A.A.']),
      taxa_cet_am: toNumber(r['Taxa CET A.M.']),
      taxa_cet_aa: toNumber(r['Taxa CET A.A.']),
      valor_solicitado: toNumber(r['Valor Solicitado']),
      valor_comissao: comissao,
      valor_iof: toNumber(r['Valor IOF']),
      valor_financiado: toNumber(r['Valor Financiado']),
      valor_ted: toNumber(r['Valor da TED']),
      valor_segurado: toNumber(r['Valor Segurado']),
      valor_seguro: toNumber(r['Valor Seguro']),
      limite_total: toNumber(r['Limite Total']),
      limite_compras: toNumber(r['Limite Compras']),
      limite_saque: toNumber(r['Limite Saque']),
      rmc: toNumber(r['RMC']),
      data_primeiro_vcto: normalizeDate(r['Data 1º Vcto']),
      data_ultimo_vcto: normalizeDate(r['Data Ult Vcto']),
      data_digitacao: normalizeDate(r['Data Digitação']),
      hora_digitacao: toString(r['Hora Digitação']),
      empregador: empregador,
      orgao_secretaria: toString(r['Órgão/Secretaria']),
      codigo_empregador: toString(r['Código Empregador']),
      sindicato: toString(r['Sindicato']),
      gerente_comercial: toString(r['Gerente Comercial']),
      gerente_resp_promotora: toString(r['Gerente Resp. Promotora']),
      usuario_digitador: toString(r['Usuário Digitador']),
      email_cliente: toString(r['E-Mail']),
      rg_cliente: toString(r['RG']),
      naturalidade: toString(r['Naturalidade']),
      estado_civil: toString(r['Estado Civil']),
      sexo: toString(r['Sexo']),
      endereco: toString(r['Endereço']),
      bairro: toString(r['Bairro']),
      cidade: toString(r['Cidade']),
      uf: toString(r['UF']),
      cep: toString(r['CEP']),
      banco: toString(r['Banco']),
      agencia: toString(r['Agência']),
      conta: toString(r['Conta']),
      conta_dv: toString(r['DV']),
      atividade: toString(r['Atividade']),
      tipo_proposta: toString(r['Tipo Proposta']),
      tipo_produto: tipoProduto,
      nome_matriz: toString(r['NOME MATRIZ']),
      ponto_de_venda: toString(r['Ponto de Venda']),
      nro_cartao: toString(r['Nro Cartão']),
      id_formalizacao: toString(r['ID Formalização']),
      cpf_repr_legal: toString(r['CPF Repr Legal']),
      nome_repr_legal: toString(r['Nome Repr Legal']),
    });
  });

  return { rows, errors, warnings };
}

// ─── Legacy template parser (backward compat) ─────────────────────────────

const LEGACY_COLUMNS = [
  'contract_id',
  'client_name',
  'client_cpf',
  'product',
  'amount',
  'installments',
  'installment_value',
  'status',
] as const;

function isContractStatus(v: unknown): v is ContractStatus {
  return (
    typeof v === 'string' &&
    ['pending_docs', 'credit_analysis', 'at_risk', 'formalized', 'canceled'].includes(v)
  );
}

function parseLegacyFormat(
  records: Record<string, unknown>[],
  errors: string[],
  warnings: string[],
): ParsedXlsx {
  const rows: ContractRow[] = [];

  const firstRow = records[0];
  const missing = LEGACY_COLUMNS.filter((col) => !(col in firstRow));
  if (missing.length > 0) {
    errors.push(`Colunas obrigatórias ausentes no template legado: ${missing.join(', ')}.`);
  }

  records.forEach((r, idx) => {
    const lineNum = idx + 2;
    const id = toString(r['contract_id']);
    const name = toString(r['client_name']);
    const cpfRaw = toString(r['client_cpf']);
    const statusRaw = toString(r['status']);

    if (!id) { errors.push(`Linha ${lineNum}: contract_id ausente.`); return; }
    if (!name) { errors.push(`Linha ${lineNum}: client_name ausente.`); return; }
    if (!cpfRaw) { errors.push(`Linha ${lineNum}: client_cpf ausente.`); return; }
    if (!isContractStatus(statusRaw)) {
      errors.push(
        `Linha ${lineNum}: status inválido "${statusRaw}". Use: pending_docs, credit_analysis, at_risk, formalized, canceled.`,
      );
      return;
    }

    const cpf = cpfRaw.replace(/\D/g, '');
    if (cpf.length !== 11) warnings.push(`Linha ${lineNum}: CPF ${cpfRaw} não possui 11 dígitos.`);

    const pendencyType = toString(r['pendency_type']);
    const pendencyDays = toNumber(r['pendency_days']);

    rows.push({
      id,
      client_name: name,
      client_cpf: cpf,
      client_phone: toString(r['client_phone']),
      client_birth: toString(r['client_birth']),
      corban_name: toString(r['corban_name']),
      product: toString(r['product']) ?? '—',
      amount: toNumber(r['amount']) ?? 0,
      installments: toNumber(r['installments']) ?? 0,
      installment_value: toNumber(r['installment_value']) ?? 0,
      status: statusRaw,
      status_label: STATUS_CONFIG[statusRaw]?.label ?? statusRaw,
      pendency_type: pendencyType,
      pendency_description: toString(r['pendency_description']),
      pendency_days: pendencyType ? (pendencyDays ?? 0) : null,
      last_update: toString(r['last_update']),
      timeline: null,
      notifications: null,
      ultima_observacao: toString(r['pendency_description']),
      motivo_recusa: pendencyType,
      matricula: null,
      nro_proposta: null,
      nro_proposta_banco: null,
      nro_contrato_externo: null,
      tabela: null,
      taxa_juros_am: null,
      taxa_juros_aa: null,
      taxa_cet_am: null,
      taxa_cet_aa: null,
      valor_solicitado: null,
      valor_comissao: null,
      valor_iof: null,
      valor_financiado: null,
      valor_ted: null,
      valor_segurado: null,
      valor_seguro: null,
      limite_total: null,
      limite_compras: null,
      limite_saque: null,
      rmc: null,
      data_primeiro_vcto: null,
      data_ultimo_vcto: null,
      data_digitacao: null,
      hora_digitacao: null,
      empregador: null,
      orgao_secretaria: null,
      codigo_empregador: null,
      sindicato: null,
      gerente_comercial: null,
      gerente_resp_promotora: null,
      usuario_digitador: null,
      email_cliente: null,
      rg_cliente: null,
      naturalidade: null,
      estado_civil: null,
      sexo: null,
      endereco: null,
      bairro: null,
      cidade: null,
      uf: null,
      cep: null,
      banco: null,
      agencia: null,
      conta: null,
      conta_dv: null,
      atividade: null,
      tipo_proposta: null,
      tipo_produto: null,
      nome_matriz: null,
      ponto_de_venda: null,
      nro_cartao: null,
      id_formalizacao: null,
      cpf_repr_legal: null,
      nome_repr_legal: null,
    });
  });

  return { rows, errors, warnings };
}

// ─── Template download (system format sample) ─────────────────────────────

export async function downloadContractsTemplate(): Promise<void> {
  const XLSX = await loadXlsx();

  const headers = [
    'NOME MATRIZ', 'NOME PROMOTORA', 'Ponto de Venda', 'Situação', 'Atividade',
    'Motivo Recusa/Pendência', 'Tipo Proposta', 'Tipo Produto', 'Código Empregador',
    'Empregador', 'Órgão/Secretaria', 'Nome Cliente', 'CPF/CNPJ', 'Matrícula',
    'Data de Nascimento', 'Telefone Celular', 'E-Mail',
    'Data Digitação', 'Hora Digitação', 'Data Movimentação', 'Hora Movimentação',
    'Nro Proposta', 'Nro Proposta Banco', 'Nro Contrato Externo',
    'Valor Solicitado', 'Valor Liberado', 'Valor da Parcela', 'Valor Comissão',
    'Prazo', 'Taxa de Juros A.M.', 'Taxa CET A.M.',
    'Data 1º Vcto', 'Data Ult Vcto', 'Tabela',
    'Banco', 'Agência', 'Conta',
    'Cidade', 'UF',
    'Usuário Digitador', 'Última Observação', 'Gerente Resp. Promotora',
  ];

  const exampleRow: Record<string, string | number> = {
    'NOME MATRIZ': 'CORBAN - OPERAÇÃO J',
    'NOME PROMOTORA': '64.839.379 EDLEA BARBOSA',
    'Ponto de Venda': 'EDLEA BARBOSA',
    'Situação': 'PEN',
    'Atividade': 'PAGAMENTO INTEGRADO',
    'Motivo Recusa/Pendência': 'FALTA HOLERITE',
    'Tipo Proposta': 'Cartão Sacado',
    'Tipo Produto': 'Cartão Consignado',
    'Código Empregador': 49,
    'Empregador': 'CÂMARA DOS DEPUTADOS - HBI',
    'Órgão/Secretaria': 'SECRETARIA DE INOVAÇÃO LEGISLATIVA',
    'Nome Cliente': 'MARIA APARECIDA SILVA',
    'CPF/CNPJ': '123.456.789-01',
    'Matrícula': '000000000283218',
    'Data de Nascimento': '15/01/1980',
    'Telefone Celular': '61 999990000',
    'E-Mail': 'maria@email.com',
    'Data Digitação': '12/02/2026',
    'Hora Digitação': '10:30',
    'Data Movimentação': '15/02/2026',
    'Hora Movimentação': '14:00',
    'Nro Proposta': 24592,
    'Nro Proposta Banco': 'RMC00245925',
    'Nro Contrato Externo': '0E99-98617',
    'Valor Solicitado': '5000,00',
    'Valor Liberado': '5000,00',
    'Valor da Parcela': '250,00',
    'Valor Comissão': '500,00',
    'Prazo': 24,
    'Taxa de Juros A.M.': '4,99',
    'Taxa CET A.M.': '5,16',
    'Data 1º Vcto': '25/03/2026',
    'Data Ult Vcto': '25/02/2028',
    'Tabela': '0281 - CARTÃO RMC - 4,99%',
    'Banco': 104,
    'Agência': '2223',
    'Conta': '599812071',
    'Cidade': 'BRASÍLIA',
    'UF': 'DF',
    'Usuário Digitador': 'EDLEA.BARBOSA',
    'Última Observação': 'Pendente envio de holerite atualizado.',
    'Gerente Resp. Promotora': 'JOÃO RIBAS',
  };

  const sheet = XLSX.utils.json_to_sheet([exampleRow], { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, 'Relatório');
  XLSX.writeFile(wb, 'corban-connect-relatorio-modelo.xlsx');
}
