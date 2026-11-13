import type { Account } from '../models/Account';
import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';
import { operating, summarize, summarizeSince, startOfMonth } from './ledger';

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

export function getDashboardData(accounts: Account[], categories: Category[], transactions: Transaction[]): DashboardData {
  const normalTransactions = operating(transactions);
  const summary = summarizeSince(normalTransactions, startOfMonth());
  const balances = accounts.reduce((acc, a) => {
    acc[a.id] = transactions.filter((tx) => tx.source === a.id).reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    return acc;
  }, {} as Record<string, number>);
  const total = Object.values(balances).reduce((sum, v) => sum + v, 0);
  const accountBreakdown = accounts.map((a) => ({ id: a.id, name: a.name, value: balances[a.id] ?? 0, percent: total === 0 ? 0 : Math.round(((balances[a.id] ?? 0) / total) * 100) }));
  const catTotals = categories.reduce((acc, c) => {
    acc[c.id] = normalTransactions.filter((tx) => tx.categoryId === c.id).reduce((sum, tx) => sum + (tx.type === 'income' ? tx.amount : -tx.amount), 0);
    return acc;
  }, {} as Record<string, number>);
  const categoryBreakdown = categories.map((c) => ({ id: c.id, name: c.name, value: catTotals[c.id] ?? 0, percent: summary[c.type === 'income' ? 'income' : 'expense'] === 0 ? 0 : Math.round(((catTotals[c.id] ?? 0) / summary[c.type === 'income' ? 'income' : 'expense']) * 100) }));
  const recentTransactions = [...transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);
  return { totalBalance: total, totalIncome: summary.income, totalExpense: summary.expense, net: summary.net, transactionCount: summary.count, accountBreakdown, categoryBreakdown, recentTransactions };
}

export interface MonthlyPoint { month: string; income: number; expense: number }
export function monthlyTrend(transactions: Transaction[], months = 12, now = new Date()): MonthlyPoint[] {
  const points: MonthlyPoint[] = [];
  const ops = operating(transactions);
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const start = new Date(d.getFullYear(), d.getMonth(), 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    let income = 0;
    let expense = 0;
    for (const tx of ops) {
      if (tx.transferId) continue;
      const t = new Date(tx.timestamp);
      if (t < start || t >= end) continue;
      if (tx.type === 'income') income += tx.amount;
      else expense += tx.amount;
    }
    points.push({ month, income, expense });
  }
  return points;
}

export function balanceAt(accounts: Account[], tx: Transaction[], before: Date): number {
  return accounts.reduce((total, account) => total + tx.filter((item) => item.source === account.id && new Date(item.timestamp) < before).reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0), 0);
}

export interface AccountMonthStat { id: string; balance: number; income: number; expense: number; count: number }
export function accountMonthStats(accounts: Account[], tx: Transaction[], start: Date, end: Date): AccountMonthStat[] {
  return accounts.map((account) => {
    const sourced = tx.filter((item) => item.source === account.id);
    const period = sourced.filter((item) => { const date = new Date(item.timestamp); return date >= start && date < end; });
    return { id: account.id, balance: sourced.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0), income: period.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amount, 0), expense: period.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amount, 0), count: period.length };
  });
}

export interface CategorySlice { id: string | null; name: string; icon: string; value: number; percent: number }
export function topCategories(tx: Transaction[], categories: Category[], limit: number): { top: CategorySlice[]; rest: CategorySlice | null; total: number; allocation: CategorySlice[] } {
  const totals = new Map<string | null, number>();
  for (const item of operating(tx)) {
    if (item.type !== 'expense' || item.transferId) continue;
    totals.set(item.categoryId ?? null, (totals.get(item.categoryId ?? null) ?? 0) + item.amount);
  }
  const slices = [...totals].map(([id, value]) => {
    const category = categories.find((item) => item.id === id);
    return { slice: { id, name: category?.name ?? 'Tanpa kategori', icon: (category as Category & { icon?: string } | undefined)?.icon ?? '🧾', value, percent: 0 }, isAllocation: !!category?.allocation };
  }).sort((a, b) => b.slice.value - a.slice.value);
  const values = slices.filter((item) => !item.isAllocation).map((item) => item.slice);
  const allocation = slices.filter((item) => item.isAllocation).map((item) => item.slice);
  const total = values.reduce((sum, item) => sum + item.value, 0);
  for (const item of values) item.percent = total ? Math.round(item.value / total * 100) : 0;
  const top = values.slice(0, limit);
  const restValues = values.slice(limit);
  const rest = restValues.length ? { id: null, name: `${restValues.length} kategori lain`, icon: '⋯', value: restValues.reduce((sum, item) => sum + item.value, 0), percent: total ? Math.round(restValues.reduce((sum, item) => sum + item.value, 0) / total * 100) : 0 } : null;
  return { top, rest, total, allocation };
}
