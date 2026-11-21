// test-harness/format.js — قالب‌بندی نمایشی اعداد و ارز
const CURRENCY_LABELS = {
  AFN: 'افغانی',
  USD: 'دالر',
  EUR: 'یورو',
  PKR: 'کلدار',
  IRR: 'تومان',
};

export function fmt(value, decimals = 0) {
  return Number(value || 0).toLocaleString('fa-IR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function currencyLabel(code) {
  return CURRENCY_LABELS[code] || code || '—';
}

export function money(value, code) {
  return `${fmt(value)} ${currencyLabel(code)}`;
}

export function dateLabel(value) {
  return value || '—';
}