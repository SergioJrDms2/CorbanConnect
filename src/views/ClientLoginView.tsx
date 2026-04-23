import { useState } from 'react';
import { ArrowLeft, FileText, Search, Shield } from 'lucide-react';
import { Brand } from '../components/Brand';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/Buttons';
import { formatBirth, formatCpf } from '../lib/format';

interface ClientLoginViewProps {
  onBack: () => void;
  onLogin: (cpf: string) => void;
}

export function ClientLoginView({ onBack, onLogin }: ClientLoginViewProps) {
  const [cpf, setCpf] = useState('');
  const [birth, setBirth] = useState('');

  const canSubmit = cpf.replace(/\D/g, '').length === 11 && birth.length >= 8;

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

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-violet-50">
              <FileText className="h-5 w-5 text-violet-600" strokeWidth={2} />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
              Consultar meu contrato
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Informe seu CPF e data de nascimento.
              <br />
              Sem cadastro necessário.
            </p>
          </div>

          <Card className="p-6">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">CPF</label>
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(formatCpf(e.target.value))}
                  placeholder="000.000.000-00"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Data de nascimento
                </label>
                <input
                  type="text"
                  value={birth}
                  onChange={(e) => setBirth(formatBirth(e.target.value))}
                  placeholder="dd/mm/aaaa"
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 font-mono text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-100"
                />
              </div>
              <PrimaryButton
                full
                disabled={!canSubmit}
                onClick={() => onLogin(cpf)}
                icon={Search}
              >
                Consultar
              </PrimaryButton>
              <p className="pt-2 text-center text-xs leading-relaxed text-slate-400">
                Use <span className="font-mono text-slate-600">123.456.789-01</span> e{' '}
                <span className="font-mono text-slate-600">15/03/1968</span> para ver um exemplo.
              </p>
            </div>
          </Card>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-500">
            <Shield className="h-3.5 w-3.5" /> Dados protegidos conforme LGPD · Lei 13.709/2018
          </div>
        </div>
      </div>
    </div>
  );
}
