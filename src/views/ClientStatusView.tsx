import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  MessageSquare,
  Phone,
  User,
} from 'lucide-react';
import { Brand } from '../components/Brand';
import { Card } from '../components/Card';
import { StatusBadge } from '../components/StatusBadge';
import { MOCK_CONTRACTS } from '../data/mockContracts';
import { formatBRL, maskCpf } from '../lib/format';

interface ClientStatusViewProps {
  onBack: () => void;
}

const corban = {
  name: 'Ricardo Almeida',
  phone: '(11) 98200-1234',
};

export function ClientStatusView({ onBack }: ClientStatusViewProps) {
  const contract = MOCK_CONTRACTS[0];

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
          <div className="mb-2 text-xs font-medium text-slate-500">
            CPF {maskCpf(contract.client.cpf)}
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Olá, {contract.client.name.split(' ')[0]}.
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Aqui está o status atual do seu contrato.
          </p>
        </div>

        {contract.pendency && (
          <Card className="mb-6 border-amber-200 bg-amber-50/40 p-5">
            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm font-semibold text-slate-900">
                  Seu contrato está aguardando documentação.
                </div>
                <div className="mb-3 text-sm leading-relaxed text-slate-700">
                  <span className="font-medium">{contract.pendency.type}:</span>{' '}
                  {contract.pendency.description}
                </div>
                <div className="text-xs font-medium text-amber-700">
                  Entre em contato com seu correspondente bancário para dar continuidade.
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card className="p-6">
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <div className="text-xs font-medium text-slate-500">Contrato</div>
                  <div className="mt-0.5 font-mono text-sm text-slate-900">{contract.id}</div>
                </div>
                <StatusBadge status={contract.status} />
              </div>

              <div className="grid grid-cols-2 gap-5 border-b border-slate-100 pb-5">
                <div>
                  <div className="text-xs text-slate-500">Produto</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{contract.product}</div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Valor contratado</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    {formatBRL(contract.amount)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Parcelas</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">
                    {contract.installments}x de {formatBRL(contract.installmentValue)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-slate-500">Última atualização</div>
                  <div className="mt-1 font-mono text-sm font-medium text-slate-900">
                    {contract.lastUpdate}
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Andamento
                </div>
                <div className="space-y-3">
                  {contract.timeline.map((t, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className={`grid h-7 w-7 shrink-0 place-items-center rounded-full ${
                          t.done
                            ? 'bg-emerald-500'
                            : t.current
                              ? 'bg-amber-500 ring-4 ring-amber-100'
                              : 'bg-slate-200'
                        }`}
                      >
                        {t.done ? (
                          <CheckCircle2 className="h-4 w-4 text-white" strokeWidth={2.4} />
                        ) : (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div className="flex flex-1 items-center justify-between">
                        <div
                          className={`text-sm ${
                            t.done
                              ? 'text-slate-900'
                              : t.current
                                ? 'font-medium text-slate-900'
                                : 'text-slate-400'
                          }`}
                        >
                          {t.step}
                        </div>
                        <div className="font-mono text-xs text-slate-400">{t.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card className="border-violet-600 bg-violet-600 p-5 text-white">
              <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">
                Seu correspondente
              </div>
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white/15">
                  <User className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <div className="font-semibold">{corban.name}</div>
                  <div className="mt-0.5 text-xs text-violet-200">Ponto de contato dedicado</div>
                </div>
              </div>
              <div className="space-y-2 border-t border-white/15 pt-4">
                <a
                  href="#"
                  className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-white/10"
                >
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </a>
                <a
                  href="#"
                  className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-colors hover:bg-white/10"
                >
                  <Phone className="h-4 w-4" />{' '}
                  <span className="font-mono">{corban.phone}</span>
                </a>
              </div>
            </Card>

            <div className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600">
              Qualquer dúvida sobre seu contrato, fale diretamente com{' '}
              {corban.name.split(' ')[0]}. Ele é seu ponto de contato dedicado para esta operação.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
