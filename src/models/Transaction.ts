export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  source: string;
  /** Set when this entry is one side of a transfer between funds. */
  destination?: string;
  /** Shared id for the two entries that make up a transfer. */
  transferId?: string;
  timestamp: string;
}
