export function formatBRL(n: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(n);
}

export function formatCpf(v: string): string {
  return v
    .replace(/\D/g, '')
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function formatBirth(v: string): string {
  return v
    .replace(/\D/g, '')
    .slice(0, 8)
    .replace(/(\d{2})(\d)/, '$1/$2')
    .replace(/(\d{2})(\d)/, '$1/$2');
}

export function maskCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length === 11) {
    return `***.***.${digits.slice(6, 9)}-${digits.slice(9)}`;
  }
  return cpf.replace(/(\d{3})\.(\d{3})\.(\d{3})-(\d{2})/, '***.***.$3-$4');
}

export function displayCpf(cpf: string): string {
  const digits = cpf.replace(/\D/g, '');
  if (digits.length === 11) {
    return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  }
  if (digits.length === 14) {
    return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }
  return cpf;
}

export function formatPercent(n: number | null | undefined, decimals = 2): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '—';
  return `${n.toFixed(decimals).replace('.', ',')}%`;
}

export function formatOrDash(value: string | null | undefined): string {
  return value && value.trim() !== '' ? value : '—';
}

export function formatCurrencyOrDash(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n) || n === 0) return '—';
  return formatBRL(n);
}
