import assert from 'node:assert/strict';
import { buildTransferEdit } from './transaction-edit';

const edited = buildTransferEdit({
  outId: 'tx-out', inId: 'tx-in', transferId: 'tr1', fromId: 'bank', toId: 'cash',
  amount: 900, adminFee: 10, timestamp: '2026-10-28T00:00:00.000Z', fromName: 'Bank', toName: 'Tunai'
});
assert.deepEqual(edited.map(({ id, type, amount, source, destination, transferId, description }) =>
  ({ id, type, amount, source, destination, transferId, description })), [
  { id: 'tx-out', type: 'expense', amount: 910, source: 'bank', destination: 'cash', transferId: 'tr1', description: 'Transfer ke Tunai (biaya Rp 10)' },
  { id: 'tx-in', type: 'income', amount: 900, source: 'cash', destination: 'bank', transferId: 'tr1', description: 'Transfer dari Bank' }
]);
console.log('transaction edit self-check: passed');
