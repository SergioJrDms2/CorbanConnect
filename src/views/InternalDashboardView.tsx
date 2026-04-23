import type { LucideIcon } from 'lucide-react';
import {
  Copy,
  Eye,
  Gauge,
  LogOut,
  MessagesSquare,
  Shield,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { Brand } from '../components/Brand';
import { Card } from '../components/Card';
import { GhostButton } from '../components/Buttons';
import { XlsxUpload } from '../components/XlsxUpload';
import { colorMap } from '../lib/theme';
import type { NotificationChannel, NotificationStatus, ToneColor } from '../types';

interface InternalDashboardViewProps {
  onBack: () => void;
  userEmail?: string | null;
  onUploaded?: () => void;
}

interface LogEntry {
  ts: string;
  ch: NotificationChannel;
  ctr: string;
  reg: string;
  status: NotificationStatus;
}

const LOG_ROWS: LogEntry[] = [
  { ts: '22/04/2026 · 09:12', ch: 'whatsapp', ctr: 'CTR-2026-00412', reg: 'D+3', status: 'delivered' },
  { ts: '22/04/2026 · 09:08', ch: 'whatsapp', ctr: 'CTR-2026-00418', reg: 'D+0', status: 'delivered' },
  { ts: '22/04/2026 · 09:05', ch: 'sms', ctr: 'CTR-2026-00405', reg: 'fallback', status: 'delivered' },
  { ts: '22/04/2026 · 08:45', ch: 'whatsapp', ctr: 'CTR-2026-00387', reg: 'D+15', status: 'pending' },
  { ts: '22/04/2026 · 08:30', ch: 'email', ctr: 'CTR-2026-00376', reg: 'D+7', status: 'failed' },
  { ts: '22/04/2026 · 08:15', ch: 'whatsapp', ctr: 'CTR-2026-00398', reg: 'D+0', status: 'read' },
];

export function InternalDashboardView({ onBack, userEmail, onUploaded }: InternalDashboardViewProps) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-6">
            <Brand small />
            <div className="hidden items-center gap-1 text-xs md:flex">
              <span className="text-slate-400">/</span>
              <span className="ml-1 font-medium text-slate-700">
                Dashboard Interno · Starbank
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs text-slate-600 sm:flex">
              <Shield className="h-3.5 w-3.5" />
              <span className="max-w-[180px] truncate">{userEmail ?? 'Operações · Starbank'}</span>
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
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Visão operacional
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Saúde do sistema, engajamento e auditoria de disparos.
            </p>
          </div>
          <div className="flex gap-2">
            <select className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-700">
              <option>Últimos 30 dias</option>
              <option>Últimos 7 dias</option>
              <option>Últimas 24h</option>
            </select>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <BigMetric
            label="Taxa de abertura"
            value="67%"
            target="Meta > 60%"
            trend="up"
            trendLabel="+4pp"
            icon={Eye}
          />
          <BigMetric
            label="Ação após notificação"
            value="38%"
            target="Meta > 35%"
            trend="up"
            trendLabel="+2pp"
            icon={MessagesSquare}
          />
          <BigMetric
            label="Latência de disparo"
            value="3.2 min"
            target="Meta < 5 min"
            trend="up"
            trendLabel="-0.4min"
            icon={Zap}
          />
          <BigMetric
            label="Uptime do portal"
            value="99.8%"
            target="Meta > 99.5%"
            trend="up"
            trendLabel="estável"
            icon={Gauge}
          />
        </div>

        <div className="mb-6">
          <XlsxUpload onUploaded={onUploaded} />
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6 md:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Disparos nos últimos 7 dias
                </div>
                <div className="mt-0.5 text-xs text-slate-500">Por canal · total 4.812 envios</div>
              </div>
              <div className="flex gap-3 text-xs">
                <LegendDot color="emerald" label="WhatsApp" />
                <LegendDot color="sky" label="SMS" />
                <LegendDot color="violet" label="E-mail" />
              </div>
            </div>
            <BarChart />
          </Card>

          <Card className="p-6">
            <div className="mb-1 text-sm font-semibold text-slate-900">
              Régua de reengajamento
            </div>
            <div className="mb-5 text-xs text-slate-500">Taxa de resolução por ciclo</div>
            <div className="space-y-4">
              <RulerRow label="D+0" pct={22} count={1058} />
              <RulerRow label="D+3" pct={41} count={718} />
              <RulerRow label="D+7" pct={62} count={284} />
              <RulerRow label="D+15" pct={78} count={96} />
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
              Régua para automaticamente quando pendência é sanada. Corban copiado em D+7 e D+15.
            </div>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-3">
          <Card className="p-6 md:col-span-2">
            <div className="mb-5 flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-900">Log de disparos recentes</div>
              <GhostButton icon={Copy}>Exportar CSV</GhostButton>
            </div>
            <div className="-mx-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-2 text-left font-medium">Timestamp</th>
                    <th className="py-2 text-left font-medium">Canal</th>
                    <th className="py-2 text-left font-medium">Contrato</th>
                    <th className="py-2 text-left font-medium">Régua</th>
                    <th className="px-6 py-2 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {LOG_ROWS.map((r, i) => (
                    <LogRow key={i} r={r} />
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <div className="mb-1 text-sm font-semibold text-slate-900">Riscos monitorados</div>
            <div className="mb-5 text-xs text-slate-500">Do PRD v1.0 · §13.3</div>
            <div className="space-y-3">
              <RiskItem
                title="Cliente ligar para Starbank"
                prob="Alta"
                impact="Médio"
                color="amber"
              />
              <RiskItem
                title="Core sem API em tempo real"
                prob="Média"
                impact="Alto"
                color="amber"
              />
              <RiskItem
                title="Baixa adesão do Corban"
                prob="Média"
                impact="Alto"
                color="amber"
              />
              <RiskItem
                title="Template WhatsApp rejeitado"
                prob="Baixa"
                impact="Médio"
                color="emerald"
              />
            </div>
          </Card>
        </div>

        <div className="mt-8 text-xs text-slate-400">
          Todos os logs retidos por 5 anos · Criptografia TLS 1.2+ · Opt-out disponível ao cliente
          final · LGPD 13.709/2018
        </div>
      </main>
    </div>
  );
}

const CHANNEL_LABEL: Record<NotificationChannel, string> = {
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  email: 'E-mail',
};

const LOG_STATUS_STYLES: Record<
  NotificationStatus,
  { label: string; color: string; dot: string }
> = {
  delivered: { label: 'Entregue', color: 'text-slate-600', dot: 'bg-slate-400' },
  read: { label: 'Lida', color: 'text-emerald-700', dot: 'bg-emerald-500' },
  pending: { label: 'Pendente', color: 'text-amber-700', dot: 'bg-amber-500' },
  failed: { label: 'Falhou', color: 'text-red-700', dot: 'bg-red-500' },
};

function LogRow({ r }: { r: LogEntry }) {
  const st = LOG_STATUS_STYLES[r.status];
  return (
    <tr>
      <td className="px-6 py-3 font-mono text-xs text-slate-600">{r.ts}</td>
      <td className="py-3 text-slate-700">{CHANNEL_LABEL[r.ch]}</td>
      <td className="py-3 font-mono text-xs text-slate-500">{r.ctr}</td>
      <td className="py-3">
        <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs">{r.reg}</span>
      </td>
      <td className={`px-6 py-3 ${st.color}`}>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} /> {st.label}
        </span>
      </td>
    </tr>
  );
}

interface BigMetricProps {
  label: string;
  value: string;
  target: string;
  trend: 'up' | 'down';
  trendLabel: string;
  icon: LucideIcon;
}

function BigMetric({ label, value, target, trend, trendLabel, icon: Icon }: BigMetricProps) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50">
          <Icon className="h-4 w-4 text-violet-600" strokeWidth={2} />
        </div>
        <span
          className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium ${
            trend === 'up' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
          }`}
        >
          {trend === 'up' ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}{' '}
          {trendLabel}
        </span>
      </div>
      <div className="text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{label}</div>
      <div className="mt-2 font-mono text-[10px] text-slate-400">{target}</div>
    </Card>
  );
}

function LegendDot({ color, label }: { color: ToneColor; label: string }) {
  const c = colorMap[color];
  return (
    <span className="inline-flex items-center gap-1.5 text-slate-600">
      <span className={`h-2 w-2 rounded-full ${c.dot}`} /> {label}
    </span>
  );
}

interface ChartDay {
  l: string;
  w: number;
  s: number;
  e: number;
}

const CHART_DAYS: ChartDay[] = [
  { l: 'Qua', w: 520, s: 140, e: 80 },
  { l: 'Qui', w: 610, s: 180, e: 110 },
  { l: 'Sex', w: 480, s: 120, e: 70 },
  { l: 'Sáb', w: 210, s: 60, e: 20 },
  { l: 'Dom', w: 180, s: 50, e: 18 },
  { l: 'Seg', w: 690, s: 210, e: 120 },
  { l: 'Ter', w: 720, s: 240, e: 140 },
];

function BarChart() {
  const max = Math.max(...CHART_DAYS.map((d) => d.w + d.s + d.e));
  return (
    <div className="mt-2 flex h-48 items-end gap-3 pt-2">
      {CHART_DAYS.map((d, i) => {
        const total = d.w + d.s + d.e;
        const h = (total / max) * 100;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex h-full w-full flex-col justify-end">
              <div
                className="flex w-full flex-col overflow-hidden rounded-t-md"
                style={{ height: `${h}%` }}
              >
                <div className="bg-violet-500" style={{ flex: d.e }} />
                <div className="bg-sky-500" style={{ flex: d.s }} />
                <div className="bg-emerald-500" style={{ flex: d.w }} />
              </div>
            </div>
            <div className="text-[10px] font-medium text-slate-500">{d.l}</div>
            <div className="-mt-1 font-mono text-[10px] text-slate-400">{total}</div>
          </div>
        );
      })}
    </div>
  );
}

function RulerRow({ label, pct, count }: { label: string; pct: number; count: number }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <span className="font-mono font-semibold text-slate-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-900">{pct}%</span>
          <span className="text-slate-400">· {count}</span>
        </div>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-violet-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

interface RiskItemProps {
  title: string;
  prob: string;
  impact: string;
  color: ToneColor;
}

function RiskItem({ title, prob, impact, color }: RiskItemProps) {
  const c = colorMap[color];
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-3">
      <span className={`h-2 w-2 rounded-full ${c.dot}`} />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-slate-900">{title}</div>
        <div className="mt-0.5 text-xs text-slate-500">
          Prob. {prob} · Impacto {impact}
        </div>
      </div>
    </div>
  );
}
