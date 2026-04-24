import { useState } from 'react';
import { AlertTriangle, ArrowLeft, Building2, Search, Shield } from 'lucide-react';
import { Brand } from '../components/Brand';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/Buttons';
import { fetchContractsByCorbanCnpj } from '../lib/contracts';
import { isAcceptableCorbanIdentifier } from '../lib/validation';
import type { Contract } from '../types';

interface CorbanLoginViewProps {
  onBack: () => void;
  onLogin: (session: { cnpj: string; contracts: Contract[] }) => void;
}

/** Format raw digits into "XX.XXX.XXX" or "XX.XXX.XXX/XXXX-XX" progressively. */
function formatCnpj(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function CorbanLoginView({ onBack, onLogin }: CorbanLoginViewProps) {
  const [cnpj, setCnpj] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const digits = cnpj.replace(/\D/g, '');
  const canSubmit = digits.length >= 8;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    if (!isAcceptableCorbanIdentifier(digits)) {
      setError(
        digits.length === 14
          ? 'CNPJ inválido. Confira os dígitos.'
          : 'CNPJ inválido. Informe o raiz (8 dígitos) ou o CNPJ completo (14 dígitos).',
      );
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const contracts = await fetchContractsByCorbanCnpj(digits);
      if (contracts.length === 0) {
        setError(
          'Não encontramos nenhum contrato vinculado a este CNPJ. Confira o código e tente novamente.',
        );
        return;
      }
      onLogin({ cnpj: digits, contracts });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Falha ao consultar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <Brand small />
        </div>
      </header>

      <div className="grid flex-1 md:grid-cols-2">
        <div className="flex items-center justify-center p-6 md:p-10">
          <form onSubmit={handleSubmit} className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-violet-50">
                <Building2 className="h-5 w-5 text-violet-600" strokeWidth={2} />
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Acessar minha carteira
              </h1>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                Informe o <span className="font-medium">CNPJ da sua promotora</span> para abrir o
                painel. Sem cadastro, sem senha — o mesmo fluxo que o seu cliente usa com o CPF.
              </p>
            </div>

            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-700">
                    CNPJ da promotora
                  </label>
                  <input
                    type="text"
                    value={cnpj}
                    onChange={(e) => setCnpj(formatCnpj(e.target.value))}
                    placeholder="64.839.379"
                    inputMode="numeric"
                    autoComplete="off"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                  />
                  <div className="mt-1.5 text-[11px] text-slate-500">
                    Aceita o raiz (8 dígitos) ou o CNPJ completo (14 dígitos). É o mesmo código
                    que aparece no campo <em>"NOME PROMOTORA"</em> do seu relatório.
                  </div>
                </div>

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5" />
                    <span>{error}</span>
                  </div>
                )}

                <PrimaryButton
                  full
                  disabled={!canSubmit || loading}
                  icon={Search}
                  type="submit"
                >
                  {loading ? 'Consultando…' : 'Acessar painel'}
                </PrimaryButton>

                <p className="pt-2 text-center text-xs leading-relaxed text-slate-400">
                  Demo: <span className="font-mono text-slate-600">64.839.379</span> (EDLEA
                  BARBOSA · Operação J).
                </p>
              </div>
            </Card>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="h-3.5 w-3.5" /> Você só enxerga contratos vinculados ao CNPJ
              informado.
            </div>
          </form>
        </div>

        <div className="hidden items-center bg-violet-600 p-10 text-white md:flex">
          <div className="max-w-md">
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">
              Proposta de valor
            </div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              Nós cuidamos dos lembretes.
              <br />
              <span className="text-violet-200">Você fecha o negócio.</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-violet-100">
              A Starbank coloca uma estrutura profissional de banco nas suas mãos para você fechar
              mais contratos, comissionar mais e perder menos clientes por falta de organização.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              <div>
                <div className="text-2xl font-semibold">-40%</div>
                <div className="mt-1 text-xs text-violet-200">Contratos perdidos por doc.</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">+20pp</div>
                <div className="mt-1 text-xs text-violet-200">Conversão formalização</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">-50%</div>
                <div className="mt-1 text-xs text-violet-200">Tempo de resolução</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
