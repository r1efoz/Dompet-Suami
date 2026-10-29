import assert from 'node:assert/strict';
import { fromDatabaseTransaction, toDatabaseTransaction } from './transaction-mapping';

const transaction = {
  id: 'tx1', type: 'income' as const, amount: 100, description: 'Gaji',
  source: 'bank', categoryId: 'salary', timestamp: '2026-10-29T00:00:00.000Z'
};
const row = toDatabaseTransaction(transaction);
assert.equal(row.category_id, 'salary');
assert.equal('categoryId' in row, false);
assert.deepEqual(fromDatabaseTransaction(row), transaction);

const transfer = { ...transaction, destination: 'cash', transferId: 'tr1' };
assert.deepEqual(fromDatabaseTransaction(toDatabaseTransaction(transfer)), transfer);
console.log('transaction mapping self-check: passed');
