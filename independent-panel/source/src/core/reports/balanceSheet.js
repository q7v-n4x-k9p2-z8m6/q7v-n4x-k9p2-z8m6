// src/core/reports/balanceSheet.js — بیلانس عمومی (ترازنامه) مشروط به سیاست تأییدشده
// طبقه‌بندی، نمایش سود دوره و مبنای ارزیابی هر سه از سیاست خوانده می‌شوند؛ بدون آن‌ها ردیفی ساخته نمی‌شود.
import { classOf, normalizeLine, missingPolicy, rateFor, round2, sum } from './ledgerBasis';

export const BALANCE_SHEET_POLICY = {
  classification: 'مبنای طبقه‌بندی اقلام',
  periodResult: 'نمایش سود دوره',
  valuation: 'مبنای ارزیابی مانده‌های ارزی',
};

const blocked = (missing) => ({ status: 'blocked', sections: null, totals: null, missing });

// نگاشت کلاس حساب به بخش ترازنامه
const SECTION_OF_CLASS = {
  asset: 'assets',
  liability: 'liabilities',
  equity: 'equity',
  revenue: 'revenue',
  expense: 'expense',
};

export function buildBalanceSheet(rawLines = [], policy = null) {
  const missing = missingPolicy(policy, Object.keys(BALANCE_SHEET_POLICY));
  if (missing.length) return blocked(missing.map((key) => BALANCE_SHEET_POLICY[key]));

  const lines = rawLines.map(normalizeLine);

  if (policy.valuation === 'current') {
    if (!policy.baseCurrency || !policy.rates) return blocked(['ارز پایه و نرخ روز برای ارزیابی مجدد']);
    const lacking = [...new Set(lines.map((line) => line.currency))].filter((code) => rateFor(policy, code) === null);
    if (lacking.length) return blocked(lacking.map((code) => 'نرخ ارز ' + code));
  }
  if (policy.classification === 'manual' && !policy.accountMap) {
    return blocked(['نگاشت دستی طبقه‌بندی حساب‌ها']);
  }

  const balances = new Map();
  lines.forEach((line) => {
    const factor = policy.valuation === 'current' ? rateFor(policy, line.currency) : 1;
    const current = balances.get(line.code) || 0;
    balances.set(line.code, current + (line.debit - line.credit) * factor);
  });

  const sections = { assets: [], liabilities: [], equity: [], revenue: [], expense: [] };
  const unmatched = [];
  balances.forEach((balance, code) => {
    const cls = policy.classification === 'manual'
      ? (policy.accountMap[code] || null)
      : classOf(code);
    if (!cls || cls === 'unknown') { unmatched.push(code); return; }
    // مانده با جهت طبیعی هر طبقه نمایش داده می‌شود: دارایی و مصرف بدهکار، بدهی و سرمایه و درآمد بستانکار
    if (!cls || cls === 'unknown') { unmatched.push(code); return; }
    // مانده با جهت طبیعی هر طبقه نمایش داده می‌شود: دارایی و مصرف بدهکار، بدهی و سرمایه و درآمد بستانکار
    const value = ['asset', 'expense'].includes(cls) ? round2(balance) : round2(-balance);
    const bucket = SECTION_OF_CLASS[cls];
    if (!bucket) { unmatched.push(code); return; }
    sections[bucket].push({ account: code, balance: value });
  });

  if (unmatched.length) return blocked(unmatched.map((code) => 'طبقه‌بندی حساب ' + code));

  const revenue = sum(sections.revenue, (row) => row.balance);
  const expense = sum(sections.expense, (row) => row.balance);
  const profit = round2(revenue - expense);

  const equityRows = [...sections.equity];
  const separateProfit = policy.periodResult === 'separate' ? profit : 0;
  if (policy.periodResult === 'equity' && profit !== 0) {
    equityRows.push({ account: 'سود دورهٔ جاری', balance: profit });
  }

  const totals = {
    assets: sum(sections.assets, (row) => row.balance),
    liabilities: sum(sections.liabilities, (row) => row.balance),
    equity: sum(equityRows, (row) => row.balance),
    profit: separateProfit,
  };
  totals.balanced = Math.abs(totals.assets - (totals.liabilities + totals.equity + totals.profit)) < 0.011;

  return {
    status: 'ready',
    sections: { assets: sections.assets, liabilities: sections.liabilities, equity: equityRows },
    totals,
    policy,
  };
}