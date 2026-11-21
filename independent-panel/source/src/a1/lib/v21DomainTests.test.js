import test from 'node:test';
import assert from 'node:assert/strict';
import { runVersion21DomainChecks } from './v21DomainTests.js';

test('financial domain rules remain balanced and reject invalid entries', () => {
  const report = runVersion21DomainChecks();
  const failed = report.results.filter((item) => !item.ok);
  assert.equal(report.failed, 0, failed.map((item) => item.name + ': ' + item.message).join('\n'));
  assert.equal(report.passed, report.total);
});
