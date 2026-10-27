import { derived, get, writable } from 'svelte/store';
import type { Account } from '../models/Account';
import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';
import { computeBalances, startOfMonth, summarizeSince } from './ledger';

const TRANSACTIONS_KEY = 'dompet-suami-transactions';
const ACCOUNTS_KEY = 'dompet-suami-accounts';
const CATEGORIES_KEY = 'dompet-suami-categories';

const DEFAULT_ACCOUNTS: Account[] = [
  { id: 'bank', name: 'Bank', type: 'bank' },
  { id: 'cash', name: 'Tunai', type: 'cash' },
  { id: 'ewallet', name: 'E-Wallet', type: 'ewallet' }
];

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'salary', name: 'Gaji', type: 'income' },
  { id: 'freelance', name: 'Freelance', type: 'income' },
  { id: 'food', name: 'Makanan', type: 'expense' },
  { id: 'transport', name: 'Transport', type: 'expense' },
  { id: 'utilities', name: 'Listrik/Air', type: 'expense' },
  { id: 'entertainment', name: 'Hiburan', type: 'expense' }
];

function readStored<T>(key: string, fallback: T): T {
  if (typeof localStorage === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function persisted<T>(key: string, initial: T) {
  const store = writable<T>(readStored(key, initial));
  store.subscribe((value) => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage full or blocked - keep in-memory state */
    }
  });
  return store;
}

export const accounts = persisted<Account[]>(ACCOUNTS_KEY, DEFAULT_ACCOUNTS);
export const categories = persisted<Category[]>(CATEGORIES_KEY, DEFAULT_CATEGORIES);
export const transactions = persisted<Transaction[]>(TRANSACTIONS_KEY, []);

export const balances = derived([accounts, transactions], ([$accounts, $transactions]) =>
  computeBalances($accounts, $transactions)
);

export const totalBalance = derived(balances, ($balances) =>
  Object.values($balances).reduce((sum, value) => sum + value, 0)
);

export const monthSummary = derived(transactions, ($transactions) =>
  summarizeSince(
    $transactions.filter((tx) => !tx.transferId),
    startOfMonth()
  )
);

function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function requireCategory(categoryId: string): Category {
  const cat = get(categories).find((c) => c.id === categoryId);
  if (!cat) throw new Error('Kategori tidak ada.');
  return cat;
}

function requireAccount(accountId: string): Account {
  const account = get(accounts).find((item) => item.id === accountId);
  if (!account) throw new Error('Sumber dana tidak ada.');
  return account;
}

function requireAmount(amount: number): number {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error('Jumlah harus lebih besar dari nol.');
  }
  return Math.round(amount);
}

export interface EntryInput {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  source: string;
  categoryId?: string;
  timestamp?: string;
}

export function recordEntry({ type, amount, description, source, categoryId, timestamp }: EntryInput): Transaction {
  requireAccount(source);
  const value = requireAmount(amount);
  const note = description.trim();

  if (!note) throw new Error('Keterangan wajib diisi.');

  if (categoryId) {
    requireCategory(categoryId);
    const cat = get(categories).find((c) => c.id === categoryId);
    if (cat?.type !== type) {
      throw new Error('Kategori tidak cocok dengan jenis transaksi.');
    }
  }

  if (type === 'expense' && (get(balances)[source] ?? 0) < value) {
    throw new Error('Saldo tidak cukup.');
  }

  const tx: Transaction = {
    id: newId('tx'),
    type,
    amount: value,
    description: note,
    source,
    categoryId,
    timestamp: timestamp ?? new Date().toISOString()
  };

  transactions.update((items) => [...items, tx]);
  return tx;
}

export function recordTransfer(from: string, to: string, amount: number): void {
  if (from === to) throw new Error('Sumber dan tujuan sama.');
  requireAccount(from);
  requireAccount(to);

  const value = requireAmount(amount);
  if ((get(balances)[from] ?? 0) < value) {
    throw new Error('Saldo tidak cukup.');
  }

  const transferId = newId('tr');
  const timestamp = new Date().toISOString();
  const fromName = get(accounts).find((a) => a.id === from)?.name ?? from;
  const toName = get(accounts).find((a) => a.id === to)?.name ?? to;

  const out: Transaction = {
    id: newId('tx'),
    type: 'expense',
    amount: value,
    description: `Transfer ke ${toName}`,
    source: from,
    destination: to,
    transferId,
    timestamp
  };

  const incoming: Transaction = {
    id: newId('tx'),
    type: 'income',
    amount: value,
    description: `Transfer dari ${fromName}`,
    source: to,
    destination: from,
    transferId,
    timestamp
  };

  transactions.update((items) => [...items, out, incoming]);
}

export function clearAll(): void {
  transactions.set([]);
}
