// a1/lib/format.js — قالب‌بندی اعداد و تاریخ، برگرفته از lib/sarraaf.js سورس A1

export function toPersianDigits(value) {
  return String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);
}

export function toEnglishDigits(value) {
  return String(value ?? '')
    .replace(/[۰-۹]/g, (digit) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit)));
}

// نام فارسی ارزها از منبع مرکزی دامنه می‌آید
export { CURRENCY_NAMES, currencyLabel } from '@/core/domain/currencies';

export function formatNumber(number, decimals = 0) {
  const value = Number(toEnglishDigits(number));
  if (!Number.isFinite(value)) return '۰';
  return toPersianDigits(value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }));
}

export function formatAmount(number, currency = '', decimals = 0) {
  const formatted = formatNumber(number, decimals);
  return currency ? `${formatted} ${currency}` : formatted;
}

export function formatDate(dateString, withTime = false) {
  if (!dateString) return '—';
  // تاریخ بدون ساعت (YYYY-MM-DD) یک «روز تقویمی» است و نباید با اختلاف منطقهٔ زمانی جابه‌جا شود.
  const dayOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateString).trim());
  const date = dayOnly
    ? new Date(Number(dayOnly[1]), Number(dayOnly[2]) - 1, Number(dayOnly[3]))
    : new Date(dateString);
  if (Number.isNaN(date.getTime())) return '—';
  const options = withTime
    ? { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }
    : { year: 'numeric', month: '2-digit', day: '2-digit' };
  return new Intl.DateTimeFormat('fa-IR', options).format(date);
}

export function todayJalali() {
  return new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}

export const TX_TYPE_LABELS = {
  trade: 'خرید و فروش',
  dadogereft: 'داد و گرفت',
  transfer_send: 'حواله ارسالی',
  transfer_receive: 'حواله دریافتی',
  transfer_execute: 'اجرای حواله',
  convert: 'تبدیل اسعار',
  deposit: 'واریز',
  withdraw: 'برداشت',
  income: 'درآمد',
  expense: 'مصرف',
  opening: 'ماندهٔ آغازین',
  manual: 'سند دستی',
};