// src/core/reports/trialBalance.js — تراز آزمایشی چهارستونی و چندارزی
import { classOf, groupOf, normalizeLine, missingPolicy, rateFor, round2, sum, isBalanced } from './ledgerBasis';

export const TRIAL_BALANCE_POLICY = {
  columns: 'نوع ستون‌ها (دوستونی یا چهارستونی)',
  level: 'سطح حساب (کل، معین، تفصیلی)',
  currency: 'تفکیک ارز یا تبدیل به ارز پایه',
  closing: 'باز یا بسته‌بودن حساب‌های موقت',
};

const TEMPORARY = ['revenue', 'expense'];
const blocked = (missing) => ({ status: 'blocked', rows: [], missing, totals: null });

function groupedTotals(rows, pickDebit, pickCredit) {
  const grouped = new Map();
  rows.forEach((row) => {
    const currency = String(row.currency || 'AFN');
    const item = grouped.get(currency) || { currency, debit: 0, credit: 0 };
    item.debit += Number(pickDebit(row) || 0);
    item.credit += Number(pickCredit(row) || 0);
    grouped.set(currency, item);
  });
  return [...grouped.values()].map((item) => ({
    currency: item.currency,
    debit: round2(item.debit),
    credit: round2(item.credit),
    balanced: Math.abs(item.debit - item.credit) < 0.011,
  }));
}

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

  const profitByCurrency = {};
  if (policy.closing === 'close') {
    const temporary = rows.filter((row) => TEMPORARY.includes(classOf(row.code)));
    const byCurrency = groupedTotals(temporary, (row) => row.creditBalance, (row) => row.debitBalance);
    byCurrency.forEach((item) => {
      // groupedTotals در اینجا debit=درآمد بستانکار و credit=مصرف بدهکار است.
      const profit = round2(item.debit - item.credit);
      profitByCurrency[item.currency] = profit;
      if (profit !== 0) {
        rows.push({
          code: '3999',
          account: 'سود دورهٔ جاری',
          currency: item.currency,
          debitTurnover: 0,
          creditTurnover: 0,
          debitBalance: profit < 0 ? -profit : 0,
          creditBalance: profit > 0 ? profit : 0,
        });
      }
    });
    rows = rows.filter((row) => !TEMPORARY.includes(classOf(row.code)));
  }

  const balanceByCurrency = groupedTotals(rows, (row) => row.debitBalance, (row) => row.creditBalance);
  const turnoverByCurrency = groupedTotals(rows, (row) => row.debitTurnover, (row) => row.creditTurnover);
  const singleCurrency = balanceByCurrency.length <= 1;
  const totals = {
    ...(singleCurrency ? {
      debit: balanceByCurrency[0]?.debit || 0,
      credit: balanceByCurrency[0]?.credit || 0,
    } : {}),
    byCurrency: balanceByCurrency,
    currency: policy.currency === 'base' ? policy.baseCurrency : 'تفکیک ارز',
    balanced: balanceByCurrency.every((item) => item.balanced),
  };
  const turnover = {
    byCurrency: turnoverByCurrency,
    ledgerBalanced: isBalanced(lines),
    balanced: turnoverByCurrency.every((item) => item.balanced),
  };
  if (singleCurrency) {
    turnover.debit = turnoverByCurrency[0]?.debit || 0;
    turnover.credit = turnoverByCurrency[0]?.credit || 0;
  }

  const profitValues = Object.values(profitByCurrency);
  const profit = profitValues.length <= 1 ? (profitValues[0] || 0) : profitByCurrency;
  return {
    status: 'ready',
    rows,
    totals,
    profit,
    profitByCurrency,
    columns: policy.columns,
    turnover,
    policy,
  };
}

// دو نمای هم‌زمان: گردش و ماندهٔ مستقل هر ارز + تجمیع بر ارز پایه با نرخ ثبت‌شده.
export function buildTrialBalanceViews(rawLines = [], policy = {}, rates = {}) {
  const split = buildTrialBalance(rawLines, { ...policy, currency: 'split' });
  const base = buildTrialBalance(rawLines, {
    ...policy,
    currency: 'base',
    baseCurrency: policy.baseCurrency || 'AFN',
    rates,
  });
  return { split, base };
}
