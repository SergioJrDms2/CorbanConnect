import { ArrowLeft } from 'lucide-react';
import { Brand } from '../components/Brand';
import { Card } from '../components/Card';

interface NotificationPreviewViewProps {
  onBack: () => void;
}

export function NotificationPreviewView({ onBack }: NotificationPreviewViewProps) {
  return (
    <div className="min-h-screen bg-slate-50">
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

      <main className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 max-w-2xl">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
            Módulo 01
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Templates de notificação
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            Toda mensagem redireciona para o Corban responsável. Nunca cria canal de suporte
            direto com a Starbank.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <div className="text-xs font-semibold text-slate-700">WhatsApp · Prioritário</div>
            </div>
            <div className="space-y-2 rounded-2xl bg-[#e5ddd5] p-4">
              <div className="max-w-[90%] rounded-lg rounded-tl-none bg-white p-3 shadow-sm">
                <div className="mb-1 text-[11px] font-semibold text-emerald-700">
                  Starbank · verificado ✓
                </div>
                <div className="text-sm leading-snug text-slate-800">
                  Olá, Maria! 👋
                  <br />
                  <br />
                  Seu contrato{' '}
                  <span className="font-mono text-xs">CTR-2026-00412</span> está aguardando
                  documentação:
                  <br />
                  <br />
                  <span className="font-medium">📄 Holerite ilegível</span>
                  <br />
                  <br />
                  Entre em contato com <span className="font-medium">Ricardo Almeida</span>{' '}
                  (seu correspondente) para enviar o documento e dar continuidade.
                </div>
                <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2">
                  <span className="text-[10px] text-slate-400">Ver status do contrato</span>
                  <span className="font-mono text-[10px] text-slate-400">09:12 ✓✓</span>
                </div>
              </div>
              <div className="max-w-[70%] rounded-lg rounded-tl-none bg-white p-2.5 shadow-sm">
                <div className="text-xs text-slate-500">📞 Ricardo · (11) 98200-1234</div>
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-sky-500" />
              <div className="text-xs font-semibold text-slate-700">SMS · Fallback</div>
            </div>
            <div className="rounded-2xl bg-slate-900 p-5 text-slate-100">
              <div className="mb-1 text-[10px] uppercase tracking-wider text-slate-400">
                SMS · Starbank
              </div>
              <div className="mb-3 font-mono text-xs text-slate-400">22/04 · 09:12</div>
              <div className="rounded-lg bg-slate-800 p-3 text-sm leading-snug">
                Starbank: seu contrato CTR-2026-00412 precisa de um documento. Fale com seu
                correspondente Ricardo (11) 98200-1234. Ver status: starbank.co/c/ab12
              </div>
              <div className="mt-3 text-[10px] text-slate-500">
                160 caracteres · sem canal de suporte direto
              </div>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-violet-500" />
              <div className="text-xs font-semibold text-slate-700">E-mail · Secundário</div>
            </div>
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 px-4 py-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">De:</span>
                  <span className="font-medium text-slate-700">
                    nao-responder@starbank.com.br
                  </span>
                </div>
                <div className="mt-1 flex justify-between">
                  <span className="text-slate-500">Assunto:</span>
                  <span className="font-medium text-slate-700">
                    Seu contrato aguarda documento
                  </span>
                </div>
              </div>
              <div className="p-4 text-sm leading-relaxed text-slate-700">
                Olá, Maria.
                <br />
                <br />
                Identificamos que seu contrato{' '}
                <span className="font-mono text-xs">CTR-2026-00412</span> está aguardando
                documentação para prosseguir.
                <br />
                <br />
                <span className="font-medium">Pendência:</span> Holerite ilegível.
                <br />
                <br />
                Para resolver, entre em contato com seu correspondente bancário,{' '}
                <span className="font-medium">Ricardo Almeida</span>, pelo telefone{' '}
                <span className="font-mono">(11) 98200-1234</span>.
                <br />
              </div>
              <div className="px-4 pb-4">
                <div className="rounded-lg bg-violet-600 py-2.5 text-center text-sm font-medium text-white">
                  Ver status do contrato
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-12">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
            Módulo 01 · Régua
          </div>
          <h2 className="mb-6 text-xl font-semibold tracking-tight text-slate-900">
            Régua de reengajamento
          </h2>
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <RulerStep
                day="D+0"
                title="Notificação inicial"
                desc="Detecção em < 5 min. Tom informativo, claro."
                active
              />
              <RulerStep
                day="D+3"
                title="1º lembrete"
                desc="Tom levemente mais direto. Ainda informativo."
              />
              <RulerStep
                day="D+7"
                title="2º lembrete"
                desc="Corban copiado. Destaque para risco de atraso."
              />
              <RulerStep
                day="D+15"
                title="Alerta final"
                desc="Corban copiado. Urgência sem ser alarmista."
              />
            </div>
            <div className="mt-6 border-t border-slate-100 pt-5 text-xs leading-relaxed text-slate-500">
              Régua configurável. Para automaticamente quando a pendência é sanada no core
              bancário.
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

interface RulerStepProps {
  day: string;
  title: string;
  desc: string;
  active?: boolean;
}

function RulerStep({ day, title, desc, active = false }: RulerStepProps) {
  return (
    <div>
      <div
        className={`mb-3 font-mono text-sm font-bold ${active ? 'text-violet-600' : 'text-slate-400'}`}
      >
        {day}
      </div>
      <div className={`mb-3 h-0.5 ${active ? 'bg-violet-500' : 'bg-slate-200'}`} />
      <div className="mb-1 text-sm font-semibold text-slate-900">{title}</div>
      <div className="text-xs leading-relaxed text-slate-500">{desc}</div>
    </div>
  );
}
