import type { Account } from '../models/Account';
import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';
import { summarize, summarizeSince, startOfMonth } from './ledger';

export interface DashboardData {
  totalBalance: number;
  totalIncome: number;
  totalExpense: number;
  net: number;
  transactionCount: number;
  accountBreakdown: { id: string; name: string; value: number; percent: number }[];
  categoryBreakdown: { id: string; name: string; value: number; percent: number }[];
  recentTransactions: Transaction[];
}

export function getDashboardData(
  accounts: Account[],
  categories: Category[],
  transactions: Transaction[]
): DashboardData {
  const normalTransactions = transactions.filter((tx) => !tx.transferId);
  const summary = summarizeSince(normalTransactions, startOfMonth());

  // Account breakdown: include ALL transactions (including transfers) for balance
  const balances = accounts.reduce((acc, a) => {
    acc[a.id] = transactions
      .filter((tx) => tx.source === a.id)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    return acc;
  }, {} as Record<string, number>);

  const total = Object.values(balances).reduce((sum, v) => sum + v, 0);

  const accountBreakdown = accounts.map((a) => ({
    id: a.id,
    name: a.name,
    value: balances[a.id] ?? 0,
    percent: total === 0 ? 0 : Math.round(((balances[a.id] ?? 0) / total) * 100)
  }));

  // Category breakdown (income/expense only)
  const catTotals = categories.reduce((acc, c) => {
    acc[c.id] = filtered
      .filter((tx) => tx.categoryId === c.id)
      .reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    return acc;
  }, {} as Record<string, number>);

  const categoryBreakdown = categories.map((c) => ({
    id: c.id,
    name: c.name,
    value: catTotals[c.id] ?? 0,
    percent: summary[c.type === 'income' ? 'income' : 'expense'] === 0
      ? 0
      : Math.round(((catTotals[c.id] ?? 0) / summary[c.type === 'income' ? 'income' : 'expense']) * 100)
  }));

  // Recent transactions
  const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 10);

  return {
    totalBalance: total,
    totalIncome: summary.income,
    totalExpense: summary.expense,
    net: summary.net,
    transactionCount: summary.count,
    accountBreakdown,
    categoryBreakdown,
    recentTransactions
  };
}
