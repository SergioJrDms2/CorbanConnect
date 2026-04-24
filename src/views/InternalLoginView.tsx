import { useState } from 'react';
import { ArrowLeft, ChevronRight, Shield } from 'lucide-react';
import { Brand } from '../components/Brand';
import { PrimaryButton } from '../components/Buttons';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

interface InternalLoginViewProps {
  onBack: () => void;
  onSuccess: () => void;
}

type Mode = 'signin' | 'signup';

export function InternalLoginView({ onBack, onSuccess }: InternalLoginViewProps) {
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);

    if (!supabase) {
      setError(
        'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no .env.local.',
      );
      return;
    }
    if (!email || !password) {
      setError('Informe e-mail e senha.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        onSuccess();
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.session) {
          onSuccess();
        } else {
          setInfo(
            'Conta criada. Verifique seu e-mail para confirmar (ou desative "confirm email" no Supabase para testes).',
          );
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Falha ao autenticar.';
      setError(msg);
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
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                Acesso interno · Starbank
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Dashboard operacional
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Acesso restrito à equipe Starbank para upload de carteiras e monitoramento.
              </p>
            </div>

            <div className="mb-5 inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setMode('signin')}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  mode === 'signin' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                Entrar
              </button>
              <button
                type="button"
                onClick={() => setMode('signup')}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                  mode === 'signup' ? 'bg-slate-900 text-white' : 'text-slate-600'
                }`}
              >
                Criar conta
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="lucas.operacoes@starbank.com.br"
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  {error}
                </div>
              )}
              {info && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {info}
                </div>
              )}

              <PrimaryButton full disabled={loading} icon={ChevronRight} type="submit">
                {loading
                  ? 'Processando…'
                  : mode === 'signin'
                    ? 'Acessar dashboard'
                    : 'Criar conta'}
              </PrimaryButton>

              {!isSupabaseConfigured && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
                  <strong>Supabase não configurado.</strong> Copie <code>.env.example</code>{' '}
                  para <code>.env.local</code> e preencha <code>VITE_SUPABASE_URL</code> e{' '}
                  <code>VITE_SUPABASE_ANON_KEY</code> para habilitar o acesso.
                </div>
              )}
            </div>
          </form>
        </div>

        <div className="hidden items-center bg-violet-600 p-10 text-white md:flex">
          <div className="max-w-md">
            <div className="mb-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">
              <Shield className="h-3.5 w-3.5" /> Equipe operacional
            </div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              Monitoramento, auditoria e upload de carteiras.
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-violet-100">
              Suba contratos via XLSX, acompanhe a saúde do motor de notificações e consulte o
              log de disparos com retenção de 5 anos conforme LGPD.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              <div>
                <div className="text-2xl font-semibold">99.8%</div>
                <div className="mt-1 text-xs text-violet-200">Uptime do portal</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">&lt; 5min</div>
                <div className="mt-1 text-xs text-violet-200">Latência de disparo</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">5 anos</div>
                <div className="mt-1 text-xs text-violet-200">Retenção LGPD</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
