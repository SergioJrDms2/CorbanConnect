interface FieldProps {
  label: string;
  value: string;
  mono?: boolean;
}

export function Field({ label, value, mono = false }: FieldProps) {
  return (
    <div>
      <div className="text-xs text-slate-500">{label}</div>
      <div className={`mt-1 text-sm text-slate-900 ${mono ? 'font-mono' : 'font-medium'}`}>
        {value}
      </div>
    </div>
  );
}
