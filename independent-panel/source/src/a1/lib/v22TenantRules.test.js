import test from 'node:test';
import assert from 'node:assert/strict';
import { belongsToExchange } from './v22TenantRules.js';

test('allows records belonging to the active exchange', () => {
  assert.equal(belongsToExchange({ exchange_code: 'EX-01' }, 'EX-01'), true);
});

test('rejects records from another exchange', () => {
  assert.equal(belongsToExchange({ exchange_code: 'EX-02' }, 'EX-01'), false);
});

test('rejects records with a missing or blank exchange code', () => {
  assert.equal(belongsToExchange({}, 'EX-01'), false);
  assert.equal(belongsToExchange({ exchange_code: '' }, 'EX-01'), false);
  assert.equal(belongsToExchange({ exchange_code: null }, 'EX-01'), false);
});

test('rejects access when the active exchange code is missing', () => {
  assert.equal(belongsToExchange({ exchange_code: 'EX-01' }, ''), false);
  assert.equal(belongsToExchange({ exchange_code: 'EX-01' }, null), false);
});

test('trims tenant identifiers consistently', () => {
  assert.equal(belongsToExchange({ exchange_code: ' EX-01 ' }, 'EX-01'), true);
});
