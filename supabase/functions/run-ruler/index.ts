/**
 * Edge Function: run-ruler
 *
 * Chamada pelo pg_cron a cada hora. Para cada contrato com pendência ativa:
 *   - Calcula dias desde a última movimentação.
 *   - Se encaixa em D+0, D+3, D+7 ou D+15 E não existe registro para aquele
 *     `reg` em `notification_log`, chama `dispatch-notification`.
 *   - Para automaticamente quando a pendência sai do schema (próximo upload).
 *
 * Nota: intencionalmente opera em batches e paraleliza com Promise.all.
 * Em volume alto trocar por fila (e.g. pgmq).
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DISPATCH_FN_URL = `${SUPABASE_URL}/functions/v1/dispatch-notification`;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

type Ruler = 'D+0' | 'D+3' | 'D+7' | 'D+15';
const RULER_DAYS: Record<Ruler, number> = { 'D+0': 0, 'D+3': 3, 'D+7': 7, 'D+15': 15 };

interface Candidate {
  id: string;
  client_cpf: string;
  status: string;
  motivo_recusa: string | null;
  pendency_type: string | null;
  last_update: string | null; // "DD/MM/YYYY · HH:MM" or similar
  created_at: string;
}

Deno.serve(async (_req) => {
  // Busca contratos com pendência ativa. Limite para não estourar batch.
  const { data: rows, error } = await supabase
    .from('contracts')
    .select(
      'id, client_cpf, status, motivo_recusa, pendency_type, last_update, created_at',
    )
    .or('pendency_type.not.is.null,and(status.eq.canceled,motivo_recusa.not.is.null)')
    .limit(1000);

  if (error) return new Response(error.message, { status: 500 });
  if (!rows || rows.length === 0) return new Response(JSON.stringify({ triggered: 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });

  // Puxa os registros já disparados para esses contratos (para idempotência).
  const ids = rows.map((r) => (r as Candidate).id);
  const { data: existing } = await supabase
    .from('notification_log')
    .select('contract_id, reg')
    .in('contract_id', ids);
  const disparado = new Set(
    (existing ?? []).map((r: { contract_id: string; reg: string }) => `${r.contract_id}|${r.reg}`),
  );

  const now = new Date();
  const tasks: Promise<unknown>[] = [];
  let triggered = 0;

  for (const c of rows as Candidate[]) {
    const refDate = parseBrDate(c.last_update) ?? new Date(c.created_at);
    const days = Math.floor((now.getTime() - refDate.getTime()) / 86400000);
    for (const r of ['D+0', 'D+3', 'D+7', 'D+15'] as Ruler[]) {
      if (days >= RULER_DAYS[r] && !disparado.has(`${c.id}|${r}`)) {
        tasks.push(dispatch(c.id, r));
        triggered++;
        break; // dispara o último marco atingido; próximos ciclos dispararão o seguinte
      }
    }
  }

  await Promise.allSettled(tasks);
  return new Response(JSON.stringify({ triggered, scanned: rows.length }), {
    headers: { 'Content-Type': 'application/json' },
  });
});

async function dispatch(contract_id: string, reg: Ruler) {
  return fetch(DISPATCH_FN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ contract_id, reg }),
  });
}

function parseBrDate(s: string | null): Date | null {
  if (!s) return null;
  // "22/04/2026 · 09:12" or "22/04/2026"
  const m = s.match(/^(\d{2})\/(\d{2})\/(\d{4})(?:\s*[·\-]\s*(\d{2}):(\d{2}))?/);
  if (!m) return null;
  const [, dd, mm, yyyy, hh = '0', mi = '0'] = m;
  return new Date(+yyyy, +mm - 1, +dd, +hh, +mi);
}
