import assert from 'node:assert/strict';
import { groupByDay, filterHistory } from './history';
import type { Transaction } from '../models/Transaction';

const transactions = [
  { id: 'expense', type: 'expense', amount: 30, source: 'bank', timestamp: '2026-10-30T12:00:00.000Z', description: 'Belanja', transferId: undefined },
  { id: 'transfer-out', type: 'expense', amount: 20, source: 'bank', timestamp: '2026-10-30T11:00:00.000Z', description: 'Transfer', transferId: 'pair' },
  { id: 'transfer-in', type: 'income', amount: 20, source: 'cash', timestamp: '2026-10-30T11:00:00.000Z', description: 'Transfer', transferId: 'pair' },
  { id: 'income', type: 'income', amount: 50, source: 'bank', timestamp: '2026-10-30T10:00:00.000Z', description: 'Gaji', transferId: undefined }
] as Transaction[];

const grouped = groupByDay(transactions);
assert.equal(grouped.length, 1);
assert.equal(grouped[0].subtotal, 20);
assert.equal(grouped[0].transactions.filter((tx) => tx.transferId).length, 1);
assert.deepEqual(filterHistory(transactions, { query: 'bElAnJa' }).map((tx) => tx.id), ['expense']);
assert.deepEqual(filterHistory(transactions, { account: 'cash' }).map((tx) => tx.id), ['transfer-in']);
assert.deepEqual(filterHistory(transactions, { account: 'bank' }).map((tx) => tx.id), ['expense', 'transfer-out', 'income']);
const histCats = [{ id: 'food', name: 'Makanan', type: 'expense' }] as import('../models/Category').Category[];
assert.deepEqual(filterHistory(transactions, { filter: 'incomplete', categories: histCats }).map((tx) => tx.id), ['expense', 'income']);
assert.deepEqual(filterHistory([{ ...transactions[0], categoryId: 'food' }], { filter: 'incomplete', categories: histCats }), []);
console.log('history self-check: 8 assertions passed');
