import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTrialBalance, buildTrialBalanceViews } from './trialBalance.js';
import { buildBalanceSheet } from './balanceSheet.js';
import { buildRevenueForm } from './revenueForm.js';
import {
  APPROVED_TRIAL_BALANCE_POLICY,
  APPROVED_BALANCE_SHEET_POLICY,
  APPROVED_REVENUE_POLICY,
  ratesFromCurrencyRecords,
  trialBalanceLinesFromAccounts,
} from './approvedPolicies.js';

const multiCurrencyLedger = [
  { code: '1010', currency: 'AFN', debit: 60, credit: 0 },
  { code: '4010', currency: 'AFN', debit: 0, credit: 100 },
  { code: '5010', currency: 'AFN', debit: 40, credit: 0 },
  { code: '1010', currency: 'USD', debit: 30, credit: 0 },
  { code: '4010', currency: 'USD', debit: 0, credit: 50 },
  { code: '5010', currency: 'USD', debit: 20, credit: 0 },
];

test('approved V22 trial balance closes temporary accounts separately per currency', () => {
  const result = buildTrialBalance(multiCurrencyLedger, APPROVED_TRIAL_BALANCE_POLICY);
  assert.equal(result.status, 'ready');
  assert.deepEqual(result.profitByCurrency, { AFN: 60, USD: 30 });
  assert.equal(result.totals.balanced, true);
  const temporaryRows = result.rows.filter((row) => ['4', '5'].includes(row.code.charAt(0)));
  assert.equal(temporaryRows.length, 4, 'revenue and expense account turnover remains visible');
  assert.equal(temporaryRows.every((row) => row.debitBalance === 0 && row.creditBalance === 0), true, 'temporary balances close to the profit row');
  assert.equal(Object.hasOwn(result.totals, 'debit'), false, 'cross-currency totals must not be added together');
  assert.deepEqual(
    result.totals.byCurrency.map((row) => [row.currency, row.debit, row.credit, row.balanced]),
    [['AFN', 60, 60, true], ['USD', 30, 30, true]],
  );
  assert.deepEqual(
    result.turnover.byCurrency.map((row) => [row.currency, row.debit, row.credit, row.balanced]),
    [['AFN', 100, 100, true], ['USD', 50, 50, true]],
  );
});

test('approved trial balance provides both native-currency and base-currency views', () => {
  const result = buildTrialBalanceViews(multiCurrencyLedger, APPROVED_TRIAL_BALANCE_POLICY, { AFN: 1, USD: 70 });
  assert.equal(result.split.status, 'ready');
  assert.equal(result.base.status, 'ready');
  assert.equal(result.base.rows.every((row) => row.currency === 'AFN'), true);
  assert.equal(result.base.totals.balanced, true);
  assert.equal(result.base.profit, 2160);
});

test('base-currency view blocks when a recorded currency rate is missing', () => {
  const result = buildTrialBalanceViews(multiCurrencyLedger, APPROVED_TRIAL_BALANCE_POLICY, { AFN: 1 });
  assert.equal(result.split.status, 'ready');
  assert.equal(result.base.status, 'blocked');
  assert.ok(result.base.missing.some((item) => item.includes('USD')));
});

test('approved balance sheet policy requires a recorded rate for every foreign currency', () => {
  const lines = [
    { code: '1010', currency: 'AFN', debit: 100, credit: 0 },
    { code: '2010', currency: 'AFN', debit: 0, credit: 30 },
    { code: '3010', currency: 'AFN', debit: 0, credit: 70 },
    { code: '1010', currency: 'USD', debit: 10, credit: 0 },
    { code: '3010', currency: 'USD', debit: 0, credit: 10 },
  ];
  const result = buildBalanceSheet(lines, { ...APPROVED_BALANCE_SHEET_POLICY, rates: { AFN: 1, USD: 70 } });
  assert.equal(result.status, 'ready');
  assert.equal(result.totals.assets, 800);
  assert.equal(result.totals.equity, 770);
  assert.equal(result.totals.balanced, true);
  const blocked = buildBalanceSheet(lines, { ...APPROVED_BALANCE_SHEET_POLICY, rates: { AFN: 1 } });
  assert.equal(blocked.status, 'blocked');
  assert.ok(blocked.missing.includes('نرخ ارز USD'));
});

test('approved revenue policy includes all revenue and keeps cash collection in cash operations', () => {
  const entries = [
    { date: '2026-11-01', kind: 'commission', amount: 100, account: '4010', parentNumber: 'EX-1' },
    { date: '2026-11-02', kind: 'other', amount: 50, account: '4090', parentNumber: 'JE-2' },
  ];
  const result = buildRevenueForm(entries, APPROVED_REVENUE_POLICY);
  assert.equal(result.status, 'ready');
  assert.equal(result.rows.length, 2);
  assert.equal(result.totals.amount, 150);
  assert.deepEqual(result.rows.map((row) => row.docNumber), ['RV-001', 'RV-002']);
});

test('currency records map their actual currency, buy_rate and sell_rate fields', () => {
  const rates = ratesFromCurrencyRecords([
    { currency: 'USD', buy_rate: 70, sell_rate: 72, is_active: true },
    { currency: 'EUR', buy_rate: 75, sell_rate: 0, rate: 75, is_active: true },
    { currency: 'IRR', accounting_rate: 0.0012, buy_rate: 0.001, sell_rate: 0.0014, is_active: true },
    { currency: 'GBP', buy_rate: 90, sell_rate: 92, is_active: false },
  ]);
  assert.deepEqual(rates, { USD: 71, IRR: 0.0012 });
  assert.equal(Object.hasOwn(rates, 'EUR'), false, 'one-sided rate must not be accepted as a mid-rate');
});

test('trial balance mapping subtracts child totals from parent rollups without double counting', () => {
  const mapped = trialBalanceLinesFromAccounts([
    { id: 'a1', code: '1010', accountType: 'asset', name: 'دارایی کل', parentId: '', balanceByCurrency: [{ currency: 'AFN', debit: 100, credit: 0 }] },
    { id: 'a2', code: '1011', accountType: 'asset', name: 'صندوق', parentId: 'a1', balanceByCurrency: [{ currency: 'AFN', debit: 60, credit: 0 }] },
    { id: 'a3', code: '1012', accountType: 'asset', name: 'بانک', parentId: 'a1', balanceByCurrency: [{ currency: 'AFN', debit: 40, credit: 0 }] },
    { id: 'l1', code: '2010', accountType: 'liability', name: 'بدهی کل', parentId: '', balanceByCurrency: [{ currency: 'AFN', debit: 0, credit: 50 }] },
    { id: 'l2', code: '2011', accountType: 'liability', name: 'بدهی معین', parentId: 'l1', balanceByCurrency: [{ currency: 'AFN', debit: 0, credit: 30 }] },
  ]);
  assert.equal(mapped.status, 'ready');
  assert.deepEqual(mapped.lines, [
    { code: '1011', currency: 'AFN', debit: 60, credit: 0 },
    { code: '1012', currency: 'AFN', debit: 40, credit: 0 },
    { code: '2010', currency: 'AFN', debit: 0, credit: 20 },
    { code: '2011', currency: 'AFN', debit: 0, credit: 30 },
  ]);
});

test('trial balance mapping blocks account codes inconsistent with account class', () => {
  const mapped = trialBalanceLinesFromAccounts([
    { id: 'x1', code: '4010', accountType: 'asset', name: 'کد ناسازگار', parentId: '', balanceByCurrency: [{ currency: 'AFN', debit: 10, credit: 0 }] },
  ]);
  assert.equal(mapped.status, 'blocked');
  assert.equal(mapped.lines.length, 0);
});


test('revenue preview never adds different currencies into one total', () => {
  const result = buildRevenueForm([
    { date: '2026-11-01', kind: 'commission', amount: 100, currency: 'AFN', account: '4010' },
    { date: '2026-11-02', kind: 'other', amount: 2, currency: 'USD', account: '4090' },
  ], APPROVED_REVENUE_POLICY);
  assert.equal(result.status, 'ready');
  assert.equal(result.totals.amount, null);
  assert.deepEqual(result.totals.byCurrency, [
    { currency: 'AFN', amount: 100 },
    { currency: 'USD', amount: 2 },
  ]);
  assert.equal(result.postingStatus, 'not-posted');
  assert.ok(result.rows.every((row) => row.documentStatus === 'preview-only'));
});

test('revenue preview blocks invalid amounts, dates, currencies and account codes', () => {
  const result = buildRevenueForm([
    { date: '2026-02-30', kind: 'other', amount: -5, currency: 'US', account: 'cash' },
  ], APPROVED_REVENUE_POLICY);
  assert.equal(result.status, 'blocked');
  assert.equal(result.rows.length, 0);
  assert.equal(result.totals, null);
  assert.equal(result.errors.length, 4);
});
