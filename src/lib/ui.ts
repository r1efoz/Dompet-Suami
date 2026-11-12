import { readable, writable } from 'svelte/store';

import type { Period } from './reports';
export type { Period };
export type View = 'home' | 'transaction' | 'report' | 'master';

export const currentView = writable<View>('home');
export const reportState = writable<{ tab: 'cashflow' | 'category' | 'balance' | 'ledger'; accountId?: string; period?: Period }>({ tab: 'cashflow' });
export const toast = writable<{ text: string; kind: 'ok' | 'err' } | null>(null);
export const APP_OWNER_NAME = 'Pak Arief';

export const isDesktop = readable(false, (set) => {
  const query = window.matchMedia('(min-width:1024px)');
  set(query.matches);
  const update = () => set(query.matches);
  query.addEventListener('change', update);
  return () => query.removeEventListener('change', update);
});

export function showToast(text: string, kind: 'ok' | 'err' = 'ok'): void {
  toast.set({ text, kind });
  setTimeout(() => toast.update((current) => current?.text === text ? null : current), 2500);
}
