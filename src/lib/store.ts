import { derived, get, writable } from 'svelte/store';
import type { Account } from '../models/Account';
import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';
import { supabase, isSupabaseConfigured } from './supabase';
import { computeBalances, startOfMonth, summarizeSince } from './ledger';
import { formatIDR } from './format';

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

export const accounts = writable<Account[]>([]);
export const categories = writable<Category[]>([]);
export const transactions = writable<Transaction[]>([]);

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
  description?: string;
  source: string;
  categoryId?: string;
  timestamp?: string;
  adminFee?: number;
}

/** Muat data awal dari Supabase ke store (panggil saat aplikasi pertama kali dimuat). */
export async function loadInitialData(): Promise<void> {
  const [accRes, catRes, txRes] = await Promise.all([
    supabase.from('accounts').select('*'),
    supabase.from('categories').select('*'),
    supabase.from('transactions').select('*')
  ]);

  if (!accRes.error) accounts.set((accRes.data as Account[]) ?? []);
  if (!catRes.error) categories.set((catRes.data as Category[]) ?? []);
  if (!txRes.error) transactions.set((txRes.data as Transaction[]) ?? []);

  // Jika tabel kosong, isi data default
  if ((accRes.data as Account[] ?? []).length === 0) {
    accounts.set(DEFAULT_ACCOUNTS);
    await supabase.from('accounts').insert(DEFAULT_ACCOUNTS);
  }
  if ((catRes.data as Category[] ?? []).length === 0) {
    categories.set(DEFAULT_CATEGORIES);
    await supabase.from('categories').insert(DEFAULT_CATEGORIES);
  }
}

/** Catat pemasukan atau pengeluaran ke Supabase dan store. */
export async function recordEntry({
  type,
  amount,
  description,
  source,
  categoryId,
  timestamp,
  adminFee = 0
}: EntryInput): Promise<Transaction> {
  requireAccount(source);
  const value = requireAmount(amount);
  const note = description?.trim() ?? '';

  if (categoryId) {
    requireCategory(categoryId);
    const cat = get(categories).find((c) => c.id === categoryId);
    if (cat?.type !== type) {
      throw new Error('Kategori tidak cocok dengan jenis transaksi.');
    }
  }

  if (type === 'expense' && (get(balances)[source] ?? 0) < value + adminFee) {
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

  const { error } = await supabase.from('transactions').insert(tx);
  if (error) throw error;

  transactions.update((items) => [...items, tx]);
  return tx;
}

/** Catat transfer antar akun ke Supabase dan store. */
export async function recordTransfer(
  from: string,
  to: string,
  amount: number,
  adminFee: number = 0
): Promise<void> {
  if (from === to) throw new Error('Sumber dan tujuan sama.');
  requireAccount(from);
  requireAccount(to);

  const value = requireAmount(amount);
  if ((get(balances)[from] ?? 0) < value + adminFee) {
    throw new Error('Saldo tidak cukup.');
  }

  const transferId = newId('tr');
  const timestamp = new Date().toISOString();
  const fromName = get(accounts).find((a) => a.id === from)?.name ?? from;
  const toName = get(accounts).find((a) => a.id === to)?.name ?? to;

  const out: Transaction = {
    id: newId('tx'),
    type: 'expense',
    amount: value + adminFee,
    description: `Transfer ke ${toName}${adminFee > 0 ? ` (biaya ${formatIDR(adminFee)})` : ''}`,
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

  const { error } = await supabase.from('transactions').insert([out, incoming]);
  if (error) throw error;

  transactions.update((items) => [...items, out, incoming]);
}

/** Hapus semua data dari Supabase dan store. */
export async function clearAll(): Promise<void> {
  await supabase.from('transactions').delete().neq('id', '');
  await supabase.from('accounts').delete().neq('id', '');
  await supabase.from('categories').delete().neq('id', '');

  transactions.set([]);
  accounts.set([]);
  categories.set([]);
}

/** Simpan akun ke Supabase (create atau update). */
export async function saveAccount(account: Account): Promise<void> {
  if (!account.id) throw new Error('Account ID tidak ada.');
  const { error } = await supabase.from('accounts').upsert(account);
  if (error) throw error;
}

/** Simpan kategori ke Supabase (create atau update). */
export async function saveCategory(category: Category): Promise<void> {
  if (!category.id) throw new Error('Kategori ID tidak ada.');
  const { error } = await supabase.from('categories').upsert(category);
  if (error) throw error;
}
