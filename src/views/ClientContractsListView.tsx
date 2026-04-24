import { AlertCircle, ArrowLeft, ChevronRight, FileText } from 'lucide-react';
import { Brand } from '../components/Brand';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { formatBRL, formatOrDash, maskCpf } from '../lib/format';
import type { Contract } from '../types';

interface ClientContractsListViewProps {
  contracts: Contract[];
  onBack: () => void;
  onOpen: (c: Contract) => void;
}

export function ClientContractsListView({
  contracts,
  onBack,
  onOpen,
}: ClientContractsListViewProps) {
  const client = contracts[0]?.client;
  const pendingCount = contracts.filter(
    (c) => !!c.pendency || (c.status === 'canceled' && !!c.motivoRecusa),
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" /> Sair
          </button>
          <Brand small />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8">
          {client && (
            <div className="mb-2 text-xs font-medium text-slate-500">
              CPF {maskCpf(client.cpf)}
            </div>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Olá, {client?.name.split(' ')[0] ?? 'cliente'}.
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Você tem{' '}
            <span className="font-semibold text-slate-900">
              {contracts.length} contrato{contracts.length > 1 ? 's' : ''} em aberto
            </span>
            . Toque em um deles para ver os detalhes.
          </p>
        </div>

        {pendingCount > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50/40 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <div className="text-sm text-slate-700">
                <span className="font-semibold text-slate-900">
                  {pendingCount} contrato{pendingCount > 1 ? 's' : ''} com ação pendente.
                </span>{' '}
                Entre em contato com seu correspondente para dar continuidade.
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          {contracts.map((c) => (
            <ContractCard key={c.id} contract={c} onOpen={() => onOpen(c)} />
          ))}
        </div>

        <div className="mt-8 text-xs text-slate-400">
          Dados sincronizados com o banco · qualquer dúvida, fale com seu correspondente.
        </div>
      </main>
    </div>
  );
}

interface ContractCardProps {
  contract: Contract;
  onOpen: () => void;
}

function ContractCard({ contract, onOpen }: ContractCardProps) {
  const hasAction =
    !!contract.pendency ||
    (contract.status === 'canceled' && !!contract.motivoRecusa);

  return (
    <button
      onClick={onOpen}
      className="group w-full rounded-xl border border-slate-200 bg-white p-5 text-left transition-all hover:border-violet-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-violet-50">
            <FileText className="h-5 w-5 text-violet-600" strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <div className="mb-0.5 font-mono text-xs text-slate-500">{contract.id}</div>
            <div className="font-semibold text-slate-900">
              {formatOrDash(contract.tipoProduto ?? contract.product)}
            </div>
            {contract.empregador && (
              <div className="mt-0.5 text-xs text-slate-500">{contract.empregador}</div>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={contract.status} />
          <ChevronRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5" />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
        <div>
          <div className="text-[11px] text-slate-500">Valor liberado</div>
          <div className="mt-0.5 text-sm font-semibold text-slate-900">
            {formatBRL(contract.amount)}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500">Parcelas</div>
          <div className="mt-0.5 text-sm font-medium text-slate-900">
            {contract.installments
              ? `${contract.installments}x de ${formatBRL(contract.installmentValue)}`
              : '—'}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-slate-500">Atualizado</div>
          <div className="mt-0.5 font-mono text-xs text-slate-700">{contract.lastUpdate}</div>
        </div>
      </div>

      {hasAction && (
        <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-800">
          {contract.pendency?.type ?? contract.motivoRecusa} — ação necessária.
        </div>
      )}
    </button>
  );
}
