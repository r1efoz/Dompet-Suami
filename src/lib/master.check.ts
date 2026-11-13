import assert from 'node:assert/strict';
import type { Transaction } from '../models/Transaction';
import { canRemoveAccount, categoryPayload, errorMessage, isReferenced, validateName } from './master';

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
assert.equal(errorMessage(new Error('boom'), 'x'), 'boom');
assert.equal(errorMessage({ message: "Could not find the 'icon' column" }, 'x'), "Could not find the 'icon' column");
assert.equal(errorMessage(null, 'x'), 'x');
assert.equal(canRemoveAccount(0), true);
assert.equal(canRemoveAccount(-0.2), true);
assert.equal(canRemoveAccount(1000), false);
assert.equal(canRemoveAccount(-5), false);
const cat = { id: 'c1', name: 'Istri', type: 'expense', allocation: true } as import('../models/Category').Category;
assert.deepEqual(categoryPayload(cat, false), { id: 'c1', name: 'Istri', type: 'expense' });
assert.deepEqual(categoryPayload(cat, true), { id: 'c1', name: 'Istri', type: 'expense', allocation: true });
assert.deepEqual(categoryPayload({ ...cat, allocation: undefined, icon: '💝' }, true), { id: 'c1', name: 'Istri', type: 'expense', icon: '💝', allocation: false });
console.log('master self-check: all assertions passed');
