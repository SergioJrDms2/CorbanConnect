/**
 * Dispatch: coordena o envio para um contrato.
 *
 *   dispatchNotification({ contractId, reg, channel? })
 *
 * 1. Carrega contrato + Corban (email/WhatsApp) do Supabase.
 * 2. Checa opt-out do CPF do cliente.
 * 3. Monta templates com placeholders certos.
 * 4. Tenta WhatsApp (se o sock está conectado e há telefone);
 *    se falhar ou não aplicável, tenta e-mail.
 * 5. Em e-mail, coloca o Corban em CC para transparência.
 * 6. Grava sempre em notification_log (delivered ou failed).
 */

import { supabase } from './supabase.js';
import { sendWhatsAppMessage, whatsappStatus } from './whatsapp.js';
import { sendEmail } from './email.js';
import {
  buildEmailHtml,
  buildEmailSubject,
  buildEmailText,
  buildWhatsAppText,
} from './templates.js';
import { config } from './config.js';

const CONTRACT_FIELDS =
  'id, client_cpf, client_name, client_phone, email_cliente, motivo_recusa, ultima_observacao, corban_cnpj, corban_name, ponto_de_venda, gerente_resp_promotora';

export async function dispatchNotification({ contractId, reg = 'D+0', channel = null }) {
  const { data: contract, error } = await supabase
    .from('contracts')
    .select(CONTRACT_FIELDS)
    .eq('id', contractId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!contract) return { ok: false, reason: 'contract_not_found' };

  // Opt-out LGPD
  const { data: optOut } = await supabase
    .from('client_opt_outs')
    .select('cpf')
    .eq('cpf', contract.client_cpf)
    .maybeSingle();
  if (optOut) {
    await logAttempt(contract.id, channel ?? 'whatsapp', reg, 'failed', 'opt_out');
    return { ok: false, reason: 'client_opt_out' };
  }

  // Corban (para e-mail em CC e/ou contato a exibir)
  let corbanRow = null;
  if (contract.corban_cnpj) {
    const { data } = await supabase
      .from('corbans')
      .select('email, whatsapp, nome')
      .eq('cnpj', contract.corban_cnpj)
      .maybeSingle();
    corbanRow = data ?? null;
  }

  const ctx = buildContext(contract, corbanRow, reg);

  const channels = channel ? [channel] : ['whatsapp', 'email'];
  let lastDetail = null;

  for (const ch of channels) {
    const result = await tryChannel(ch, contract, corbanRow, ctx);
    await logAttempt(contract.id, ch, reg, result.ok ? 'delivered' : 'failed', result.detail);
    if (result.ok) return { ok: true, channel: ch };
    lastDetail = result.detail;
  }

  return { ok: false, reason: 'all_channels_failed', detail: lastDetail };
}

async function tryChannel(ch, contract, corbanRow, ctx) {
  try {
    if (ch === 'whatsapp') {
      if (!contract.client_phone) return { ok: false, detail: 'no_phone' };
      if (whatsappStatus().state !== 'open') {
        return { ok: false, detail: 'whatsapp_offline' };
      }
      const { messageId } = await sendWhatsAppMessage(contract.client_phone, buildWhatsAppText(ctx));
      return { ok: true, detail: messageId ?? undefined };
    }
    if (ch === 'email') {
      if (!contract.email_cliente) return { ok: false, detail: 'no_email' };
      const { messageId } = await sendEmail({
        to: contract.email_cliente,
        cc: corbanRow?.email ?? undefined,
        subject: buildEmailSubject(ctx),
        html: buildEmailHtml(ctx),
        text: buildEmailText(ctx),
      });
      return { ok: true, detail: messageId ?? undefined };
    }
    return { ok: false, detail: `canal_desconhecido:${ch}` };
  } catch (err) {
    return { ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

function buildContext(contract, corbanRow, reg) {
  const corbanName =
    corbanRow?.nome ??
    contract.ponto_de_venda ??
    (contract.corban_name ?? '').replace(/^\d[\d.\-/]*\s*/, '') ??
    'Seu correspondente';
  const corbanContact =
    corbanRow?.whatsapp ?? contract.gerente_resp_promotora ?? 'consulte seu corban';
  const token = randomToken();
  return {
    reg,
    contract,
    corban: { name: corbanName, contact: corbanContact },
    portalUrl: `${config.platform.baseUrl}/c/${token}`,
    optOutUrl: `${config.platform.baseUrl}/opt-out?t=${token}`,
  };
}

function randomToken() {
  return Math.random().toString(36).slice(2, 10);
}

async function logAttempt(contractId, channel, reg, status, detail) {
  await supabase.from('notification_log').insert({
    contract_id: contractId,
    channel,
    status,
    reg: detail ? `${reg} (${detail})` : reg,
  });
}
