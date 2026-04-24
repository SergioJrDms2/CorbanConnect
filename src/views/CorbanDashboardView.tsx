import { useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ChevronRight,
  FileCheck,
  FileClock,
  FileText,
  LogOut,
  Search,
  User,
} from 'lucide-react';
import { Brand } from '../components/Brand';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { useCorbanContracts } from '../hooks/useContracts';
import { colorMap } from '../lib/theme';
import { formatBRL } from '../lib/format';
import type { Contract, ContractStatus, ToneColor } from '../types';

interface CorbanDashboardViewProps {
  onBack: () => void;
  onOpenContract: (c: Contract) => void;
  cnpj: string;
}

interface FilterOption {
  id: 'all' | ContractStatus;
  label: string;
}

const FILTERS: FilterOption[] = [
  { id: 'all', label: 'Todos' },
  { id: 'pending_docs', label: 'Pendência Documental' },
  { id: 'credit_analysis', label: 'Análise de Crédito' },
  { id: 'at_risk', label: 'Em Risco' },
  { id: 'formalized', label: 'Formalizado' },
  { id: 'canceled', label: 'Cancelado / Redigitar' },
];

export function CorbanDashboardView({ onBack, onOpenContract, cnpj }: CorbanDashboardViewProps) {
  const { contracts, loading, error } = useCorbanContracts(cnpj);
  const [statusFilter, setStatusFilter] = useState<FilterOption['id']>('all');
  const [search, setSearch] = useState('');

  // Corban identity (derived from the first contract — all share the same Corban)
  const corbanDisplayName =
    contracts[0]?.pontoDeVenda ?? contracts[0]?.corbanName ?? `CNPJ ${cnpj}`;
  const corbanMatrix = contracts[0]?.nomeMatriz ?? null;

  const filtered = useMemo(() => {
    return contracts.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const q = search.trim().toLowerCase();
      const matchesQuery =
        !q ||
        c.client.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.client.cpf.includes(q);
      return matchesStatus && matchesQuery;
    });
  }, [contracts, statusFilter, search]);

  const stats = useMemo(() => {
    const counts = contracts.reduce<Record<string, number>>((acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    }, {});
    const needsAction = contracts.filter(
      (c) =>
        c.pendency ||
        (c.status === 'canceled' && (c.motivoRecusa || c.ultimaObservacao)),
    ).length;
    return {
      total: contracts.length,
      pending: counts.pending_docs ?? 0,
      risk: counts.at_risk ?? 0,
      canceled: counts.canceled ?? 0,
      formalized: counts.formalized ?? 0,
      needsAction,
    };
  }, [contracts]);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Brand small />
            <div className="hidden items-center gap-1 text-xs md:flex">
              <span className="text-slate-400">/</span>
              <span className="ml-1 font-medium text-slate-700">Painel do Corban</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600 sm:flex">
              <User className="h-3.5 w-3.5" />
              <span className="max-w-[160px] truncate">{corbanDisplayName}</span>
              <span className="font-mono text-[10px] text-slate-400">· {cnpj}</span>
            </div>
            <button
              onClick={onBack}
              className="p-2 text-slate-500 hover:text-slate-900"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Olá, {corbanDisplayName.split(' ')[0]}.
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              {stats.needsAction > 0 ? (
                <>
                  Você tem{' '}
                  <span className="font-semibold text-slate-900">
                    {stats.needsAction} contratos com ação pendente
                  </span>
                  . Já notificamos os clientes — fique de olho nos retornos.
                </>
              ) : (
                <>Todos os contratos em dia. Nenhuma pendência aberta no momento.</>
              )}
            </p>
            {corbanMatrix && (
              <div className="mt-2 text-xs text-slate-500">
                {corbanMatrix} · CNPJ {cnpj}
              </div>
            )}
          </div>
          <div className="font-mono text-xs text-slate-500">
            {new Date().toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            })}
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <KpiCard label="Contratos na carteira" value={stats.total} icon={FileText} tone="violet" />
          <KpiCard
            label="Ação pendente"
            value={stats.needsAction}
            icon={FileClock}
            tone="amber"
          />
          <KpiCard
            label="Cancelados / Redigitar"
            value={stats.canceled}
            icon={AlertTriangle}
            tone="red"
          />
          <KpiCard
            label="Integrados"
            value={stats.formalized}
            icon={FileCheck}
            tone="emerald"
          />
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, CPF ou contrato…"
              className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-2 focus:ring-violet-100"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {FILTERS.map((f) => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <Card>
          <div className="divide-y divide-slate-100">
            {loading && (
              <div className="p-10 text-center text-sm text-slate-500">
                Carregando contratos…
              </div>
            )}
            {!loading && error && (
              <div className="p-10 text-center text-sm text-red-600">{error}</div>
            )}
            {!loading && !error && filtered.length === 0 && (
              <div className="p-10 text-center text-sm text-slate-500">
                Nenhum contrato encontrado para este filtro.
              </div>
            )}
            {!loading &&
              !error &&
              filtered.map((c) => (
                <ContractRow key={c.id} contract={c} onOpen={() => onOpenContract(c)} />
              ))}
          </div>
        </Card>

        <div className="mt-6 text-xs text-slate-400">
          Sincronizado com core bancário · última atualização há 3 min · SLA &lt; 10 min
        </div>
      </main>
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  tone?: ToneColor;
  delta?: string;
}

function KpiCard({ label, value, icon: Icon, tone = 'violet', delta }: KpiCardProps) {
  const c = colorMap[tone];
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className={`grid h-9 w-9 place-items-center rounded-lg ${c.bg}`}>
          <Icon className={`h-4 w-4 ${c.text}`} strokeWidth={2} />
        </div>
        {delta && (
          <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
            {delta}
          </span>
        )}
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
    </Card>
  );
}

interface ContractRowProps {
  contract: Contract;
  onOpen: () => void;
}

function ContractRow({ contract, onOpen }: ContractRowProps) {
  const isRisk = contract.status === 'at_risk';
  const isCanceled = contract.status === 'canceled';
  const avatarClass = isRisk
    ? 'bg-red-50 text-red-600'
    : isCanceled
      ? 'bg-slate-200 text-slate-500'
      : 'bg-slate-100 text-slate-500';

  const locationChip = [contract.cidade, contract.uf].filter(Boolean).join('/');
  const propRef = contract.nroProposta ?? contract.id;

  return (
    <button
      onClick={onOpen}
      className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-50/80"
    >
      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${avatarClass}`}>
        <User className="h-4 w-4" strokeWidth={2} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <div className="truncate text-sm font-medium text-slate-900">
            {contract.client.name}
          </div>
          <div className="font-mono text-[11px] text-slate-400">
            {contract.nroProposta ? `Prop. ${propRef}` : propRef}
          </div>
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
          <span className="truncate">{contract.tipoProduto ?? contract.product}</span>
          <span className="text-slate-300">·</span>
          <span>{formatBRL(contract.amount)}</span>
          {contract.installments > 0 && (
            <>
              <span className="text-slate-300">·</span>
              <span>{contract.installments}x</span>
            </>
          )}
          {contract.empregador && (
            <>
              <span className="text-slate-300">·</span>
              <span className="truncate">{contract.empregador}</span>
            </>
          )}
          {locationChip && (
            <>
              <span className="text-slate-300">·</span>
              <span>{locationChip}</span>
            </>
          )}
        </div>
        {(contract.pendency || contract.motivoRecusa) && (
          <div
            className={`mt-1 flex flex-wrap items-center gap-1.5 text-xs ${
              isRisk ? 'text-red-600' : isCanceled ? 'text-slate-600' : 'text-amber-700'
            }`}
          >
            <span className="font-medium">
              {contract.pendency?.type ?? contract.motivoRecusa}
            </span>
            {contract.pendency && contract.pendency.days > 0 && (
              <span className="opacity-80">· {contract.pendency.days} dias</span>
            )}
          </div>
        )}
      </div>

      <div className="hidden sm:block">
        <StatusBadge status={contract.status} />
      </div>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
    </button>
  );
}
