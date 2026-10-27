const idr = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0
});

const plain = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0
});

const shortDate = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short',
  year: 'numeric'
});

const shortDateNoYear = new Intl.DateTimeFormat('id-ID', {
  day: '2-digit',
  month: 'short'
});

export function formatIDR(amount: number): string {
  return idr.format(amount);
}

export function formatNumber(amount: number): string {
  return plain.format(amount);
}

export function formatDate(iso: string): string {
  return shortDate.format(new Date(iso));
}

export function formatDayMonth(iso: string): string {
  return shortDateNoYear.format(new Date(iso));
}

export function formatSigned(amount: number, type: 'income' | 'expense'): string {
  return `${type === 'income' ? '+' : '−'}${formatIDR(amount)}`;
}
