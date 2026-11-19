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
