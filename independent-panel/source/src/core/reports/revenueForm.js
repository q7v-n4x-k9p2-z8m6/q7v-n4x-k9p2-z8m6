// src/core/reports/revenueForm.js — فرم مستقل عواید، مشروط به سیاست ثبت
// دامنهٔ عواید، شکل سند و دریافت نقدی از سیاست می‌آید؛ بدون آن ردیفی تولید نمی‌شود.

export const REVENUE_POLICY = {
  scope: 'دامنهٔ عواید (فقط کمیشن یا همهٔ درآمدها)',
  document: 'شکل سند (مستقل یا داخل سند عملیات)',
  cash: 'اثر دریافت نقدی بر صندوق/بانک',
};

const COMMISSION_KINDS = ['commission', 'exchange', 'transfer', 'fee', 'کمیشن', 'معامله', 'حواله'];
const blocked = (missing) => ({ status: 'blocked', rows: [], totals: null, missing });

export function buildRevenueForm(entries = [], policy = null) {
  const missing = !policy
    ? Object.keys(REVENUE_POLICY)
    : Object.keys(REVENUE_POLICY).filter((key) => !policy[key]);
  if (missing.length) return blocked(missing.map((key) => REVENUE_POLICY[key]));
  if (!Array.isArray(entries) || entries.length === 0) return blocked(['عواید ثبت‌شده']);

  let rows = entries.map((entry) => ({
    date: entry.date || '',
    kind: String(entry.kind || ''),
    amount: Number(entry.amount || 0),
    account: String(entry.account || '4000'),
    cashAccount: String(entry.cashAccount || ''),
    parentNumber: String(entry.parentNumber || entry.number || ''),
  }));

  if (policy.scope === 'commission') rows = rows.filter((row) => COMMISSION_KINDS.includes(row.kind));
  if (rows.length === 0) return blocked(['عواید کمیشن ثبت‌شده']);
  if (policy.document === 'line' && rows.some((row) => !row.parentNumber)) {
    return blocked(['شمارهٔ سند عملیات مرتبط']);
  }
  if (policy.cash === 'yes' && rows.some((row) => !row.cashAccount)) {
    return blocked(['حساب صندوق یا بانک برای دریافت نقدی']);
  }

  rows = rows.map((row, index) => ({
    ...row,
    docNumber: policy.document === 'separate' ? 'RV-' + String(index + 1).padStart(3, '0') : row.parentNumber,
  }));

  return {
    status: 'ready',
    rows,
    totals: { amount: Math.round(rows.reduce((total, row) => total + row.amount, 0) * 100) / 100, count: rows.length },
    policy,
  };
}