import type { Transaction } from '../models/Transaction';

export function isReferenced(transactions: Transaction[], ref: { accountId?: string; categoryId?: string }): boolean {
  return transactions.some((tx) =>
    ref.accountId !== undefined ? tx.source === ref.accountId || tx.destination === ref.accountId : tx.categoryId === ref.categoryId
  );
}

/** Error message, or null when valid. `selfId` is the row being edited. */
export function validateName(existing: { id: string; name: string; type: string }[], name: string, type: string, selfId?: string): string | null {
  const n = name.trim();
  if (!n) return 'Nama wajib diisi.';
  if (n.length > 40) return 'Nama terlalu panjang.';
  if (existing.some((e) => e.id !== selfId && e.type === type && e.name.trim().toLowerCase() === n.toLowerCase())) return 'Nama sudah dipakai.';
  return null;
}

/** Supabase errors are plain objects, not Error instances. */
export function errorMessage(e: unknown, fallback: string): string {
  const m = (e as { message?: unknown } | null)?.message;
  return typeof m === 'string' && m ? m : fallback;
}

/** An account may be removed (deleted, or archived when it has history) only at zero balance. */
export function canRemoveAccount(balance: number): boolean {
  return Math.round(balance) === 0;
}
