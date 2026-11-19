import test from 'node:test';
import assert from 'node:assert/strict';
import { number, validateBalancedLines } from './Version21AccountingRules.js';
import { resolveSessionUserId } from './Version21DemoRules.js';

const line = (account_type, account_name, debit, credit, extra = {}) => ({
  account_type, account_name, debit, credit, currency: 'AFN', ...extra,
});

test('number treats blank values as zero but rejects malformed numeric input', () => {
  assert.equal(number(null), 0);
  assert.equal(number('  '), 0);
  assert.equal(number('12.5'), 12.5);
  assert.equal(Number.isNaN(number('12x')), true);
});

test('chart account ledger mapping rejects cash/customer/branch rows with colliding IDs', async () => {
  const { isChartAccountLedgerLine } = await import('./Version21AccountingRules.js');
  const account = { id: '12', account_name: 'مصارف دفتر' };
  assert.equal(isChartAccountLedgerLine({ account_type: 'suspense', account_id: '12', account_name: 'مصارف دفتر' }, account), true);
  assert.equal(isChartAccountLedgerLine({ account_type: 'cash', account_id: '12', account_name: 'صندوق اصلی' }, account), false);
  assert.equal(isChartAccountLedgerLine({ account_type: 'customer', account_id: '12', account_name: 'احمد' }, account), false);
  assert.equal(isChartAccountLedgerLine({ account_type: 'suspense', account_id: '12', account_name: 'نمایندگی کابل' }, account), false);
  assert.equal(isChartAccountLedgerLine({ account_type: 'suspense', account_id: '99', account_name: 'مصارف دفتر' }, account), false);
});

test('cash movement totals exclude customer and non-cash ledger rows per currency', async () => {
  const { sumCashLedgerMovement } = await import('./Version21AccountingRules.js');
  const rows = [
    { cash: 'صندوق اصلی', currency: 'AFN', amount: 120 },
    { cash: 'صندوق اصلی', currency: 'AFN', amount: -35 },
    { cash: '', currency: 'AFN', amount: -85 },
    { cash: 'صندوق دالر', currency: 'USD', amount: 50 },
  ];
  assert.equal(sumCashLedgerMovement(rows, 'AFN'), 85);
  assert.equal(sumCashLedgerMovement(rows, 'USD'), 50);
  assert.equal(sumCashLedgerMovement(rows, 'EUR'), 0);
});

test('accepts a balanced two-sided journal entry', () => {
  assert.doesNotThrow(() => validateBalancedLines([
    line('expense', 'مصارف', 250, 0),
    line('cash', 'صندوق اصلی', 0, 250, { account_id: 1 }),
  ]));
});

test('rejects an entry with fewer than two lines', () => {
  assert.throws(() => validateBalancedLines([line('cash', 'صندوق', 1, 0, { account_id: 1 })]), /حداقل دو سطر/);
});

test('rejects unbalanced totals within the same currency', () => {
  assert.throws(() => validateBalancedLines([
    line('expense', 'مصارف', 250, 0),
    line('cash', 'صندوق', 0, 249, { account_id: 1 }),
  ]), /تراز نیست/);
});

test('checks balance independently for each currency', () => {
  assert.throws(() => validateBalancedLines([
    line('expense', 'مصارف AFN', 100, 0, { currency: 'AFN' }),
    line('cash', 'صندوق AFN', 0, 100, { currency: 'AFN', account_id: 1 }),
    line('expense', 'مصارف IRR', 50, 0, { currency: 'IRR' }),
    line('cash', 'صندوق IRR', 0, 49, { currency: 'IRR', account_id: 2 }),
  ]), /ارز IRR/);
});

test('rejects malformed, negative, zero-sided, and dual-sided line amounts', () => {
  for (const [debit, credit] of [['bad', 0], [-1, 0], [0, 0], [5, 5]]) {
    assert.throws(() => validateBalancedLines([
      line('expense', 'مصارف', debit, credit),
      line('cash', 'صندوق', 0, 1, { account_id: 1 }),
    ]));
  }
});

test('requires linked cash/customer account IDs', () => {
  assert.throws(() => validateBalancedLines([
    line('customer', 'مشتری', 100, 0),
    line('cash', 'صندوق', 0, 100, { account_id: 1 }),
  ]), /شناسه حساب مرتبط/);
});

test('allows small rounding differences up to the existing tolerance', () => {
  assert.doesNotThrow(() => validateBalancedLines([
    line('expense', 'مصارف', 100, 0),
    line('cash', 'صندوق', 0, 99.997, { account_id: 1 }),
  ]));
});

test('demo identity uses the cached signed-in user ID when available', () => {
  assert.equal(resolveSessionUserId('{"id":107}', ''), '107');
  assert.equal(resolveSessionUserId('{"user_id":114}', ''), '114');
});

test('demo identity falls back to the signed session token when cached user ID is absent', () => {
  const encoded = Buffer.from(JSON.stringify({ uid: 114 })).toString('base64url');
  assert.equal(resolveSessionUserId('{"username":"33333333"}', encoded + '.signature'), '114');
});

test('demo identity rejects malformed or missing session identity', () => {
  assert.equal(resolveSessionUserId('{bad json', ''), '');
  assert.equal(resolveSessionUserId('{}', 'not-a-token'), '');
});

test('demo identity reads the claims segment of a standard three-part JWT', () => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const claims = Buffer.from(JSON.stringify({ sub: 'auth-subject', uid: 107 })).toString('base64url');
  assert.equal(resolveSessionUserId('{}', header + '.' + claims + '.signature'), '107');
});

test('demo tenant matching accepts only the exact user and exchange pair', async () => {
  const { matchDemoAccount } = await import('./Version21DemoRules.js');
  assert.equal(matchDemoAccount(107, 'EX-261019-9B2573C5')?.username, '22222222');
  assert.equal(matchDemoAccount(114, 'EX-261028-27497E95')?.username, '33333333');
  assert.equal(matchDemoAccount(107, 'EX-261028-27497E95'), null);
  assert.equal(matchDemoAccount(114, 'EX-261019-9B2573C5'), null);
  assert.equal(matchDemoAccount(999, 'EX-261019-9B2573C5'), null);
});


test('document date accepts valid ISO calendar dates and preserves date-only value', async () => {
  const { documentDateTimestamp } = await import('./Version21AccountingRules.js');
  assert.equal(documentDateTimestamp('2024-02-29'), '2024-02-29T12:00:00.000Z');
  assert.equal(documentDateTimestamp('2026-11-19'), '2026-11-19T12:00:00.000Z');
  assert.equal(documentDateTimestamp(''), null);
});

test('document date rejects impossible or non-ISO dates before posting', async () => {
  const { documentDateTimestamp } = await import('./Version21AccountingRules.js');
  for (const value of ['2025-02-29', '2026-13-01', '2026-04-31', '19/11/2026', '2026-1-01']) {
    assert.throws(() => documentDateTimestamp(value), /تاریخ سند/);
  }
});


test('cash transaction party requires the selected customer or branch to resolve', async () => {
  const { validateCashTransactionParty } = await import('./Version21AccountingRules.js');
  assert.equal(validateCashTransactionParty('customer', 'احمد', { id: 12 }), 'customer');
  assert.equal(validateCashTransactionParty('branch', 'نمایندگی کابل', { id: 3 }), 'branch');
  assert.throws(() => validateCashTransactionParty('customer', 'احمد', null), /مشتری انتخاب‌شده/);
  assert.throws(() => validateCashTransactionParty('branch', 'نمایندگی کابل', null), /نمایندگی انتخاب‌شده/);
});

test('cash transaction permits suspense counterpart only for explicit other type', async () => {
  const { validateCashTransactionParty } = await import('./Version21AccountingRules.js');
  assert.equal(validateCashTransactionParty('other', 'حساب متفرقه'), 'other');
  assert.throws(() => validateCashTransactionParty('', 'حساب متفرقه'), /نوع طرف حساب/);
  assert.throws(() => validateCashTransactionParty('other', ''), /طرف حساب/);
});


test('cash transaction edit cannot change its linked party or document relation', async () => {
  const { validateCashTransactionPartyIdentity } = await import('./Version21AccountingRules.js');
  assert.equal(validateCashTransactionPartyIdentity(
    { related_type: 'branch', related_id: 8, related_name: 'نمایندگی هرات' },
    'branch', 'نمایندگی هرات', { id: 8 }
  ), true);
  assert.throws(() => validateCashTransactionPartyIdentity(
    { related_type: 'branch', related_id: 8, related_name: 'نمایندگی هرات' },
    'branch', 'نمایندگی کابل', { id: 9 }
  ), /طرف حساب یک گردش ثبت‌شده قابل تعویض نیست/);
  assert.throws(() => validateCashTransactionPartyIdentity(
    { related_type: 'customer', related_id: 12, related_name: 'احمد' },
    'other', 'حساب متفرقه'
  ), /طرف حساب یک گردش ثبت‌شده قابل تعویض نیست/);
});
test('balanced journal requires a valid linked bank account ID', () => {
  assert.throws(() => validateBalancedLines([
    line('bank', 'بانک نمونه', 100, 0),
    line('suspense', 'حساب مقابل', 0, 100, { account_id: '9' }),
  ]), /شناسه حساب مرتبط/);
  assert.doesNotThrow(() => validateBalancedLines([
    line('bank', 'بانک نمونه', 100, 0, { account_id: '42' }),
    line('suspense', 'حساب مقابل', 0, 100, { account_id: '9' }),
  ]));
});

test('cash ledger totals match exact safe ID, currency and active ledger rows', async () => {
  const { sumCashLedgerSide } = await import('./Version21AccountingRules.js');
  const rows = [
    { accountType: 'cash', accountId: '7', currency: 'AFN', debit: 80, credit: 0 },
    { accountType: 'cash', accountId: '7', currency: 'AFN', debit: 0, credit: 20 },
    { accountType: 'cash', accountId: '70', currency: 'AFN', debit: 700, credit: 0 },
    { accountType: 'cash', accountId: '7', currency: 'USD', debit: 500, credit: 0 },
    { accountType: 'customer', accountId: '7', currency: 'AFN', debit: 400, credit: 0 },
    { accountType: 'cash', accountId: '7', currency: 'AFN', debit: 200, credit: 0, deleted: true },
  ];
  assert.equal(sumCashLedgerSide(rows, 7, 'AFN', 'debit'), 80);
  assert.equal(sumCashLedgerSide(rows, 7, 'AFN', 'credit'), 20);
  assert.equal(sumCashLedgerSide(rows, 7, 'USD', 'debit'), 500);
  assert.equal(sumCashLedgerSide(rows, 999, 'AFN', 'debit'), 0);
});

test('bank ledger totals match exact bank ID, currency and active ledger rows', async () => {
  const { sumBankLedgerMovement } = await import('./Version21AccountingRules.js');
  const rows = [
    { accountType: 'bank', accountId: '12', currency: 'AFN', debit: 100, credit: 0 },
    { accountType: 'bank', accountId: '12', currency: 'AFN', debit: 0, credit: 25 },
    { accountType: 'bank', accountId: '123', currency: 'AFN', debit: 900, credit: 0 },
    { accountType: 'bank', accountId: '12', currency: 'USD', debit: 700, credit: 0 },
    { accountType: 'cash', accountId: '12', currency: 'AFN', debit: 500, credit: 0 },
    { accountType: 'bank', accountId: '12', currency: 'AFN', debit: 300, credit: 0, deleted: true },
  ];
  assert.equal(sumBankLedgerMovement(rows, 12, 'AFN', 'debit'), 100);
  assert.equal(sumBankLedgerMovement(rows, 12, 'AFN', 'credit'), 25);
  assert.equal(sumBankLedgerMovement(rows, 12, 'USD', 'debit'), 700);
  assert.equal(sumBankLedgerMovement(rows, 999, 'AFN', 'debit'), 0);
});

test('bank ledger mapping uses the exact bank account identity', async () => {
  const { bankLedgerRef } = await import('./Version21AccountingRules.js');
  assert.deepEqual(bankLedgerRef({ id: 42, bank_name: 'بانک نمونه' }), {
    account_type: 'bank', account_id: '42', account_name: 'بانک نمونه',
  });
  assert.deepEqual(bankLedgerRef({ id: 43, bank_name: '', holder: 'دارنده حساب' }), {
    account_type: 'bank', account_id: '43', account_name: 'دارنده حساب',
  });
  assert.throws(() => bankLedgerRef({ id: 0, bank_name: 'بانک نمونه' }), /حساب بانکی/);
  assert.throws(() => bankLedgerRef({ id: 42, bank_name: '' }), /حساب بانکی/);
});
