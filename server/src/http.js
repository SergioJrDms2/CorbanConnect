/**
 * HTTP API do backend. Rotas públicas apenas /health e /qr; as demais exigem
 * Bearer Token via INTERNAL_API_TOKEN para evitar que qualquer um dispare mensagens.
 */

import express from 'express';
import { config } from './config.js';
import { sendWhatsAppMessage, whatsappStatus, latestQr } from './whatsapp.js';
import { sendEmail, verifyEmailConfig } from './email.js';
import { dispatchNotification } from './dispatch.js';
import { runRulerTick, rulerStatus } from './ruler.js';

export function createApp() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  // ── Público ─────────────────────────────────────────────────────────
  app.get('/health', async (_req, res) => {
    res.json({
      ok: true,
      uptime: process.uptime(),
      whatsapp: whatsappStatus(),
      ruler: rulerStatus(),
    });
  });

  app.get('/qr', (_req, res) => {
    const qr = latestQr();
    if (!qr) return res.status(404).json({ ok: false, error: 'nenhum QR pendente' });
    res.json({ ok: true, qr });
  });

  // ── Autenticadas ────────────────────────────────────────────────────
  app.use(requireToken);

  app.post('/send/whatsapp', async (req, res) => {
    const { phone, message } = req.body ?? {};
    if (!phone || !message) return res.status(400).json({ ok: false, error: 'phone e message obrigatórios' });
    try {
      const result = await sendWhatsAppMessage(phone, message);
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/send/email', async (req, res) => {
    const { to, cc, subject, html, text } = req.body ?? {};
    if (!to || !subject || (!html && !text)) {
      return res.status(400).json({ ok: false, error: 'to, subject e (html ou text) obrigatórios' });
    }
    try {
      const result = await sendEmail({ to, cc, subject, html, text });
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/dispatch', async (req, res) => {
    const { contract_id, reg, channel } = req.body ?? {};
    if (!contract_id) return res.status(400).json({ ok: false, error: 'contract_id obrigatório' });
    try {
      const result = await dispatchNotification({ contractId: contract_id, reg, channel });
      res.json(result);
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/ruler/run', async (_req, res) => {
    try {
      const result = await runRulerTick('manual');
      res.json({ ok: true, ...result });
    } catch (err) {
      res.status(500).json({ ok: false, error: err instanceof Error ? err.message : String(err) });
    }
  });

  app.get('/verify/email', async (_req, res) => {
    const v = await verifyEmailConfig();
    res.json(v);
  });

  return app;
}

function requireToken(req, res, next) {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : header;
  if (!token || token !== config.security.internalApiToken) {
    return res.status(401).json({ ok: false, error: 'unauthorized' });
  }
  next();
}
