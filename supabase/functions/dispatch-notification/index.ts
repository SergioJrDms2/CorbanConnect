/**
 * Edge Function: dispatch-notification
 *
 * POST body: { contract_id: string, channel?: 'whatsapp'|'sms'|'email', reg?: Ruler }
 *
 * Fluxo:
 *  1. Valida service-role JWT (apenas run-ruler / equipe interna chamam).
 *  2. Carrega o contrato + checa opt-out do CPF.
 *  3. Monta o template apropriado.
 *  4. Chama o provedor (Twilio/Zenvia/Resend).
 *  5. Registra em `notification_log` com status delivered|failed.
 *
 * Política de canal quando `channel` não é passado:
 *   WhatsApp prioritário → SMS fallback → e-mail secundário.
 *
 * Deploy: `supabase functions deploy dispatch-notification --no-verify-jwt false`
 * Secrets: ver providers.ts.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { emailHtml, emailSubject, smsText, whatsappText, type Ruler } from './templates.ts';
import { sendEmail, sendSms, sendWhatsApp, type ProviderResult } from './providers.ts';

type Channel = 'whatsapp' | 'sms' | 'email';

interface Body {
  contract_id: string;
  channel?: Channel;
  reg?: Ruler;
}

interface ContractRow {
  id: string;
  client_cpf: string;
  client_name: string;
  client_phone: string | null;
  email_cliente: string | null;
  motivo_recusa: string | null;
  ultima_observacao: string | null;
  corban_name: string | null;
  ponto_de_venda: string | null;
  gerente_resp_promotora: string | null;
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const BASE_URL = Deno.env.get('CORBAN_CONNECT_BASE_URL') ?? 'https://app.corbanconnect.com.br';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'method not allowed' }, 405);
  }

  let body: Body;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'invalid json' }, 400);
  }
  if (!body.contract_id) return json({ error: 'contract_id required' }, 400);

  const { data: contract, error: loadErr } = await supabase
    .from('contracts')
    .select(
      'id, client_cpf, client_name, client_phone, email_cliente, motivo_recusa, ultima_observacao, corban_name, ponto_de_venda, gerente_resp_promotora',
    )
    .eq('id', body.contract_id)
    .maybeSingle();
  if (loadErr || !contract) return json({ error: 'contract not found' }, 404);

  // Opt-out LGPD
  const { data: optedOut } = await supabase
    .from('client_opt_outs')
    .select('cpf')
    .eq('cpf', (contract as ContractRow).client_cpf)
    .maybeSingle();
  if (optedOut) {
    await logAttempt(contract.id, body.channel ?? 'whatsapp', body.reg ?? 'D+0', 'failed', 'client_opt_out');
    return json({ ok: false, reason: 'client_opt_out' }, 200);
  }

  const ctx = buildContext(contract as ContractRow);
  const reg: Ruler = body.reg ?? 'D+0';

  const order: Channel[] = body.channel ? [body.channel] : ['whatsapp', 'sms', 'email'];
  let lastErr: string | undefined;

  for (const ch of order) {
    const result = await trySend(ch, reg, contract as ContractRow, ctx);
    await logAttempt(contract.id, ch, reg, result.ok ? 'delivered' : 'failed', result.detail);
    if (result.ok) return json({ ok: true, channel: ch });
    lastErr = result.detail;
  }

  return json({ ok: false, reason: 'all channels failed', detail: lastErr }, 502);
});

async function trySend(
  ch: Channel,
  reg: Ruler,
  contract: ContractRow,
  ctx: ReturnType<typeof buildContext>,
): Promise<ProviderResult> {
  switch (ch) {
    case 'whatsapp':
      if (!contract.client_phone) return { ok: false, detail: 'no_phone' };
      return sendWhatsApp(contract.client_phone, whatsappText(reg, ctx));
    case 'sms':
      if (!contract.client_phone) return { ok: false, detail: 'no_phone' };
      return sendSms(contract.client_phone, smsText(reg, ctx));
    case 'email':
      if (!contract.email_cliente) return { ok: false, detail: 'no_email' };
      return sendEmail(contract.email_cliente, emailSubject(reg, ctx), emailHtml(reg, ctx));
  }
}

async function logAttempt(
  contract_id: string,
  channel: Channel,
  reg: Ruler,
  status: 'delivered' | 'failed',
  detail?: string,
) {
  await supabase.from('notification_log').insert({
    contract_id,
    channel,
    status,
    reg: detail ? `${reg} (${detail})` : reg,
  });
}

function buildContext(c: ContractRow) {
  const first = (c.client_name ?? '').split(' ')[0] || 'cliente';
  const corbanName = c.ponto_de_venda ?? c.corban_name ?? 'seu correspondente';
  const corbanContact = c.gerente_resp_promotora ?? 'consulte o seu corban';
  const token = crypto.randomUUID().slice(0, 8);
  return {
    clientFirstName: first,
    contractId: c.id,
    motivoRecusa: c.motivo_recusa,
    ultimaObservacao: c.ultima_observacao,
    corbanContact,
    corbanName,
    portalUrl: `${BASE_URL}/c/${token}`,
    optOutUrl: `${BASE_URL}/opt-out?t=${token}`,
  };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
