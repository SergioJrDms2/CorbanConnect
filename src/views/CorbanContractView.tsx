import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileWarning,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Shield,
  Smartphone,
} from 'lucide-react';
import { Brand } from '../components/Brand';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { StatusBadge } from '../components/StatusBadge';
import { GhostButton, PrimaryButton } from '../components/Buttons';
import { colorMap } from '../lib/theme';
import { formatBRL } from '../lib/format';
import type { Contract, NotificationChannel, NotificationEvent, NotificationStatus, ToneColor } from '../types';
import type { LucideIcon } from 'lucide-react';

interface CorbanContractViewProps {
  contract: Contract;
  onBack: () => void;
}

export function CorbanContractView({ contract, onBack }: CorbanContractViewProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="h-4 w-4" /> Voltar ao painel
            </button>
          </div>
          <Brand small />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 font-mono text-xs text-slate-500">{contract.id}</div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {contract.client.name}
            </h1>
            <div className="mt-1 font-mono text-sm text-slate-500">
              CPF {contract.client.cpf} · {contract.client.phone}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={contract.status} />
            {contract.status === 'at_risk' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-medium text-white">
                <AlertTriangle className="h-3.5 w-3.5" /> Prioridade
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {contract.pendency && (
              <Card className="border-amber-200 bg-amber-50/40 p-5">
                <div className="flex gap-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100">
                    <FileWarning className="h-4 w-4 text-amber-600" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {contract.pendency.type}
                      </div>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                        {contract.pendency.days} dias em aberto
                      </span>
                    </div>
                    <div className="mt-1.5 text-sm leading-relaxed text-slate-700">
                      {contract.pendency.description}
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <PrimaryButton icon={Send}>Disparar novo lembrete</PrimaryButton>
                      <GhostButton icon={CheckCircle2}>Marcar como resolvida</GhostButton>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            <Card className="p-5">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Detalhes do contrato
              </div>
              <div className="grid grid-cols-2 gap-5">
                <Field label="Produto" value={contract.product} />
                <Field label="Valor contratado" value={formatBRL(contract.amount)} />
                <Field
                  label="Parcelas"
                  value={`${contract.installments}x de ${formatBRL(contract.installmentValue)}`}
                />
                <Field label="Última atualização" value={contract.lastUpdate} mono />
              </div>
            </Card>

            <Card className="p-5">
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
            </Card>

            <Card className="p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Histórico de notificações ao cliente
                </div>
                <span className="text-[11px] text-slate-400">Régua D+0, D+3, D+7, D+15</span>
              </div>
              {contract.notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  Nenhuma notificação enviada — contrato sem pendência ativa.
                </div>
              ) : (
                <div className="space-y-2">
                  {contract.notifications.map((n, i) => (
                    <NotificationRow key={i} n={n} />
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-4">
            <Card className="p-5">
              <div className="mb-4 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cliente
              </div>
              <div className="space-y-3 text-sm">
                <Field label="Nome" value={contract.client.name} />
                <Field label="CPF" value={contract.client.cpf} mono />
                <Field label="Nascimento" value={contract.client.birth} mono />
                <Field label="Telefone" value={contract.client.phone} mono />
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <PrimaryButton full icon={MessageSquare}>
                  Abrir conversa no WhatsApp
                </PrimaryButton>
                <div className="mt-2">
                  <GhostButton icon={Phone}>Ligar para o cliente</GhostButton>
                </div>
              </div>
            </Card>

            <div className="rounded-lg border border-violet-100 bg-violet-50 px-4 py-3 text-xs leading-relaxed text-violet-800">
              <Shield className="-mt-0.5 mr-1.5 inline h-4 w-4" />
              Todas as ações e disparos ficam registrados no log de auditoria por no mínimo 5
              anos (LGPD).
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

interface ChannelStyle {
  icon: LucideIcon;
  label: string;
  color: ToneColor;
}

const CHANNEL_CONFIG: Record<NotificationChannel, ChannelStyle> = {
  whatsapp: { icon: MessageSquare, label: 'WhatsApp', color: 'emerald' },
  sms: { icon: Smartphone, label: 'SMS', color: 'sky' },
  email: { icon: Mail, label: 'E-mail', color: 'violet' },
};

interface StatusStyle {
  label: string;
  color: string;
  dot: string;
}

const STATUS_STYLES: Record<NotificationStatus, StatusStyle> = {
  delivered: { label: 'Entregue', color: 'text-slate-600', dot: 'bg-slate-400' },
  read: { label: 'Lida', color: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { label: 'Pendente', color: 'text-amber-700', dot: 'bg-amber-500' },
  failed: { label: 'Falhou', color: 'text-red-700', dot: 'bg-red-500' },
};

function NotificationRow({ n }: { n: NotificationEvent }) {
  const ch = CHANNEL_CONFIG[n.channel];
  const st = STATUS_STYLES[n.status];
  const c = colorMap[ch.color];
  const ChIcon = ch.icon;

  return (
    <div className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
      <div className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg ${c.bg}`}>
        <ChIcon className={`h-4 w-4 ${c.text}`} strokeWidth={2} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-slate-900">{ch.label}</span>
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-500">
            {n.reg}
          </span>
        </div>
        <div className="font-mono text-xs text-slate-500">{n.date}</div>
      </div>
      <div className={`flex items-center gap-1.5 text-xs font-medium ${st.color}`}>
        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
      </div>
    </div>
  );
}
