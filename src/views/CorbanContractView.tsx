import {
  AlertTriangle,
  ArrowLeft,
  Banknote,
  Briefcase,
  Building2,
  CheckCircle2,
  FileSearch,
  FileText,
  FileWarning,
  Landmark,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  Percent,
  Phone,
  Send,
  Shield,
  Smartphone,
  User,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Brand } from '../components/Brand';
import { Card } from '../components/Card';
import { Field } from '../components/Field';
import { Section } from '../components/Section';
import { StatusBadge } from '../components/StatusBadge';
import { GhostButton, PrimaryButton } from '../components/Buttons';
import { colorMap } from '../lib/theme';
import { fetchContractNotifications } from '../lib/contracts';
import {
  displayCpf,
  formatBRL,
  formatCurrencyOrDash,
  formatOrDash,
  formatPercent,
} from '../lib/format';
import type {
  Contract,
  NotificationChannel,
  NotificationEvent,
  NotificationStatus,
  ToneColor,
} from '../types';

interface CorbanContractViewProps {
  contract: Contract;
  onBack: () => void;
}

export function CorbanContractView({ contract, onBack }: CorbanContractViewProps) {
  const hasObservation = !!(contract.ultimaObservacao || contract.motivoRecusa);
  const hasLegalRep = !!(contract.nomeReprLegal || contract.cpfReprLegal);

  const [notifications, setNotifications] = useState<NotificationEvent[]>(contract.notifications);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setNotifLoading(true);
    setNotifError(null);
    fetchContractNotifications(contract.id)
      .then((list) => {
        if (!cancelled) setNotifications(list);
      })
      .catch((e) => {
        if (!cancelled) setNotifError(e instanceof Error ? e.message : 'Falha ao carregar histórico.');
      })
      .finally(() => {
        if (!cancelled) setNotifLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [contract.id]);

  // If it's a card product (RMC), show limits; otherwise show installment-based financials
  const isCardProduct =
    (contract.tipoProduto ?? '').toLowerCase().includes('cartão') ||
    !!contract.rmc ||
    !!contract.nroCartao;

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
        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2 font-mono text-xs text-slate-500">
              <span>{contract.id}</span>
              {contract.nroProposta && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>Prop. {contract.nroProposta}</span>
                </>
              )}
              {contract.nroPropBanco && (
                <>
                  <span className="text-slate-300">·</span>
                  <span>{contract.nroPropBanco}</span>
                </>
              )}
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              {contract.client.name}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-slate-500">
              <span className="font-mono">CPF {displayCpf(contract.client.cpf)}</span>
              {contract.client.phone && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="font-mono">{contract.client.phone}</span>
                </>
              )}
              {contract.empregador && (
                <>
                  <span className="text-slate-300">·</span>
                  <span className="truncate">{contract.empregador}</span>
                </>
              )}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={contract.status} />
            {contract.atividade && (
              <span className="inline-flex items-center rounded-full bg-slate-900 px-2.5 py-1 text-xs font-medium text-white">
                {contract.atividade}
              </span>
            )}
            {contract.status === 'at_risk' && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-medium text-white">
                <AlertTriangle className="h-3.5 w-3.5" /> Prioridade
              </span>
            )}
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            {/* Pendência — action required */}
            {contract.pendency && (
              <Card className="border-amber-200 bg-amber-50/40 p-5">
                <div className="flex gap-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-amber-100">
                    <FileWarning className="h-4 w-4 text-amber-600" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        Ação necessária · {contract.pendency.type}
                      </div>
                      <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                        {contract.pendency.days} dias em aberto
                      </span>
                    </div>
                    {contract.pendency.description && (
                      <div className="mt-1.5 text-sm leading-relaxed text-slate-700">
                        {contract.pendency.description}
                      </div>
                    )}
                    <div className="mt-4 flex flex-wrap gap-2">
                      <PrimaryButton icon={Send}>Disparar novo lembrete</PrimaryButton>
                      <GhostButton icon={CheckCircle2}>Marcar como resolvida</GhostButton>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Internal team observation — always when present, separately from pendency */}
            {hasObservation && !contract.pendency && (
              <Card className="border-slate-200 bg-slate-50/60 p-5">
                <div className="flex gap-4">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-violet-100">
                    <MessageCircle className="h-4 w-4 text-violet-700" strokeWidth={2} />
                  </div>
                  <div className="flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        Observação da equipe interna
                      </div>
                      {contract.motivoRecusa && (
                        <span className="rounded-full bg-white px-2 py-0.5 text-[11px] font-medium text-slate-700 ring-1 ring-slate-200">
                          {contract.motivoRecusa}
                        </span>
                      )}
                    </div>
                    {contract.ultimaObservacao && (
                      <div className="text-sm leading-relaxed text-slate-700">
                        {contract.ultimaObservacao}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            )}

            {/* Observation inside pendency block (if both exist, still surface the raw observation) */}
            {contract.pendency && contract.ultimaObservacao &&
              contract.ultimaObservacao !== contract.pendency.description && (
                <Card className="border-slate-200 bg-slate-50/60 p-4">
                  <div className="flex items-start gap-3">
                    <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" />
                    <div className="text-xs leading-relaxed text-slate-600">
                      <span className="font-semibold text-slate-700">Observação interna:</span>{' '}
                      {contract.ultimaObservacao}
                    </div>
                  </div>
                </Card>
              )}

            {/* Proposta */}
            <Section title="Proposta" icon={FileSearch}>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                <Field label="Produto" value={formatOrDash(contract.tipoProduto ?? contract.product)} />
                <Field label="Tipo de proposta" value={formatOrDash(contract.tipoProposta)} />
                <Field label="Tabela" value={formatOrDash(contract.tabela)} />
                <Field label="Nº Proposta" value={formatOrDash(contract.nroProposta)} mono />
                <Field label="Nº Proposta Banco" value={formatOrDash(contract.nroPropBanco)} mono />
                <Field label="Nº Contrato Externo" value={formatOrDash(contract.nroContratoExterno)} mono />
                {isCardProduct && (
                  <>
                    <Field label="Nº Cartão" value={formatOrDash(contract.nroCartao)} mono />
                    <Field label="ID Formalização" value={formatOrDash(contract.idFormalizacao)} mono />
                  </>
                )}
                <Field label="Digitação" value={joinDateTime(contract.dataDigitacao, contract.horaDigitacao)} mono />
                <Field label="Última movimentação" value={contract.lastUpdate} mono />
              </div>
            </Section>

            {/* Financeiro */}
            <Section title={isCardProduct ? 'Valores e limites' : 'Financeiro'} icon={Banknote}>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                {isCardProduct ? (
                  <>
                    <Field label="RMC" value={formatCurrencyOrDash(contract.rmc)} />
                    <Field label="Limite total" value={formatCurrencyOrDash(contract.limiteTotal)} />
                    <Field label="Limite compras" value={formatCurrencyOrDash(contract.limiteCompras)} />
                    <Field label="Limite saque" value={formatCurrencyOrDash(contract.limiteSaque)} />
                  </>
                ) : null}
                <Field label="Valor solicitado" value={formatCurrencyOrDash(contract.valorSolicitado)} />
                <Field label="Valor liberado" value={formatBRL(contract.amount)} />
                <Field label="Valor financiado" value={formatCurrencyOrDash(contract.valorFinanciado)} />
                <Field label="IOF" value={formatCurrencyOrDash(contract.valorIof)} />
                <Field label="Valor TED" value={formatCurrencyOrDash(contract.valorTed)} />
                <Field label="Comissão" value={formatCurrencyOrDash(contract.valorComissao)} />
                {(contract.valorSegurado || contract.valorSeguro) && (
                  <>
                    <Field label="Valor segurado" value={formatCurrencyOrDash(contract.valorSegurado)} />
                    <Field label="Prêmio seguro" value={formatCurrencyOrDash(contract.valorSeguro)} />
                  </>
                )}
              </div>
            </Section>

            {/* Parcelas e taxas */}
            <Section title="Parcelas e taxas" icon={Percent}>
              <div className="grid grid-cols-2 gap-5 sm:grid-cols-3">
                <Field
                  label="Parcelas"
                  value={`${contract.installments || '—'}${
                    contract.installments ? `x de ${formatBRL(contract.installmentValue)}` : ''
                  }`}
                />
                <Field label="Juros A.M." value={formatPercent(contract.taxaJurosAm)} />
                <Field label="Juros A.A." value={formatPercent(contract.taxaJurosAa)} />
                <Field label="CET A.M." value={formatPercent(contract.taxaCetAm)} />
                <Field label="CET A.A." value={formatPercent(contract.taxaCetAa)} />
                <Field label="1º vencimento" value={formatOrDash(contract.dataPrimeiroVcto)} mono />
                <Field label="Último vencimento" value={formatOrDash(contract.dataUltimoVcto)} mono />
              </div>
            </Section>

            {/* Timeline */}
            <Section title="Andamento" icon={FileText}>
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
            </Section>

            {/* Notifications */}
            <Section
              title="Histórico de notificações ao cliente"
              icon={MessageSquare}
              hint="Régua D+0, D+3, D+7, D+15"
            >
              {notifLoading ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  Carregando histórico…
                </div>
              ) : notifError ? (
                <div className="py-6 text-center text-sm text-red-600">{notifError}</div>
              ) : notifications.length === 0 ? (
                <div className="py-6 text-center text-sm text-slate-500">
                  Nenhuma notificação enviada — contrato sem pendência ativa.
                </div>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n, i) => (
                    <NotificationRow key={i} n={n} />
                  ))}
                </div>
              )}
            </Section>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Cliente */}
            <Section title="Cliente" icon={User}>
              <div className="space-y-3 text-sm">
                <Field label="Nome" value={contract.client.name} />
                <Field label="CPF" value={displayCpf(contract.client.cpf)} mono />
                <Field label="Nascimento" value={formatOrDash(contract.client.birth)} mono />
                <Field label="Matrícula" value={formatOrDash(contract.client.matricula)} mono />
                {contract.client.rg && <Field label="RG" value={contract.client.rg} mono />}
                {contract.client.phone && (
                  <Field label="Telefone" value={contract.client.phone} mono />
                )}
                {contract.client.email && (
                  <Field label="E-mail" value={contract.client.email} />
                )}
                {(contract.client.sexo || contract.client.estadoCivil) && (
                  <div className="flex gap-4 pt-1 text-xs text-slate-500">
                    {contract.client.sexo && <span>Sexo: {contract.client.sexo}</span>}
                    {contract.client.estadoCivil && (
                      <span>Estado civil: {contract.client.estadoCivil}</span>
                    )}
                  </div>
                )}
                {contract.client.naturalidade && (
                  <div className="text-xs text-slate-500">
                    Naturalidade: {contract.client.naturalidade}
                  </div>
                )}
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <PrimaryButton full icon={MessageSquare}>
                  Abrir conversa no WhatsApp
                </PrimaryButton>
                <div className="mt-2">
                  <GhostButton icon={Phone}>Ligar para o cliente</GhostButton>
                </div>
              </div>
            </Section>

            {/* Endereço */}
            {(contract.endereco || contract.cidade) && (
              <Section title="Endereço" icon={MapPin}>
                <div className="space-y-1.5 text-sm text-slate-700">
                  {contract.endereco && <div>{contract.endereco}</div>}
                  {(contract.bairro || contract.cep) && (
                    <div className="text-slate-500">
                      {[contract.bairro, contract.cep].filter(Boolean).join(' · ')}
                    </div>
                  )}
                  {(contract.cidade || contract.uf) && (
                    <div className="text-slate-500">
                      {[contract.cidade, contract.uf].filter(Boolean).join(' / ')}
                    </div>
                  )}
                </div>
              </Section>
            )}

            {/* Dados bancários */}
            {(contract.banco || contract.agencia || contract.conta) && (
              <Section title="Dados bancários" icon={Landmark}>
                <div className="space-y-3 text-sm">
                  <Field label="Banco" value={formatOrDash(contract.banco)} mono />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Agência" value={formatOrDash(contract.agencia)} mono />
                    <Field
                      label="Conta"
                      value={
                        contract.conta
                          ? `${contract.conta}${contract.contaDv ? '-' + contract.contaDv : ''}`
                          : '—'
                      }
                      mono
                    />
                  </div>
                </div>
              </Section>
            )}

            {/* Empregador */}
            {(contract.empregador || contract.orgaoSecretaria) && (
              <Section title="Empregador" icon={Briefcase}>
                <div className="space-y-3 text-sm">
                  <Field label="Empregador" value={formatOrDash(contract.empregador)} />
                  {contract.codigoEmpregador && (
                    <Field label="Código" value={contract.codigoEmpregador} mono />
                  )}
                  {contract.orgaoSecretaria && (
                    <Field label="Órgão / Secretaria" value={contract.orgaoSecretaria} />
                  )}
                  {contract.sindicato && <Field label="Sindicato" value={contract.sindicato} />}
                </div>
              </Section>
            )}

            {/* Legal rep */}
            {hasLegalRep && (
              <Section title="Representante legal" icon={Users}>
                <div className="space-y-3 text-sm">
                  <Field label="Nome" value={formatOrDash(contract.nomeReprLegal)} />
                  <Field label="CPF" value={formatOrDash(contract.cpfReprLegal)} mono />
                </div>
              </Section>
            )}

            {/* Corban / promotora */}
            <Section title="Corban / Promotora" icon={Building2}>
              <div className="space-y-3 text-sm">
                <Field label="Matriz" value={formatOrDash(contract.nomeMatriz)} />
                <Field label="Promotora" value={formatOrDash(contract.corbanName)} />
                <Field label="Ponto de venda" value={formatOrDash(contract.pontoDeVenda)} />
                {contract.gerenteComercial && (
                  <Field label="Gerente comercial" value={contract.gerenteComercial} />
                )}
                <Field label="Gerente resp. promotora" value={formatOrDash(contract.gerenteRespPromotora)} />
                <Field label="Usuário digitador" value={formatOrDash(contract.usuarioDigitador)} mono />
              </div>
            </Section>

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

function joinDateTime(date: string | null, time: string | null): string {
  if (!date && !time) return '—';
  return [date, time].filter(Boolean).join(' · ');
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
