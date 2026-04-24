/**
 * Provider adapters — thin wrappers, provider-agnostic by design.
 *
 * Cada função faz uma única coisa: chama o provedor e retorna success/failure
 * com uma mensagem. A seleção do provedor é via env var (`WHATSAPP_PROVIDER`
 * etc.) para facilitar troca sem mudar o código de disparo.
 */

export interface ProviderResult {
  ok: boolean;
  detail?: string;
}

// ── WhatsApp ───────────────────────────────────────────────────────────────
export async function sendWhatsApp(to: string, body: string): Promise<ProviderResult> {
  const provider = Deno.env.get('WHATSAPP_PROVIDER') ?? 'twilio';
  switch (provider) {
    case 'twilio':
      return twilioWhatsApp(to, body);
    case 'zenvia':
      return zenviaWhatsApp(to, body);
    default:
      return { ok: false, detail: `provider "${provider}" não suportado` };
  }
}

async function twilioWhatsApp(to: string, body: string): Promise<ProviderResult> {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const from = Deno.env.get('TWILIO_WHATSAPP_FROM'); // e.g. "whatsapp:+14155238886"
  if (!sid || !token || !from) return { ok: false, detail: 'Twilio env vars ausentes' };

  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const auth = 'Basic ' + btoa(`${sid}:${token}`);
  const form = new URLSearchParams({
    From: from,
    To: `whatsapp:${normalizePhone(to)}`,
    Body: body,
  });
  const res = await fetch(url, { method: 'POST', headers: { Authorization: auth }, body: form });
  if (!res.ok) return { ok: false, detail: `Twilio ${res.status}: ${await res.text()}` };
  return { ok: true };
}

async function zenviaWhatsApp(to: string, body: string): Promise<ProviderResult> {
  const token = Deno.env.get('ZENVIA_API_TOKEN');
  const from = Deno.env.get('ZENVIA_WHATSAPP_FROM');
  if (!token || !from) return { ok: false, detail: 'Zenvia env vars ausentes' };

  const res = await fetch('https://api.zenvia.com/v2/channels/whatsapp/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-API-TOKEN': token },
    body: JSON.stringify({
      from,
      to: normalizePhone(to),
      contents: [{ type: 'text', text: body }],
    }),
  });
  if (!res.ok) return { ok: false, detail: `Zenvia ${res.status}: ${await res.text()}` };
  return { ok: true };
}

// ── SMS ────────────────────────────────────────────────────────────────────
export async function sendSms(to: string, body: string): Promise<ProviderResult> {
  const sid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const token = Deno.env.get('TWILIO_AUTH_TOKEN');
  const from = Deno.env.get('TWILIO_SMS_FROM');
  if (!sid || !token || !from) return { ok: false, detail: 'SMS env vars ausentes' };

  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: 'POST',
    headers: { Authorization: 'Basic ' + btoa(`${sid}:${token}`) },
    body: new URLSearchParams({ From: from, To: normalizePhone(to), Body: body }),
  });
  if (!res.ok) return { ok: false, detail: `SMS ${res.status}: ${await res.text()}` };
  return { ok: true };
}

// ── E-mail ─────────────────────────────────────────────────────────────────
export async function sendEmail(
  to: string,
  subject: string,
  html: string,
): Promise<ProviderResult> {
  const apiKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('EMAIL_FROM') ?? 'nao-responder@starbank.com.br';
  if (!apiKey) return { ok: false, detail: 'RESEND_API_KEY ausente' };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ from, to, subject, html }),
  });
  if (!res.ok) return { ok: false, detail: `Resend ${res.status}: ${await res.text()}` };
  return { ok: true };
}

function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, '');
  if (digits.startsWith('55')) return '+' + digits;
  if (digits.length === 11) return '+55' + digits;
  if (digits.length === 13 && digits.startsWith('55')) return '+' + digits;
  return '+' + digits; // fallback
}
