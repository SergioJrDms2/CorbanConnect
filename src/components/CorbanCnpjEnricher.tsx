import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Loader2,
  Save,
  Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Card } from './Card';

// ── Types ────────────────────────────────────────────────────────────────────

interface CorbanGroup {
  name: string;
  count: number;
}

interface BrasilApiCnpj {
  cnpj: string;
  razao_social: string;
  nome_fantasia?: string;
  situacao_cadastral: string;
  uf?: string;
  municipio?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

// ── Main component ───────────────────────────────────────────────────────────

export function CorbanCnpjEnricher() {
  const [corbans, setCorbans] = useState<CorbanGroup[]>([]);
  const [loading, setLoading] = useState(true);

  // Per-row state
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [validated, setValidated] = useState<Record<string, BrasilApiCnpj | null>>({});
  const [validating, setValidating] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    void load();
  }, []);

  // Fetch distinct corban names that don't have a CNPJ yet
  async function load() {
    if (!supabase) { setLoading(false); return; }
    setLoading(true);

    const { data, error } = await supabase
      .from('contracts')
      .select('corban_name')
      .is('corban_cnpj', null)
      .not('corban_name', 'is', null);

    if (!error && data) {
      const counts: Record<string, number> = {};
      (data as { corban_name: string }[]).forEach(r => {
        if (r.corban_name) counts[r.corban_name] = (counts[r.corban_name] ?? 0) + 1;
      });
      setCorbans(
        Object.entries(counts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count),
      );
    }
    setLoading(false);
  }

  // Validate a CNPJ using BrasilAPI (free, CORS-friendly)
  async function validate(name: string) {
    const digits = (inputs[name] ?? '').replace(/\D/g, '');
    if (digits.length !== 14) {
      setErrors(p => ({ ...p, [name]: 'Digite o CNPJ completo (14 dígitos).' }));
      return;
    }
    setValidating(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: '' }));
    setValidated(p => ({ ...p, [name]: null }));
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
      if (!res.ok) throw new Error('not_found');
      const data = (await res.json()) as BrasilApiCnpj;
      setValidated(p => ({ ...p, [name]: data }));
    } catch {
      setErrors(p => ({
        ...p,
        [name]: 'CNPJ não encontrado na Receita Federal. Confira os números.',
      }));
    } finally {
      setValidating(p => ({ ...p, [name]: false }));
    }
  }

  // Persist: update contracts + upsert corbans table
  async function save(name: string) {
    if (!supabase || !validated[name]) return;
    const cnpjRaiz = (inputs[name] ?? '').replace(/\D/g, '').slice(0, 8);
    setSaving(p => ({ ...p, [name]: true }));
    setErrors(p => ({ ...p, [name]: '' }));

    try {
      // 1) Update all contracts that share this corban_name
      const { error: contractsErr } = await supabase
        .from('contracts')
        .update({ corban_cnpj: cnpjRaiz })
        .eq('corban_name', name)
        .is('corban_cnpj', null);
      if (contractsErr) throw contractsErr;

      // 2) Upsert to corbans lookup table (if it doesn't exist yet)
      const { error: corbanErr } = await supabase
        .from('corbans')
        .upsert({ cnpj: cnpjRaiz, nome: name }, { onConflict: 'cnpj' });
      if (corbanErr) throw corbanErr;

      // Remove from UI list
      setCorbans(p => p.filter(c => c.name !== name));
    } catch (e) {
      setErrors(p => ({
        ...p,
        [name]: e instanceof Error ? e.message : 'Erro ao salvar no banco.',
      }));
    } finally {
      setSaving(p => ({ ...p, [name]: false }));
    }
  }

  if (loading) return null;
  if (corbans.length === 0) return null;

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="mb-5 flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-amber-50">
          <Building2 className="h-4 w-4 text-amber-600" strokeWidth={2} />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-900">
            Corbans sem CNPJ cadastrado
          </div>
          <div className="text-xs text-slate-500">
            {corbans.length} corban(s) sem CNPJ — notificações por e-mail e reencaminhamento de
            WhatsApp ficam desabilitados até o cadastro.
          </div>
        </div>
      </div>

      {/* Rows */}
      <div className="space-y-3">
        {corbans.map(({ name, count }) => (
          <CorbanRow
            key={name}
            name={name}
            count={count}
            input={inputs[name] ?? ''}
            validation={validated[name]}
            validating={!!validating[name]}
            saving={!!saving[name]}
            error={errors[name] ?? ''}
            onInput={v => setInputs(p => ({ ...p, [name]: formatCnpj(v) }))}
            onValidate={() => void validate(name)}
            onSave={() => void save(name)}
          />
        ))}
      </div>
    </Card>
  );
}

// ── Row sub-component ────────────────────────────────────────────────────────

interface CorbanRowProps {
  name: string;
  count: number;
  input: string;
  validation?: BrasilApiCnpj | null;
  validating: boolean;
  saving: boolean;
  error: string;
  onInput: (v: string) => void;
  onValidate: () => void;
  onSave: () => void;
}

function CorbanRow({
  name,
  count,
  input,
  validation,
  validating,
  saving,
  error,
  onInput,
  onValidate,
  onSave,
}: CorbanRowProps) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-4">
      {/* Corban info */}
      <div className="mb-3">
        <div className="text-sm font-medium text-slate-900">{name}</div>
        <div className="text-xs text-slate-500">{count} contrato(s) vinculados</div>
      </div>

      {/* CNPJ input + validate button */}
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => onInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onValidate()}
          placeholder="00.000.000/0001-00"
          className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
        />
        <button
          onClick={onValidate}
          disabled={validating || !input}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {validating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          Validar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-2 flex items-center gap-1.5 text-xs text-red-600">
          <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </div>
      )}

      {/* Validation result + save */}
      {validation && (
        <div className="mt-3 flex items-start justify-between gap-3 rounded-lg bg-emerald-50 px-3 py-3">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {validation.razao_social}
            </div>
            {validation.nome_fantasia && (
              <div className="mt-0.5 text-xs text-emerald-700">{validation.nome_fantasia}</div>
            )}
            <div className="mt-1 font-mono text-[11px] text-emerald-600">
              CNPJ raiz: {input.replace(/\D/g, '').slice(0, 8)}
              {validation.municipio
                ? ` · ${validation.municipio}${validation.uf ? `/${validation.uf}` : ''}`
                : ''}
            </div>
          </div>
          <button
            onClick={onSave}
            disabled={saving}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
