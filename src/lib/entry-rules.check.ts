import assert from 'node:assert/strict';
import type { Category } from '../models/Category';
import { DESCRIPTION_REQUIRED_FROM, entryProblem } from './entry-rules';

const cats = [
  { id: 'food', name: 'Makanan', type: 'expense' },
  { id: 'wife', name: 'Transfer Ke Istri', type: 'expense', allocation: true },
  { id: 'salary', name: 'Gaji', type: 'income' }
] as Category[];
const noCat = { field: 'category', message: 'Pilih kategori dulu.' };
const noDesc = { field: 'description', message: 'Isi keterangan untuk pengeluaran Rp 500 rb ke atas.' };

assert.equal(DESCRIPTION_REQUIRED_FROM, 500_000);
assert.equal(entryProblem({ type: 'expense', amount: 1000, transferId: 'tr1' }, cats), null);
assert.equal(entryProblem({ id: 'fee_tr1', type: 'expense', amount: 2500 }, cats), null);
assert.deepEqual(entryProblem({ type: 'expense', amount: 1000 }, cats), noCat);
assert.deepEqual(entryProblem({ type: 'expense', amount: 1000, categoryId: '' }, cats), noCat);
assert.deepEqual(entryProblem({ type: 'expense', amount: 1000, categoryId: 'gone' }, cats), noCat);
assert.deepEqual(entryProblem({ type: 'income', amount: 1000 }, cats), noCat);
assert.equal(entryProblem({ type: 'expense', amount: 499_999, categoryId: 'food', description: '' }, cats), null);
assert.deepEqual(entryProblem({ type: 'expense', amount: 500_000, categoryId: 'food', description: '  ' }, cats), noDesc);
assert.equal(entryProblem({ type: 'expense', amount: 500_000, categoryId: 'food', description: 'PLN' }, cats), null);
assert.equal(entryProblem({ type: 'expense', amount: 8_500_000, categoryId: 'wife' }, cats), null);
assert.equal(entryProblem({ type: 'income', amount: 18_214_145, categoryId: 'salary' }, cats), null);
console.log('entry-rules self-check: 12 assertions passed');
