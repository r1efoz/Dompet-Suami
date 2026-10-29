import type { Transaction } from '../models/Transaction';

type TransactionRow = Omit<Transaction, 'categoryId' | 'transferId'> & {
  category_id?: string;
  transfer_id?: string;
};

type AppTransaction = Transaction & { categoryId?: string };

export function toDatabaseTransaction(transaction: AppTransaction): TransactionRow {
  const { categoryId, transferId, ...row } = transaction;
  return {
    ...row,
    ...(categoryId ? { category_id: categoryId } : {}),
    ...(transferId ? { transfer_id: transferId } : {})
  };
}

export function fromDatabaseTransaction(row: TransactionRow): AppTransaction {
  const { category_id, transfer_id, ...transaction } = row;
  return {
    ...transaction,
    ...(category_id ? { categoryId: category_id } : {}),
    ...(transfer_id ? { transferId: transfer_id } : {})
  };
}
