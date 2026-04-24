/**
 * CPF/CNPJ validators (módulo 11 checksum).
 *
 * References: Receita Federal algoritmo oficial.
 * Does NOT perform online validation — only the structural/checksum rule.
 */

function onlyDigits(v: string): string {
  return v.replace(/\D/g, '');
}

function allSameDigit(digits: string): boolean {
  return /^(\d)\1+$/.test(digits);
}

function mod11Digit(digits: string, weights: number[]): number {
  const sum = weights.reduce((acc, w, i) => acc + w * Number(digits[i]), 0);
  const rest = sum % 11;
  return rest < 2 ? 0 : 11 - rest;
}

export function isValidCpf(cpf: string): boolean {
  const d = onlyDigits(cpf);
  if (d.length !== 11) return false;
  if (allSameDigit(d)) return false;

  const dv1 = mod11Digit(d.slice(0, 9), [10, 9, 8, 7, 6, 5, 4, 3, 2]);
  if (dv1 !== Number(d[9])) return false;
  const dv2 = mod11Digit(d.slice(0, 10), [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
  return dv2 === Number(d[10]);
}

export function isValidCnpj(cnpj: string): boolean {
  const d = onlyDigits(cnpj);
  if (d.length !== 14) return false;
  if (allSameDigit(d)) return false;

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const dv1 = mod11Digit(d.slice(0, 12), w1);
  if (dv1 !== Number(d[12])) return false;
  const dv2 = mod11Digit(d.slice(0, 13), w2);
  return dv2 === Number(d[13]);
}

/**
 * Accept the Corban's login identifier in two shapes:
 *  - 14-digit CNPJ (full, checksum-validated)
 *  - 8-digit raiz (the "radical" at the start of `NOME PROMOTORA`, not checksum-validatable
 *    on its own, but accepted since the XLSX export only includes these 8 digits)
 */
export function isAcceptableCorbanIdentifier(v: string): boolean {
  const d = onlyDigits(v);
  if (d.length === 14) return isValidCnpj(d);
  if (d.length === 8) return !allSameDigit(d);
  return false;
}
