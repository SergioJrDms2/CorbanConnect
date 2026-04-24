/**
 * Templates das mensagens disparadas ao cliente.
 *
 * Os templates de WhatsApp precisam ser aprovados pela Meta ANTES de
 * conseguir mandar. Enquanto isso os canais SMS e e-mail atuam como fallback.
 *
 * Regra fundamental (PRD §4.2): TODA mensagem redireciona ao Corban.
 * Nunca cita suporte direto da Starbank.
 */

export type Ruler = 'D+0' | 'D+3' | 'D+7' | 'D+15';

export interface TemplateContext {
  clientFirstName: string;
  contractId: string;
  motivoRecusa: string | null;
  ultimaObservacao: string | null;
  corbanContact: string; // phone or name
  corbanName: string;
  portalUrl: string; // link curto com token
  optOutUrl: string; // link de opt-out LGPD
}

/** Ajusta o tom conforme a régua (sem ser alarmista). */
function toneFor(r: Ruler): string {
  switch (r) {
    case 'D+0':
      return '';
    case 'D+3':
      return 'Atenção: ';
    case 'D+7':
      return 'Importante: ';
    case 'D+15':
      return 'Última chamada: ';
  }
}

export function whatsappText(r: Ruler, c: TemplateContext): string {
  const t = toneFor(r);
  const pendencyHint = c.motivoRecusa ? `\n\n📄 ${c.motivoRecusa}` : '';
  return (
    `Olá, ${c.clientFirstName}! 👋\n\n` +
    `${t}Seu contrato ${c.contractId} está aguardando uma ação.${pendencyHint}\n\n` +
    `Entre em contato com ${c.corbanName} (seu correspondente) para dar continuidade:\n` +
    `📞 ${c.corbanContact}\n\n` +
    `Acompanhar status: ${c.portalUrl}\n` +
    `Não quero mais receber: ${c.optOutUrl}`
  );
}

export function smsText(r: Ruler, c: TemplateContext): string {
  const t = toneFor(r);
  // SMS é limitado a ~160 caracteres. Priorizar o direcionamento ao Corban.
  return (
    `Starbank: ${t}contrato ${c.contractId} precisa de atenção. ` +
    `Fale com ${c.corbanName} ${c.corbanContact}. ` +
    `Status: ${c.portalUrl}`
  ).slice(0, 320);
}

export function emailSubject(r: Ruler, c: TemplateContext): string {
  const t = toneFor(r).replace(': ', '').trim();
  return t ? `[${t}] Contrato ${c.contractId} aguarda documento` : `Contrato ${c.contractId} aguarda documento`;
}

export function emailHtml(r: Ruler, c: TemplateContext): string {
  const t = toneFor(r);
  const pendency = c.motivoRecusa
    ? `<p><strong>Pendência:</strong> ${escapeHtml(c.motivoRecusa)}.</p>`
    : '';
  return `
<!doctype html>
<html lang="pt-BR"><body style="font-family: system-ui, -apple-system, sans-serif; color: #0f172a; max-width: 560px; margin: 0 auto; padding: 24px;">
  <h2 style="margin: 0 0 16px 0; color: #7c3aed;">Corban Connect · Starbank</h2>
  <p>Olá, ${escapeHtml(c.clientFirstName)}.</p>
  <p>${t}Identificamos que seu contrato <strong>${escapeHtml(c.contractId)}</strong> está aguardando uma ação para prosseguir.</p>
  ${pendency}
  <p>Para resolver, entre em contato com seu correspondente bancário <strong>${escapeHtml(c.corbanName)}</strong> pelo telefone <span style="font-family:monospace;">${escapeHtml(c.corbanContact)}</span>.</p>
  <p><a href="${escapeAttr(c.portalUrl)}" style="display:inline-block;padding:10px 20px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;">Ver status do contrato</a></p>
  <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;"/>
  <p style="font-size:12px;color:#64748b;">Não deseja mais receber essas mensagens? <a href="${escapeAttr(c.optOutUrl)}">Cancelar notificações</a>. Esta mensagem é automática — qualquer dúvida fale diretamente com seu correspondente.</p>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => {
    switch (c) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      default:
        return '&#39;';
    }
  });
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
