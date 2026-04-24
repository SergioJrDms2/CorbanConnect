/**
 * Templates das mensagens enviadas ao cliente final.
 *
 * Regra do PRD (§4.2): TODA mensagem redireciona ao Corban. Jamais cita
 * suporte direto da Starbank. O tom aumenta levemente a cada régua, sem
 * ser alarmista.
 */

export const RULERS = ['D+0', 'D+3', 'D+7', 'D+15'];

const SAUDACOES = ['Olá', 'Oi', 'Bom dia', 'Prezado(a)'];

function toneFor(reg) {
  switch (reg) {
    case 'D+0':
      return '';
    case 'D+3':
      return 'Lembrete: ';
    case 'D+7':
      return 'Atenção: ';
    case 'D+15':
      return 'Último aviso: ';
    default:
      return '';
  }
}

function pickSaudacao() {
  return SAUDACOES[Math.floor(Math.random() * SAUDACOES.length)];
}

function firstName(fullName) {
  return (fullName ?? '').split(' ')[0] || 'cliente';
}

function escapeHtml(s = '') {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

/**
 * ctx:
 *   contract.id, contract.client_name, contract.motivo_recusa,
 *   contract.ultima_observacao
 *   corban.name, corban.contact
 *   portalUrl, optOutUrl
 *   reg (D+0 etc.)
 */
export function buildWhatsAppText(ctx) {
  const saudacao = pickSaudacao();
  const nome = firstName(ctx.contract.client_name);
  const tom = toneFor(ctx.reg);
  const motivo = ctx.contract.motivo_recusa
    ? `\n\n📄 Pendência: ${ctx.contract.motivo_recusa}`
    : '';
  return (
    `${saudacao}, ${nome}! 👋\n\n` +
    `${tom}Seu contrato *${ctx.contract.id}* está aguardando uma ação para seguir.` +
    `${motivo}\n\n` +
    `Entre em contato com *${ctx.corban.name}* (seu correspondente) para dar continuidade:\n` +
    `📞 ${ctx.corban.contact}\n\n` +
    `Acompanhar status: ${ctx.portalUrl}\n` +
    `Não quero mais receber: ${ctx.optOutUrl}\n\n` +
    `— Corban Connect · Starbank`
  );
}

export function buildEmailSubject(ctx) {
  const tom = toneFor(ctx.reg).replace(': ', '').trim();
  const prefix = tom ? `[${tom}] ` : '';
  return `${prefix}Seu contrato ${ctx.contract.id} aguarda uma ação`;
}

export function buildEmailHtml(ctx) {
  const nome = escapeHtml(ctx.contract.client_name ?? 'cliente');
  const tom = toneFor(ctx.reg);
  const motivoBlock = ctx.contract.motivo_recusa
    ? `<tr><td style="padding:8px 0;"><strong>Pendência:</strong> ${escapeHtml(ctx.contract.motivo_recusa)}</td></tr>`
    : '';
  const obsBlock = ctx.contract.ultima_observacao
    ? `<p style="font-size:13px;color:#475569;line-height:1.6;margin:0 0 12px;">${escapeHtml(ctx.contract.ultima_observacao)}</p>`
    : '';
  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,Segoe UI,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;margin:0 auto;padding:24px;">
    <tr><td style="padding:0 0 20px;">
      <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:#7c3aed;font-weight:600;">Corban Connect · Starbank</div>
    </td></tr>
    <tr><td style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:32px;">
      <p style="margin:0 0 16px;font-size:15px;">Olá, <strong>${nome}</strong>.</p>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#334155;">
        ${tom}Identificamos que seu contrato <strong>${escapeHtml(ctx.contract.id)}</strong> está aguardando uma ação para prosseguir.
      </p>
      ${obsBlock}
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f1f5f9;border-radius:8px;padding:12px 16px;margin:16px 0;font-size:13px;color:#334155;">
        ${motivoBlock}
        <tr><td style="padding:4px 0;"><strong>Contrato:</strong> ${escapeHtml(ctx.contract.id)}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Correspondente:</strong> ${escapeHtml(ctx.corban.name)}</td></tr>
        <tr><td style="padding:4px 0;"><strong>Contato:</strong> ${escapeHtml(ctx.corban.contact)}</td></tr>
      </table>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#334155;">
        Para resolver, entre em contato com seu correspondente bancário — ele é o seu ponto dedicado para essa operação.
      </p>
      <a href="${escapeHtml(ctx.portalUrl)}" style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 22px;border-radius:8px;font-weight:600;font-size:14px;">Ver status do contrato</a>
    </td></tr>
    <tr><td style="padding:16px 8px;text-align:center;font-size:11px;color:#94a3b8;line-height:1.6;">
      Esta mensagem é automática. Dúvidas sobre o contrato? Fale diretamente com seu correspondente.<br/>
      Não deseja mais receber essas mensagens? <a href="${escapeHtml(ctx.optOutUrl)}" style="color:#94a3b8;">Cancelar notificações</a>.
    </td></tr>
  </table>
</body></html>`;
}

export function buildEmailText(ctx) {
  const nome = firstName(ctx.contract.client_name);
  const tom = toneFor(ctx.reg);
  const motivo = ctx.contract.motivo_recusa ? `\nPendência: ${ctx.contract.motivo_recusa}` : '';
  return (
    `Olá, ${nome}.\n\n` +
    `${tom}Seu contrato ${ctx.contract.id} está aguardando uma ação.${motivo}\n\n` +
    `Fale com ${ctx.corban.name} (${ctx.corban.contact}) para dar continuidade.\n\n` +
    `Acompanhar status: ${ctx.portalUrl}\n` +
    `Não quero mais receber: ${ctx.optOutUrl}\n\n` +
    `— Corban Connect · Starbank`
  );
}
