import test from 'node:test';
import assert from 'node:assert/strict';
import { dollars, money, summarizeBids, eligibleClientProjects, eligibleProviderProjects } from '../lib/format.js';

test('currency helpers use server dollar and cent contracts', () => {
  assert.equal(money(123456), '$1,235');
  assert.equal(dollars(1234.6), '$1,235');
});

test('bid summary includes only accepted value', () => {
  const result = summarizeBids([{ status: 'PENDING', amount: 100 }, { status: 'ACCEPTED', amount: 250.5 }, { status: 'DECLINED', amount: 500 }]);
  assert.equal(result.pending.length, 1);
  assert.equal(result.accepted.length, 1);
  assert.equal(result.awardedValue, 250.5);
});

test('appointment candidates require a matched client project or accepted provider bid', () => {
  const projects = [{ id: 'a', status: 'POSTED' }, { id: 'b', status: 'MATCHED' }, { id: 'c', status: 'IN_PROGRESS' }];
  assert.deepEqual(eligibleClientProjects(projects).map((p) => p.id), ['b', 'c']);
  assert.deepEqual(eligibleProviderProjects([{ status: 'PENDING', project: projects[0] }, { status: 'ACCEPTED', project: projects[1] }]).map((p) => p.id), ['b']);
});
