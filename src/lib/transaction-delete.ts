import type { Transaction } from '../models/Transaction';

export function transactionIdsToDelete(transactions: Transaction[], id: string): string[] {
  const tx = transactions.find((item) => item.id === id);
  if (!tx) return [];
  return tx.transferId
    ? transactions.filter((item) => item.transferId === tx.transferId).map((item) => item.id)
    : [tx.id];
}
