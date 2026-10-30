import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';
import { formatCompact, formatIDR } from './format';

export interface Insight {
  id: 'top-category' | 'savings-ratio' | 'daily-average' | 'vs-last-month' | 'new-category';
  tone: 'neg' | 'pos' | 'neutral';
  segments: Array<{ t: string; b?: boolean }>;
}
export function insightText(insight: Insight): string { return insight.segments.map(({ t }) => t).join(''); }
const make = (id: Insight['id'], tone: Insight['tone'], parts: Array<[string, boolean?]>): Insight => ({ id, tone, segments: parts.map(([t, b]) => ({ t, ...(b ? { b: true } : {}) })) });
export function buildInsights(transactions: Transaction[], categories: Category[], now: Date): Insight[] {
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonth = transactions.filter((tx) => !tx.transferId && new Date(tx.timestamp) >= monthStart && new Date(tx.timestamp) < new Date(now.getFullYear(), now.getMonth() + 1, 1));
  const lastMonth = transactions.filter((tx) => !tx.transferId && new Date(tx.timestamp) >= lastStart && new Date(tx.timestamp) < monthStart);
  const expenses = thisMonth.filter((tx) => tx.type === 'expense');
  const income = thisMonth.filter((tx) => tx.type === 'income').reduce((sum, tx) => sum + tx.amount, 0);
  const expense = expenses.reduce((sum, tx) => sum + tx.amount, 0);
  const byCat = new Map<string, number>();
  for (const tx of expenses) byCat.set(tx.categoryId ?? '', (byCat.get(tx.categoryId ?? '') ?? 0) + tx.amount);
  const top = [...byCat].sort((a, b) => b[1] - a[1])[0];
  const results: Insight[] = [];
  if (expense > 0 && top) {
    const name = categories.find((category) => category.id === top[0])?.name ?? 'Tanpa kategori';
    results.push(make('top-category', 'neg', [[name, true], [' adalah pengeluaran terbesar: Rp ' + formatCompact(top[1]) + ` (${Math.round(top[1] / expense * 100)}% dari total keluar).`]]));
  }
  if (income > 0) {
    const ratio = Math.round((income - expense) / income * 100);
    results.push(ratio < 0
      ? make('savings-ratio', 'neg', [['Pengeluaran melebihi pemasukan bulan ini ('], [String(Math.abs(ratio)) + '%', true], [' lebih besar).']])
      : make('savings-ratio', ratio >= 20 ? 'pos' : 'neg', [['Rasio tabungan bulan ini '], [`${ratio}%`, true], [` — ${ratio >= 20 ? 'di atas' : 'di bawah'} target 20%.`]]));
  }
  if (expense > 0) {
    const average = expense / now.getDate();
    const remaining = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate() - now.getDate();
    results.push(remaining === 0
      ? make('daily-average', 'neutral', [['Rata-rata pengeluaran harian '], [formatIDR(average), true], [' sepanjang bulan ini.']])
      : make('daily-average', 'neutral', [['Rata-rata pengeluaran harian '], [formatIDR(average), true], [`. Sisa ${remaining} hari, proyeksi akhir bulan `], [formatIDR(average * new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()), true], ['.']]));
  }
  const previousExpense = lastMonth.filter((tx) => tx.type === 'expense').reduce((sum, tx) => sum + tx.amount, 0);
  if (previousExpense > 0) {
    const percent = Math.round(Math.abs(expense - previousExpense) / previousExpense * 100);
    const monthName = lastStart.toLocaleDateString('id-ID', { month: 'long' });
    results.push(percent === 0 ? make('vs-last-month', 'neutral', [['Pengeluaran '], ['sama', true], [` dengan ${monthName}.`]]) : make('vs-last-month', expense > previousExpense ? 'neg' : 'pos', [[`Pengeluaran ${expense > previousExpense ? 'naik' : 'turun'} `], [`${percent}%`, true], [` dibanding ${monthName}.`]]));
  }
  const previousCategories = new Set(lastMonth.filter((tx) => tx.type === 'expense').map((tx) => tx.categoryId));
  const fresh = [...byCat].filter(([id]) => id && !previousCategories.has(id)).sort((a, b) => b[1] - a[1])[0];
  if (fresh) results.push(make('new-category', 'neutral', [['Kategori baru bulan ini: '], [categories.find((category) => category.id === fresh[0])?.name ?? 'Tanpa kategori', true], [` Rp ${formatCompact(fresh[1])}.`]]));
  return results.slice(0, 3);
}
