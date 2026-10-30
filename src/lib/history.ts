import type { Transaction } from '../models/Transaction';

export interface HistoryDay {
  date: string;
  transactions: Transaction[];
  subtotal: number;
}

export function groupByDay(transactions: Transaction[]): HistoryDay[] {
  const days = new Map<string, Transaction[]>();
  for (const tx of transactions) {
    const date = new Date(tx.timestamp).toLocaleDateString('en-CA');
    const day = days.get(date) ?? [];
    if (tx.transferId && day.some((item) => item.transferId === tx.transferId)) continue;
    day.push(tx);
    days.set(date, day);
  }
  return [...days].sort(([a], [b]) => b.localeCompare(a)).map(([date, items]) => ({
    date,
    transactions: items,
    subtotal: items.reduce((sum, tx) => sum + (tx.transferId ? 0 : tx.type === 'income' ? tx.amount : -tx.amount), 0)
  }));
}

export function filterHistory(transactions: Transaction[], options: { query?: string; filter?: 'all' | 'income' | 'expense' | 'transfer' }): Transaction[] {
  const query = options.query?.trim().toLocaleLowerCase();
  return transactions.filter((tx) => {
    const matchesType = !options.filter || options.filter === 'all' || (options.filter === 'transfer' ? Boolean(tx.transferId) : !tx.transferId && tx.type === options.filter);
    return matchesType && (!query || tx.description.toLocaleLowerCase().includes(query));
  });
}

export function categoryUsageOrder<T extends { id: string; name: string }>(categories: T[], transactions: Transaction[], now = new Date()): T[] {
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 90);
  const counts = new Map<string, number>();
  for (const tx of transactions) if (tx.categoryId && new Date(tx.timestamp) >= start && new Date(tx.timestamp) <= now) counts.set(tx.categoryId, (counts.get(tx.categoryId) ?? 0) + 1);
  return [...categories].sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.name.localeCompare(b.name));
}
