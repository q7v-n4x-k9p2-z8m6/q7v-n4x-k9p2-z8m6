import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isReversalDocument,
  isOriginalLinkedDocument,
  cashBankOutflows,
  assertAvailableBalance,
} from './v21PostingGuards.js';

test('reversal document is identified by its document type', () => {
  assert.equal(isReversalDocument({ doc_type: 'reversal' }), true);
  assert.equal(isReversalDocument({ doc_type: 'transfer' }), false);
});

test('reversal document is identified by its source link even if type is missing', () => {
  assert.equal(isReversalDocument({ doc_type: 'transfer', reverses_document_id: 42 }), true);
  assert.equal(isReversalDocument({ reverses_document_id: null }), false);
});

test('linked document selection keeps original reversed documents but excludes reversal rows', () => {
  const docs = [
    { id: 1, transfer_id: 9, doc_type: 'transfer', reversed: true },
    { id: 2, transfer_id: 9, doc_type: 'transfer_fee', reversed: true },
    { id: 3, transfer_id: 9, doc_type: 'reversal', reverses_document_id: 1, reversed: false },
    { id: 4, transfer_id: 9, doc_type: 'reversal', reverses_document_id: 2, reversed: false },
    { id: 5, transfer_id: 9, doc_type: 'transfer', deleted: true },
  ];
  const linked = docs.filter(isOriginalLinkedDocument);
  assert.deepEqual(linked.map((doc) => doc.id), [1, 2]);
  assert.equal(linked.filter((doc) => !doc.reversed).length, 0);
});

test('cash and bank outflows are netted by account and currency', () => {
  const rows = cashBankOutflows([
    { account_type: 'cash', account_id: '1', account_name: 'صندوق اصلی', currency: 'AFN', debit: 0, credit: 10 },
    { account_type: 'cash', account_id: '1', account_name: 'صندوق اصلی', currency: 'AFN', debit: 2, credit: 3 },
    { account_type: 'cash', account_id: '1', account_name: 'صندوق اصلی', currency: 'USD', debit: 0, credit: 9 },
    { account_type: 'bank', account_id: '2', account_name: 'بانک', currency: 'USD', debit: 0, credit: 4 },
    { account_type: 'cash', account_id: '3', account_name: 'صندوق دوم', currency: 'AFN', debit: 20, credit: 0 },
    { account_type: 'customer', account_id: '8', account_name: 'مشتری', currency: 'AFN', debit: 0, credit: 50 },
  ]);
  assert.deepEqual(
    rows.map(({ account_type, account_id, currency, required }) => [account_type, account_id, currency, required]),
    [
      ['cash', '1', 'AFN', 11],
      ['cash', '1', 'USD', 9],
      ['bank', '2', 'USD', 4],
    ],
  );
});

test('available balance accepts exact payment and the rounding tolerance', () => {
  assert.equal(assertAvailableBalance({ available: 100, required: 100, accountName: 'صندوق', currency: 'AFN' }), true);
  assert.equal(assertAvailableBalance({ available: 100, required: 100.004, accountName: 'صندوق', currency: 'AFN' }), true);
});

test('available balance rejects an outflow that would make cash negative', () => {
  assert.throws(
    () => assertAvailableBalance({ available: 99, required: 100, accountName: 'صندوق اصلی', currency: 'AFN' }),
    /موجودی صندوق اصلی کافی نیست/,
  );
});

test('available balance rejects invalid values', () => {
  assert.throws(
    () => assertAvailableBalance({ available: Number.NaN, required: 10 }),
    /مانده یا مبلغ خروجی حساب معتبر نیست/,
  );
});
