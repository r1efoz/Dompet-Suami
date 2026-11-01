import type { Account } from '../models/Account';
import type { Transaction } from '../models/Transaction';

/** Single source of truth: balances are derived from ledger entries. */
export function computeBalances(accounts: Account[], transactions: Transaction[]): Record<string, number> {
  const balances: Record<string, number> = {};
  for (const account of accounts) balances[account.id] = 0;

  for (const tx of transactions) {
    const current = balances[tx.source] ?? 0;
    balances[tx.source] = current + (tx.type === 'income' ? tx.amount : -tx.amount);
  }

  return balances;
}

/**
 * Entries that count as income/expense: non-transfers, plus each transfer's admin fee
 * (outgoing minus incoming amount) as an expense. Keeps income - expense equal to the balance change.
 */
export function operating(transactions: Transaction[]): Transaction[] {
  const result: Transaction[] = [];
  const incoming = new Map<string, number>();
  for (const tx of transactions) if (tx.transferId && tx.type === 'income') incoming.set(tx.transferId, tx.amount);
  for (const tx of transactions) {
    if (!tx.transferId) result.push(tx);
    else if (tx.type === 'expense') {
      const fee = tx.amount - (incoming.get(tx.transferId) ?? tx.amount);
      if (fee > 0) result.push({ id: `fee_${tx.transferId}`, type: 'expense', amount: fee, description: 'Biaya admin transfer', source: tx.source, timestamp: tx.timestamp });
    }
  }
  return result;
}

export interface Summary {
  income: number;
  expense: number;
  net: number;
  count: number;
}

export function summarize(transactions: Transaction[]): Summary {
  let income = 0;
  let expense = 0;

  for (const tx of transactions) {
    if (tx.type === 'income') income += tx.amount;
    else expense += tx.amount;
  }

  return { income, expense, net: income - expense, count: transactions.length };
}

/** Totals restricted to entries on/after `sinceIso`. */
export function summarizeSince(transactions: Transaction[], sinceIso: string): Summary {
  const since = new Date(sinceIso).getTime();
  return summarize(transactions.filter((tx) => new Date(tx.timestamp).getTime() >= since));
}

export interface LedgerRow {
  tx: Transaction;
  runningBalance: number;
}

/** Running balance of one fund source, oldest entry first. */
export function buildLedger(transactions: Transaction[], accountId: string, opening = 0): LedgerRow[] {
  let running = opening;
  const rows: LedgerRow[] = [];

  const ordered = [...transactions].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  for (const tx of ordered) {
    if (tx.source !== accountId) continue;
    running += tx.type === 'income' ? tx.amount : -tx.amount;
    rows.push({ tx, runningBalance: running });
  }

  return rows;
}

export function startOfMonth(date = new Date()): string {
  return new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
}
