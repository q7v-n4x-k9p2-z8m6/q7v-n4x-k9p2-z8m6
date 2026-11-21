import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTH_DEFAULT_POLICY, AUTH_ENFORCEMENT_POINTS, AUTH_OPEN_DECISIONS, ROLE_MIGRATION } from './authMigration.js';

test('V22 authentication defaults use username and password only', () => {
  assert.deepEqual(AUTH_DEFAULT_POLICY.loginFields, ['username', 'password']);
  assert.equal(AUTH_DEFAULT_POLICY.emailRequired, false);
  assert.equal(AUTH_DEFAULT_POLICY.otpRequired, false);
  assert.equal(AUTH_DEFAULT_POLICY.sessionPersistence, 'until-explicit-logout');
});

test('tenant isolation and staff permissions are enforced on the server', () => {
  assert.match(AUTH_DEFAULT_POLICY.tenantIsolation, /exchange_code.*membership.*RLS/);
  assert.equal(AUTH_DEFAULT_POLICY.permissionStore, 'user_permissions');
  assert.equal(AUTH_DEFAULT_POLICY.employeeInvite, 'owner-created');
  assert.equal(AUTH_DEFAULT_POLICY.clientSecretStorage, false);
  assert.match(AUTH_DEFAULT_POLICY.passwordStorage, /salted password hash/);
  assert.ok(AUTH_ENFORCEMENT_POINTS.some((item) => item.key === 'tenant-rls'));
  assert.ok(AUTH_ENFORCEMENT_POINTS.some((item) => item.key === 'server-permission'));
});

test('all five application roles have an explicit V22 mapping and no auth decisions remain open', () => {
  assert.deepEqual(ROLE_MIGRATION.map((row) => row.local), ['creator', 'admin', 'sarraaf', 'employee', 'customer']);
  assert.ok(ROLE_MIGRATION.every((row) => row.target.startsWith('V22 users.role') && row.platformRole === row.local));
  assert.deepEqual(AUTH_OPEN_DECISIONS, []);
});
