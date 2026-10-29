import assert from 'node:assert/strict';
import { transactionIdsToDelete } from './transaction-delete';

const txs = [
  { id: 'out', type: 'expense' as const, amount: 120, description: 'Transfer ke Tunai', source: 'bank', transferId: 'tr1', timestamp: '2026-10-01' },
  { id: 'in', type: 'income' as const, amount: 100, description: 'Transfer dari Bank', source: 'cash', transferId: 'tr1', timestamp: '2026-10-01' },
  { id: 'normal', type: 'expense' as const, amount: 10, description: 'Kopi', source: 'cash', timestamp: '2026-10-02' }
];
assert.deepEqual(transactionIdsToDelete(txs, 'normal'), ['normal']);
assert.deepEqual(transactionIdsToDelete(txs, 'out'), ['out', 'in']);
assert.deepEqual(transactionIdsToDelete(txs, 'missing'), []);
console.log('transaction delete self-check: passed');
