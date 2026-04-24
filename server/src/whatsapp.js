/**
 * Baileys WhatsApp client — escuta e envia.
 *
 * Diferente do projeto de cobrança original, aqui **não** fazemos triagem
 * automática de devedor. Quando um cliente responde, apenas registramos em
 * `notification_log` e, se o contrato tiver Corban cadastrado com WhatsApp,
 * reencaminhamos a mensagem para o Corban ("Cliente X respondeu: …"), em
 * linha com a premissa do PRD: a Starbank nunca intermedia o suporte.
 */

import makeWASocket, {
  DisconnectReason,
  fetchLatestBaileysVersion,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys';
import { Boom } from '@hapi/boom';
import qrcode from 'qrcode-terminal';
import pino from 'pino';
import { config } from './config.js';
import { supabase } from './supabase.js';

const logger = pino({ level: 'warn' });

let sock = null;
let lastQr = null;
let connectionState = 'disconnected'; // 'connecting' | 'open' | 'disconnected'

export function whatsappStatus() {
  return {
    state: connectionState,
    user: sock?.user?.id ?? null,
    hasPendingQr: !!lastQr,
  };
}

export function latestQr() {
  return lastQr;
}

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(config.whatsapp.authDir);
  const { version } = await fetchLatestBaileysVersion();
  connectionState = 'connecting';

  sock = makeWASocket({
    version,
    auth: state,
    logger,
    printQRInTerminal: false,
    browser: ['Corban Connect', 'Chrome', '1.0.0'],
    markOnlineOnConnect: false,
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      lastQr = qr;
      console.log('\n📱 Escaneie o QR com o WhatsApp do número oficial do Corban Connect:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'open') {
      lastQr = null;
      connectionState = 'open';
      console.log('✅ WhatsApp conectado:', sock.user?.id);
    }

    if (connection === 'close') {
      const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      connectionState = 'disconnected';
      console.log(
        '❌ WhatsApp desconectado:',
        lastDisconnect?.error?.message,
        '| reconectar:', shouldReconnect,
      );
      if (shouldReconnect) {
        setTimeout(() => void startWhatsApp(), 3000);
      } else {
        console.log(`🚪 Deslogado. Apague ${config.whatsapp.authDir} e reinicie para parear.`);
      }
    }
  });

  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      try {
        await handleIncoming(msg);
      } catch (err) {
        console.error('Erro processando mensagem recebida:', err);
      }
    }
  });
}

/**
 * Normaliza números brasileiros: aceita "(11) 98765-4321", "11987654321",
 * "5511987654321", já com @s.whatsapp.net etc. Devolve o JID pronto.
 */
export function toJid(phone) {
  if (!phone) throw new Error('phone vazio');
  if (phone.includes('@')) return phone;
  const digits = phone.replace(/\D/g, '');
  const withCountry = digits.startsWith('55') ? digits : `55${digits}`;
  return `${withCountry}@s.whatsapp.net`;
}

export async function sendWhatsAppMessage(phone, message) {
  if (!sock || connectionState !== 'open') {
    throw new Error('WhatsApp não está conectado.');
  }
  if (!phone || !message) throw new Error('phone e message são obrigatórios');

  const jid = toJid(phone);
  const sent = await sock.sendMessage(jid, { text: message });
  return { jid, messageId: sent?.key?.id ?? null };
}

/**
 * Mensagens recebidas: extrai texto, identifica se é um cliente conhecido
 * pelo CPF/telefone, registra em notification_log como 'read' e (se houver)
 * reencaminha ao Corban.
 */
async function handleIncoming(msg) {
  if (msg.key.fromMe) return;
  if (msg.key.remoteJid?.endsWith('@g.us')) return;
  if (msg.key.remoteJid === 'status@broadcast') return;

  const text =
    msg.message?.conversation ||
    msg.message?.extendedTextMessage?.text ||
    msg.message?.imageMessage?.caption ||
    msg.message?.videoMessage?.caption ||
    '';
  if (!text.trim()) return;

  const from = msg.key.remoteJid;
  const phoneRaw = from.split('@')[0];
  const phoneClean = phoneRaw.startsWith('55') && phoneRaw.length >= 12 ? phoneRaw.slice(2) : phoneRaw;

  // Procura um contrato cujo `client_phone` termine com os dígitos do remetente.
  const { data: contracts } = await supabase
    .from('contracts')
    .select('id, client_name, corban_cnpj, client_cpf')
    .ilike('client_phone', `%${phoneClean.slice(-8)}%`)
    .limit(1);

  const contract = contracts?.[0] ?? null;
  if (!contract) return; // não é cliente da plataforma — ignora

  // Registra como resposta lida.
  await supabase.from('notification_log').insert({
    contract_id: contract.id,
    channel: 'whatsapp',
    status: 'read',
    reg: `resposta cliente: ${text.slice(0, 140)}`,
  });

  // Reencaminha para o Corban (se cadastrado com WhatsApp).
  if (contract.corban_cnpj) {
    const { data: corban } = await supabase
      .from('corbans')
      .select('whatsapp, nome')
      .eq('cnpj', contract.corban_cnpj)
      .maybeSingle();
    if (corban?.whatsapp) {
      try {
        await sendWhatsAppMessage(
          corban.whatsapp,
          `📬 Resposta do cliente *${contract.client_name}* (contrato ${contract.id}):\n\n${text}\n\n— Corban Connect`,
        );
      } catch (err) {
        console.error('Falha ao reencaminhar para o Corban:', err.message);
      }
    }
  }
}
