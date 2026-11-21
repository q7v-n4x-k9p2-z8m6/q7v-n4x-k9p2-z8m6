// src/core/reports/ledgerBasis.js — مبنای مشترک گزارش‌های مالی (بدون فریم‌ورک)
// فقط ابزار تبدیل و تجمیع سطر دفتر است؛ هیچ قاعدهٔ حسابداری حدسی در این فایل نیست.

export const ACCOUNT_CLASSES = {
  1: 'asset',
  2: 'liability',
  3: 'equity',
  4: 'revenue',
  5: 'expense',
};

export const CLASS_LABEL = {
  asset: 'دارایی',
  liability: 'بدهی',
  equity: 'سرمایه',
  revenue: 'درآمد',
  expense: 'مصرف',
  unknown: 'نامشخص',
};

export const round2 = (value) => Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100;

export const accountCode = (line) => String(line?.accountCode ?? line?.account_code ?? line?.code ?? '').trim();

export const classOf = (code) => ACCOUNT_CLASSES[String(code || '').trim().charAt(0)] || 'unknown';

export const groupOf = (code) => String(code || '').trim().charAt(0) || '';

export function normalizeLine(line = {}) {
  return {
    code: accountCode(line),
    party: String(line.party ?? line.partyName ?? ''),
    currency: line.currency || 'AFN',
    debit: Number(line.debit || 0),
    credit: Number(line.credit || 0),
    date: line.date || '',
  };
}

export const missingPolicy = (policy, keys) => keys.filter((key) => !policy || !policy[key]);

// نرخ یک ارز در سیاست؛ نبودِ نرخ باید گزارش شود، نه با ۱ جایگزین شود
export function rateFor(policy, currency) {
  if (!policy) return null;
  if (currency === policy.baseCurrency) return 1;
  const rate = policy.rates ? policy.rates[currency] : null;
  return rate === null || rate === undefined ? null : Number(rate);
}

export const sum = (rows, pick) => round2(rows.reduce((total, row) => total + Number(pick(row) || 0), 0));

// توازن دفتر: در هر ارز، جمع بدهکار و بستانکار باید برابر باشد
export function isBalanced(lines) {
  const byCurrency = new Map();
  lines.forEach((line) => {
    byCurrency.set(line.currency, (byCurrency.get(line.currency) || 0) + (line.debit - line.credit));
  });
  return [...byCurrency.values()].every((value) => Math.abs(value) < 0.011);
}