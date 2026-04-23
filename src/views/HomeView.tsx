import { Building2, ChevronRight, CircleDot, Shield, User, UserCheck, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Brand } from '../components/Brand';
import type { ViewId } from '../types';

interface HomeViewProps {
  onNavigate: (view: ViewId) => void;
}

interface PortalCard {
  id: ViewId;
  icon: LucideIcon;
  tag: string;
  title: string;
  desc: string;
  cta: string;
}

const portals: PortalCard[] = [
  {
    id: 'client-login',
    icon: User,
    tag: 'Cliente final',
    title: 'Portal do Cliente',
    desc: 'Consulta de status do contrato por CPF. Sem cadastro. Direcionamento ao Corban responsável.',
    cta: 'Consultar contrato',
  },
  {
    id: 'corban-login',
    icon: UserCheck,
    tag: 'Correspondente bancário',
    title: 'Painel do Corban',
    desc: 'Gestão da carteira de contratos, pendências e histórico de notificações enviadas aos clientes.',
    cta: 'Acessar painel',
  },
  {
    id: 'internal-dashboard',
    icon: Building2,
    tag: 'Equipe Starbank',
    title: 'Dashboard Interno',
    desc: 'Monitoramento operacional, logs de disparo, métricas de engajamento e saúde do sistema.',
    cta: 'Abrir dashboard',
  },
];

export function HomeView({ onNavigate }: HomeViewProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Brand />
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CircleDot className="h-3 w-3 text-emerald-500" />
            <span>PRD v1.0 · Rascunho</span>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-10 pt-16">
        <div className="max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 ring-1 ring-inset ring-violet-100">
            <Zap className="h-3.5 w-3.5" strokeWidth={2.4} /> Protótipo navegável · Abril 2026
          </div>
          <h1 className="text-4xl font-semibold leading-[1.1] tracking-tight text-slate-900 md:text-5xl">
            Notificações automáticas e portal de acompanhamento
            <span className="text-violet-600"> de contratos.</span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-slate-600">
            Estrutura o fluxo entre Starbank, Corban e cliente final. Resolve a falha crítica em
            que contratos ficam paralisados por falta de documentação sem que ninguém notifique o
            cliente — preservando o Corban como intermediário exclusivo.
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          {portals.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.id}
                onClick={() => onNavigate(p.id)}
                className="group rounded-xl border border-slate-200 bg-white p-6 text-left transition-all hover:border-violet-300 hover:shadow-sm"
              >
                <div className="mb-5 grid h-11 w-11 place-items-center rounded-lg bg-violet-50 transition-colors group-hover:bg-violet-100">
                  <Icon className="h-5 w-5 text-violet-600" strokeWidth={2} />
                </div>
                <div className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {p.tag}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-slate-900">{p.title}</h3>
                <p className="mb-5 text-sm leading-relaxed text-slate-600">{p.desc}</p>
                <div className="inline-flex items-center gap-1 text-sm font-medium text-violet-600 transition-all group-hover:gap-2">
                  {p.cta}
                  <ChevronRight className="h-4 w-4" strokeWidth={2.2} />
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-6 md:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Módulos da plataforma</h3>
              <button
                onClick={() => onNavigate('notifications')}
                className="inline-flex items-center gap-1 text-xs font-medium text-violet-600 hover:text-violet-700"
              >
                Ver preview das notificações <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="space-y-4">
              <ModuleRow
                num="01"
                title="Notificações automáticas ao cliente"
                desc="Detecção de pendência em < 5min. Disparo via WhatsApp (prioritário), SMS (fallback) e e-mail (secundário). Régua D+0, D+3, D+7, D+15."
              />
              <ModuleRow
                num="02"
                title="Portal de acompanhamento"
                desc="Cliente: acesso por CPF + nascimento. Corban: painel consolidado da carteira com filtros, indicadores de risco e histórico de notificações."
              />
            </div>
          </div>

          <div className="rounded-xl bg-gradient-to-br from-violet-600 to-violet-700 p-6 text-white">
            <div className="mb-4 flex items-center gap-2 text-xs font-medium text-violet-100">
              <Shield className="h-4 w-4" /> Premissa inegociável
            </div>
            <p className="text-base leading-relaxed">
              O cliente pertence ao Corban. Toda comunicação é{' '}
              <span className="font-semibold">informativa e redirecionadora</span> — o canal de
              suporte é e sempre será o Corban.
            </p>
            <div className="mt-6 border-t border-white/20 pt-5 text-xs leading-relaxed text-violet-100">
              Abordagem ao Corban: parceria, nunca controle. <br />
              Mensagem:{' '}
              <span className="text-white">"estamos te ajudando a fechar mais contratos"</span>.
            </div>
          </div>
        </div>
      </section>

      <footer className="mx-auto mt-16 max-w-6xl border-t border-slate-200 px-6 py-8 text-xs text-slate-400">
        Plataforma Corban Connect · PRD v1.0 · Confidencial — Uso Interno · Starbank
      </footer>
    </div>
  );
}

interface ModuleRowProps {
  num: string;
  title: string;
  desc: string;
}

function ModuleRow({ num, title, desc }: ModuleRowProps) {
  return (
    <div className="flex items-start gap-4">
      <div className="pt-0.5 font-mono text-xs font-semibold text-violet-600">{num}</div>
      <div className="flex-1">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="mt-1 text-sm leading-relaxed text-slate-600">{desc}</div>
      </div>
    </div>
  );
}
