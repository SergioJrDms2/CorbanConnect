import { useRef, useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { Card } from './Card';
import { GhostButton, PrimaryButton } from './Buttons';
import { downloadContractsTemplate, parseContractsXlsx, type ParsedXlsx } from '../lib/xlsx';
import { upsertContracts } from '../lib/contracts';
import { isSupabaseConfigured } from '../lib/supabase';

interface XlsxUploadProps {
  onUploaded?: () => void;
}

interface UploadFeedback {
  kind: 'success' | 'error';
  message: string;
  details?: string[];
}

export function XlsxUpload({ onUploaded }: XlsxUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsed, setParsed] = useState<ParsedXlsx | null>(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<UploadFeedback | null>(null);

  function reset() {
    setFileName(null);
    setParsed(null);
    setFeedback(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setFeedback(null);
    try {
      const result = await parseContractsXlsx(file);
      setParsed(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao ler XLSX.';
      setFeedback({ kind: 'error', message: msg });
    }
  }

  async function handleUpload() {
    if (!parsed || parsed.rows.length === 0) return;
    setLoading(true);
    setFeedback(null);
    const result = await upsertContracts(parsed.rows);
    setLoading(false);
    if (result.error) {
      const isSchemaIssue =
        /schema cache|column .* does not exist|Could not find/i.test(result.error);
      setFeedback({
        kind: 'error',
        message: isSchemaIssue
          ? `${result.error}\n\nSolução: abra o SQL Editor do Supabase e execute o arquivo supabase/setup.sql (cria/atualiza todas as colunas + força reload do cache do PostgREST). Depois tente subir o XLSX novamente.`
          : result.error,
      });
      return;
    }
    setFeedback({
      kind: 'success',
      message: `${result.inserted} contrato(s) sincronizados com o Supabase.`,
    });
    setParsed(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = '';
    onUploaded?.();
  }

  const canUpload = parsed && parsed.rows.length > 0 && parsed.errors.length === 0;

  return (
    <Card className="p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet-50">
              <FileSpreadsheet className="h-4 w-4 text-violet-600" strokeWidth={2} />
            </div>
            <div className="text-sm font-semibold text-slate-900">
              Upload de carteira · XLSX
            </div>
          </div>
          <div className="mt-2 text-xs leading-relaxed text-slate-500">
            Envie a planilha com contratos e status. As linhas são sincronizadas (upsert) na
            tabela <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">contracts</code>{' '}
            do Supabase via <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">contract_id</code>.
          </div>
        </div>
        <GhostButton icon={Download} onClick={() => void downloadContractsTemplate()}>
          Baixar template
        </GhostButton>
      </div>

      {!isSupabaseConfigured && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
          Supabase não configurado. O parsing funciona, mas os dados não serão persistidos até que
          as variáveis de ambiente sejam definidas.
        </div>
      )}

      <label
        htmlFor="xlsx-input"
        className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 py-8 text-sm text-slate-500 transition-colors hover:border-violet-300 hover:bg-violet-50/40"
      >
        <Upload className="h-4 w-4" />
        {fileName ? (
          <span>
            <span className="font-medium text-slate-700">{fileName}</span> · clique para trocar
          </span>
        ) : (
          <span>
            Arraste ou <span className="font-medium text-violet-700">clique para selecionar</span>{' '}
            um arquivo .xlsx
          </span>
        )}
      </label>
      <input
        ref={inputRef}
        id="xlsx-input"
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="hidden"
        onChange={handleFileChange}
      />

      {parsed && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center gap-4 rounded-lg bg-slate-50 px-4 py-3 text-xs">
            <Stat label="Linhas válidas" value={parsed.rows.length} tone="emerald" />
            <Stat label="Erros" value={parsed.errors.length} tone="red" />
            <Stat label="Avisos" value={parsed.warnings.length} tone="amber" />
          </div>

          {parsed.errors.length > 0 && (
            <div className="max-h-40 overflow-y-auto rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              <div className="mb-1 flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" /> Corrija antes de sincronizar
              </div>
              <ul className="space-y-0.5 pl-4">
                {parsed.errors.slice(0, 20).map((e, i) => (
                  <li key={i} className="list-disc">
                    {e}
                  </li>
                ))}
                {parsed.errors.length > 20 && (
                  <li className="list-none italic text-red-600">
                    +{parsed.errors.length - 20} erros adicionais
                  </li>
                )}
              </ul>
            </div>
          )}
          {parsed.warnings.length > 0 && (
            <div className="max-h-32 overflow-y-auto rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
              <div className="mb-1 font-semibold">Avisos</div>
              <ul className="space-y-0.5 pl-4">
                {parsed.warnings.slice(0, 10).map((w, i) => (
                  <li key={i} className="list-disc">
                    {w}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-2">
            <PrimaryButton
              onClick={handleUpload}
              disabled={!canUpload || loading}
              icon={Upload}
            >
              {loading
                ? 'Sincronizando…'
                : `Sincronizar ${parsed.rows.length} contrato(s)`}
            </PrimaryButton>
            <GhostButton onClick={reset}>Cancelar</GhostButton>
          </div>
        </div>
      )}

      {feedback && (
        <div
          className={`mt-4 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
            feedback.kind === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-700'
          }`}
        >
          {feedback.kind === 'success' ? (
            <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          ) : (
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span className="whitespace-pre-line leading-relaxed">{feedback.message}</span>
        </div>
      )}
    </Card>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: 'emerald' | 'red' | 'amber' }) {
  const color =
    tone === 'emerald'
      ? 'text-emerald-700'
      : tone === 'red'
        ? 'text-red-700'
        : 'text-amber-700';
  return (
    <div className="flex items-baseline gap-1.5">
      <span className={`text-sm font-semibold ${color}`}>{value}</span>
      <span className="text-slate-500">{label}</span>
    </div>
  );
}
