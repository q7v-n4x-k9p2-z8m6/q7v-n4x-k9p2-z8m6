import test from 'node:test';
import assert from 'node:assert/strict';
import { number, validateBalancedLines } from './Version21AccountingRules.js';

const line = (account_type, account_name, debit, credit, extra = {}) => ({
  account_type, account_name, debit, credit, currency: 'AFN', ...extra,
});

test('number treats blank values as zero but rejects malformed numeric input', () => {
  assert.equal(number(null), 0);
  assert.equal(number('  '), 0);
  assert.equal(number('12.5'), 12.5);
  assert.equal(Number.isNaN(number('12x')), true);
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
