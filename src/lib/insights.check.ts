import assert from 'node:assert/strict';
import { buildInsights, insightText } from './insights';
import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';

const now = new Date(2026, 9, 30);
const categories = [{ id: 'food', name: 'Makan', type: 'expense' }] as Category[];
const makeTx = (id: string, type: 'income' | 'expense', amount: number, day = 10): Transaction => ({ id, type, amount, description: '', source: 'bank', categoryId: type === 'expense' ? 'food' : undefined, timestamp: new Date(2026, 9, day, 12).toISOString() });
const insights = buildInsights([makeTx('e', 'expense', 1000)], categories, now);
assert.equal(insightText(insights[0]), 'Makan adalah pengeluaran terbesar: Rp 1 rb (100% dari total keluar).');
const noIncome = buildInsights([makeTx('e', 'expense', 1000)], categories, now);
assert.equal(noIncome.some((i) => insightText(i).includes('Rasio tabungan')), false);
assert.equal(noIncome.some((i) => /NaN|Infinity/.test(insightText(i))), false);
assert.deepEqual(buildInsights([], categories, now), []);
assert.ok(buildInsights([makeTx('e', 'expense', 3100, 1)], categories, now).every((i) => !insightText(i).includes('NaN')));
assert.ok(buildInsights([makeTx('e', 'expense', 1000), makeTx('i', 'income', 2000)], categories, now).length <= 3);
console.log('insights self-check: 5 assertions passed');
