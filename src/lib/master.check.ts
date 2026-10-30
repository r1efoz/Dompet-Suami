import assert from 'node:assert/strict';
import type { Transaction } from '../models/Transaction';
import { isReferenced, validateName } from './master';

const tx = (p: Partial<Transaction>): Transaction => ({ id: 'x', type: 'expense', amount: 1, description: '', source: 'a', timestamp: '2026-10-01T00:00:00Z', ...p });
const list = [tx({ source: 'bank', destination: 'cash', categoryId: 'food' })];

assert.equal(isReferenced(list, { accountId: 'bank' }), true);
assert.equal(isReferenced(list, { accountId: 'cash' }), true);
assert.equal(isReferenced(list, { accountId: 'zzz' }), false);
assert.equal(isReferenced(list, { categoryId: 'food' }), true);
assert.equal(isReferenced(list, { categoryId: 'other' }), false);

const existing = [{ id: '1', name: 'Bank', type: 'bank' }, { id: '2', name: 'Makan', type: 'expense' }];
assert.equal(validateName(existing, '  ', 'bank'), 'Nama wajib diisi.');
assert.equal(validateName(existing, 'x'.repeat(41), 'bank'), 'Nama terlalu panjang.');
assert.equal(validateName(existing, 'bANk', 'bank'), 'Nama sudah dipakai.');
assert.equal(validateName(existing, 'Bank', 'bank', '1'), null);
assert.equal(validateName(existing, 'Bank', 'cash'), null);
assert.equal(validateName(existing, 'Baru', 'bank'), null);
console.log('master self-check: all assertions passed');
