// src/core/transfer/financialContracts.js — آزمون عملی قراردادهای گزارش مالی
// سه گزارش فقط با سیاست صریح محاسبه می‌کنند؛ این آزمون هم حالت «بدون سیاست ⇒ بدون عدد» را می‌سنجد
// و هم نتیجهٔ هر گزینهٔ سیاست را روی یک دفتر نمونهٔ متوازن بررسی می‌کند.
import { buildTrialBalance } from '@/core/reports/trialBalance';
import { buildBalanceSheet } from '@/core/reports/balanceSheet';
import { buildRevenueForm } from '@/core/reports/revenueForm';

const same = (a, b) => Math.abs(Number(a) - Number(b)) < 0.011;

// دفتر نمونه: جمع بدهکار و بستانکار برابر ۱۲۵٬۰۰۰
export const FINANCIAL_FIXTURE = [
  { code: '1010', currency: 'AFN', debit: 100000, credit: 0, party: 'صندوق مرکزی', date: '2026-11-01' },
  { code: '1030', currency: 'AFN', debit: 20000, credit: 0, party: 'مشتری آزمون', date: '2026-11-02' },
  { code: '2010', currency: 'AFN', debit: 0, credit: 30000, party: '', date: '2026-11-03' },
  { code: '3010', currency: 'AFN', debit: 0, credit: 70000, party: '', date: '2026-11-01' },
  { code: '4010', currency: 'AFN', debit: 0, credit: 25000, party: '', date: '2026-11-04' },
  { code: '5010', currency: 'AFN', debit: 5000, credit: 0, party: '', date: '2026-11-05' },
];

export const REVENUE_FIXTURE = [
  { date: '2026-11-10', kind: 'exchange', amount: 1200, account: '4010', parentNumber: 'EX-9', cashAccount: 'صندوق افغانی' },
  { date: '2026-11-11', kind: 'transfer', amount: 300, account: '4010', parentNumber: 'TR-4', cashAccount: 'صندوق افغانی' },
  { date: '2026-11-12', kind: 'penalty', amount: 50, account: '4090', parentNumber: 'JE-2', cashAccount: '' },
];

const TARIFF = { AFN: 1, USD: 71.2 };

function score(checks) {
  const passed = checks.filter((item) => item.ok).length;
  return {
    ok: passed === checks.length,
    passed,
    total: checks.length,
    evidence: checks.filter((item) => item.ok).map((item) => item.label).join('، ')
      + (passed === checks.length ? '' : '؛ ناموفق: ' + checks.filter((item) => !item.ok).map((item) => item.label + (item.detail ? ' (' + item.detail + ')' : '')).join('، ')),
  };
}

export function checkTrialBalance() {
  const checks = [];
  const expect = (label, condition, detail = '') => checks.push({ label, ok: Boolean(condition), detail });

  const noPolicy = buildTrialBalance(FINANCIAL_FIXTURE, null);
  expect('بدون سیاست هیچ ردیفی نمی‌سازد', noPolicy.status === 'blocked' && noPolicy.rows.length === 0);

  const two = buildTrialBalance(FINANCIAL_FIXTURE, { columns: 'two', level: 'sub', currency: 'split', closing: 'keep' });
  expect('دوستونی: ۶ ردیف حساب', two.status === 'ready' && two.rows.length === 6, two.rows.length + ' ردیف');
  expect('دوستونی: جمع بدهکار ۱۲۵٬۰۰۰', same(two.totals.debit, 125000), String(two.totals.debit));
  expect('دوستونی: جمع بستانکار ۱۲۵٬۰۰۰', same(two.totals.credit, 125000), String(two.totals.credit));
  expect('دوستونی: تراز برقرار است', two.totals.balanced === true);
  expect('گردش دفتر متوازن است', two.turnover.ledgerBalanced === true);

  const four = buildTrialBalance(FINANCIAL_FIXTURE, { columns: 'four', level: 'group', currency: 'base', baseCurrency: 'AFN', rates: TARIFF, closing: 'close' });
  expect('چهارستونی با بستن موقت: ۶ ردیف (۵ گروه + سود دوره)', four.status === 'ready' && four.rows.length === 6, four.rows.length + ' ردیف');
  expect('چهارستونی: سود دوره ۲۰٬۰۰۰', same(four.profit, 20000), String(four.profit));
  expect('چهارستونی: تراز پس از بستن', four.totals.balanced === true);

  const noRates = buildTrialBalance(FINANCIAL_FIXTURE, { columns: 'two', level: 'sub', currency: 'base', closing: 'keep' });
  expect('ارز پایه بدون نرخ ⇒ توقف', noRates.status === 'blocked' && noRates.missing.length > 0);

  const detail = buildTrialBalance(FINANCIAL_FIXTURE, { columns: 'two', level: 'detail', currency: 'split', closing: 'keep' });
  expect('سطح تفصیلی بدون طرف حساب ⇒ توقف', detail.status === 'blocked' && detail.rows.length === 0);

  return { key: 'trial_balance', title: 'تراز آزمایشی', ...score(checks) };
}

export function checkBalanceSheet() {
  const checks = [];
  const expect = (label, condition, detail = '') => checks.push({ label, ok: Boolean(condition), detail });

  const noPolicy = buildBalanceSheet(FINANCIAL_FIXTURE, null);
  expect('بدون سیاست هیچ مانده‌ای نمی‌سازد', noPolicy.status === 'blocked' && noPolicy.sections === null);

  const separate = buildBalanceSheet(FINANCIAL_FIXTURE, { classification: 'code', periodResult: 'separate', valuation: 'book' });
  expect('طبقه‌بندی با کدینگ: دارایی ۱۲۰٬۰۰۰', same(separate.totals?.assets, 120000), String(separate.totals?.assets));
  expect('بدهی ۳۰٬۰۰۰', same(separate.totals?.liabilities, 30000), String(separate.totals?.liabilities));
  expect('سرمایه ۷۰٬۰۰۰', same(separate.totals?.equity, 70000), String(separate.totals?.equity));
  expect('سود دوره جداگانه ۲۰٬۰۰۰', same(separate.totals?.profit, 20000), String(separate.totals?.profit));
  expect('ترازنامه تراز است', separate.totals?.balanced === true);

  const merged = buildBalanceSheet(FINANCIAL_FIXTURE, { classification: 'code', periodResult: 'equity', valuation: 'book' });
  expect('سود دوره در سرمایه: سرمایه ۹۰٬۰۰۰', same(merged.totals?.equity, 90000), String(merged.totals?.equity));
  expect('سود دوره در سرمایه: سطر جدا ندارد', same(merged.totals?.profit, 0));

  const noRates = buildBalanceSheet(FINANCIAL_FIXTURE, { classification: 'code', periodResult: 'separate', valuation: 'current' });
  expect('ارزیابی به نرخ روز بدون نرخ ⇒ توقف', noRates.status === 'blocked');

  const manual = buildBalanceSheet(FINANCIAL_FIXTURE, { classification: 'manual', periodResult: 'separate', valuation: 'book' });
  expect('طبقه‌بندی دستی بدون نگاشت ⇒ توقف', manual.status === 'blocked' && manual.missing.length > 0);

  return { key: 'balance_sheet', title: 'بیلانس عمومی (ترازنامه)', ...score(checks) };
}

export function checkRevenueForm() {
  const checks = [];
  const expect = (label, condition, detail = '') => checks.push({ label, ok: Boolean(condition), detail });

  const noPolicy = buildRevenueForm(REVENUE_FIXTURE, null);
  expect('بدون سیاست هیچ عوایدی ثبت نمی‌شود', noPolicy.status === 'blocked' && noPolicy.rows.length === 0);

  const commission = buildRevenueForm(REVENUE_FIXTURE, { scope: 'commission', document: 'separate', cash: 'yes' });
  expect('دامنهٔ کمیشن: ۲ ردیف', commission.status === 'ready' && commission.rows.length === 2, commission.rows.length + ' ردیف');
  expect('جمع عواید کمیشن ۱٬۵۰۰', same(commission.totals?.amount, 1500), String(commission.totals?.amount));
  expect('سند مستقل برای هر عواید', commission.rows.every((row) => row.docNumber.startsWith('RV-')));

  const all = buildRevenueForm(REVENUE_FIXTURE, { scope: 'all', document: 'separate', cash: 'yes' });
  expect('همهٔ درآمدها با دریافت نقدی ناقص ⇒ توقف', all.status === 'blocked' && all.rows.length === 0);

  const inside = buildRevenueForm(REVENUE_FIXTURE, { scope: 'commission', document: 'line', cash: 'no' });
  expect('سطر داخل سند عملیات: شمارهٔ سند والد', inside.status === 'ready' && inside.rows.map((row) => row.docNumber).join(',') === 'EX-9,TR-4');

  return { key: 'revenue_form', title: 'فرم مستقل عواید', ...score(checks) };
}

export function financialContractChecks() {
  return [checkTrialBalance(), checkBalanceSheet(), checkRevenueForm()];
}