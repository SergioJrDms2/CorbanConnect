/**
 * Régua de reengajamento D+0 / D+3 / D+7 / D+15.
 *
 * A cada tick (default hora cheia), o scheduler:
 *  1. Respeita o horário comercial (America/Sao_Paulo).
 *  2. Busca contratos com pendência ativa
 *     (pendency_type != null OU status=canceled com motivo_recusa).
 *  3. Calcula dias desde `last_update` (ou created_at, fallback).
 *  4. Para cada régua cujo limiar foi atingido, verifica idempotência
 *     no notification_log. Se ainda não disparou, chama dispatchNotification
 *     com um delay aleatório (anti-ban).
 */

import { enrichCorbanCnpjs } from './enrichCorbans.js';
import cron from 'node-cron';
import { config } from './config.js';
import { supabase } from './supabase.js';
import { dispatchNotification } from './dispatch.js';

const RULER_DAYS = { 'D+0': 0, 'D+3': 3, 'D+7': 7, 'D+15': 15 };

let cronTask = null;
let running = false;
let lastRun = null;

export function startRuler() {
  if (cronTask) return;
  cronTask = cron.schedule(config.ruler.cron, () => {
    void runRulerTick('cron');
  }, { timezone: 'America/Sao_Paulo' });
  console.log('⏰ Régua agendada:', config.ruler.cron, '(America/Sao_Paulo)');
}

export function rulerStatus() {
  return {
    cron: config.ruler.cron,
    running,
    lastRun,
    businessHours: `${config.ruler.businessHoursStart}-${config.ruler.businessHoursEnd}`,
  };
}

export async function runRulerTick(trigger = 'manual') {
  if (running) {
    return { skipped: true, reason: 'already_running' };
  }
  if (trigger === 'cron' && !insideBusinessHours()) {
    return { skipped: true, reason: 'outside_business_hours' };
  }

  running = true;
  lastRun = new Date().toISOString();
  const stats = { scanned: 0, dispatched: 0, skipped: 0, errors: 0 };

  try {
    const { data: candidates, error } = await supabase
      .from('contracts')
      .select('id, client_cpf, status, motivo_recusa, pendency_type, last_update, created_at, updated_at')
      .or('pendency_type.not.is.null,and(status.eq.canceled,motivo_recusa.not.is.null)')
      .limit(config.ruler.batchSize);

    if (error) throw new Error(error.message);
    const rows = candidates ?? [];
    stats.scanned = rows.length;

    if (rows.length === 0) return { ...stats, trigger };

    // Puxa logs existentes para idempotência.
    const ids = rows.map((r) => r.id);
    const { data: existing } = await supabase
      .from('notification_log')
      .select('contract_id, reg')
      .in('contract_id', ids);
    const already = new Set(
      (existing ?? []).map((r) => `${r.contract_id}|${baseReg(r.reg)}`),
    );

    const now = new Date();
    for (const c of rows) {
      const ref = parseBrDate(c.last_update) ?? new Date(c.updated_at ?? c.created_at);
      const days = Math.floor((now.getTime() - ref.getTime()) / 86400000);
      const reg = pickReg(days);
      if (!reg) {
        stats.skipped++;
        continue;
      }
      if (already.has(`${c.id}|${reg}`)) {
        stats.skipped++;
        continue;
      }

      try {
        await sleepRandom();
        const result = await dispatchNotification({ contractId: c.id, reg });
        if (result.ok) stats.dispatched++;
        else stats.errors++;
      } catch (err) {
        console.error('Ruler dispatch error:', err);
        stats.errors++;
      }
    }

    await enrichCorbanCnpjs().catch(err =>
      console.warn('[enrich] falhou neste tick:', err.message),
    );

    return { ...stats, trigger };
  } finally {
    running = false;
  }
}

function insideBusinessHours() {
  const now = new Date();
  const saoPauloHour = Number(
    now.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', hour12: false }),
  );
  return saoPauloHour >= config.ruler.businessHoursStart && saoPauloHour < config.ruler.businessHoursEnd;
}

function pickReg(days) {
  if (days >= RULER_DAYS['D+15']) return 'D+15';
  if (days >= RULER_DAYS['D+7']) return 'D+7';
  if (days >= RULER_DAYS['D+3']) return 'D+3';
  if (days >= RULER_DAYS['D+0']) return 'D+0';
  return null;
}

function baseReg(reg) {
  // "D+3 (messageId)" → "D+3"
  return (reg ?? '').split(' ')[0];
}

function parseBrDate(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s*[·\-]\s*(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh = '0', mi = '0'] = m;
  return new Date(+yyyy, +mm - 1, +dd, +hh, +mi);
}

function sleepRandom() {
  const { minDelayMs, maxDelayMs } = config.ruler;
  if (maxDelayMs <= 0) return Promise.resolve();
  const ms = Math.floor(Math.random() * (maxDelayMs - minDelayMs + 1)) + minDelayMs;
  return new Promise((resolve) => setTimeout(resolve, ms));
}
