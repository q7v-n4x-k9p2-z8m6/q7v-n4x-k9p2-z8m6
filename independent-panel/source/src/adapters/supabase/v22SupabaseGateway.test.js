import test from 'node:test';
import assert from 'node:assert/strict';
import { createV22SupabaseGateway, V22_GATEWAY_RPC } from './v22SupabaseGateway.js';
import { GatewayError, GATEWAY_METHODS } from '../../core/gateway/contract.js';

function fakeClient({ data = null, error = null } = {}) {
  const calls = [];
  return {
    calls,
    rpc: async (name, args) => {
      calls.push({ name, args });
      return { data, error };
    },
  };
}

test('V22 Supabase gateway implements the complete neutral gateway contract', () => {
  const client = fakeClient();
  const gateway = createV22SupabaseGateway({ client, exchangeCode: 'EX-22' });
  GATEWAY_METHODS.forEach((method) => assert.equal(typeof gateway[method], 'function', method));
});

test('every database dispatch is pinned to the active exchange', async () => {
  const client = fakeClient({ data: { id: 'new-1' } });
  const gateway = createV22SupabaseGateway({ client, exchangeCode: ' EX-22 ' });
  const result = await gateway.create('journal', { amount: 10 });
  assert.deepEqual(result, { id: 'new-1' });
  assert.equal(client.calls.length, 1);
  assert.equal(client.calls[0].name, V22_GATEWAY_RPC);
  assert.equal(client.calls[0].args.p_action, 'create');
  assert.equal(client.calls[0].args.p_exchange_code, 'EX-22');
  assert.equal(client.calls[0].args.p_module, 'journal');
});

test('gateway refuses to start without a tenant or Supabase client', () => {
  assert.throws(() => createV22SupabaseGateway({ client: fakeClient() }), (error) => error instanceof GatewayError && error.code === 'MISSING_TENANT');
  assert.throws(() => createV22SupabaseGateway({ exchangeCode: 'EX-22' }), (error) => error instanceof GatewayError && error.code === 'NO_SUPABASE_CLIENT');
});

test('server errors are normalized to GatewayError', async () => {
  const client = fakeClient({ error: { code: '42501', message: 'row denied', details: 'tenant policy' } });
  const gateway = createV22SupabaseGateway({ client, exchangeCode: 'EX-22' });
  await assert.rejects(gateway.list('customers'), (error) => error instanceof GatewayError && error.code === '42501' && error.details === 'tenant policy');
});

test('bulk clear and reset remain blocked in the production gateway', async () => {
  const client = fakeClient();
  const gateway = createV22SupabaseGateway({ client, exchangeCode: 'EX-22' });
  await assert.rejects(gateway.clearExcept([]), (error) => error.code === 'PROTECTED_OPERATION');
  await assert.rejects(gateway.reset(), (error) => error.code === 'PROTECTED_OPERATION');
  assert.equal(client.calls.length, 0);
});

test('realtime requires an explicitly supplied tenant-aware subscription factory', () => {
  const gateway = createV22SupabaseGateway({ client: fakeClient(), exchangeCode: 'EX-22' });
  assert.throws(() => gateway.subscribe(() => {}), (error) => error.code === 'REALTIME_NOT_CONFIGURED');
});
