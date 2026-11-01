import type { Account } from '../models/Account';
import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';

export type Period =
  | { kind: 'month'; y: number; m: number }
  | { kind: 'year'; y: number }
  | { kind: 'range'; from: string; to: string };

export interface PeriodRange {
  start: Date;
  end: Date;
  label: string;
  prevStart: Date;
  prevEnd: Date;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const DAY_MS = 86_400_000;

import { operating } from './ledger';

const signed = (tx: Transaction) => (tx.type === 'income' ? tx.amount : -tx.amount);
const time = (tx: Transaction) => new Date(tx.timestamp).getTime();
const within = (tx: Transaction, start: Date, end: Date) => time(tx) >= start.getTime() && time(tx) < end.getTime();

function parseLocalDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** `end` is exclusive; `prev*` is the preceding period of the same length. */
export function periodRange(period: Period): PeriodRange {
  if (period.kind === 'month') {
    return {
      start: new Date(period.y, period.m, 1),
      end: new Date(period.y, period.m + 1, 1),
      label: `${MONTHS[period.m]} ${period.y}`,
      prevStart: new Date(period.y, period.m - 1, 1),
      prevEnd: new Date(period.y, period.m, 1)
    };
  }
  if (period.kind === 'year') {
    return {
      start: new Date(period.y, 0, 1),
      end: new Date(period.y + 1, 0, 1),
      label: String(period.y),
      prevStart: new Date(period.y - 1, 0, 1),
      prevEnd: new Date(period.y, 0, 1)
    };
  }
  const start = parseLocalDate(period.from);
  const last = parseLocalDate(period.to);
  const end = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1);
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  const fmt = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return {
    start,
    end,
    label: `${fmt(start)} – ${fmt(last)}`,
    prevStart: new Date(start.getFullYear(), start.getMonth(), start.getDate() - days),
    prevEnd: start
  };
}

export interface AccountBalanceRow {
  id: string;
  name: string;
  type: Account['type'];
  awal: number;
  masuk: number;
  keluar: number;
  akhir: number;
}

/** Includes transfers: every entry hits its `source` account. */
export function accountBalanceReport(accounts: Account[], transactions: Transaction[], start: Date, end: Date): AccountBalanceRow[] {
  return accounts.map((account) => {
    let awal = 0;
    let masuk = 0;
    let keluar = 0;
    for (const tx of transactions) {
      if (tx.source !== account.id) continue;
      if (time(tx) < start.getTime()) awal += signed(tx);
      else if (time(tx) < end.getTime()) {
        if (tx.type === 'income') masuk += tx.amount;
        else keluar += tx.amount;
      }
    }
    return { id: account.id, name: account.name, type: account.type, awal, masuk, keluar, akhir: awal + masuk - keluar };
  });
}

export interface CategoryRow {
  id: string;
  name: string;
  amount: number;
  percent: number;
  prev: number;
  /** % change vs previous period, `'baru'` when previous was 0, `'—'` when both 0. */
  vs: number | 'baru' | '—';
}

export interface CategoryReport {
  expense: CategoryRow[];
  income: CategoryRow[];
  total: { expense: CategoryRow; income: CategoryRow };
}

const NO_CATEGORY = '';

function compare(amount: number, prev: number): CategoryRow['vs'] {
  if (prev === 0) return amount === 0 ? '—' : 'baru';
  return Math.round(((amount - prev) / prev) * 100);
}

function sumBy(transactions: Transaction[], type: Transaction['type'], start: Date, end: Date): Map<string, number> {
  const sums = new Map<string, number>();
  for (const tx of operating(transactions)) {
    if (tx.transferId || tx.type !== type || !within(tx, start, end)) continue;
    const key = tx.categoryId ?? NO_CATEGORY;
    sums.set(key, (sums.get(key) ?? 0) + tx.amount);
  }
  return sums;
}

/** Non-transfer entries only. */
export function categoryReport(categories: Category[], transactions: Transaction[], start: Date, end: Date, prevStart: Date, prevEnd: Date): CategoryReport {
  const build = (type: Transaction['type']) => {
    const cur = sumBy(transactions, type, start, end);
    const prev = sumBy(transactions, type, prevStart, prevEnd);
    const total = [...cur.values()].reduce((a, b) => a + b, 0);
    const prevTotal = [...prev.values()].reduce((a, b) => a + b, 0);
    const rows: CategoryRow[] = [...cur]
      .map(([id, amount]) => ({
        id,
        name: categories.find((c) => c.id === id)?.name ?? 'Tanpa kategori',
        amount,
        percent: (amount / total) * 100,
        prev: prev.get(id) ?? 0,
        vs: compare(amount, prev.get(id) ?? 0)
      }))
      .sort((a, b) => b.amount - a.amount);
    const sum: CategoryRow = { id: 'total', name: 'Total', amount: total, percent: total ? 100 : 0, prev: prevTotal, vs: compare(total, prevTotal) };
    return { rows, sum };
  };
  const expense = build('expense');
  const income = build('income');
  return { expense: expense.rows, income: income.rows, total: { expense: expense.sum, income: income.sum } };
}

export interface MonthlyRow {
  month: number;
  income: number;
  expense: number;
  net: number;
}

/** Non-transfer entries of `year`, one row per month that has any, newest first. */
export function monthlyTable(transactions: Transaction[], year: number): { rows: MonthlyRow[]; total: Omit<MonthlyRow, 'month'> } {
  const months = new Map<number, MonthlyRow>();
  for (const tx of operating(transactions)) {
    const date = new Date(tx.timestamp);
    if (tx.transferId || date.getFullYear() !== year) continue;
    const row = months.get(date.getMonth()) ?? { month: date.getMonth(), income: 0, expense: 0, net: 0 };
    if (tx.type === 'income') row.income += tx.amount;
    else row.expense += tx.amount;
    row.net = row.income - row.expense;
    months.set(row.month, row);
  }
  const rows = [...months.values()].sort((a, b) => b.month - a.month);
  const income = rows.reduce((s, r) => s + r.income, 0);
  const expense = rows.reduce((s, r) => s + r.expense, 0);
  return { rows, total: { income, expense, net: income - expense } };
}

/** Quote a cell only when it holds a comma, quote or newline. */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    // text cells that spreadsheets would evaluate as formulas get a leading quote; numbers stay as is
    const s = typeof v === 'string' && /^[=+\-@\t\r]/.test(v) ? `'${v}` : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

/** Header + one row per entry (one per transfer pair), oldest first, names instead of ids. */
export function fullBackupRows(transactions: Transaction[], accounts: Account[], categories: Category[]): (string | number)[][] {
  const accountName = (id?: string) => accounts.find((a) => a.id === id)?.name ?? id ?? '';
  const categoryName = (id?: string) => categories.find((c) => c.id === id)?.name ?? '';
  const rows = [...transactions]
    .sort((a, b) => time(a) - time(b))
    // ponytail: transfer pair kept by its expense (source) side; amount fee is not split out
    .filter((tx) => !tx.transferId || tx.type === 'expense')
    .map((tx) => [
      tx.timestamp,
      tx.transferId ? 'transfer' : tx.type,
      tx.amount,
      accountName(tx.source),
      tx.transferId ? accountName(tx.destination) : '',
      categoryName(tx.categoryId),
      tx.description
    ]);
  return [['Tanggal', 'Tipe', 'Jumlah', 'Sumber', 'Tujuan', 'Kategori', 'Keterangan'], ...rows];
}
