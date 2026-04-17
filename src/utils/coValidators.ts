/**
 * Validaciones para identificaciones colombianas.
 */

export interface Validation {
  valid: boolean;
  message?: string;
}

/** Cédula de ciudadanía — solo dígitos, 6 a 10 cifras. */
export function validateCedula(raw: string): Validation {
  const s = raw.replace(/\s|\./g, '');
  if (!s) return { valid: false };
  if (!/^\d+$/.test(s)) return { valid: false, message: 'Solo dígitos' };
  if (s.length < 6) return { valid: false, message: 'Muy corta' };
  if (s.length > 10) return { valid: false, message: 'Muy larga' };
  return { valid: true };
}

/**
 * NIT colombiano con dígito de verificación.
 * Acepta formato "900123456-7" o "9001234567".
 * Valida el último dígito con el algoritmo DIAN.
 */
export function validateNit(raw: string): Validation {
  const clean = raw.replace(/\s|\./g, '');
  const m = clean.match(/^(\d{6,15})-?(\d)$/);
  if (!m) {
    if (/^\d+$/.test(clean) && clean.length >= 7 && clean.length <= 16) {
      return { valid: false, message: 'Falta el dígito de verificación' };
    }
    return { valid: false, message: 'Formato inválido' };
  }
  const base = m[1];
  const checkDigit = parseInt(m[2], 10);
  const expected = computeNitCheckDigit(base);
  if (expected !== checkDigit) {
    return { valid: false, message: `Dígito esperado: ${expected}` };
  }
  return { valid: true };
}

function computeNitCheckDigit(base: string): number {
  const primes = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];
  let sum = 0;
  const digits = base.split('').reverse();
  for (let i = 0; i < digits.length; i++) {
    sum += parseInt(digits[i], 10) * primes[i];
  }
  const mod = sum % 11;
  if (mod < 2) return mod;
  return 11 - mod;
}

export function formatNit(raw: string): string {
  const clean = raw.replace(/\s|\./g, '');
  const m = clean.match(/^(\d{6,15})-?(\d)$/);
  if (!m) return raw;
  return `${m[1]}-${m[2]}`;
}
