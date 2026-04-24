import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Briefcase,
  Calendar,
  CheckCircle2,
  Landmark,
  MessageSquare,
  Phone,
  User,
} from 'lucide-react';
import { Brand } from '../components/Brand';
import { Card } from '../components/Card';
import { Section } from '../components/Section';
import { StatusBadge } from '../components/StatusBadge';
import {
  displayCpf,
  formatBRL,
  formatCurrencyOrDash,
  formatOrDash,
  maskCpf,
} from '../lib/format';
import type { Contract } from '../types';

interface ClientStatusViewProps {
  contract: Contract;
  onBack: () => void;
}

function friendlyActionMessage(motivoRecusa: string | null): string {
  const m = (motivoRecusa ?? '').toUpperCase();
  if (m.includes('REDIGITADA') || m.includes('REDIGITAR')) {
    return 'Sua proposta precisa ser ajustada. Seu correspondente bancário está providenciando os ajustes.';
  }
  if (m.includes('DOC') || m.includes('HOLERITE') || m.includes('RG') || m.includes('COMPROVANTE')) {
    return 'Seu contrato está aguardando o envio de um documento.';
  }
  return 'Há uma atualização sobre seu contrato que precisa de atenção.';
}

export function ClientStatusView({ contract, onBack }: ClientStatusViewProps) {
  const corbanDisplayName =
    contract.pontoDeVenda ??
    (contract.corbanName ? contract.corbanName.replace(/^\d[\d.\-/]*\s*/, '') : null) ??
    'Seu correspondente';
  const corban = {
    name: corbanDisplayName,
    manager: contract.gerenteRespPromotora ?? null,
  };

  const hasAction = !!contract.pendency;
  const hasObservation =
    !hasAction && (!!contract.motivoRecusa || !!contract.ultimaObservacao);

  const installmentsText = contract.installments
    ? `${contract.installments}x de ${formatBRL(contract.installmentValue)}`
    : '—';

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

        {hasAction && contract.pendency && (
          <Card className="mb-6 border-amber-200 bg-amber-50/40 p-5">
            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-amber-100">
                <AlertCircle className="h-5 w-5 text-amber-600" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm font-semibold text-slate-900">
                  {friendlyActionMessage(contract.motivoRecusa)}
                </div>
                {contract.motivoRecusa && (
                  <div className="mb-2 text-xs font-medium text-amber-800">
                    Motivo: {contract.motivoRecusa}
                  </div>
                )}
                <div className="text-xs font-medium text-amber-700">
                  Entre em contato com seu correspondente bancário para dar continuidade.
                </div>
              </div>
            </div>
          </Card>
        )}

        {hasObservation && (
          <Card className="mb-6 border-violet-100 bg-violet-50/50 p-5">
            <div className="flex gap-4">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-violet-100">
                <MessageSquare className="h-5 w-5 text-violet-700" strokeWidth={2} />
              </div>
              <div className="flex-1">
                <div className="mb-1 text-sm font-semibold text-slate-900">
                  Há uma atualização do banco sobre seu contrato.
                </div>
                <div className="text-xs text-violet-800">
                  Fale com seu correspondente bancário para mais detalhes.
                </div>
              </div>
            </div>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Card className="p-6">
              <div className="mb-5 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-slate-500">Contrato</div>
                  <div className="mt-0.5 font-mono text-sm text-slate-900">{contract.id}</div>
                </div>
                <StatusBadge status={contract.status} />
              </div>

              <div className="grid grid-cols-2 gap-5 border-b border-slate-100 pb-5 sm:grid-cols-3">
                <KV label="Produto" value={formatOrDash(contract.tipoProduto ?? contract.product)} />
                <KV label="Valor liberado" value={formatBRL(contract.amount)} />
                <KV label="Parcelas" value={installmentsText} />
                <KV label="1º vencimento" value={formatOrDash(contract.dataPrimeiroVcto)} mono />
                <KV label="Último vencimento" value={formatOrDash(contract.dataUltimoVcto)} mono />
                <KV label="Atualizado em" value={contract.lastUpdate} mono />
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

            {(contract.empregador || contract.orgaoSecretaria) && (
              <Section title="Consignação" icon={Briefcase}>
                <div className="grid gap-5 sm:grid-cols-2">
                  <KV label="Empregador" value={formatOrDash(contract.empregador)} />
                  <KV label="Órgão / Secretaria" value={formatOrDash(contract.orgaoSecretaria)} />
                  <KV label="Matrícula" value={formatOrDash(contract.client.matricula)} mono />
                  {contract.tipoProposta && (
                    <KV label="Tipo da proposta" value={contract.tipoProposta} />
                  )}
                </div>
              </Section>
            )}

            <Section title="Resumo financeiro" icon={Banknote}>
              <div className="grid gap-5 sm:grid-cols-3">
                <KV label="Valor solicitado" value={formatCurrencyOrDash(contract.valorSolicitado)} />
                <KV label="Valor liberado" value={formatBRL(contract.amount)} />
                <KV label="Valor financiado" value={formatCurrencyOrDash(contract.valorFinanciado)} />
                <KV label="Prazo" value={contract.installments ? `${contract.installments} meses` : '—'} />
                <KV label="Parcela" value={contract.installmentValue ? formatBRL(contract.installmentValue) : '—'} />
                {contract.rmc ? (
                  <KV label="Reserva margem (RMC)" value={formatCurrencyOrDash(contract.rmc)} />
                ) : null}
              </div>
            </Section>

            {(contract.banco || contract.agencia || contract.conta) && (
              <Section title="Conta para depósito" icon={Landmark}>
                <div className="grid gap-5 sm:grid-cols-3">
                  <KV label="Banco" value={formatOrDash(contract.banco)} mono />
                  <KV label="Agência" value={formatOrDash(contract.agencia)} mono />
                  <KV
                    label="Conta"
                    value={
                      contract.conta
                        ? `${contract.conta}${contract.contaDv ? '-' + contract.contaDv : ''}`
                        : '—'
                    }
                    mono
                  />
                </div>
                <div className="mt-3 text-xs text-slate-500">
                  Confira se estes dados batem com sua conta. Qualquer divergência, avise seu
                  correspondente antes da liberação.
                </div>
              </Section>
            )}

            <Section title="Identificação da proposta" icon={Calendar}>
              <div className="grid gap-5 sm:grid-cols-2">
                <KV label="Nº da proposta" value={formatOrDash(contract.nroProposta)} mono />
                <KV label="Nº no banco" value={formatOrDash(contract.nroPropBanco)} mono />
                {contract.nroContratoExterno && (
                  <KV label="Contrato externo" value={contract.nroContratoExterno} mono />
                )}
                {contract.nroCartao && <KV label="Nº cartão" value={contract.nroCartao} mono />}
              </div>
            </Section>
          </div>

          <div>
            <div
              className="rounded-xl border border-violet-500 p-5 text-white"
              style={{ backgroundColor: '#7c3aed' }}
            >
              <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-violet-100">
                Seu correspondente
              </div>
              <div className="mb-4 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-white/20 ring-2 ring-white/30">
                  <User className="h-5 w-5 text-white" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <div className="truncate text-base font-bold text-white">{corban.name}</div>
                  <div className="mt-0.5 text-xs font-medium text-violet-100">
                    Ponto de contato dedicado
                  </div>
                </div>
              </div>
              <div className="space-y-1 border-t border-white/20 pt-4">
                <a
                  href="#"
                  className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-white transition-colors hover:bg-white/15"
                >
                  <MessageSquare className="h-4 w-4 shrink-0" /> WhatsApp
                </a>
                {corban.manager && (
                  <div className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm font-medium text-white">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{corban.manager}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-lg bg-slate-100 px-4 py-3 text-xs leading-relaxed text-slate-600">
              Qualquer dúvida sobre seu contrato, fale diretamente com{' '}
              {corban.name.split(' ')[0]}. Este é seu ponto de contato dedicado para esta
              operação.
            </div>

            <Card className="mt-4 p-5">
              <div className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Seus dados
              </div>
              <div className="space-y-2 text-sm">
                <KV label="Nome" value={contract.client.name} />
                <KV label="CPF" value={displayCpf(contract.client.cpf)} mono />
                <KV label="Nascimento" value={formatOrDash(contract.client.birth)} mono />
                {contract.client.phone && (
                  <KV label="Telefone" value={contract.client.phone} mono />
                )}
                {contract.client.email && <KV label="E-mail" value={contract.client.email} />}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

interface KVProps {
  label: string;
  value: string;
  mono?: boolean;
}

function KV({ label, value, mono = false }: KVProps) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-sm text-slate-900 ${mono ? 'font-mono' : 'font-medium'}`}>
        {value}
      </div>
    </div>
  );
}
