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
