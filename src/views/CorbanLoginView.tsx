import { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { Brand } from '../components/Brand';
import { PrimaryButton } from '../components/Buttons';

interface CorbanLoginViewProps {
  onBack: () => void;
  onLogin: () => void;
}

export function CorbanLoginView({ onBack, onLogin }: CorbanLoginViewProps) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');

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

      <div className="flex-1 grid md:grid-cols-2">
        <div className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-600">
                Acesso Corban
              </div>
              <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                Bem-vindo de volta.
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Entre com suas credenciais Starbank.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">E-mail</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ricardo.almeida@corban.com.br"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Senha</label>
                <input
                  type="password"
                  value={pwd}
                  onChange={(e) => setPwd(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-violet-600"
                    defaultChecked
                  />{' '}
                  Manter conectado
                </label>
                <a href="#" className="text-xs font-medium text-violet-600 hover:text-violet-700">
                  Esqueci minha senha
                </a>
              </div>
              <PrimaryButton full onClick={onLogin} icon={ChevronRight}>
                Acessar painel
              </PrimaryButton>
              <p className="pt-1 text-center text-xs text-slate-400">
                No protótipo, clique em{' '}
                <span className="font-medium text-slate-600">Acessar painel</span> para entrar.
              </p>
            </div>
          </div>
        </div>

        <div className="hidden items-center bg-violet-600 p-10 text-white md:flex">
          <div className="max-w-md">
            <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-violet-200">
              Proposta de valor
            </div>
            <h2 className="text-3xl font-semibold leading-tight tracking-tight">
              Nós cuidamos dos lembretes.
              <br />
              <span className="text-violet-200">Você fecha o negócio.</span>
            </h2>
            <p className="mt-5 text-sm leading-relaxed text-violet-100">
              A Starbank coloca uma estrutura profissional de banco nas suas mãos para você fechar
              mais contratos, comissionar mais e perder menos clientes por falta de organização.
            </p>
            <div className="mt-8 grid grid-cols-3 gap-4 border-t border-white/15 pt-6">
              <div>
                <div className="text-2xl font-semibold">-40%</div>
                <div className="mt-1 text-xs text-violet-200">Contratos perdidos por doc.</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">+20pp</div>
                <div className="mt-1 text-xs text-violet-200">Conversão formalização</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">-50%</div>
                <div className="mt-1 text-xs text-violet-200">Tempo de resolução</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
