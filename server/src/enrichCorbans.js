/**
 * Enriquecimento de CNPJ: para contratos cujo corban_cnpj está nulo,
 * busca pelo nome da promotora via ReceitaWS (free, ~3 req/min).
 */

import { supabase } from './supabase.js';

async function fetchCnpjRaiz(name) {
  try {
    const q = encodeURIComponent(name.trim().slice(0, 60));
    const res = await fetch(
      `https://receitaws.com.br/v1/cnpj/search?query=${q}`,
      { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(10_000) }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const list = json.companies ?? json.activities ?? (Array.isArray(json) ? json : []);
    const first = list[0];
    if (!first) return null;
    const digits = String(first.cnpj ?? first.CNPJ ?? '').replace(/\D/g, '');
    return digits.length >= 8 ? digits.slice(0, 8) : null;
  } catch {
    return null;
  }
}

export async function enrichCorbanCnpjs() {
  const { data: rows, error } = await supabase
    .from('contracts')
    .select('id, corban_name, ponto_de_venda')
    .is('corban_cnpj', null)
    .not('corban_name', 'is', null);

  if (error || !rows?.length) return { enriched: 0, skipped: 0 };

  // Agrupa por nome único para evitar chamadas duplicadas à API
  const nameToIds = new Map();
  for (const row of rows) {
    const name = row.corban_name ?? row.ponto_de_venda;
    if (!name) continue;
    if (!nameToIds.has(name)) nameToIds.set(name, []);
    nameToIds.get(name).push(row.id);
  }

  let enriched = 0;
  let skipped = 0;

  for (const [name, ids] of nameToIds) {
    // Tenta extrair CNPJ do próprio nome antes de chamar a API
    const fromName = name.match(/\d[\d./-]*\d/)?.[0]?.replace(/\D/g, '');
    let cnpjRaiz = fromName && fromName.length >= 8 ? fromName.slice(0, 8) : null;

    if (!cnpjRaiz) {
      cnpjRaiz = await fetchCnpjRaiz(name);
      await new Promise((r) => setTimeout(r, 2500)); // Respeita rate limit
    }

    if (!cnpjRaiz) {
      console.warn(`[enrich] CNPJ não encontrado para: "${name}"`);
      skipped++;
      continue;
    }

    const { error: upErr } = await supabase
      .from('contracts')
      .update({ corban_cnpj: cnpjRaiz })
      .in('id', ids);

    if (upErr) {
      console.error(`[enrich] Erro ao atualizar "${name}":`, upErr.message);
      skipped++;
    } else {
      enriched += ids.length;
      console.log(`[enrich] "${name}" → ${cnpjRaiz} (${ids.length} contrato(s))`);

      // Garante entrada na tabela corbans
      await supabase
        .from('corbans')
        .upsert({ cnpj: cnpjRaiz, nome: name }, { onConflict: 'cnpj' });
    }
  }

  return { enriched, skipped };
}
