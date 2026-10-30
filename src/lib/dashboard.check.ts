import assert from 'node:assert/strict';
import { monthlyTrend, accountMonthStats, topCategories, balanceAt } from './dashboard';
import type { Transaction } from '../models/Transaction';

const tx: Transaction[] = [{ id: 'e', type: 'expense', amount: 1000, description: '', source: 'bank', categoryId: 'food', timestamp: new Date(2026, 9, 1, 0, 30).toISOString() }];
const points = monthlyTrend(tx, 12, new Date(2026, 9, 1, 0, 30));
assert.equal(points[11].month, '2026-10');
const accounts = [{ id: 'bank', name: 'Bank', type: 'bank' }] as import('../models/Account').Account[];
const categories = [{ id: 'food', name: 'Makan', type: 'expense' }] as import('../models/Category').Category[];
assert.deepEqual(accountMonthStats(accounts, tx, new Date(2026, 9, 1), new Date(2026, 10, 1)), [{ id: 'bank', balance: -1000, income: 0, expense: 1000, count: 1 }]);
assert.deepEqual(topCategories(tx, categories, 5), { top: [{ id: 'food', name: 'Makan', icon: '🧾', value: 1000, percent: 100 }], rest: null, total: 1000 });
assert.equal(balanceAt(accounts, tx, new Date(2026, 10, 1)), -1000);
console.log('dashboard self-check: 4 assertions passed');
