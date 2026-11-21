const numberFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 0 });
const decimalFormatter = new Intl.NumberFormat('fa-IR', { maximumFractionDigits: 2 });

export function num(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '۰';
  return numberFormatter.format(Number(value));
}

export function dec(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '۰';
  return decimalFormatter.format(Number(value));
}

export function money(value) {
  return num(value);
}

export function faDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function faDateShort(value) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
    day: '2-digit',
    month: 'long',
  }).format(date);
}

export function isoToday() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60000).toISOString().slice(0, 10);
}