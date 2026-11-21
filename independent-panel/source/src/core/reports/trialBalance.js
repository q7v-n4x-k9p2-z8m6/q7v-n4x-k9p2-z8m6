// src/core/reports/trialBalance.js — تراز آزمایشی مشروط به سیاست تأییدشده
// تا وقتی سیاست (ستون‌ها، سطح، ارز، بستن حساب‌های موقت) انتخاب نشود، هیچ ردیفی تولید نمی‌شود.
import { classOf, groupOf, normalizeLine, missingPolicy, rateFor, round2, sum, isBalanced } from './ledgerBasis';

export const TRIAL_BALANCE_POLICY = {
  columns: 'نوع ستون‌ها (دوستونی یا چهارستونی)',
  level: 'سطح حساب (کل، معین، تفصیلی)',
  currency: 'تفکیک ارز یا تبدیل به ارز پایه',
  closing: 'باز یا بسته‌بودن حساب‌های موقت',
};

const TEMPORARY = ['revenue', 'expense'];
const blocked = (missing) => ({ status: 'blocked', rows: [], missing, totals: null });

export function buildTrialBalance(rawLines = [], policy = null) {
  const missing = missingPolicy(policy, Object.keys(TRIAL_BALANCE_POLICY));
  if (missing.length) return blocked(missing.map((key) => TRIAL_BALANCE_POLICY[key]));

  const lines = rawLines.map(normalizeLine);

  if (policy.currency === 'base') {
    if (!policy.baseCurrency || !policy.rates) return blocked(['ارز پایه و نرخ‌های تبدیل']);
    const lacking = [...new Set(lines.map((line) => line.currency))].filter((code) => rateFor(policy, code) === null);
    if (lacking.length) return blocked(lacking.map((code) => 'نرخ ارز ' + code));
  }
  if (policy.level === 'detail' && lines.some((line) => !line.party)) {
    return blocked(['نگاشت طرف حساب برای سطح تفصیلی']);
  }

  const buckets = new Map();
  lines.forEach((line) => {
    const factor = policy.currency === 'base' ? rateFor(policy, line.currency) : 1;
    const currency = policy.currency === 'base' ? policy.baseCurrency : line.currency;
    const code = policy.level === 'group' ? groupOf(line.code) : line.code;
    const label = policy.level === 'detail' ? code + ' — ' + line.party : code;
    const key = label + '::' + currency;
    const row = buckets.get(key) || { code, account: label, currency, debitTurnover: 0, creditTurnover: 0 };
    row.debitTurnover += line.debit * factor;
    row.creditTurnover += line.credit * factor;
    buckets.set(key, row);
  });

  let rows = [...buckets.values()].map((row) => {
    const net = round2(row.debitTurnover - row.creditTurnover);
    return {
      code: row.code,
      account: row.account,
      currency: row.currency,
      debitTurnover: round2(row.debitTurnover),
      creditTurnover: round2(row.creditTurnover),
      debitBalance: net > 0 ? net : 0,
      creditBalance: net < 0 ? -net : 0,
    };
  });

  let profit = 0;
  if (policy.closing === 'close') {
    const temporary = rows.filter((row) => TEMPORARY.includes(classOf(row.code)));
    profit = round2(sum(temporary, (row) => row.creditBalance) - sum(temporary, (row) => row.debitBalance));
    rows = rows.filter((row) => !TEMPORARY.includes(classOf(row.code)));
    if (profit !== 0) {
      const currency = policy.currency === 'base' ? policy.baseCurrency : (rows[0]?.currency || 'AFN');
      rows.push({
        code: '3999',
        account: 'سود دورهٔ جاری',
        currency,
        debitTurnover: 0,
        creditTurnover: 0,
        debitBalance: profit < 0 ? -profit : 0,
        creditBalance: profit > 0 ? profit : 0,
      });
    }
  }

  const totals = {
    debit: sum(rows, (row) => row.debitBalance),
    credit: sum(rows, (row) => row.creditBalance),
    currency: policy.currency === 'base' ? policy.baseCurrency : 'تفکیک ارز',
  };
  totals.balanced = Math.abs(totals.debit - totals.credit) < 0.011;

  return {
    status: 'ready',
    rows,
    totals,
    profit: policy.closing === 'close' ? profit : 0,
    columns: policy.columns,
    turnover: {
      debit: sum(rows, (row) => row.debitTurnover),
      credit: sum(rows, (row) => row.creditTurnover),
      ledgerBalanced: isBalanced(lines),
    },
    policy,
  };
}