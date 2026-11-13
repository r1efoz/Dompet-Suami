import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';
import { entryProblem } from './entry-rules';
import { formatCompact, formatIDR } from './format';
import { operating, summarize } from './ledger';
import { activePeriod, paydayPeriods, periodDays, within } from './reports';

export interface Insight {
  id: 'incomplete' | 'top-category' | 'allocation' | 'savings-ratio' | 'daily-average' | 'vs-previous' | 'new-category';
  tone: 'neg' | 'pos' | 'neutral';
  segments: Array<{ t: string; b?: boolean }>;
}
export function insightText(insight: Insight): string { return insight.segments.map(({ t }) => t).join(''); }
const make = (id: Insight['id'], tone: Insight['tone'], parts: Array<[string, boolean?]>): Insight => ({ id, tone, segments: parts.map(([t, b]) => ({ t, ...(b ? { b: true } : {}) })) });
const rp = (amount: number) => 'Rp ' + formatCompact(amount);
const sum = (list: Transaction[]) => list.reduce((total, tx) => total + tx.amount, 0);

export function buildInsights(transactions: Transaction[], categories: Category[], now: Date): Insight[] {
  const period = activePeriod(paydayPeriods(transactions, categories, now), now);
  const { elapsed, total, remaining } = periodDays(period, now);
  const word = period.word;
  const nameOf = (id: string) => categories.find((category) => category.id === id)?.name ?? 'Tanpa kategori';
  const allocationIds = new Set(categories.filter((c) => c.allocation).map((c) => c.id));
  const isAllocation = (tx: Transaction) => allocationIds.has(tx.categoryId ?? '');
  const ledger = operating(transactions);
  const current = ledger.filter((tx) => within(tx, period.start, period.end));
  const expenses = current.filter((tx) => tx.type === 'expense');
  const allocations = expenses.filter(isAllocation);
  const spending = expenses.filter((tx) => !isAllocation(tx));
  const { income, expense } = summarize(current);
  const allocated = sum(allocations);
  const spent = expense - allocated;
  const byCategory = (list: Transaction[]) => {
    const map = new Map<string, number>();
    for (const tx of list) map.set(tx.categoryId ?? '', (map.get(tx.categoryId ?? '') ?? 0) + tx.amount);
    return map;
  };
  const results: Insight[] = [];

  const unfinished = transactions.filter((tx) => entryProblem(tx, categories));
  if (unfinished.length > 0) results.push(make('incomplete', 'neg', [[`${unfinished.length} transaksi`, true], [` (${rp(sum(unfinished))}) perlu dilengkapi. Buka Riwayat → Perlu dilengkapi.`]]));

  const spendingByCategory = byCategory(spending);
  const top = [...spendingByCategory].sort((a, b) => b[1] - a[1])[0];
  if (spent > 0 && top) results.push(make('top-category', 'neg', [[nameOf(top[0]), true], [` adalah pengeluaran terbesar: ${rp(top[1])} (${Math.round(top[1] / spent * 100)}% dari belanja).`]]));

  if (allocated > 0) {
    const kinds = byCategory(allocations);
    const label = kinds.size === 1 ? nameOf([...kinds.keys()][0]) : `(${kinds.size} kategori)`;
    results.push(make('allocation', 'neutral', [['Alokasi '], [label, true], [` ${rp(allocated)}${income > 0 ? ` (${Math.round(allocated / income * 100)}% dari pemasukan)` : ''}.`]]));
  }

  if (income > 0) {
    const ratio = Math.round((income - expense) / income * 100);
    results.push(ratio < 0
      ? make('savings-ratio', 'neg', [[`Pengeluaran melebihi pemasukan ${word} (`], [`${Math.abs(ratio)}%`, true], [' lebih besar).']])
      : make('savings-ratio', ratio >= 20 ? 'pos' : 'neg', [[`Rasio tabungan ${word} `], [`${ratio}%`, true], [` — ${ratio >= 20 ? 'di atas' : 'di bawah'} target 20%.`]]));
  }

  if (spent > 0) {
    const average = spent / elapsed;
    results.push(remaining > 0
      ? make('daily-average', 'neutral', [['Rata-rata belanja harian '], [formatIDR(average), true], [`. Sisa ${remaining} hari, proyeksi ${period.kind === 'payday' ? 'sampai gajian berikutnya' : 'akhir bulan'} `], [formatIDR(average * total), true], ['.']])
      : make('daily-average', 'neutral', [['Rata-rata belanja harian '], [formatIDR(average), true], [` ${word}.`]]));
  }

  if (period.prev) {
    const { start, end } = period.prev;
    const label = period.kind === 'payday' ? 'gajian lalu' : 'bulan lalu';
    const sameSpan = new Date(start.getFullYear(), start.getMonth(), start.getDate() + elapsed);
    const prevSpending = ledger.filter((tx) => tx.type === 'expense' && !isAllocation(tx) && within(tx, start, end));
    const previous = sum(prevSpending.filter((tx) => within(tx, start, sameSpan)));
    if (previous > 0) {
      const percent = Math.round(Math.abs(spent - previous) / previous * 100);
      results.push(percent === 0
        ? make('vs-previous', 'neutral', [['Belanja '], ['sama', true], [` dengan rentang yang sama ${label}.`]])
        : make('vs-previous', spent > previous ? 'neg' : 'pos', [[`Belanja ${spent > previous ? 'naik' : 'turun'} `], [`${percent}%`, true], [` dibanding rentang yang sama ${label}.`]]));
    }
    const seen = new Set(prevSpending.map((tx) => tx.categoryId ?? ''));
    const fresh = [...spendingByCategory].filter(([id]) => id && !seen.has(id)).sort((a, b) => b[1] - a[1])[0];
    if (fresh) results.push(make('new-category', 'neutral', [[`Kategori baru ${word}: `], [nameOf(fresh[0]), true], [` ${rp(fresh[1])}.`]]));
  }
  return results.slice(0, 5);
}
