import type { Category } from '../models/Category';
import type { Transaction } from '../models/Transaction';

export const DESCRIPTION_REQUIRED_FROM = 500_000;

export interface EntryProblem {
  field: 'category' | 'description';
  message: string;
}

export function entryProblem(
  entry: Pick<Transaction, 'type' | 'amount'> & { id?: string; categoryId?: string; description?: string; transferId?: string },
  categories: Category[]
): EntryProblem | null {
  if (entry.transferId || entry.id?.startsWith('fee_')) return null;
  const category = entry.categoryId ? categories.find((item) => item.id === entry.categoryId) : undefined;
  if (!category) return { field: 'category', message: 'Pilih kategori dulu.' };
  if (
    entry.type === 'expense' &&
    !category.allocation &&
    entry.amount >= DESCRIPTION_REQUIRED_FROM &&
    !entry.description?.trim()
  ) {
    return { field: 'description', message: 'Isi keterangan untuk pengeluaran Rp 500 rb ke atas.' };
  }
  return null;
}
